import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError, requireUserAuth } from "@/lib/api-utils"

export async function GET(request: NextRequest, context: unknown) {
  try {
    const auth = await requireUserAuth()
    if (auth instanceof NextResponse) return auth

    const { user } = auth
    const { id } = (context as { params: { id: string } }).params

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: { where: { size: "THUMBNAIL" }, take: 1 },
              },
            },
          },
        },
        coupon: { select: { code: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    return handleApiError(error, "account/orders:[id]:GET")
  }
}

