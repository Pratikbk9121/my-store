import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRazorpay } from "@/lib/razorpay"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    type Body = { amount: number; currency?: string; receipt?: string }
    const body = (await req.json().catch(() => ({}))) as Partial<Body>
    const amount = body.amount
    const currency = body.currency || "INR"
    const receipt = body.receipt

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const rz = getRazorpay()
    const order = await rz.orders.create({
      amount, // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: true,
    })

    return NextResponse.json({ order })
  } catch (err: unknown) {
    console.error("create-order error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

