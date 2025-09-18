import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { extractIdFromSlug } from '@/lib/slug'
import { getFallbackImageUrl } from '@/lib/image-utils'
import { PdpAddToCart } from '@/components/public/pdp-add-to-cart'
import { Reviews } from '@/components/public/reviews'
import { ImageCarousel } from '@/components/public/image-carousel'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slugAndId: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slugAndId } = await params
  const id = extractIdFromSlug(slugAndId)

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  })

  if (!product) return notFound()

  const fullImages = (product.images || []).filter((img) => img.size === 'FULL')
  const images = fullImages.length
    ? fullImages.map((im, idx) => ({ src: `data:${im.imageType};base64,${im.imageData}` as string, alt: `${product.name} ${idx + 1}` }))
    : [{ src: getFallbackImageUrl(), alt: product.name }]

  const prettyCategory = product.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-gray-600 mb-6">
        <Link href="/products" className="hover:underline">Products</Link>
        <span className="mx-2">/</span>
        <span>{prettyCategory}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full">
          <ImageCarousel images={images} showThumbnails />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description || 'Beautiful 925 silver jewelry.'}</p>
          <div className="text-2xl font-semibold">₹{product.price.toLocaleString('en-IN')}</div>

          <div className="pt-2">
            <PdpAddToCart product={{ id: product.id, name: product.name, price: product.price, inStock: product.inStock }} />
          </div>

          <div className="pt-4 text-sm text-gray-500">
            Category: {prettyCategory} • Material: {product.material}
          </div>
        </div>
      </div>

      <Reviews productId={product.id} />
    </div>

  )
}

