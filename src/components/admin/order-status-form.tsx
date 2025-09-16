"use client"

import { useState } from "react"
import { OrderStatus } from "@prisma/client"

export function OrderStatusForm({ id, status, onUpdated }: { id: string; status: OrderStatus; onUpdated?: () => void }) {
  const [value, setValue] = useState<OrderStatus>(status)
  const [loading, setLoading] = useState(false)

  async function update() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update")
      }
      onUpdated?.()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value as OrderStatus)} className="border rounded px-2 py-1 text-sm">
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button onClick={update} disabled={loading} className="border rounded px-2 py-1 text-sm disabled:opacity-60">
        {loading ? "Saving..." : "Update"}
      </button>
    </div>
  )
}

