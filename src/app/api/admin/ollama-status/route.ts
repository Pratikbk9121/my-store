import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Ollama URL is configured
    if (!process.env.OLLAMA_API_URL) {
      return NextResponse.json({
        status: "not_configured",
        message: "OLLAMA_API_URL environment variable not set"
      })
    }

    try {
      // Try to connect to Ollama
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${process.env.OLLAMA_API_URL}/api/tags`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const hasLlava = data.models?.some((model: any) => model.name.includes('llava'))
        
        return NextResponse.json({
          status: "connected",
          message: "Ollama is running",
          models: data.models || [],
          hasLlava,
          recommendation: hasLlava ? null : "Install llava model with: ollama pull llava"
        })
      } else {
        return NextResponse.json({
          status: "error",
          message: `Ollama responded with status: ${response.status}`
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          status: "timeout",
          message: "Connection to Ollama timed out"
        })
      }
      
      return NextResponse.json({
        status: "disconnected",
        message: "Cannot connect to Ollama. Make sure it's running.",
        instructions: [
          "1. Install Ollama: https://ollama.ai",
          "2. Start Ollama: ollama serve",
          "3. Install llava model: ollama pull llava"
        ]
      })
    }
  } catch (error) {
    console.error("Error checking Ollama status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
