"use client"

import { useEffect, useMemo, useState } from "react"

type Props = {
  orderId: string
  initialStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
}

const steps: Array<Props["initialStatus"]> = ["PENDING","PROCESSING","SHIPPED","DELIVERED"]

export function OrderStatusTracker({ orderId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)

  // Poll order status periodically to simulate realtime updates
  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const s = data?.order?.status as Props["initialStatus"] | undefined
        if (active && s) setStatus(s)
      } catch {}
    }
    const id = setInterval(tick, 7000)
    // initial fetch once
    tick()
    return () => { active = false; clearInterval(id) }
  }, [orderId])

  const currentIndex = useMemo(() => {
    if (status === "CANCELLED") return -1
    return steps.indexOf(status)
  }, [status])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, i) => {
          const reached = currentIndex >= i
          return (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${reached ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600'}`}>
                {i+1}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${currentIndex > i ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        {steps.map((s) => (
          <span key={s} className="flex-1 text-center">{s.replace(/_/g,' ')}</span>
        ))}
      </div>
      {status === 'CANCELLED' && (
        <div className="mt-3 px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm">This order was cancelled.</div>
      )}
    </div>
  )
}

