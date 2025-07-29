import sharp from 'sharp'
import { ImageSize } from '@prisma/client'
import { IMAGE_SIZES, IMAGE_LIMITS } from '@/lib/constants'

export interface ProcessedImage {
  data: Buffer
  type: string
  size: ImageSize
}

export async function processProductImage(
  imageBuffer: Buffer,
  originalType: string
): Promise<ProcessedImage[]> {
  const sizes = [
    { name: ImageSize.THUMBNAIL, ...IMAGE_SIZES.THUMBNAIL },
    { name: ImageSize.MEDIUM, ...IMAGE_SIZES.MEDIUM },
    { name: ImageSize.FULL, ...IMAGE_SIZES.FULL }
  ]
  
  const processedImages: ProcessedImage[] = []
  
  for (const size of sizes) {
    const processed = await sharp(imageBuffer)
      .resize(size.width, size.height, { fit: 'cover' })
      .jpeg({ quality: IMAGE_LIMITS.QUALITY })
      .toBuffer()
    
    processedImages.push({
      data: processed,
      type: 'image/jpeg',
      size: size.name
    })
  }
  
  return processedImages
}