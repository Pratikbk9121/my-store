'use client'

import { useState, useEffect, useCallback } from "react"
import { ProductCard } from "@/components/molecules/product-card"
import { SearchFilter } from "@/components/molecules/search-filter"
import { LoadingSpinner } from "@/components/atoms/loading-spinner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  inStock: boolean
  featured: boolean
  images?: Array<{ imageData: string; imageType: string; size: string }>
}

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
  onAddProduct?: () => void
  onEditProduct?: (id: string) => void
  onDeleteProduct?: (id: string) => void
  onViewProduct?: (id: string) => void
  className?: string
}

export function ProductGrid({
  products,
  isLoading = false,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  className
}: ProductGridProps) {
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  const categories = Array.from(new Set(products.map(p => p.category)))
  const filters = [
    {
      key: "category",
      label: "Category",
      options: categories.map(cat => ({ value: cat, label: cat }))
    },
    {
      key: "inStock",
      label: "Stock Status",
      options: [
        { value: "true", label: "In Stock" },
        { value: "false", label: "Out of Stock" }
      ]
    },
    {
      key: "featured",
      label: "Featured",
      options: [
        { value: "true", label: "Featured" },
        { value: "false", label: "Not Featured" }
      ]
    }
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(query, activeFilters)
  }

  const handleFilter = (filters: Record<string, string>) => {
    setActiveFilters(filters)
    applyFilters(searchQuery, filters)
  }

  const handleClear = () => {
    setSearchQuery("")
    setActiveFilters({})
    setFilteredProducts(products)
  }

  const applyFilters = useCallback((query: string, filters: Record<string, string>) => {
    let filtered = products

    // Apply search query
    if (query) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "category") {
        filtered = filtered.filter(product => product.category === value)
      } else if (key === "inStock") {
        filtered = filtered.filter(product => product.inStock === (value === "true"))
      } else if (key === "featured") {
        filtered = filtered.filter(product => product.featured === (value === "true"))
      }
    })

    setFilteredProducts(filtered)
  }, [products])

  // Update filtered products when products prop changes
  useEffect(() => {
    applyFilters(searchQuery, activeFilters)
  }, [products, searchQuery, activeFilters, applyFilters])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        {onAddProduct && (
          <Button onClick={onAddProduct} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        onClear={handleClear}
        filters={filters}
        placeholder="Search products by name, description, or category..."
      />

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              onView={onViewProduct}
            />
          ))}
        </div>
      )}
    </div>
  )
}
