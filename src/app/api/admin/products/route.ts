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
    const material = (formData.get("material") as string) || "925 Silver"
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
    const dimensions = (formData.get("dimensions") as string) || null
    const stock = formData.get("stock") ? parseInt(formData.get("stock") as string, 10) : 0
    const featured = formData.get("featured") === "true"
    const generateDescription = formData.get("generateDescription") === "true"

    if (!name || isNaN(price) || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    // Collect multiple images (supports both `images` and legacy single `image` keys)
    const images = formData
      .getAll("images")
      .filter((v): v is File => v instanceof File && v.size > 0)
    const singleImageVal = formData.get("image")
    if (singleImageVal instanceof File && singleImageVal.size > 0) images.push(singleImageVal)

    let description = formData.get("description") as string || ""
    const productImages: Array<{
      imageData: string
      imageType: string
      size: ImageSize
      alt: string
    }> = []

    if (images.length > 0) {
      // Generate AI description once from the first image if requested
      if (generateDescription && !description) {
        const firstBuffer = Buffer.from(await images[0].arrayBuffer())
        description = await generateProductDescription(firstBuffer)
      }

      // Process each uploaded image into multiple sizes
      for (const file of images) {
        const imageBuffer = Buffer.from(await file.arrayBuffer())
        const processedImages = await processProductImage(imageBuffer, file.type)
        for (const img of processedImages) {
          productImages.push({
            imageData: img.data.toString('base64'),
            imageType: img.type,
            size: img.size,
            alt: name
          })
        }
      }
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
        stock,
        inStock: stock > 0,
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
