"use client"

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function Reviews({ productId }: { productId: string }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<{ id: string; rating: number; comment?: string; userName: string; createdAt: string }>>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load reviews')
      setItems(data.items)
      setAverage(data.average)
      setCount(data.count)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => { void load() }, [load])

  async function submit() {
    if (!session) return alert('Please sign in to review')
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment: comment.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      setComment('')
      await load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reviews ({count})</h2>
        <div className="text-sm text-gray-600">Avg rating: {average.toFixed(1)} / 5</div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-gray-500">No reviews yet.</div>}
        {items.map(r => (
          <div key={r.id} className="border rounded-md p-3">
            <div className="text-sm font-medium">{r.userName} • {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
            {r.comment && <div className="text-sm text-gray-700 mt-1">{r.comment}</div>}
          </div>
        ))}
      </div>

      <div className="border rounded-md p-3 space-y-2">
        <div className="text-sm font-medium">Write a review</div>
        <div className="flex items-center gap-2">
          <select value={rating} onChange={e => setRating(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ★</option>)}
          </select>
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment" className="flex-1 border rounded px-3 py-2 text-sm" />
          <button onClick={submit} disabled={loading} className="border rounded px-3 py-2 text-sm disabled:opacity-60">Submit</button>
        </div>
        {!session && <div className="text-xs text-gray-500">Sign in to submit a review.</div>}
      </div>
    </div>
  )
}

