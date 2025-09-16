import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { verifyRazorpaySignature } from "@/lib/razorpay"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as {
      payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
      shipping: { name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string }
      items: { id: string; quantity: number }[]
      couponCode?: string
      saveAddress?: boolean
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body.payment || {}
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 })
    }

    const ok = verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature })
    if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 400 })

    if (!body?.items?.length) return NextResponse.json({ error: "No items" }, { status: 400 })

    const productIds = body.items.map(i => i.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } })
    if (products.length !== productIds.length) return NextResponse.json({ error: "Some items are invalid" }, { status: 400 })

    const priceMap = new Map(products.map(p => [p.id, p.price]))
    let subtotal = 0
    for (const it of body.items) subtotal += (priceMap.get(it.id) || 0) * it.quantity

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

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
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
          create: body.items.map(it => ({ productId: it.id, quantity: it.quantity, price: priceMap.get(it.id)! })),
        },
      },
    })

    if (couponId) {
      await prisma.couponRedemption.create({ data: { couponId, userId, orderId: order.id } })
    }

    if (body.saveAddress) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
      await prisma.address.create({
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

    return NextResponse.json({ orderId: order.id })
  } catch (err: unknown) {
    console.error("confirm-razorpay error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

