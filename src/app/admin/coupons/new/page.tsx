import Link from 'next/link'
import { CouponForm } from '@/components/admin/coupon-form'

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Coupon</h1>
          <p className="text-gray-600">Create a discount code</p>
        </div>
        <Link href="/admin/coupons" className="px-3 py-2 rounded-md border">Back</Link>
      </div>

      <div className="rounded-md border p-4">
        <CouponForm />
      </div>
    </div>
  )
}

