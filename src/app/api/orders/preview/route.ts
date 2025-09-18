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
      items: { id: string; quantity: number }[]
      couponCode?: string
    }

    if (!body?.items?.length) return NextResponse.json({ error: "No items" }, { status: 400 })

    const productIds = body.items.map(i => i.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true, stock: true } })
    if (products.length !== productIds.length) return NextResponse.json({ error: "Some items are invalid" }, { status: 400 })

    const priceMap = new Map(products.map(p => [p.id, p.price]))
    const stockMap = new Map(products.map(p => [p.id, p.stock]))
    const qtyById = body.items.reduce((m, it) => m.set(it.id, (m.get(it.id) || 0) + it.quantity), new Map<string, number>())
    const stockIssues: Array<{ id: string; requested: number; available: number }> = []

    let subtotal = 0
    for (const it of body.items) subtotal += (priceMap.get(it.id) || 0) * it.quantity

    for (const [id, qty] of qtyById) {
      const available = stockMap.get(id) ?? 0
      if (available < qty) stockIssues.push({ id, requested: qty, available })
    }

    let couponId: string | undefined
    let couponDiscount = 0
    let couponValid = false

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
        couponValid = true
      } else {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 })
      }
    }

    const total = Math.max(0, subtotal - couponDiscount)

    return NextResponse.json({ subtotal, couponDiscount, total, couponId, couponValid, stockOk: stockIssues.length === 0, stockIssues })
  } catch (err: unknown) {
    console.error("orders/preview error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

