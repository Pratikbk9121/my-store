import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import type { ProductDto } from '@/types'


/**
 * Hook for fetching a single product
 */
export function useProduct(id: string | null) {
  const [product, setProduct] = useState<ProductDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/products/${id}`)

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Product not found' : 'Failed to fetch product')
      }

      const data = await response.json()
      setProduct(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    // Fetch when id changes
    fetchProduct()
  }, [fetchProduct])

  return { product, isLoading, error, refetch: fetchProduct }
}

/**
 * Hook for fetching multiple products
 */
export function useProducts() {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/products')

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Product deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product'
      toast.error(errorMessage)
      return false
    }
  }

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    deleteProduct
  }
}
