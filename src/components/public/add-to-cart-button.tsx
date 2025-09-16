'use client'

import { useCart } from '@/lib/cart'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
  }
  quantity?: number
  disabled?: boolean
  className?: string
}

export function AddToCartButton({ product, quantity = 1, disabled, className }: AddToCartButtonProps) {
  const { addItem } = useCart()

  return (
    <button
      onClick={() => addItem({ id: product.id, name: product.name, price: product.price }, quantity)}
      disabled={disabled}
      className={`px-4 py-2 rounded-md text-white transition-colors ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'} ${className ?? ''}`}
    >
      Add to Cart
    </button>
  )
}

