import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { parsePaginationParams, handleApiError, requireUserAuth } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUserAuth()
    if (auth instanceof NextResponse) return auth

    const { user } = auth
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const sort = (searchParams.get("sort") || "newest").toLowerCase()

    const orderBy = sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: { where: { size: "THUMBNAIL" }, take: 1 },
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ])

    const items = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status as OrderStatus,
      total: o.total,
      items: o.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        price: it.price,
        product: {
          id: it.product.id,
          name: it.product.name,
          hasImage: (it.product.images?.length || 0) > 0,
        },
      })),
    }))

    return NextResponse.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, "account/orders:GET")
  }
}

