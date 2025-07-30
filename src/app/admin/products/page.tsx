'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductGrid } from "@/components/organisms/product-grid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/admin/page-header"
import { useProducts } from "@/hooks/use-product"
import { Plus, RefreshCw } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const { products, isLoading, deleteProduct, refetch } = useProducts()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleAddProduct = () => {
    router.push("/admin/products/new")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  const handleEditProduct = (id: string) => {
    router.push(`/admin/products/${id}/edit`)
  }

  const handleViewProduct = (id: string) => {
    router.push(`/admin/products/${id}`)
  }

  const handleDeleteProduct = (id: string) => {
    setDeleteDialog({ open: true, productId: id })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.productId) return

    setIsDeleting(true)
    const success = await deleteProduct(deleteDialog.productId)
    if (success) {
      setDeleteDialog({ open: false, productId: null })
    }
    setIsDeleting(false)
  }

  const cancelDelete = () => {
    setDeleteDialog({ open: false, productId: null })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product inventory"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddProduct} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      />

      <ProductGrid
        products={products}
        isLoading={isLoading}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onViewProduct={handleViewProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
