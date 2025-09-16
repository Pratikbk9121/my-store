'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { useSession, signIn } from 'next-auth/react'
import { ImageSize } from '@prisma/client'
import { getImageUrl } from '@/lib/image-utils'
import { Minus, Plus, Trash2 } from 'lucide-react'

export default function CartPage() {
  const { state, totalAmount, totalItems, removeItem, setQuantity, clear } = useCart()
  const { data: session } = useSession()

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
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2">
              {session ? (
                <Link href="/checkout" className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-900 text-white">
                  Proceed to checkout
                </Link>
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

