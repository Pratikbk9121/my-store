'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { useSession, signIn } from 'next-auth/react'
import { ImageSize } from '@prisma/client'
import { getImageUrl } from '@/lib/image-utils'
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react'

export default function CartPage() {
  const { state, totalAmount, totalItems, removeItem, setQuantity, clear, couponCode, setCouponCode } = useCart()
  const { data: session } = useSession()

  const itemsPayload = useMemo(() => state.items.map(i => ({ id: i.id, quantity: i.quantity })), [state.items])

  const [preview, setPreview] = useState<{ subtotal: number; couponDiscount: number; total: number } | null>(null)
  const [stockIssues, setStockIssues] = useState<Array<{ id: string; requested: number; available: number }> | null>(null)
  const [couponError, setCouponError] = useState<string>('')
  const [couponInput, setCouponInput] = useState<string>(couponCode || '')
  const stockOk = stockIssues == null || stockIssues.length === 0

  // Stock check whenever cart items change
  useEffect(() => {
    (async () => {
      try {
        const endpoint = session ? '/api/orders/preview' : '/api/cart/preview'
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: itemsPayload }),
        })
        const data = await res.json()
        if (res.ok) {
          setStockIssues(Array.isArray(data.stockIssues) ? data.stockIssues : [])
        } else {
          setStockIssues(null)
        }
      } catch {
        setStockIssues(null)
      }
    })()
  }, [itemsPayload, session])

  async function applyCoupon() {
    if (!session) {
      alert('Please sign in to apply a coupon')
      return
    }
    try {
      setCouponError('')
      const res = await fetch('/api/orders/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, couponCode: couponInput || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid coupon')
      setPreview({ subtotal: data.subtotal, couponDiscount: data.couponDiscount, total: data.total })
      setStockIssues(Array.isArray(data.stockIssues) ? data.stockIssues : [])
      setCouponCode(couponInput)
      setCouponInput('')
      setCouponError('')
    } catch (e) {
      setPreview(null)
      setCouponError((e as Error).message)
    }
  }

  const displayTotal = preview?.total ?? totalAmount

  const items = state.items

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center text-gray-600 py-24">
          Your cart is empty. <Link href="/products" className="underline">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 justify-between border rounded-md p-4">
                <Image
                  src={getImageUrl(item.id, ImageSize.THUMBNAIL)}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-md border object-cover"
                />

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-sm text-gray-600">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-md">
                    <button
                      aria-label="Decrease quantity"
                      className="p-2 hover:bg-gray-100"
                      onClick={() => setQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center select-none">{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      className="p-2 hover:bg-gray-100"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    aria-label="Remove item"
                    title="Remove"
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-md border hover:bg-red-50 hover:border-red-300 text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={clear} className="text-sm text-gray-600 underline">Clear cart</button>
          </div>

          {/* Summary */}
          <div className="border rounded-md p-4 space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>

            {session ? (
              <div>
                <label className="block text-sm mb-1">Coupon code</label>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value)
                      setCouponError('')
                      setPreview(null)
                    }}
                    className={`flex-1 border rounded-md px-3 py-2 ${couponError ? 'border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500' : preview ? 'border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600' : ''}`}
                    placeholder="Enter coupon"
                  />
                  <button onClick={applyCoupon} className="px-3 py-2 border rounded-md">Apply</button>
                </div>
                {couponError && (
                  <div className="text-sm text-red-600 mt-1">{couponError}</div>
                )}
                {preview && !couponError && (
                  <div className="text-sm text-green-700 mt-1">
                    {couponCode} applied • Discount: ₹{preview.couponDiscount.toLocaleString('en-IN')} • Subtotal: ₹{preview.subtotal.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Sign in to apply coupons.</p>
            )}

            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>₹{displayTotal.toLocaleString('en-IN')}</span>
            </div>

            {!stockOk && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold">Some items are not available in requested quantity.</p>
                  <p className="mt-1 text-sm text-red-700">Adjust quantities or remove items before checkout.</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              {session ? (
                stockOk ? (
                  <Link href="/checkout" className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-900 text-white">
                    Proceed to checkout
                  </Link>
                ) : (
                  <button disabled className="w-full px-4 py-2 rounded-md bg-gray-300 text-gray-600 cursor-not-allowed">
                    Resolve stock issues to continue
                  </button>
                )
              ) : (
                <button
                  onClick={() => signIn()}
                  className="w-full px-4 py-2 rounded-md bg-gray-900 text-white"
                >
                  Sign in to checkout
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Shipping and taxes calculated at checkout. Prices in INR.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

