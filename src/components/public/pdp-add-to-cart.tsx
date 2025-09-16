"use client"

import { useState } from 'react'
import { AddToCartButton } from '@/components/public/add-to-cart-button'

interface PdpAddToCartProps {
  product: {
    id: string
    name: string
    price: number
    inStock: boolean
  }
}

export function PdpAddToCart({ product }: PdpAddToCartProps) {
  const [qty, setQty] = useState<number>(1)

  return (
    <div className="space-y-3">
      <div className="text-sm">
        {product.inStock ? (
          <span className="text-green-700">In stock</span>
        ) : (
          <span className="text-red-600">Out of stock</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 border rounded-md px-2 py-1"
          aria-label="Quantity"
        />
        <AddToCartButton
          product={{ id: product.id, name: product.name, price: product.price }}
          quantity={qty}
          disabled={!product.inStock}
        />
      </div>
    </div>
  )
}

