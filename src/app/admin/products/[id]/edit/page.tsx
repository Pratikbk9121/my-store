'use client'

import { useParams, useRouter } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import { LoadingState } from "@/components/admin/loading-state"
import { ErrorState } from "@/components/admin/error-state"
import { useProduct } from "@/hooks/use-product"

export default function EditProductPage() {
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

  return <ProductForm product={product} />
}
