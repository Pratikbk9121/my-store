// Test script to verify Ollama connection from Node.js
const fs = require('fs')

async function testOllamaConnection() {
  try {
    console.log('🧪 Testing Ollama connection...')
    
    const ollamaUrl = 'http://127.0.0.1:11434'
    
    // Test 1: Check if Ollama is responding
    console.log('1. Testing basic connection...')
    const response = await fetch(`${ollamaUrl}/api/tags`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Ollama is responding!')
    console.log('📦 Available models:', data.models.map(m => m.name))
    
    // Test 2: Check if LLaVA is available
    const hasLlava = data.models.some(model => model.name.includes('llava'))
    if (hasLlava) {
      console.log('✅ LLaVA model is available!')
    } else {
      console.log('❌ LLaVA model not found')
      return
    }
    
    // Test 3: Try a simple text generation (without image)
    console.log('2. Testing text generation...')
    const textResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava',
        prompt: 'Describe a beautiful silver necklace in one sentence.',
        stream: false
      })
    })
    
    if (textResponse.ok) {
      const textData = await textResponse.json()
      console.log('✅ Text generation works!')
      console.log('📝 Sample response:', textData.response.substring(0, 100) + '...')
    } else {
      console.log('❌ Text generation failed:', textResponse.status)
    }
    
    console.log('\n🎉 Ollama connection test completed!')
    
  } catch (error) {
    console.error('❌ Ollama connection test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:')
      console.log('1. Make sure Ollama is running: ollama serve')
      console.log('2. Check if Ollama is on the right port: curl http://127.0.0.1:11434/api/tags')
      console.log('3. Try restarting Ollama: brew services restart ollama')
    }
  }
}

// Run the test
testOllamaConnection()
