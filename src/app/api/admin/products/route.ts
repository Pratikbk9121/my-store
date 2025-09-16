import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateProductDescription } from "@/lib/ai-description"
import { processProductImage } from "@/lib/image-processing"
import { requireAdminAuth, handleApiError } from "@/lib/api-utils"
import { Category, ImageSize } from "@prisma/client"

// GET /api/admin/products - List all products
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const inStock = searchParams.get("inStock")
    const featured = searchParams.get("featured")

    const skip = (page - 1) * limit

    const where: {
      category?: Category
      inStock?: boolean
      featured?: boolean
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" }
        description?: { contains: string; mode: "insensitive" }
      }>
    } = {}
    
    if (category) where.category = category as Category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    }
    if (inStock !== null && inStock !== undefined) {
      where.inStock = inStock === "true"
    }
    if (featured !== null && featured !== undefined) {
      where.featured = featured === "true"
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            where: { size: "THUMBNAIL" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, "admin/products:GET")
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const formData = await request.formData()
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const category = formData.get("category") as Category
    const material = formData.get("material") as string || "925 Silver"
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
    const dimensions = formData.get("dimensions") as string || null
    const inStock = formData.get("inStock") === "true"
    const featured = formData.get("featured") === "true"
    const image = formData.get("image") as File
    const generateDescription = formData.get("generateDescription") === "true"

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    let description = formData.get("description") as string || ""
    let productImages: Array<{
      imageData: string
      imageType: string
      size: ImageSize
      alt: string
    }> = []

    // Process image if provided
    if (image && image.size > 0) {
      const imageBuffer = Buffer.from(await image.arrayBuffer())
      
      // Generate AI description if requested
      if (generateDescription && !description) {
        description = await generateProductDescription(imageBuffer)
      }

      // Process images in different sizes
      const processedImages = await processProductImage(imageBuffer, image.type)
      productImages = processedImages.map(img => ({
        imageData: img.data.toString('base64'), // Convert Buffer to base64 string for SQLite
        imageType: img.type,
        size: img.size,
        alt: name
      }))
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        material,
        weight,
        dimensions,
        inStock,
        featured,
        images: {
          create: productImages
        }
      },
      include: {
        images: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return handleApiError(error, "admin/products:POST")
  }
}
