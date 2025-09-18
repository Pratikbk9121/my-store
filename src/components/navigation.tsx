'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/lib/cart'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'




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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="User menu" className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                  <Avatar>
                    <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || session.user?.email || 'User'} />
                    <AvatarFallback>{(session.user?.name || session.user?.email || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{session.user?.name || 'Account'}</span>
                    <span className="text-xs text-muted-foreground truncate">{session.user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">Orders</Link>
                </DropdownMenuItem>
                {session.user?.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e)=>{e.preventDefault(); signOut();}}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/signin" aria-label="Sign in" className="flex items-center">
              <Avatar>
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}