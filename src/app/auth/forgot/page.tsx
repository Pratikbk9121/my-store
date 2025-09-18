"use client"

import { useState } from "react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string|undefined>()
  const [resetUrl, setResetUrl] = useState<string|null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(undefined)
    setResetUrl(null)
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.error || "Failed to request password reset")
      } else {
        setMessage("If an account exists, a reset link is shown below.")
        setResetUrl(data?.resetUrl ?? null)
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Forgot password</h1>
      {message && (
        <div className="mb-4 rounded-md border bg-gray-50 px-3 py-2 text-sm">{message}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      {resetUrl && (
        <div className="mt-4 text-sm">
          <div className="text-gray-600 mb-1">Development helper:</div>
          <a href={resetUrl} className="underline break-all">{resetUrl}</a>
        </div>
      )}
    </div>
  )
}

