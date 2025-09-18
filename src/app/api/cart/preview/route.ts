import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Public endpoint: preview cart for guests (no auth, no coupons)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      items: { id: string; quantity: number }[]
    }

    if (!body?.items?.length) return NextResponse.json({ error: "No items" }, { status: 400 })

    // Aggregate quantities by product in case of duplicates
    const qtyById = body.items.reduce((m, it) => m.set(it.id, (m.get(it.id) || 0) + Math.max(0, it.quantity)), new Map<string, number>())
    const productIds = Array.from(qtyById.keys())

    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true, stock: true } })
    if (products.length !== productIds.length) return NextResponse.json({ error: "Some items are invalid" }, { status: 400 })

    const priceMap = new Map(products.map(p => [p.id, p.price]))
    const stockMap = new Map(products.map(p => [p.id, p.stock]))

    let subtotal = 0
    for (const [id, q] of qtyById) subtotal += (priceMap.get(id) || 0) * q

    const stockIssues: Array<{ id: string; requested: number; available: number }> = []
    for (const [id, q] of qtyById) {
      const available = stockMap.get(id) || 0
      if (q > available) stockIssues.push({ id, requested: q, available })
    }

    return NextResponse.json({ subtotal, stockOk: stockIssues.length === 0, stockIssues })
  } catch (err: unknown) {
    console.error("cart/preview error", err)
    const message = err instanceof Error ? err.message : "Server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

