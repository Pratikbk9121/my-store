import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dashboard statistics
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      recentProducts,
      orderStats
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),
      
      // Total orders count
      prisma.order.count(),
      
      // Total customers count
      prisma.user.count({
        where: { role: "CUSTOMER" }
      }),
      
      // Recent products (last 10)
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          inStock: true,
          createdAt: true
        }
      }),
      
      // Order statistics for revenue calculation
      prisma.order.aggregate({
        _sum: {
          total: true
        },
        where: {
          status: {
            in: ["DELIVERED", "PROCESSING", "SHIPPED"]
          }
        }
      })
    ])

    const totalRevenue = orderStats._sum.total || 0

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      recentProducts
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
