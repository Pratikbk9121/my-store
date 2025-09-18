import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"
import { OrderStatusForm } from "@/components/admin/order-status-form"

export const revalidate = 0

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true, name: true } }, items: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders</p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs"><Link href={`/admin/orders/${o.id}`} className="underline">{o.id.slice(0,8)}…</Link></td>
                <td className="px-3 py-2">
                  {o.userId && (o.user?.name || o.user?.email) ? (
                    <Link href={`/admin/customers/${o.userId}`} className="underline">
                      {o.user?.name || o.user?.email}
                    </Link>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-semibold">₹{o.total.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{o.paymentMethod || '—'} {o.paymentStatus && `(${o.paymentStatus})`}</td>
                <td className="px-3 py-2">

                  <OrderStatusForm id={o.id} status={o.status as OrderStatus} />
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{o.updatedAt.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs">{o.items.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
