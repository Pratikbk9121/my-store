import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as {
      shipping: { name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string }
      items: { id: string; quantity: number }[]
      couponCode?: string
      saveAddress?: boolean
    }

    if (!body?.items?.length) return NextResponse.json({ error: "No items" }, { status: 400 })

    // Aggregate quantities by product in case of duplicates
    const qtyById = new Map<string, number>()
    for (const it of body.items) qtyById.set(it.id, (qtyById.get(it.id) || 0) + Math.max(0, it.quantity))
    const productIds = Array.from(qtyById.keys())

    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true, stock: true } })
    if (products.length !== productIds.length) return NextResponse.json({ error: "Some items are invalid" }, { status: 400 })

    // Pricing
    const priceMap = new Map(products.map(p => [p.id, p.price]))
    let subtotal = 0
    for (const [id, q] of qtyById) subtotal += (priceMap.get(id) || 0) * q

    // Validate stock
    for (const p of products) {
      const need = qtyById.get(p.id) || 0
      if (need <= 0) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
      if ((p.stock || 0) < need) return NextResponse.json({ error: "Insufficient stock for some items" }, { status: 409 })
    }

    // Coupon validation (outside tx for quick feedback on limits that don't depend on order write)
    let couponId: string | undefined
    let couponDiscount = 0

    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: body.couponCode } })
      const now = new Date()
      const valid = coupon && coupon.active && (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.expiresAt || coupon.expiresAt >= now) && (!coupon.minOrder || subtotal >= coupon.minOrder)
      if (valid) {
        if (coupon.usageLimit != null) {
          const count = await prisma.couponRedemption.count({ where: { couponId: coupon.id } })
          if (count >= coupon.usageLimit) return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
        }
        if (coupon.perUserLimit != null) {
          const ucount = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } })
          if (ucount >= coupon.perUserLimit) return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 })
        }
        let discount = 0
        if (coupon.type === "PERCENT") discount = (subtotal * coupon.value) / 100
        else discount = coupon.value
        if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount)
        discount = Math.min(discount, subtotal)
        if (discount > 0) {
          couponId = coupon.id
          couponDiscount = discount
        }
      } else {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 })
      }
    }

    const total = Math.max(0, subtotal - couponDiscount)

    const result = await prisma.$transaction(async (tx) => {
      // Double-check and decrement stock atomically
      for (const p of products) {
        const need = qtyById.get(p.id) || 0
        // Ensure not overselling in concurrent scenarios by reading current stock
        const current = await tx.product.findUnique({ where: { id: p.id }, select: { stock: true } })
        if (!current || (current.stock || 0) < need) throw new Error("STOCK_CHANGED")
        const newStock = (current.stock || 0) - need
        await tx.product.update({ where: { id: p.id }, data: { stock: { decrement: need }, inStock: newStock > 0 } })
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          couponId,
          couponDiscount: couponDiscount || undefined,
          shippingName: body.shipping.name,
          shippingPhone: body.shipping.phone,
          shippingLine1: body.shipping.line1,
          shippingLine2: body.shipping.line2 || null,
          shippingCity: body.shipping.city,
          shippingState: body.shipping.state,
          shippingPostalCode: body.shipping.postalCode,
          shippingCountry: body.shipping.country || "IN",
          items: {
            create: Array.from(qtyById.entries()).map(([id, q]) => ({ productId: id, quantity: q, price: priceMap.get(id)! })),
          },
        },
      })

      if (couponId) {
        await tx.couponRedemption.create({ data: { couponId, userId, orderId: order.id } })
      }

      if (body.saveAddress) {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
        await tx.address.create({
          data: {
            userId,
            name: body.shipping.name,
            phone: body.shipping.phone,
            line1: body.shipping.line1,
            line2: body.shipping.line2 || null,
            city: body.shipping.city,
            state: body.shipping.state,
            postalCode: body.shipping.postalCode,
            country: body.shipping.country || "IN",
            isDefault: true,
          },
        })
      }

      return { orderId: order.id }
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "STOCK_CHANGED") {
      return NextResponse.json({ error: "Stock changed, please refresh your cart" }, { status: 409 })
    }
    console.error("create-cod error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
