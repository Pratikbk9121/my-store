import { DESCRIPTION_LIMITS, FALLBACK_DESCRIPTION, IMAGE_LIMITS, TIMEOUTS } from '@/lib/constants'

interface OllamaResponse { response: string }

const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const hasProperEnding = (text: string) => /[.!?]$/.test(text.trim())
const findLastPunctuation = (text: string) => Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'))

function processDescription(description: string): string {
  let cleaned = description
    .replace(/\*+/g, '').replace(/#{1,6}\s/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()

  if (!hasProperEnding(cleaned)) {
    const lastPunctuation = findLastPunctuation(cleaned)
    if (lastPunctuation > cleaned.length * 0.6) {
      cleaned = cleaned.substring(0, lastPunctuation + 1).trim()
    }
  }

  const wordCount = getWordCount(cleaned)

  if (wordCount >= DESCRIPTION_LIMITS.MIN && wordCount <= DESCRIPTION_LIMITS.MAX && hasProperEnding(cleaned)) return cleaned
  if (wordCount < DESCRIPTION_LIMITS.MIN) {
    console.warn(`Description too short (${wordCount} words), using fallback`)
    return FALLBACK_DESCRIPTION
  }

  console.warn(`Description needs trimming (${wordCount} words), creating complete sentences`)
  return trimToSentences(cleaned)
}

function trimToSentences(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  let result = '', wordCount = 0

  for (const sentence of sentences) {
    const sentenceWords = getWordCount(sentence)
    if (wordCount + sentenceWords > DESCRIPTION_LIMITS.TARGET) break
    result += sentence.trim() + '. '
    wordCount += sentenceWords
  }

  return wordCount < DESCRIPTION_LIMITS.MIN_MEANINGFUL || !result.trim()
    ? (console.warn('Could not create meaningful description, using fallback'), FALLBACK_DESCRIPTION)
    : result.trim()
}

function buildContextPrompt(productName?: string, category?: string): string {
  const context = (productName || category)
    ? `Product context: ${productName ? `Name: "${productName}"` : ''}${productName && category ? ', ' : ''}${category ? `Category: ${category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}` : ''}. `
    : ''

  return `${context}Write a complete, compelling product description for this 925 silver jewelry piece in exactly 60-75 words. Include: design details, materials, craftsmanship, and appeal. Be specific about the style and features visible in the image. End with a complete sentence. Make it professional for e-commerce. IMPORTANT: Write complete sentences only, do not cut off mid-sentence.`
}

export async function generateProductDescription(
  imageBuffer: Buffer,
  productName?: string,
  category?: string
): Promise<string> {
  try {
    const ollamaUrl = process.env.OLLAMA_API_URL
    if (!ollamaUrl) {
      console.warn('OLLAMA_API_URL not configured. Using fallback description.')
      return FALLBACK_DESCRIPTION
    }
    if (imageBuffer.length > IMAGE_LIMITS.MAX_SIZE) {
      console.warn('Image too large for Ollama processing, using fallback description')
      return FALLBACK_DESCRIPTION
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.OLLAMA_REQUEST)

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: buildContextPrompt(productName, category),
        images: [imageBuffer.toString('base64')],
        stream: false,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 120, stop: ['\n\n', '---'] }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error response:', errorText)
      if (errorText.includes('unable to make llava embedding from image')) {
        console.warn('Image format not compatible with LLaVA, using fallback description')
        return FALLBACK_DESCRIPTION
      }
      throw new Error(`Ollama API responded with status: ${response.status} - ${errorText}`)
    }

    const data: OllamaResponse = await response.json()
    if (!data.response?.trim()) {
      console.warn('Empty response from Ollama, using fallback description')
      return FALLBACK_DESCRIPTION
    }

    return processDescription(data.response.trim())

  } catch (error) {
    console.error('AI description generation failed:', error)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Ollama request timed out')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('Cannot connect to Ollama. Make sure Ollama is running on', process.env.OLLAMA_API_URL)
      }
    }
    return FALLBACK_DESCRIPTION
  }
}