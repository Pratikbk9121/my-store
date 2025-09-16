import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { buildProductPath } from '@/lib/slug'
import { PublicProductCard } from '@/components/public/product-card'

import type { Category, Prisma } from '@prisma/client'

export const revalidate = 60

interface PageProps {
  searchParams?: Promise<{
    search?: string
    category?: string
    page?: string
    inStock?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const page = Math.max(1, Number(sp?.page || 1))
  const limit = 12
  const skip = (page - 1) * limit

  const sort = sp?.sort || 'newest'
  const minPrice = sp?.minPrice ? Number(sp.minPrice) : undefined
  const maxPrice = sp?.maxPrice ? Number(sp.maxPrice) : undefined
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price-asc' ? { price: 'asc' } :
    sort === 'price-desc' ? { price: 'desc' } :
    { createdAt: 'desc' }

  const where: Prisma.ProductWhereInput = {}
  if (sp?.search) {
    const q = sp.search
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { category: { equals: q.toUpperCase() as Category } },
    ]
  }
  if (sp?.category) {
    where.category = sp.category.toUpperCase() as Category
  }
  if (sp?.inStock === 'true') where.inStock = true
  if (sp?.inStock === 'false') where.inStock = false
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { images: { where: { size: 'THUMBNAIL' }, take: 1 } },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const ratingMap = new Map<string, { avg: number; count: number }>()
  if (products.length) {
    const ids = products.map(p => p.id)
    const groups = await prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    })
    for (const g of groups) ratingMap.set(g.productId, { avg: g._avg.rating || 0, count: g._count._all })
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  // Get distinct categories for quick filters
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Our Collection</h1>
        <p className="text-gray-600">Premium 925 sterling silver jewelry</p>
      </header>


      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <form className="flex-1" action="/products" method="get">
            <input
              name="search"
              defaultValue={sp?.search || ''}
              placeholder="Search by name or description..."
              className="w-full border rounded-md px-3 py-2"
            />
          </form>

          {/* Price range */}
          <form action="/products" method="get" className="flex items-center gap-2">
            {/* Preserve existing params */}
            {sp?.search && <input type="hidden" name="search" value={sp.search} />}
            {sp?.category && <input type="hidden" name="category" value={sp.category} />}
            {sp?.inStock === 'true' && <input type="hidden" name="inStock" value="true" />}
            {sp?.sort && <input type="hidden" name="sort" value={sp.sort} />}
            <input name="minPrice" inputMode="numeric" pattern="[0-9]*" defaultValue={sp?.minPrice || ''} placeholder="Min" className="w-24 border rounded-md px-2 py-1" />
            <span className="text-gray-500">-</span>
            <input name="maxPrice" inputMode="numeric" pattern="[0-9]*" defaultValue={sp?.maxPrice || ''} placeholder="Max" className="w-24 border rounded-md px-2 py-1" />
            <button className="px-3 py-1.5 rounded-md border">Apply</button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Categories */}
          {(() => {
            const params = new URLSearchParams({
              ...(sp?.search ? { search: sp.search } : {}),
              ...(sp?.inStock === 'true' ? { inStock: 'true' } : {}),
              ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
              ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
              ...(sp?.sort ? { sort: sp.sort } : {}),
            })
            const href = `/products${params.toString() ? `?${params.toString()}` : ''}`
            return (
              <Link href={href} className={`px-3 py-1.5 rounded-md border ${!sp?.category ? 'bg-gray-900 text-white' : ''}`}>All</Link>
            )
          })()}

          {categories.map((c) => {
            const params = new URLSearchParams({
              ...(sp?.search ? { search: sp.search } : {}),
              category: c.category,
              ...(sp?.inStock === 'true' ? { inStock: 'true' } : {}),
              ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
              ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
              ...(sp?.sort ? { sort: sp.sort } : {}),
            })
            const href = `/products?${params.toString()}`
            return (
              <Link
                key={c.category}
                href={href}
                className={`px-3 py-1.5 rounded-md border ${sp?.category === c.category ? 'bg-gray-900 text-white' : ''}`}
              >
                {c.category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </Link>
            )
          })}

          {/* In Stock toggle */}
          {(() => {
            const on = sp?.inStock === 'true'
            const params = new URLSearchParams({
              ...(sp?.search ? { search: sp.search } : {}),
              ...(sp?.category ? { category: sp.category } : {}),
              ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
              ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
              ...(sp?.sort ? { sort: sp.sort } : {}),
              ...(on ? {} : { inStock: 'true' }),
            })
            const href = `/products${params.toString() ? `?${params.toString()}` : ''}`
            return (
              <Link href={href} className={`px-3 py-1.5 rounded-md border ${on ? 'bg-gray-900 text-white' : ''}`}>
                In Stock
              </Link>
            )
          })()}

          {/* Sorting */}
          <div className="ml-auto flex flex-wrap gap-2">
            {['newest','price-asc','price-desc'].map((opt) => {
              const labels: Record<string,string> = {
                'newest': 'Newest',
                'price-asc': 'Price E Low-High',
                'price-desc': 'Price E High-Low',
              }
              const params = new URLSearchParams({
                ...(sp?.search ? { search: sp.search } : {}),
                ...(sp?.category ? { category: sp.category } : {}),
                ...(sp?.inStock === 'true' ? { inStock: 'true' } : {}),
                ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
                ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
                sort: opt,
              })
              const href = `/products?${params.toString()}`
              return (
                <Link key={opt} href={href} className={`px-3 py-1.5 rounded-md border ${sp?.sort === opt || (!sp?.sort && opt==='newest') ? 'bg-gray-900 text-white' : ''}`}>
                  {labels[opt]}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-24">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => {
            const r = ratingMap.get(p.id)
            return (
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
                  ratingAverage: r?.avg,
                  ratingCount: r?.count,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Link
          href={`/products?${new URLSearchParams({
            ...(sp?.search ? { search: sp.search } : {}),
            ...(sp?.category ? { category: sp.category } : {}),
            ...(sp?.inStock === 'true' ? { inStock: 'true' } : {}),
            ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
            ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
            ...(sp?.sort ? { sort: sp.sort } : {}),
            page: String(Math.max(1, page - 1))
          }).toString()}`}
          className={`px-3 py-1.5 rounded-md border ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Previous
        </Link>
        <span className="text-sm text-gray-600">Page {page} of {pages}</span>
        <Link
          href={`/products?${new URLSearchParams({
            ...(sp?.search ? { search: sp.search } : {}),
            ...(sp?.category ? { category: sp.category } : {}),
            ...(sp?.inStock === 'true' ? { inStock: 'true' } : {}),
            ...(sp?.minPrice ? { minPrice: sp.minPrice } : {}),
            ...(sp?.maxPrice ? { maxPrice: sp.maxPrice } : {}),
            ...(sp?.sort ? { sort: sp.sort } : {}),
            page: String(Math.min(pages, page + 1))
          }).toString()}`}
          className={`px-3 py-1.5 rounded-md border ${page === pages ? 'pointer-events-none opacity-50' : ''}`}
        >
          Next
        </Link>
      </div>
    </div>

  )
}

