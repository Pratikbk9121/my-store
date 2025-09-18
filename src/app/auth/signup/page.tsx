"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 max-w-md">Loading…</div>}>
      <SignUpContent />
    </Suspense>
  )
}

function SignUpContent() {
  const sp = useSearchParams()
  const callbackUrl = sp.get("callbackUrl") || "/"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Failed to sign up")
        return
      }
      await signIn("credentials", { email, password, callbackUrl })
    } catch (e) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Create account</h1>
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" required placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" required placeholder="10-digit phone" pattern="[0-9]{10}" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2" required placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  )
}

