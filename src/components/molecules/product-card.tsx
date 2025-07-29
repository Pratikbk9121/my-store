import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "@/components/atoms/price-display"
import { StatusBadge } from "@/components/atoms/status-badge"
import { Edit, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    category: string
    inStock: boolean
    featured: boolean
    images?: Array<{ imageData: string; imageType: string }>
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  className?: string
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onView,
  className
}: ProductCardProps) {
  const imageUrl = product.images?.[0]
    ? `data:${product.images[0].imageType};base64,${product.images[0].imageData}`
    : '/placeholder-product.jpg'

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Featured
              </Badge>
            )}
            <StatusBadge status={product.inStock ? "active" : "inactive"}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </StatusBadge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description || "No description available"}
          </p>
          <div className="flex items-center justify-between">
            <PriceDisplay amount={product.price} size="lg" />
            <Badge variant="outline">{product.category}</Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        {onView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(product.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product.id)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
