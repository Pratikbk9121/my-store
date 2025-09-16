"use client"

export const dynamic = "force-dynamic"


import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 max-w-md">Loading…</div>}>
      <SignInContent />
    </Suspense>
  )
}

function SignInContent() {
  const sp = useSearchParams()
  const callbackUrl = sp.get("callbackUrl") || "/"
  const error = sp.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn("credentials", { email, password, callbackUrl })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Sign in</h1>
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error === "CredentialsSignin" ? "Invalid email or password" : "Authentication error"}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            required
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full px-4 py-2 rounded-md border"
      >
        Continue with Google
      </button>
      <p className="text-xs text-gray-600 mt-4">
        Don’t have a password? Use Google to create an account quickly.
      </p>
      <p className="text-xs text-gray-600 mt-1">
        <Link href="/" className="underline">Back to home</Link>
      </p>
    </div>
  )
}

