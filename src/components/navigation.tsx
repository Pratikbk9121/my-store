'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Silver Store
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/products">Products</Link>
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