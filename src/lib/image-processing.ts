import sharp from 'sharp'

import { ImageSize } from '@/generated/prisma'

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
    { name: ImageSize.THUMBNAIL, width: 150, height: 150 },
    { name: ImageSize.MEDIUM, width: 500, height: 500 },
    { name: ImageSize.FULL, width: 1200, height: 1200 }
  ]
  
  const processedImages: ProcessedImage[] = []
  
  for (const size of sizes) {
    const processed = await sharp(imageBuffer)
      .resize(size.width, size.height, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer()
    
    processedImages.push({
      data: processed,
      type: 'image/jpeg',
      size: size.name
    })
  }
  
  return processedImages
}