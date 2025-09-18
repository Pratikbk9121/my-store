import { NextRequest, NextResponse } from "next/server"
import { requireUserAuth, handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, context: unknown) {
  try {
    const auth = await requireUserAuth()
    if (auth instanceof NextResponse) return auth

    const { user } = auth
    const { id } = (context as { params: { id: string } }).params

    // Fetch order with items to restock
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true },
    })

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Set order cancelled
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } })

      // Restock items
      for (const it of order.items) {
        // get current stock
        const p = await tx.product.findUnique({ where: { id: it.productId }, select: { stock: true } })
        if (!p) continue
        const newStock = (p.stock || 0) + it.quantity
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity }, inStock: newStock > 0 } })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, "account/orders:[id]/cancel:POST")
  }
}

