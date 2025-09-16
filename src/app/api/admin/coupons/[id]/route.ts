import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAuth, handleApiError } from "@/lib/api-utils"
import { CouponType } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const coupon = await prisma.coupon.findUnique({ where: { id } })
    if (!coupon) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(coupon)
  } catch (error) {
    return handleApiError(error, "admin/coupons/[id]:GET")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
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

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.code ? { code: body.code.trim().toUpperCase() } : {}),
        ...(body.type ? { type: body.type as CouponType } : {}),
        ...(body.value != null ? { value: Number(body.value) } : {}),
        ...(body.active != null ? { active: !!body.active } : {}),
        ...(body.startsAt !== undefined ? { startsAt: body.startsAt ? new Date(body.startsAt) : null } : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {}),
        ...(body.minOrder !== undefined ? { minOrder: body.minOrder } : {}),
        ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount } : {}),
        ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit } : {}),
        ...(body.perUserLimit !== undefined ? { perUserLimit: body.perUserLimit } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error, "admin/coupons/[id]:PUT")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    // Attempt delete; will fail if constrained
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    // Could be foreign key constraint; return 400 instead of 500
    console.error("admin/coupons/[id]:DELETE", error)
    return NextResponse.json({ error: "Unable to delete coupon" }, { status: 400 })
  }
}

