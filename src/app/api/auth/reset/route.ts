import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string }
    if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 })

    const record = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!record) return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    if (record.usedAt) return NextResponse.json({ error: "Token already used" }, { status: 400 })
    if (record.expiresAt < new Date()) return NextResponse.json({ error: "Token expired" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } })
    ])

    return NextResponse.json({ ok: true, email: user.email })
  } catch (err: unknown) {
    console.error("auth/reset:POST", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

