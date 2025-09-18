import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const revalidate = 0

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: { addresses: { orderBy: { createdAt: "desc" } } },
  })

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="text-2xl font-semibold">Customer not found</div>
        <Link href="/admin/orders" className="underline">Back to orders</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600">ID: <span className="font-mono text-sm">{user.id}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="px-3 py-2 rounded-md border">Back to Orders</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="rounded-md border">
          <div className="border-b px-4 py-3">
            <div className="text-lg font-semibold">Basic Info</div>
          </div>
          <div className="px-4 py-4 space-y-3 text-sm text-gray-800">
            <div className="flex justify-between">
              <div className="text-gray-500">Name</div>
              <div className="font-medium">{user.name || "—"}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Phone</div>
              <div className="font-medium">{user.phone || "—"}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Created</div>
              <div className="font-medium">{user.createdAt.toLocaleString()}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-500">Updated</div>
              <div className="font-medium">{user.updatedAt.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="rounded-md border">
          <div className="border-b px-4 py-3">
            <div className="text-lg font-semibold">Addresses</div>
          </div>
          <div className="px-4 py-4 space-y-3 text-sm">
            {user.addresses.length === 0 && (
              <div className="text-gray-600">No saved addresses</div>
            )}
            {user.addresses.map(addr => (
              <div key={addr.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">
                    {addr.name || "Address"}
                  </div>
                  {addr.isDefault && (
                    <span className="text-xs rounded bg-gray-900 text-white px-2 py-0.5">Default</span>
                  )}
                </div>
                <div className="mt-1 text-gray-700">
                  {addr.phone ? <div className="text-xs text-gray-600">{addr.phone}</div> : null}
                  <div>{addr.line1}</div>
                  {addr.line2 ? <div>{addr.line2}</div> : null}
                  <div>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </div>
                  <div className="text-gray-600">{addr.country}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

