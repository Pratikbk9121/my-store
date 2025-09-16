import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAuth, handleApiError, parsePaginationParams, createPaginationResponse } from "@/lib/api-utils"
import { CouponType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePaginationParams(searchParams)

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count(),
    ])

    return NextResponse.json(createPaginationResponse(coupons, total, page, limit))
  } catch (error) {
    return handleApiError(error, "admin/coupons:GET")
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({})) as Partial<{
      code: string
      type: CouponType
      value: number
      active: boolean
      startsAt?: string | null
      expiresAt?: string | null
      minOrder?: number | null
      maxDiscount?: number | null
      usageLimit?: number | null
      perUserLimit?: number | null
    }>

    if (!body.code || !body.type || !body.value) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["PERCENT", "FIXED"].includes(String(body.type))) {
      return NextResponse.json({ error: "Invalid coupon type" }, { status: 400 })
    }

    const data = {
      code: body.code.trim().toUpperCase(),
      type: body.type as CouponType,
      value: Number(body.value),
      active: body.active ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      minOrder: body.minOrder ?? null,
      maxDiscount: body.maxDiscount ?? null,
      usageLimit: body.usageLimit ?? null,
      perUserLimit: body.perUserLimit ?? null,
    }

    const created = await prisma.coupon.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error, "admin/coupons:POST")
  }
}

