import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-600">Manage discount codes</p>
        </div>
        <Link href="/admin/coupons/new" className="px-3 py-2 rounded-md bg-gray-900 text-white">Add Coupon</Link>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Starts</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">Usage Limit</th>
              <th className="px-3 py-2">Per User</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2">{c.type}</td>
                <td className="px-3 py-2">{c.type === 'PERCENT' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-3 py-2">{c.active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{c.startsAt ? new Date(c.startsAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{c.expiresAt ? new Date(c.expiresAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-xs">{c.usageLimit ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{c.perUserLimit ?? '—'}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/coupons/${c.id}`} className="underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

