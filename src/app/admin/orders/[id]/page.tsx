import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { OrderStatusForm } from "@/components/admin/order-status-form"

export const revalidate = 0

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="space-y-4">
        <div className="text-2xl font-semibold">Order not found</div>
        <Link href="/admin/orders" className="underline">Back to orders</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600">Order ID: <span className="font-mono text-sm">{order.id}</span></p>
        </div>
        <Link href="/admin/orders" className="px-3 py-2 rounded-md border">Back to Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-md border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{order.user?.name || order.user?.email || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-sm text-gray-700">{order.createdAt.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment</div>
                <div className="text-sm text-gray-700">{order.paymentMethod || "—"} {order.paymentStatus ? `(${order.paymentStatus})` : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Coupon</div>
                <div className="text-sm text-gray-700">{order.coupon?.code || "—"} {order.couponDiscount ? `(−₹${order.couponDiscount})` : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <OrderStatusForm id={order.id} status={order.status as OrderStatus} />
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-lg font-semibold">₹{order.total.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-md border">
            <div className="px-4 py-3 border-b font-semibold">Items</div>
            <div className="divide-y">
              {order.items.map((it) => (
                <div key={it.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.product.name}</div>
                    <div className="text-gray-600">Qty: {it.quantity}</div>
                  </div>
                  <div className="font-medium">₹{(it.price * it.quantity).toLocaleString("en-IN")}</div>
                </div>
              ))}
              {order.items.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">No items</div>
              )}
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <div className="font-semibold mb-3">Shipping Info</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Name:</span> {order.shippingName || "—"}</div>
              <div><span className="text-gray-500">Phone:</span> {order.shippingPhone || "—"}</div>
              <div><span className="text-gray-500">Address:</span>
                <div className="mt-1">
                  {[order.shippingLine1, order.shippingLine2].filter(Boolean).join(", ") || "—"}
                </div>
                <div>
                  {[order.shippingCity, order.shippingState, order.shippingPostalCode].filter(Boolean).join(", ")}
                </div>
                <div>{order.shippingCountry || "IN"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

