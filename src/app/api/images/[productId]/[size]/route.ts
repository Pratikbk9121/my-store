import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ImageSize } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; size: string }> }
) {
  try {
    const { productId, size } = await params

    // Validate size parameter
    const validSizes = Object.values(ImageSize)
    if (!validSizes.includes(size.toUpperCase() as ImageSize)) {
      return NextResponse.json(
        { error: "Invalid image size" },
        { status: 400 }
      )
    }

    // Get image from database
    const image = await prisma.productImage.findFirst({
      where: {
        productId,
        size: size.toUpperCase() as ImageSize
      },
      select: {
        imageData: true,
        imageType: true,
        alt: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image.imageData, 'base64')

    // Set proper headers for image serving
    const headers = new Headers()
    headers.set('Content-Type', image.imageType)
    headers.set('Content-Length', imageBuffer.length.toString())
    // Allow revalidation via ETag to keep SSR/CSR consistent while updating promptly
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate')

    // Compute ETag; include image size and a basic length to reduce false positives
    const eTag = `"${productId}-${size}-${imageBuffer.length}"`
    headers.set('ETag', eTag)

    // Add alt text if available
    if (image.alt) {
      headers.set('X-Image-Alt', image.alt)
    }

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === eTag) {
      return new NextResponse(null, { status: 304, headers })
    }

    return new NextResponse(imageBuffer, { headers })

  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
