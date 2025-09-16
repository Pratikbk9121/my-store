import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, price: true } } } },
      user: { select: { email: true, name: true } },
      coupon: { select: { code: true } },
    },
  })

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <Link href="/products" className="underline">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thank you! 🎉</h1>
        <p className="text-gray-600">Your order has been received.</p>
      </div>

      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Order ID</div>
            <div className="font-mono text-sm">{order.id}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-semibold">₹{order.total.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Status: {order.status}</div>
        {order.paymentMethod && (
          <div className="text-sm text-gray-600">Payment: {order.paymentMethod} {order.paymentStatus ? `(${order.paymentStatus})` : null}</div>
        )}
        {order.coupon && (
          <div className="text-sm text-gray-600">Coupon: {order.coupon.code} {order.couponDiscount ? `(−₹${order.couponDiscount})` : null}</div>
        )}
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <ul className="space-y-2">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between text-sm">
              <span>{it.product.name} × {it.quantity}</span>
              <span>₹{(it.price * it.quantity).toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        A confirmation email will be sent to {order.user.email}.
      </div>

      <Link href="/products" className="inline-block px-4 py-2 rounded-md border">Continue shopping</Link>
    </div>
  )
}

