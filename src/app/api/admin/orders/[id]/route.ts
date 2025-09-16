import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminAuth, handleApiError } from "@/lib/api-utils"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function PATCH(request: NextRequest, context: unknown) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = (context as { params: { id: string } }).params
    const body = await request.json().catch(() => ({})) as { status?: OrderStatus; paymentStatus?: PaymentStatus }

    if (!body.status && !body.paymentStatus) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: order.id })
  } catch (error) {
    return handleApiError(error, "admin/orders:[id]:PATCH")
  }
}

