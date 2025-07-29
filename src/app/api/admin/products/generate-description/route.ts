import { NextRequest, NextResponse } from "next/server"
import { generateProductDescription } from "@/lib/ai-description"
import { requireAdminAuth, handleApiError } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const formData = await request.formData()
    const image = formData.get("image") as File
    const productName = formData.get("productName") as string
    const category = formData.get("category") as string

    if (!image || image.size === 0) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      )
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer())

    // Log image details for debugging
    console.log('Processing image:', {
      name: image.name,
      type: image.type,
      size: image.size,
      bufferLength: imageBuffer.length,
      productName: productName || 'Not provided',
      category: category || 'Not provided'
    })

    const description = await generateProductDescription(imageBuffer, productName, category)

    return NextResponse.json({ description })
  } catch (error) {
    return handleApiError(error, "generate-description")
  }
}
