'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/atoms/price-display'
import { getOptimizedImageProps, getFallbackImageUrl } from '@/lib/image-utils'
import { ImageSize } from '@prisma/client'

interface PublicProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    category: string
    hasImage: boolean
    inStock?: boolean
    ratingAverage?: number
    ratingCount?: number
  }
  href: string
}

export function PublicProductCard({ product, href }: PublicProductCardProps) {
  const imageProps = product.hasImage
    ? getOptimizedImageProps(product.id, product.name, ImageSize.MEDIUM)
    : { src: getFallbackImageUrl(), alt: product.name, loading: 'lazy' as const, decoding: 'async' as const }

  const avg = product.ratingAverage ?? 0
  const count = product.ratingCount ?? 0
  const fullStars = Math.round(avg)

  return (
    <Link href={href} className="block group">
      <div className="overflow-hidden rounded-lg border bg-white hover:shadow-lg transition-shadow">
        <div className="relative h-56">
          <Image
            src={imageProps.src}
            alt={imageProps.alt}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className={`object-cover transition-opacity ${product.inStock === false ? 'opacity-60' : 'group-hover:opacity-95'}`}
          />
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {product.inStock === false && (
              <span className="px-2 py-1 text-xs rounded-md bg-red-600 text-white">Out of stock</span>
            )}
            <Badge variant="outline" className="text-white">{product.category}</Badge>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          {count > 0 && (
            <div className="text-xs text-yellow-600">{'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)} <span className="text-gray-500">({count})</span></div>
          )}
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description || 'Beautiful 925 silver jewelry.'}
          </p>
          <div className="pt-1">
            <PriceDisplay amount={product.price} size="lg" />
          </div>
        </div>
      </div>
    </Link>
  )
}

