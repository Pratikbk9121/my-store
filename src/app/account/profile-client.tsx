"use client"

import { useState } from "react"

export default function AccountClient({ initial }: { initial: { name: string; email: string; phone: string } }) {
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string|undefined>()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(undefined)
    try {
      const res = await fetch("/api/account/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) })
      const data = await res.json()
      if (!res.ok) setMsg(data?.error || "Failed to save")
      else setMsg("Saved!")
    } catch {
      setMsg("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="text-sm text-gray-600">Manage your profile details</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-4 bg-white">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={initial.email} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="10-digit phone" required pattern="[0-9]{10}" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-gray-900 text-white disabled:opacity-60">{saving?"Saving...":"Save changes"}</button>
      </form>
      <div className="text-sm text-gray-600">
        Manage your addresses from checkout or via your recent orders.
      </div>
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  )
}

