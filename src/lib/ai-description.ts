import { DESCRIPTION_LIMITS, FALLBACK_DESCRIPTION } from '@/lib/constants'
import { generateDescriptionWithGemini, isGeminiConfigured } from './gemini-vision'

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

export async function generateProductDescription(
  imageBuffer: Buffer,
  productName?: string,
  category?: string
): Promise<string> {
  try {
    // Check if Gemini is configured
    if (!isGeminiConfigured()) {
      console.warn('Google Gemini API key not configured. Using fallback description.')
      return FALLBACK_DESCRIPTION
    }

    // Use Gemini Vision to generate description
    const result = await generateDescriptionWithGemini(imageBuffer, productName, category)

    if (!result.success) {
      console.warn('Gemini Vision failed:', result.error)
      return FALLBACK_DESCRIPTION
    }

    // Process the description to ensure it meets our requirements
    return processDescription(result.description)

  } catch (error) {
    console.error('AI description generation failed:', error)
    return FALLBACK_DESCRIPTION
  }
}