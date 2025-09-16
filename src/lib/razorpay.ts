import Razorpay from "razorpay"
import crypto from "crypto"

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) {
    throw new Error("Razorpay not configured: missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET")
  }
  return new Razorpay({ key_id, key_secret })
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) {
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_secret) return false
  const h = crypto.createHmac("sha256", key_secret)
  h.update(`${orderId}|${paymentId}`)
  const digest = h.digest("hex")
  return digest === signature
}

