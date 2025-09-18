import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force Node.js runtime and disable caching for NextAuth endpoints
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }