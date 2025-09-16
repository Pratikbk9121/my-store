'use client'

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay } from "@/components/atoms/price-display"
import { StatusBadge } from "@/components/atoms/status-badge"
import { PageHeader } from "@/components/admin/page-header"
import { LoadingState } from "@/components/admin/loading-state"
import { ErrorState } from "@/components/admin/error-state"
import { useProduct } from "@/hooks/use-product"
import { Edit, Trash2 } from "lucide-react"

export default function ProductViewPage() {
  const params = useParams()
  const router = useRouter()
  const { product, isLoading, error } = useProduct(params.id as string)

  if (isLoading) {
    return <LoadingState message="Loading product..." />
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product Not Found"
        message={error || "The product you're looking for doesn't exist."}
        showBackButton
        onBack={() => router.push("/admin/products")}
      />
    )
  }

  const mainImage = product.images?.find(img => img.size === "FULL") || product.images?.[0]
  const imageUrl = mainImage
    ? `data:${mainImage.imageType};base64,${mainImage.imageData}`
    : '/placeholder-product.jpg'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={product.name}
        description="Product Details"
        showBackButton
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this product?")) {
                  // Delete logic here
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <Card>
          <CardContent className="p-6">
            <div className="relative h-96">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Information</CardTitle>
              <div className="flex gap-2">
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
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Price</h3>
              <PriceDisplay amount={product.price} size="lg" />
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Category</h3>
              <Badge variant="outline">{product.category}</Badge>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Material</h3>
              <p className="text-gray-700">{product.material}</p>
            </div>

            {product.weight && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Weight</h3>
                <p className="text-gray-700">{product.weight}g</p>
              </div>
            )}

            {product.dimensions && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Dimensions</h3>
                <p className="text-gray-700">{product.dimensions}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-2">Created</h3>
              <p className="text-gray-700">
                {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Last Updated</h3>
              <p className="text-gray-700">
                {new Date(product.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
