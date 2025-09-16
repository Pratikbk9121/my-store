import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRazorpay } from "@/lib/razorpay"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as {
      items: { id: string; quantity: number }[]
      couponCode?: string
      currency?: string
    }

    if (!body?.items?.length) return NextResponse.json({ error: "No items" }, { status: 400 })

    const productIds = body.items.map(i => i.id)
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } })
    if (products.length !== productIds.length) return NextResponse.json({ error: "Some items are invalid" }, { status: 400 })

    const priceMap = new Map(products.map(p => [p.id, p.price]))
    let subtotal = 0
    for (const it of body.items) subtotal += (priceMap.get(it.id) || 0) * it.quantity

    let couponDiscount = 0
    if (body.couponCode) {
      const now = new Date()
      const coupon = await prisma.coupon.findUnique({ where: { code: body.couponCode } })
      const valid = coupon && coupon.active && (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.expiresAt || coupon.expiresAt >= now) && (!coupon.minOrder || subtotal >= coupon.minOrder)
      if (!valid) return NextResponse.json({ error: "Invalid coupon" }, { status: 400 })
      if (coupon.usageLimit != null) {
        const count = await prisma.couponRedemption.count({ where: { couponId: coupon.id } })
        if (count >= coupon.usageLimit) return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 })
      }
      if (coupon.perUserLimit != null) {
        const ucount = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } })
        if (ucount >= coupon.perUserLimit) return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 })
      }
      let discount = coupon.type === "PERCENT" ? (subtotal * coupon.value) / 100 : coupon.value
      if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount)
      couponDiscount = Math.min(discount, subtotal)
    }

    const total = Math.max(0, subtotal - couponDiscount)
    const currency = body.currency || "INR"
    const amountPaise = Math.round(total * 100)

    const rz = getRazorpay()
    const order = await rz.orders.create({
      amount: amountPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      payment_capture: true,
    })

    return NextResponse.json({ order, subtotal, couponDiscount, total, amountPaise })
  } catch (err: unknown) {
    console.error("orders/prepare error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

