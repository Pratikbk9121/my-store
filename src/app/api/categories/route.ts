import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const rows = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
    const categories = rows.map((r) => r.category)
    return NextResponse.json({ categories })
  } catch (err) {
    console.error("Failed to load categories", err)
    return NextResponse.json({ categories: [] }, { status: 200 })
  }
}

