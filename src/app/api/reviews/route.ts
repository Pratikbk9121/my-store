import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })

    const [reviews, stats] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
        take: 20,
      }),
      prisma.productReview.aggregate({ _avg: { rating: true }, _count: { _all: true }, where: { productId } }),
    ])

    return NextResponse.json({
      items: reviews.map(r => ({ id: r.id, rating: r.rating, comment: r.comment, userName: r.user?.name || "Anonymous", createdAt: r.createdAt })),
      average: stats._avg.rating || 0,
      count: stats._count._all,
    })
  } catch (err: unknown) {
    console.error("reviews:GET", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json() as { productId: string; rating: number; comment?: string }
    if (!body.productId || !body.rating) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const rating = Math.max(1, Math.min(5, Math.round(body.rating)))

    const review = await prisma.productReview.upsert({
      where: { productId_userId: { productId: body.productId, userId } },
      update: { rating, comment: body.comment || null },
      create: { productId: body.productId, userId, rating, comment: body.comment || null },
    })

    return NextResponse.json({ id: review.id })
  } catch (err: unknown) {
    console.error("reviews:POST", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

