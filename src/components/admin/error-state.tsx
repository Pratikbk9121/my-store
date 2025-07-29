import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export function ErrorState({ 
  title = "Something went wrong",
  message = "An error occurred while loading the content.",
  onRetry,
  onBack,
  showBackButton = false
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-center gap-4">
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
        {showBackButton && onBack && (
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        )}
      </div>
    </div>
  )
}
