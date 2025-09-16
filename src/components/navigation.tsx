'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/lib/cart'
import { useEffect, useState } from 'react'



export function Navigation() {
  const { data: session } = useSession()
  const { totalItems } = useCart()
  const [mounted, setMounted] = useState(false)


  useEffect(() => setMounted(true), [])





  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">

          <Link href="/" className="text-xl font-bold">
            Silver Store
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/products">Products</Link>
          <Link href="/cart" className="relative">
            Cart{mounted && totalItems > 0 && (
              <span className="ml-1 inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded-full bg-gray-900 text-white" suppressHydrationWarning>
                {totalItems}
              </span>
            )}
          </Link>

          {session ? (
            <>
              <Link href="/orders">Orders</Link>
              {session.user?.role === "ADMIN" && (
                <Link href="/admin" className="bg-gray-900 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Admin Panel
                </Link>
              )}
              <button onClick={() => signOut()}>Sign Out</button>
            </>
          ) : (
            <Link href="/auth/signin">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}