import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const items = await prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
    return NextResponse.json({ items })
  } catch (err: unknown) {
    console.error("addresses:GET", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as { name?: string; phone?: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country?: string; isDefault?: boolean }

    if (!body.line1 || !body.city || !body.state || !body.postalCode) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
    }

    const addr = await prisma.address.create({
      data: {
        userId,
        name: body.name || null,
        phone: body.phone || null,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "IN",
        isDefault: !!body.isDefault,
      },
    })

    return NextResponse.json({ id: addr.id })
  } catch (err: unknown) {
    console.error("addresses:POST", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

