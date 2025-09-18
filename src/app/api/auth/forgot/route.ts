import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string }
    const normalized = (email || "").trim().toLowerCase()
    if (!normalized) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: normalized } })

    // Always respond success to avoid email enumeration
    const origin = new URL(req.url).origin

    if (!user) {
      return NextResponse.json({ ok: true, message: "If an account exists, a reset link is provided below.", resetUrl: null })
    }

    // Create token valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const resetUrl = `${origin}/auth/reset/${token}`
    // No email sending for now; return link in response
    return NextResponse.json({ ok: true, resetUrl })
  } catch (err: unknown) {
    console.error("auth/forgot:POST", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

