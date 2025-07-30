'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react"
import { getGeminiStatus } from "@/lib/gemini-vision"

interface GeminiStatusData {
  configured: boolean
  available: boolean
  error?: string
}

export function GeminiStatus() {
  const [status, setStatus] = useState<GeminiStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const statusData = await getGeminiStatus()
      setStatus(statusData)
    } catch {
      setStatus({
        configured: false,
        available: false,
        error: "Failed to check Gemini status"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin" />
    
    if (status?.configured && status?.available) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status?.configured && !status?.available) {
      return <XCircle className="h-5 w-5 text-red-600" />
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusBadge = () => {
    if (status?.configured && status?.available) {
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>
    } else if (status?.configured && !status?.available) {
      return <Badge variant="destructive">Error</Badge>
    } else {
      return <Badge variant="secondary">Not Configured</Badge>
    }
  }

  const getStatusMessage = () => {
    if (status?.configured && status?.available) {
      return "Google Gemini Vision is connected and ready for AI-generated product descriptions"
    } else if (status?.configured && !status?.available) {
      return status?.error || "Google Gemini Vision API is not responding"
    } else {
      return "Google Gemini API key not configured"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">AI Description Service</CardTitle>
              <CardDescription>Google Gemini Vision for AI-generated product descriptions</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{getStatusMessage()}</p>
            
            {status.configured && status.available && (
              <div className="space-y-2">
                <p className="text-sm text-green-600">✅ Gemini Vision is available for image descriptions</p>
                <p className="text-sm text-gray-600">
                  Using model: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">gemini-1.5-flash</code>
                </p>
              </div>
            )}
            
            {!status.configured && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</p>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Get a Google Gemini API key from Google AI Studio</li>
                  <li>2. Add GOOGLE_GEMINI_API_KEY to your environment variables</li>
                  <li>3. Restart your application</li>
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  asChild
                >
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get API Key
                  </a>
                </Button>
              </div>
            )}

            {status.configured && !status.available && status.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">Error: {status.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
