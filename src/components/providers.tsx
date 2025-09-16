'use client'

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/lib/cart"
import { GlobalNavigation } from "@/components/global-navigation"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <GlobalNavigation />
        {children}
        <Toaster />
      </CartProvider>
    </SessionProvider>
  )
}
