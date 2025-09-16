import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAuth, handleApiError, parsePaginationParams } from "@/lib/api-utils"
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)
    const status = searchParams.get("status") as OrderStatus | null

    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { email: true, name: true } },
          items: { select: { id: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      items: orders.map(o => ({
        id: o.id,
        createdAt: o.createdAt,
        status: o.status as OrderStatus,
        total: o.total,
        paymentMethod: o.paymentMethod as PaymentMethod | null,
        paymentStatus: o.paymentStatus as PaymentStatus,
        user: o.user,
        itemsCount: o.items.length,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, "admin/orders:GET")
  }
}

