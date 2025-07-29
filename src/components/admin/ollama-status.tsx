'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ExternalLink } from "lucide-react"

interface OllamaStatus {
  status: "connected" | "disconnected" | "not_configured" | "timeout" | "error"
  message: string
  models?: Array<{ name: string }>
  hasLlava?: boolean
  recommendation?: string
  instructions?: string[]
}

export function OllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/ollama-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        setStatus({
          status: "error",
          message: "Failed to check Ollama status"
        })
      }
    } catch (error) {
      setStatus({
        status: "error",
        message: "Failed to check Ollama status"
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
    
    switch (status?.status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "disconnected":
      case "timeout":
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "not_configured":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    switch (status?.status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
      case "timeout":
        return <Badge variant="destructive">Timeout</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "not_configured":
        return <Badge variant="secondary">Not Configured</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
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
              <CardDescription>Ollama status for AI-generated product descriptions</CardDescription>
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
            <p className="text-sm text-gray-600">{status.message}</p>
            
            {status.status === "connected" && (
              <div className="space-y-2">
                {status.hasLlava ? (
                  <p className="text-sm text-green-600">✅ LLaVA model is available for image descriptions</p>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">⚠️ LLaVA model not found</p>
                    <p className="text-xs text-yellow-600 mt-1">{status.recommendation}</p>
                  </div>
                )}
                
                {status.models && status.models.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Available models:</p>
                    <div className="flex flex-wrap gap-1">
                      {status.models.map((model, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {model.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {(status.status === "disconnected" || status.status === "not_configured") && status.instructions && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</p>
                <ol className="text-sm text-blue-800 space-y-1">
                  {status.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  asChild
                >
                  <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Ollama
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
