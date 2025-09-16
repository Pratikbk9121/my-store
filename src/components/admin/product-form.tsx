'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/molecules/image-upload"
import { LoadingSpinner } from "@/components/atoms/loading-spinner"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id?: string
  name: string
  description?: string
  price: number
  category: string
  material: string
  weight?: number
  dimensions?: string
  inStock: boolean
  featured: boolean
  images?: Array<{ imageData: string; imageType: string }>
}

interface ProductFormProps {
  product?: Product
  onSubmit?: (product: Product) => void
  isLoading?: boolean
}

const categories = [
  "NECKLACE", "RING", "EARRING", "BRACELET", "BROOCH", "PENDANT",
  "BANGLE", "CHARM", "BELT", "WATCH", "SCARF", "TIE", "HAT",
  "GLOVE", "SHOES", "BAG", "BELLY_BUTTON", "PIERCING", "CANDLE",
  "DECORATION", "GIFT", "OTHER"
]

export function ProductForm({ product, onSubmit, isLoading = false }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    category: "NECKLACE",
    material: "925 Silver",
    weight: undefined,
    dimensions: "",
    inStock: true,
    featured: false,
    ...product
  })
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (product?.images?.[0]) {
      const image = product.images[0]
      const imageUrl = `data:${image.imageType};base64,${image.imageData}`
      setImagePreview(imageUrl)
    }
  }, [product])

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setImagePreview("")
  }

  const generateDescription = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first")
      return
    }

    setIsGeneratingDescription(true)
    try {
      const submitFormData = new FormData()
      submitFormData.append("image", selectedImage)

      // Add product context for better AI descriptions
      if (formData.name && formData.name.trim()) {
        submitFormData.append("productName", formData.name.trim())
      }
      if (formData.category) {
        submitFormData.append("category", formData.category)
      }

      const response = await fetch("/api/admin/products/generate-description", {
        method: "POST",
        body: submitFormData
      })

      if (response.ok) {
        const { description, usedFallback } = await response.json()
        setFormData(prev => ({ ...prev, description }))

        // Count words in the generated description
        const wordCount = description.trim().split(/\s+/).filter((word: string) => word.length > 0).length

        if (usedFallback) {
          toast.warning("AI description unavailable. Using optimized fallback description (75 words).")
        } else {
          const contextUsed = (formData.name || formData.category) ? " with product context" : ""
          toast.success(`Description generated successfully${contextUsed}! (${wordCount} words)`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate description")
      }
    } catch (error) {
      console.error("Error generating description:", error)
      toast.error("Failed to generate description. Check your Google Gemini API key.")
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitData.append(key, value.toString())
        }
      })

      // Add image if selected
      if (selectedImage) {
        submitData.append("image", selectedImage)
      }

      const url = product?.id
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products"

      const method = product?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        body: submitData
      })

      if (response.ok) {
        const savedProduct = await response.json()
        toast.success(`Product ${product?.id ? 'updated' : 'created'} successfully!`)

        if (onSubmit) {
          onSubmit(savedProduct)
        } else {
          router.push("/admin/products")
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to save product")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Failed to save product")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {product?.id ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-gray-600">
            {product?.id ? "Update product information" : "Create a new product for your store"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price (INR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="925 Silver"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      weight: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="L x W x H"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inStock: !!checked }))}
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Image & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Image & Description</CardTitle>
              <CardDescription>
                Upload product image and add description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                preview={imagePreview}
                isLoading={isLoading}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={!selectedImage || isGeneratingDescription}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingDescription ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                    {!isGeneratingDescription && (
                      <p className="text-xs text-gray-500 text-right">
                        {formData.name || formData.category
                          ? "Will use product name & category for context"
                          : "Add product name & category for better results"}
                      </p>
                    )}
                  </div>
                </div>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description or generate with AI... (Optimal: 50-80 words)"
                  rows={6}
                />
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                  <span>Optimal length: 50-80 words for best SEO and readability</span>
                  <span className={`font-medium ${
                    (() => {
                      const wordCount = (formData.description || "").trim().split(/\s+/).filter(word => word.length > 0).length
                      if (wordCount === 0) return "text-gray-400"
                      if (wordCount >= 50 && wordCount <= 80) return "text-green-600"
                      if (wordCount < 50) return "text-yellow-600"
                      return "text-red-600"
                    })()
                  }`}>
                    {(formData.description || "").trim().split(/\s+/).filter(word => word.length > 0).length} words
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {product?.id ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
