"use client"

import React, { createContext, useContext, useEffect, useMemo, useReducer, useState, useRef } from 'react'
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
  couponCode?: string
}

type Action =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'>; quantity?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; quantity: number }
  | { type: 'SET_COUPON'; code: string }
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
        return { ...state, items }
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: qty }] }
    }
    case 'REMOVE': {
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    }
    case 'SET_QTY': {
      const qty = Math.max(1, action.quantity)
      return {
        ...state,
        items: state.items.map(i => (i.id === action.id ? { ...i, quantity: qty } : i))
      }
    }
    case 'SET_COUPON':
      return { ...state, couponCode: action.code || '' }
    case 'CLEAR':
      return { items: [], couponCode: '' }
    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  setCouponCode: (code: string) => void
  clear: () => void
  totalItems: number
  totalAmount: number
  couponCode: string
} | null>(null)

const STORAGE_KEY_BASE = 'cart:v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)
  const { data: session } = useSession()
  const hasMigratedRef = useRef(false)
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

  // Migrate guest cart into user cart after login
  useEffect(() => {
    if (!isHydrated) return
    if (!session?.user?.id) return
    if (hasMigratedRef.current) return
    try {
      const guestKey = `${STORAGE_KEY_BASE}:guest`
      const userKey = `${STORAGE_KEY_BASE}:${session.user.id}`
      const guestRaw = window.localStorage.getItem(guestKey)
      if (guestRaw) {
        const guestState = JSON.parse(guestRaw) as CartState
        const userRaw = window.localStorage.getItem(userKey)
        const userState = userRaw ? (JSON.parse(userRaw) as CartState) : initialState
        const map = new Map<string, CartItem>()
        for (const it of userState.items ?? []) map.set(it.id, it)
        for (const it of guestState.items ?? []) {
          const existing = map.get(it.id)
          if (existing) {
            map.set(it.id, { ...existing, quantity: existing.quantity + it.quantity })
          } else {
            map.set(it.id, it)
          }
        }
        const merged: CartState = {
          items: Array.from(map.values()),
          couponCode: userState.couponCode || guestState.couponCode || ''
        }
        dispatch({ type: 'HYDRATE', state: merged })
        window.localStorage.setItem(userKey, JSON.stringify(merged))
        window.localStorage.removeItem(guestKey)
      }
    } catch {}
    hasMigratedRef.current = true
  }, [isHydrated, session?.user?.id])

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
      setCouponCode: (code: string) => dispatch({ type: 'SET_COUPON', code }),
      clear: () => dispatch({ type: 'CLEAR' }),
      totalItems,
      totalAmount,
      couponCode: state.couponCode || '',
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

