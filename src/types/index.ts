import { ImageSize, Category, OrderStatus, Role } from '@prisma/client'

// Product related types
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: Category
  material: string
  weight?: number
  dimensions?: string
  inStock: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  productId: string
  imageData: string
  imageType: string
  size: ImageSize
  alt?: string
  createdAt: Date
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form data types
export interface ProductFormData {
  name: string
  description?: string
  price: number
  category: string
  material?: string
  weight?: number
  dimensions?: string
  inStock: boolean
  featured: boolean
  image?: File
  generateDescription?: boolean
}

// Search and filter types
export interface ProductFilters {
  category?: Category
  search?: string
  inStock?: boolean
  featured?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface SearchParams {
  page?: string
  limit?: string
  category?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// User types
export interface User {
  id: string
  email: string
  name?: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

// Order types
export interface Order {
  id: string
  userId: string
  status: OrderStatus
  total: number
  createdAt: Date
  updatedAt: Date
  items: OrderItem[]
  user: User
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product: Product
}

// Dashboard types
export interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  recentProducts: Array<{
    id: string
    name: string
    price: number
    category: string
    inStock: boolean
    createdAt: string
  }>
}

// Image processing types
export interface ProcessedImageData {
  imageData: string
  imageType: string
  size: ImageSize
  alt: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingProps {
  isLoading?: boolean
  loadingText?: string
}

export interface ErrorProps {
  error?: string | null
  onRetry?: () => void
}
