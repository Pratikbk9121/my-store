import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; phone?: string; password?: string }
    const name = (body.name || "").trim()
    const email = (body.email || "").trim().toLowerCase()
    const phone = (body.phone || "").trim()
    const password = body.password || ""

    if (!email || !password || !phone) return NextResponse.json({ error: "Email, phone and password are required" }, { status: 400 })
    if (!/^[0-9]{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { email, name: name || null, phone, password: hashed, role: "CUSTOMER" } })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err: unknown) {
    console.error("auth/signup:POST", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

