"use client"

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { useSession } from 'next-auth/react'


export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  imageAlt?: string
}

type CartState = {
  items: CartItem[]
}

type Action =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'>; quantity?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: CartState }

const initialState: CartState = { items: [] }

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'ADD': {
      const qty = Math.max(1, action.quantity ?? 1)
      const idx = state.items.findIndex(i => i.id === action.item.id)
      if (idx !== -1) {
        const items = [...state.items]
        items[idx] = { ...items[idx], quantity: items[idx].quantity + qty }
        return { items }
      }
      return { items: [...state.items, { ...action.item, quantity: qty }] }
    }
    case 'REMOVE': {
      return { items: state.items.filter(i => i.id !== action.id) }
    }
    case 'SET_QTY': {
      const qty = Math.max(1, action.quantity)
      return {
        items: state.items.map(i => (i.id === action.id ? { ...i, quantity: qty } : i))
      }
    }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clear: () => void
  totalItems: number
  totalAmount: number
} | null>(null)

const STORAGE_KEY_BASE = 'cart:v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)
  const { data: session } = useSession()
  const storageKey = useMemo(() => `${STORAGE_KEY_BASE}:${session?.user?.id ?? 'guest'}` , [session?.user?.id])

  // Hydrate from localStorage whenever the user/session changes
  useEffect(() => {
    setIsHydrated(false)
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        dispatch({ type: 'HYDRATE', state: JSON.parse(raw) as CartState })
      } else {
        dispatch({ type: 'HYDRATE', state: initialState })
      }
    } catch {}
    setIsHydrated(true)
  }, [storageKey])

  // Persist only after hydration to avoid wiping saved cart during SSR
  useEffect(() => {
    if (!isHydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {}
  }, [state, isHydrated, storageKey])

  const value = useMemo(() => {
    const totalItems = state.items.reduce((s, i) => s + i.quantity, 0)
    const totalAmount = state.items.reduce((s, i) => s + i.price * i.quantity, 0)
    return {
      state,
      addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) =>
        dispatch({ type: 'ADD', item, quantity }),
      removeItem: (id: string) => dispatch({ type: 'REMOVE', id }),
      setQuantity: (id: string, quantity: number) => dispatch({ type: 'SET_QTY', id, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
      totalItems,
      totalAmount,
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

