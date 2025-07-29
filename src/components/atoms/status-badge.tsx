import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error"
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusStyles = {
    active: "bg-green-100 text-green-800 hover:bg-green-100",
    inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100", 
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    error: "bg-red-100 text-red-800 hover:bg-red-100"
  }

  return (
    <Badge 
      variant="secondary"
      className={cn(statusStyles[status], className)}
    >
      {children}
    </Badge>
  )
}
