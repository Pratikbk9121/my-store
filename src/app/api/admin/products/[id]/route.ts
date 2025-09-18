import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateProductDescription } from "@/lib/ai-description"
import { processProductImage } from "@/lib/image-processing"
import { requireAdminAuth, handleApiError } from "@/lib/api-utils"
import { Category, ImageSize } from "@prisma/client"

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return handleApiError(error, "admin/products/[id]:GET")
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const formData = await request.formData()
    const name = formData.get("name") as string
    const price = parseFloat(formData.get("price") as string)
    const category = formData.get("category") as Category
    const material = (formData.get("material") as string) || "925 Silver"
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
    const dimensions = (formData.get("dimensions") as string) || null
    const stockStr = formData.get("stock") as string | null
    const stock = stockStr != null && stockStr !== "" ? parseInt(stockStr, 10) : undefined
    const featured = formData.get("featured") === "true"
    const generateDescription = formData.get("generateDescription") === "true"

    // Collect multiple images (supports both `images` and legacy single `image` keys)
    const images = formData
      .getAll("images")
      .filter((v): v is File => v instanceof File && v.size > 0)
    const singleImageVal = formData.get("image")
    if (singleImageVal instanceof File && singleImageVal.size > 0) images.push(singleImageVal)

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    let description = formData.get("description") as string || ""

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Process new images if provided
    if (images.length > 0) {
      // Generate AI description if requested using the first image
      if (generateDescription && !description) {
        const firstBuffer = Buffer.from(await images[0].arrayBuffer())
        description = await generateProductDescription(firstBuffer)
      }

      // Delete existing images
      await prisma.productImage.deleteMany({ where: { productId: id } })

      // Process and create new images for all uploaded files
      const productImages: Array<{ imageData: string; imageType: string; size: ImageSize; alt: string }> = []
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

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          category,
          material,
          weight,
          dimensions,
          ...(typeof stock === 'number' ? { stock, inStock: stock > 0 } : {}),
          featured,
          images: { create: productImages }
        },
        include: { images: true }
      })

      return NextResponse.json(product)
    } else {
      // Update product without changing images
      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          price,
          category,
          material,
          weight,
          dimensions,
          ...(typeof stock === 'number' ? { stock, inStock: stock > 0 } : {}),
          featured
        },
        include: {
          images: true
        }
      })

      return NextResponse.json(product)
    }
  } catch (error) {
    return handleApiError(error, "admin/products/[id]:PUT")
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete product (images will be deleted automatically due to cascade)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    return handleApiError(error, "admin/products/[id]:DELETE")
  }
}
