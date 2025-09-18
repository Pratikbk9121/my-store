 import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getImageUrl, getFallbackImageUrl } from "@/lib/image-utils"
import { OrderStatus, ImageSize } from "@prisma/client"
import { OrderStatusTracker } from "@/components/account/order-status-tracker"

import { CancelOrderButton } from "@/components/account/cancel-order-button"

interface PageProps { params: Promise<{ id: string }> }

export default async function OrderDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const { id } = await params
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { include: { product: { select: { id: true, name: true, price: true, images: { where: { size: 'THUMBNAIL' }, take: 1 } } } } },
      coupon: { select: { code: true } },
    },
  })

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <Link href="/orders" className="underline">Back to orders</Link>
      </div>
    )
  }

  const shipping = {
    name: order.shippingName,
    phone: order.shippingPhone,
    line1: order.shippingLine1,
    line2: order.shippingLine2,
    city: order.shippingCity,
    state: order.shippingState,
    postalCode: order.shippingPostalCode,
    country: order.shippingCountry,
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <div className="text-sm text-gray-600 font-mono">{order.id}</div>
          <div className="text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-semibold">₹{order.total.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Status tracker */}
      <div className="rounded-lg border p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current Status</div>
            <div className="font-medium">{order.status}</div>
          </div>
          <div className="text-sm text-gray-600">Payment: {order.paymentMethod || 'N/A'} {order.paymentStatus ? `(${order.paymentStatus})` : ''}</div>
        </div>
        <div className="mt-4">
          <OrderStatusTracker orderId={order.id} initialStatus={order.status as OrderStatus} />
        </div>
        {order.status === 'PENDING' && (
          <div className="mt-4">
            <CancelOrderButton orderId={order.id} />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-lg border p-4 bg-white">
        <h2 className="font-semibold mb-3">Items</h2>
        <ul className="divide-y">
          {order.items.map((it) => {
            const hasImage = (it.product.images?.length || 0) > 0
            const src = hasImage ? getImageUrl(it.product.id, ImageSize.THUMBNAIL) : getFallbackImageUrl()
            return (
              <li key={it.id} className="py-3 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-md overflow-hidden border bg-gray-50">
                  <Image src={src} alt={it.product.name} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{it.product.name}</div>
                  <div className="text-sm text-gray-600">Qty {it.quantity} × ₹{it.price.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right font-semibold">₹{(it.quantity * it.price).toLocaleString('en-IN')}</div>
              </li>
            )
          })}
        </ul>
        <div className="pt-3 text-right text-sm text-gray-600">Subtotal shown; any discounts or delivery charges are included in total.</div>
      </div>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-3">Shipping Address</h2>
          {shipping.line1 ? (
            <div className="text-sm text-gray-700 space-y-1">
              {shipping.name && <div>{shipping.name}</div>}
              {shipping.phone && <div>{shipping.phone}</div>}
              <div>{shipping.line1}</div>
              {shipping.line2 && <div>{shipping.line2}</div>}
              <div>{[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ')}</div>
              {shipping.country && <div>{shipping.country}</div>}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No shipping address on file.</div>
          )}
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <h2 className="font-semibold mb-3">Payment</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Method: {order.paymentMethod || 'N/A'}</div>
            <div>Status: {order.paymentStatus}</div>
            {order.coupon && <div>Coupon: {order.coupon.code} {order.couponDiscount ? `(−₹${order.couponDiscount})` : ''}</div>}
          </div>

        </div>
      </div>

      <div>
        <Link href="/orders" className="inline-block px-4 py-2 rounded-md border">Back to orders</Link>
      </div>
    </div>
  )
}

