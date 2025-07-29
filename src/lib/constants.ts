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
  THUMBNAIL: { width: 150, height: 150 },
  MEDIUM: { width: 500, height: 500 },
  FULL: { width: 1200, height: 1200 }
} as const

export const IMAGE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  QUALITY: 85
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
  OLLAMA_REQUEST: 60000, // 60 seconds
  API_REQUEST: 30000     // 30 seconds
} as const

// Fallback content
export const FALLBACK_DESCRIPTION = 'Beautiful 925 silver jewelry piece featuring elegant design and premium craftsmanship. This stunning accessory showcases exceptional attention to detail with polished finish and sophisticated styling. Perfect for both casual and formal occasions, offering timeless appeal and lasting quality. Expertly crafted from high-grade sterling silver, ensuring durability and lustrous shine that complements any wardrobe beautifully.'
