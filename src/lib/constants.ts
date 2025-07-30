/**
 * Application-wide constants
 */

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
} as const

// Image processing
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 300, height: 300 },
  MEDIUM: { width: 800, height: 800 },
  FULL: { width: 1920, height: 1920 }
} as const

export const IMAGE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  JPEG_QUALITY: 95, // High quality for JPEG
  WEBP_QUALITY: 90, // High quality for WebP
  PNG_COMPRESSION: 6 // PNG compression level (0-9)
} as const

// Image format preferences
export const IMAGE_FORMATS = {
  PREFERRED: 'webp', // WebP for best compression/quality ratio
  FALLBACK: 'jpeg',  // JPEG fallback for compatibility
  PRESERVE_PNG: true // Keep PNG for images with transparency
} as const

// AI Description limits
export const DESCRIPTION_LIMITS = {
  MIN: 50,
  MAX: 80,
  TARGET: 75,
  MIN_MEANINGFUL: 40
} as const

// Default values
export const DEFAULTS = {
  MATERIAL: "925 Silver",
  PAGINATION_LIMIT: 10,
  MAX_PAGINATION_LIMIT: 100
} as const

// Timeouts
export const TIMEOUTS = {
  GEMINI_REQUEST: 30000, // 30 seconds
  API_REQUEST: 30000     // 30 seconds
} as const

// Fallback content
export const FALLBACK_DESCRIPTION = 'Beautiful 925 silver jewelry piece featuring elegant design and premium craftsmanship. This stunning accessory showcases exceptional attention to detail with polished finish and sophisticated styling. Perfect for both casual and formal occasions, offering timeless appeal and lasting quality. Expertly crafted from high-grade sterling silver, ensuring durability and lustrous shine that complements any wardrobe beautifully.'
