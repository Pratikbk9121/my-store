"use client"

import { useState, useTransition } from "react"

export function CancelOrderButton({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string|undefined>()

  async function onClick() {
    setLoading(true)
    setError(undefined)
    try {
      const res = await fetch(`/api/account/orders/${orderId}/cancel`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Unable to cancel order")
      } else {
        if (onDone) onDone()
        else startTransition(() => window.location.reload())
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={onClick} disabled={loading} className="px-3 py-2 rounded-md border text-red-600 border-red-300 disabled:opacity-60">
        {loading ? "Cancelling..." : "Cancel order"}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  )
}

