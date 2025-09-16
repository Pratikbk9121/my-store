'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useCart } from '@/lib/cart'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  address1: z.string().min(5, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits'),
  saveAddress: z.boolean().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

type PaymentMethod = 'RAZORPAY' | 'COD'

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  handler: (response: RazorpayResponse) => void
  theme?: { color?: string }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const { state, totalAmount, totalItems, clear } = useCart()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ subtotal: number; couponDiscount: number; total: number } | null>(null)
  const [addressDefaults, setAddressDefaults] = useState<Partial<CheckoutForm> | undefined>(undefined)
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

  // Load Razorpay script when needed
  useEffect(() => {
    if (paymentMethod !== 'RAZORPAY') return
    if (typeof window === 'undefined' || window.Razorpay) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [paymentMethod])

  const itemsPayload = useMemo(() => state.items.map(i => ({ id: i.id, quantity: i.quantity })), [state.items])

  // Load default address
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/account/addresses')
        if (!res.ok) return
        type AddressLite = { isDefault?: boolean; name?: string; phone?: string; line1: string; line2?: string; city: string; state: string; postalCode: string }
        const data = await res.json() as { items: Array<AddressLite> }
        const def = data.items.find((a) => a.isDefault) || data.items[0]
        if (def) {
          setAddressDefaults({
            fullName: def.name || session?.user?.name || '',
            phone: def.phone || '',
            email: String(session?.user?.email || ''),
            address1: def.line1,
            address2: def.line2 || '',
            city: def.city,
            state: def.state,
            pin: def.postalCode,
          })
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function applyCoupon() {
    try {
      const res = await fetch('/api/orders/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, couponCode: couponCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid coupon')
      setPreview({ subtotal: data.subtotal, couponDiscount: data.couponDiscount, total: data.total })
    } catch (e) {
      setPreview(null)
      alert((e as Error).message)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-gray-600">Please sign in to continue to checkout.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => signIn()} className="px-4 py-2 rounded-md bg-gray-900 text-white">Sign in</button>
          <Link href="/cart" className="px-4 py-2 rounded-md border">Back to Cart</Link>
        </div>
      </div>
    )
  }

  async function placeCodOrder(form: CheckoutForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/create-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping: {
            name: form.fullName, phone: form.phone,
            line1: form.address1, line2: form.address2,
            city: form.city, state: form.state, postalCode: form.pin, country: 'IN'
          },
          items: itemsPayload,
          couponCode: couponCode || undefined,
          saveAddress: !!form.saveAddress,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place COD order')
      clear()
      router.push(`/order/confirmation/${data.orderId}`)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function placeRazorpayOrder(form: CheckoutForm) {
    if (!publicKey) {
      alert('Razorpay key missing. Set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local')
      return
    }
    setLoading(true)
    try {
      // Server-calculated amount and create Razorpay order
      const res = await fetch('/api/orders/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, couponCode: couponCode || undefined, currency: 'INR' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to prepare order')

      const options = {
        key: publicKey,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Checkout',
        order_id: data.order.id,
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        handler: async (response: RazorpayResponse) => {
          const res2 = await fetch('/api/orders/confirm-razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment: response,
              shipping: {
                name: form.fullName, phone: form.phone,
                line1: form.address1, line2: form.address2,
                city: form.city, state: form.state, postalCode: form.pin, country: 'IN'
              },
              items: itemsPayload,
              couponCode: couponCode || undefined,
              saveAddress: !!form.saveAddress,
            }),
          })
          const data2 = await res2.json()
          if (!res2.ok) {
            alert(data2.error || 'Payment verification failed')
            return
          }
          clear()
          router.push(`/order/confirmation/${data2.orderId}`)
        },
        theme: { color: '#111827' },
      } as RazorpayOptions

      // @ts-expect-error Razorpay global
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const displayTotal = preview?.total ?? totalAmount

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {state.items.length === 0 ? (
        <div className="text-center text-gray-600 py-24">
          Your cart is empty. <Link href="/products" className="underline">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <CheckoutFormSection
            onPlaceOrder={(form) => paymentMethod === 'COD' ? placeCodOrder(form) : placeRazorpayOrder(form)}
            submitDisabled={loading}
            defaults={{
              fullName: session.user?.name || '',
              email: String(session.user?.email || ''),
            }}
            prefill={addressDefaults}
          />

          {/* Summary */}
          <div className="border rounded-md p-4 space-y-3 h-fit">
            <h2 className="font-semibold">Order summary</h2>
            <div className="text-sm text-gray-600">Items: {totalItems}</div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>₹{displayTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 space-y-2">
              <div>
                <label className="block text-sm mb-1">Coupon code</label>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1 border rounded-md px-3 py-2" placeholder="Enter coupon" />
                  <button onClick={applyCoupon} className="px-3 py-2 border rounded-md">Apply</button>
                </div>
                {preview && (
                  <div className="text-sm text-gray-600 mt-1">Discount: ₹{preview.couponDiscount.toLocaleString('en-IN')} • Subtotal: ₹{preview.subtotal.toLocaleString('en-IN')}</div>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1">Payment method</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('RAZORPAY')} className={`px-3 py-2 border rounded-md ${paymentMethod==='RAZORPAY' ? 'bg-gray-900 text-white' : ''}`}>Razorpay</button>
                  <button type="button" onClick={() => setPaymentMethod('COD')} className={`px-3 py-2 border rounded-md ${paymentMethod==='COD' ? 'bg-gray-900 text-white' : ''}`}>Cash on Delivery</button>
                </div>
              </div>
              <button type="button" onClick={() => document.getElementById('checkout-submit')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} disabled={loading} className="w-full px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60">
                {loading ? 'Processing…' : 'Place order'}
              </button>
            </div>

            <Link href="/cart" className="block text-center text-sm text-gray-600 underline">Back to cart</Link>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckoutFormSection({ defaults, prefill, onPlaceOrder, submitDisabled }: { defaults?: Partial<CheckoutForm>, prefill?: Partial<CheckoutForm>, onPlaceOrder: (form: CheckoutForm) => void, submitDisabled?: boolean }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (prefill) reset({ ...defaults, ...prefill })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  return (
    <form id="checkout-submit" onSubmit={handleSubmit(onPlaceOrder)} className="lg:col-span-2 space-y-4">
      <div className="border rounded-md p-4 space-y-3">
        <h2 className="font-semibold">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <input {...register('fullName')} className="w-full border rounded-md px-3 py-2" placeholder="Full name" />
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <input {...register('phone')} className="w-full border rounded-md px-3 py-2" placeholder="Phone" />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
          </div>
          <div className="md:col-span-2">
            <input {...register('email')} className="w-full border rounded-md px-3 py-2" placeholder="Email" />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
        </div>
      </div>
      <div className="border rounded-md p-4 space-y-3">
        <h2 className="font-semibold">Shipping address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <input {...register('address1')} className="w-full border rounded-md px-3 py-2" placeholder="Address line 1" />
            {errors.address1 && <p className="text-xs text-red-600 mt-1">{errors.address1.message}</p>}
          </div>
          <div className="md:col-span-2">
            <input {...register('address2')} className="w-full border rounded-md px-3 py-2" placeholder="Address line 2 (optional)" />
          </div>
          <div>
            <input {...register('city')} className="w-full border rounded-md px-3 py-2" placeholder="City" />
            {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <input {...register('state')} className="w-full border rounded-md px-3 py-2" placeholder="State" />
            {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <input {...register('pin')} className="w-full border rounded-md px-3 py-2" placeholder="PIN code" />
            {errors.pin && <p className="text-xs text-red-600 mt-1">{errors.pin.message}</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm pt-2">
          <input type="checkbox" {...register('saveAddress')} />
          <span>Save this address to my account</span>
        </label>
      </div>
      <button type="submit" disabled={submitDisabled} className="hidden" aria-hidden>
        Submit
      </button>
    </form>
  )
}

