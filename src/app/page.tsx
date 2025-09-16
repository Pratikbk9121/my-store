import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PublicProductCard } from '@/components/public/product-card'
import { buildProductPath } from '@/lib/slug'

export const revalidate = 60

export default async function Home() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      include: { images: { where: { size: 'THUMBNAIL' }, take: 1 } },
      take: 8,
    }),
    prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold">Silver Jewelry Store</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Premium 925 sterling silver jewelry crafted with elegance and care.
        </p>
        <div className="pt-2">
          <Link href="/products" className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white">
            Shop all products
          </Link>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Featured</h2>
            <Link href="/products" className="text-sm underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map((p) => (
              <PublicProductCard
                key={p.id}
                href={buildProductPath({ id: p.id, name: p.name })}
                product={{
                  id: p.id,
                  name: p.name,
                  description: p.description || undefined,
                  price: p.price,
                  category: p.category,
                  hasImage: (p.images?.length || 0) > 0,
                  inStock: p.inStock,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Shop by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const label = c.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
              const href = `/products?${new URLSearchParams({ category: c.category }).toString()}`
              return (
                <Link key={c.category} href={href} className="px-3 py-1.5 rounded-md border">
                  {label}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
