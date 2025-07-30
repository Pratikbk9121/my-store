import sharp from 'sharp'
import { ImageSize } from '@prisma/client'
import { IMAGE_SIZES, IMAGE_LIMITS, IMAGE_FORMATS } from '@/lib/constants'

export interface ProcessedImage {
  data: Buffer
  type: string
  size: ImageSize
  format: string
}

/**
 * Determine the best output format based on input type and preferences
 */
function getBestFormat(originalType: string): { format: string; mimeType: string } {
  const inputFormat = originalType.toLowerCase()

  // Preserve PNG for images with transparency
  if (inputFormat.includes('png') && IMAGE_FORMATS.PRESERVE_PNG) {
    return { format: 'png', mimeType: 'image/png' }
  }

  // Use WebP for best compression/quality ratio
  if (IMAGE_FORMATS.PREFERRED === 'webp') {
    return { format: 'webp', mimeType: 'image/webp' }
  }

  // Fallback to JPEG
  return { format: 'jpeg', mimeType: 'image/jpeg' }
}

/**
 * Get quality settings based on format and size
 */
function getQualitySettings(format: string, size: ImageSize) {
  switch (format) {
    case 'webp':
      // Higher quality for larger images
      return size === ImageSize.FULL ? IMAGE_LIMITS.WEBP_QUALITY + 5 : IMAGE_LIMITS.WEBP_QUALITY
    case 'jpeg':
      // Higher quality for larger images
      return size === ImageSize.FULL ? IMAGE_LIMITS.JPEG_QUALITY : IMAGE_LIMITS.JPEG_QUALITY - 5
    case 'png':
      return IMAGE_LIMITS.PNG_COMPRESSION
    default:
      return IMAGE_LIMITS.JPEG_QUALITY
  }
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

  const { format, mimeType } = getBestFormat(originalType)
  const processedImages: ProcessedImage[] = []

  for (const size of sizes) {
    let sharpInstance = sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        withoutEnlargement: true // Don't upscale small images
      })

    // Apply format-specific processing
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: getQualitySettings(format, size.name),
          effort: 6 // Higher effort for better compression
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          compressionLevel: getQualitySettings(format, size.name),
          adaptiveFiltering: true
        })
        break
      case 'jpeg':
      default:
        sharpInstance = sharpInstance.jpeg({
          quality: getQualitySettings(format, size.name),
          progressive: true,
          mozjpeg: true // Use mozjpeg encoder for better quality
        })
        break
    }

    const processed = await sharpInstance.toBuffer()

    processedImages.push({
      data: processed,
      type: mimeType,
      size: size.name,
      format
    })
  }

  return processedImages
}