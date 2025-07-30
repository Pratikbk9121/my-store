import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Configuration constants
export const GEMINI_CONFIG = {
  MODEL: 'gemini-1.5-flash',
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB - Gemini's limit
  TIMEOUT: 30000, // 30 seconds
  GENERATION_CONFIG: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 150,
  }
} as const

export interface GeminiVisionResponse {
  description: string
  success: boolean
  error?: string
}

/**
 * Generate product description using Google Gemini Vision
 */
export async function generateDescriptionWithGemini(
  imageBuffer: Buffer,
  productName?: string,
  category?: string
): Promise<GeminiVisionResponse> {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return {
        success: false,
        description: '',
        error: 'Google Gemini API key not configured'
      }
    }

    // Check image size
    if (imageBuffer.length > GEMINI_CONFIG.MAX_IMAGE_SIZE) {
      return {
        success: false,
        description: '',
        error: 'Image too large for Gemini processing'
      }
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.MODEL,
      generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
    })

    // Build the prompt
    const prompt = buildGeminiPrompt(productName, category)

    // Convert buffer to the format Gemini expects
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg' // Assuming JPEG, could be made dynamic
      }
    }

    // Generate content with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.TIMEOUT)

    try {
      const result = await model.generateContent([prompt, imagePart])
      clearTimeout(timeoutId)

      const response = await result.response
      const text = response.text()

      if (!text?.trim()) {
        return {
          success: false,
          description: '',
          error: 'Empty response from Gemini'
        }
      }

      return {
        success: true,
        description: processGeminiDescription(text.trim())
      }

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }

  } catch (error) {
    console.error('Gemini Vision API error:', error)
    
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out'
      } else if (error.message.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid Google Gemini API key'
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API quota exceeded'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      description: '',
      error: errorMessage
    }
  }
}

/**
 * Build the prompt for Gemini Vision
 */
function buildGeminiPrompt(productName?: string, category?: string): string {
  let prompt = `Analyze this jewelry image and create a compelling product description. Focus on:

- Material and craftsmanship details
- Design elements and style
- Occasions suitable for wearing
- Quality and finish

Requirements:
- Write 60-80 words
- Use professional, appealing language
- Mention "925 silver" or "sterling silver" if it appears to be silver jewelry
- Focus on visual details you can observe
- Make it suitable for an e-commerce product listing`

  if (productName) {
    prompt += `\n- Product name: ${productName}`
  }

  if (category) {
    prompt += `\n- Category: ${category}`
  }

  prompt += `\n\nProvide only the description text, no additional formatting or explanations.`

  return prompt
}

/**
 * Process and clean the description from Gemini
 */
function processGeminiDescription(description: string): string {
  // Remove any markdown formatting
  let processed = description
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '')   // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove headers
    .trim()

  // Ensure it starts with a capital letter
  if (processed.length > 0) {
    processed = processed.charAt(0).toUpperCase() + processed.slice(1)
  }

  // Ensure it ends with a period
  if (processed.length > 0 && !processed.endsWith('.')) {
    processed += '.'
  }

  return processed
}

/**
 * Check if Gemini Vision is properly configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_GEMINI_API_KEY
}

/**
 * Get Gemini service status
 */
export async function getGeminiStatus(): Promise<{
  configured: boolean
  available: boolean
  error?: string
}> {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      available: false,
      error: 'Google Gemini API key not configured'
    }
  }

  try {
    // Test with a simple text generation to check if the API is working
    const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.MODEL })
    const result = await model.generateContent('Test')
    await result.response.text()

    return {
      configured: true,
      available: true
    }
  } catch (error) {
    return {
      configured: true,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
