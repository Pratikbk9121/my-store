import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  amount: number
  currency?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceDisplay({ 
  amount, 
  currency = "USD", 
  size = "md", 
  className 
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold"
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <span className={cn("font-medium", sizeClasses[size], className)}>
      {formatPrice(amount, currency)}
    </span>
  )
}
