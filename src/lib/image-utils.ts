import { ImageSize } from '@prisma/client'

/**
 * Generate image URL for a product
 */
export function getImageUrl(productId: string, size: ImageSize = ImageSize.MEDIUM): string {
  // Use a stable URL to avoid hydration mismatches; rely on ETag/Cache-Control from API
  return `/api/images/${productId}/${size.toLowerCase()}`
}

/**
 * Generate srcset for responsive images
 */
export function getImageSrcSet(productId: string): string {
  return [
    `${getImageUrl(productId, ImageSize.THUMBNAIL)} 300w`,
    `${getImageUrl(productId, ImageSize.MEDIUM)} 800w`,
    `${getImageUrl(productId, ImageSize.FULL)} 1920w`
  ].join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export function getImageSizes(): string {
  return '(max-width: 768px) 300px, (max-width: 1024px) 800px, 1920px'
}

/**
 * Create optimized image props for Next.js Image component or regular img
 */
export function getOptimizedImageProps(
  productId: string,
  alt: string,
  size: ImageSize = ImageSize.MEDIUM
) {
  return {
    src: getImageUrl(productId, size),
    srcSet: getImageSrcSet(productId),
    sizes: getImageSizes(),
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const
  }
}

/**
 * Fallback image URL for when no image is available
 */
export function getFallbackImageUrl(): string {
  return '/placeholder-product.svg'
}

/**
 * Check if an image exists and return appropriate URL
 */
export function getImageUrlWithFallback(
  productId: string | null | undefined,
  hasImage: boolean,
  size: ImageSize = ImageSize.MEDIUM
): string {
  if (!productId || !hasImage) {
    return getFallbackImageUrl()
  }
  return getImageUrl(productId, size)
}
