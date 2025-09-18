'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CouponType } from '@prisma/client'

interface CouponFormProps {
  coupon?: {
    id: string
    code: string
    type: CouponType
    value: number
    active: boolean
    startsAt: string | null
    expiresAt: string | null
    minOrder: number | null
    maxDiscount: number | null
    usageLimit: number | null
    perUserLimit: number | null
  }
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter()
  const defaultStartsAt = new Date().toISOString().slice(0,16)
  const defaultExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,16)
  const [code, setCode] = useState(coupon?.code || '')
  const [type, setType] = useState<CouponType>(coupon?.type || 'PERCENT')
  const [value, setValue] = useState<number>(coupon?.value ?? 10)
  const [active, setActive] = useState<boolean>(coupon?.active ?? true)
  const [startsAt, setStartsAt] = useState<string>(coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0,16) : defaultStartsAt)
  const [expiresAt, setExpiresAt] = useState<string>(coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0,16) : defaultExpiresAt)
  const [minOrder, setMinOrder] = useState<string>(coupon?.minOrder?.toString() || '')
  const [maxDiscount, setMaxDiscount] = useState<string>(coupon?.maxDiscount?.toString() || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        code,
        type,
        value: Number(value),
        active,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        minOrder: minOrder !== '' ? Number(minOrder) : null,
        maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : null,
      }
      const res = await fetch(coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons', {
        method: coupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save coupon')
      }
      router.push('/admin/coupons')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save coupon')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!coupon?.id) return
    if (!confirm('Delete this coupon?')) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete coupon')
      }
      router.push('/admin/coupons')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete coupon')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required className="w-full rounded-md border px-3 py-2" placeholder="SUMMER10" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value as CouponType)} className="w-full rounded-md border px-3 py-2">
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Value</label>
          <input type="number" value={value} min={0} step={type === 'PERCENT' ? 1 : 0.01} onChange={e => setValue(Number(e.target.value))} required className="w-full rounded-md border px-3 py-2" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input id="active" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm">Active</label>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Starts At</label>
          <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Expires At</label>
          <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min Order</label>
          <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Max Discount</label>
          <input type="number" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} className="w-full rounded-md border px-3 py-2" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-50">
          {coupon ? 'Update Coupon' : 'Create Coupon'}
        </button>
        <button type="button" disabled={submitting} onClick={() => router.push('/admin/coupons')} className="px-4 py-2 rounded-md border">
          Cancel
        </button>
        {coupon?.id && (
          <button type="button" disabled={submitting} onClick={handleDelete} className="ml-auto px-4 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50">
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

