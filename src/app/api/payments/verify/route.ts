import { NextRequest, NextResponse } from "next/server"
import { verifyRazorpaySignature } from "@/lib/razorpay"

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })
    }

    const ok = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!ok) return NextResponse.json({ ok: false }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("verify error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

