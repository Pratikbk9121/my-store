"use client"

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/navigation'

export function GlobalNavigation() {
  const pathname = usePathname() || '/'
  // Hide public navigation on admin routes which have their own layout/header
  if (pathname.startsWith('/admin')) return null
  return <Navigation />
}

