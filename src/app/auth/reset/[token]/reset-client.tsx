"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ResetClient({ token }: { token: string }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>()
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Failed to reset password")
      } else {
        router.push("/auth/signin?reset=1")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Set a new password</h1>
      {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">New password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm password</label>
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60">
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  )
}

