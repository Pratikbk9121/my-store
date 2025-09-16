import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { CouponForm } from '@/components/admin/coupon-form'

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) {
    return (
      <div className="space-y-4">
        <div className="text-2xl font-semibold">Coupon not found</div>
        <Link href="/admin/coupons" className="underline">Back to coupons</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Coupon</h1>
          <p className="text-gray-600">Code: {coupon.code}</p>
        </div>
        <Link href="/admin/coupons" className="px-3 py-2 rounded-md border">Back</Link>
      </div>

      <div className="rounded-md border p-4">
        <CouponForm coupon={{
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          active: coupon.active,
          startsAt: coupon.startsAt ? coupon.startsAt.toISOString() : null,
          expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
          minOrder: coupon.minOrder,
          maxDiscount: coupon.maxDiscount,
          usageLimit: coupon.usageLimit,
          perUserLimit: coupon.perUserLimit,
        }} />
      </div>
    </div>
  )
}

