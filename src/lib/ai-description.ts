interface OllamaResponse {
  response: string
}

export async function generateProductDescription(imageBuffer: Buffer): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64')
    
    const response = await fetch(`${process.env.OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: 'Describe this 925 silver jewelry piece in detail for an e-commerce listing. Include style, design elements, and appeal.',
        images: [base64Image],
        stream: false
      })
    })
    
    const data: OllamaResponse = await response.json()
    return data.response
  } catch (error) {
    console.error('AI description generation failed:', error)
    return 'Beautiful 925 silver jewelry piece with elegant design.'
  }
}