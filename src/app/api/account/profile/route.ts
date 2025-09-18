import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } })
    return NextResponse.json({ profile: user })
  } catch (err: unknown) {
    console.error("account/profile:GET", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as { name?: string | null; phone?: string | null }
    const name = (body.name || "").trim()
    const phone = (body.phone || "").trim()

    if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 })
    if (!/^[0-9]{10}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit phone number" }, { status: 400 })

    await prisma.user.update({ where: { id: userId }, data: { name: name || null, phone } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("account/profile:PUT", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

