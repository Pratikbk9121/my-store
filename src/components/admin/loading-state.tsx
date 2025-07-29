import { LoadingSpinner } from "@/components/atoms/loading-spinner"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({ message = "Loading...", size = "lg" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <LoadingSpinner size={size} />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
