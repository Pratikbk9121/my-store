import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    role: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
  interface JWT {
    role?: string
  }
}



export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email as string | undefined
        if (!email) return false
        // Ensure a local user exists for Google sign-ins
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          const random = Math.random().toString(36).slice(2)
          const hashed = await bcrypt.hash(random, 10)
          await prisma.user.create({
            data: {
              email,
              name: user.name || null,
              password: hashed,
              role: "CUSTOMER",
            },
          })
        }
      }
      return true
    },
    jwt: async ({ token, user, account }) => {
      // On first sign-in with Google, map to our DB user and set role
      if (account?.provider === "google") {
        const email = (user?.email || token.email) as string | undefined
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } })
          if (dbUser) {
            token.sub = dbUser.id
            token.role = dbUser.role as unknown as string
          } else if (!token.role) {
            token.role = "CUSTOMER"
          }
        }
      } else if (user) {
        const u = user as unknown as { role?: string }
        if (u.role) token.role = u.role
      } else if (!token.role) {
        token.role = "CUSTOMER"
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = (token.role as string) || "CUSTOMER"
      }
      return session
    }
  }
}
