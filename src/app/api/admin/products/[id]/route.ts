import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateProductDescription } from "@/lib/ai-description"
import { processProductImage } from "@/lib/image-processing"
import { Category } from "@prisma/client"

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Process new image if provided
    if (image && image.size > 0) {
      const imageBuffer = Buffer.from(await image.arrayBuffer())
      
      // Generate AI description if requested
      if (generateDescription && !description) {
        description = await generateProductDescription(imageBuffer)
      }

      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId: id }
      })

      // Process and create new images
      const processedImages = await processProductImage(imageBuffer, image.type)
      const productImages = processedImages.map(img => ({
        imageData: img.data.toString('base64'), // Convert Buffer to base64 string for SQLite
        imageType: img.type,
        size: img.size,
        alt: name
      }))

      // Update product with new images
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
          inStock,
          featured
        },
        include: {
          images: true
        }
      })

      return NextResponse.json(product)
    }
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
