import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ImageSize, type Prisma } from "@prisma/client"
import { getImageUrl, getFallbackImageUrl } from "@/lib/image-utils"

interface PageProps {
  searchParams?: Promise<{ sort?: string; page?: string }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/auth/signin")

  const sp = (await searchParams) ?? {}
  const sort = (sp.sort || "newest").toLowerCase()
  const page = Math.max(1, Number(sp.page || 1))
  const limit = 10
  const skip = (page - 1) * limit

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: { where: { size: "THUMBNAIL" }, take: 1 },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ])

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Your Orders</h1>
          <p className="text-gray-600">Track and view your recent purchases</p>
        </div>
        <div className="ml-auto flex gap-2">
          {["newest","oldest"].map((opt) => {
            const params = new URLSearchParams({ sort: opt })
            return (
              <Link key={opt} href={`/orders?${params.toString()}`} className={`px-3 py-1.5 rounded-md border ${sort===opt ? 'bg-gray-900 text-white' : ''}`}>
                {opt === 'newest' ? 'Newest first' : 'Oldest first'}
              </Link>
            )
          })}
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-24">You have no orders yet.</div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border p-4 bg-white flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Order</div>
                    <div className="font-mono text-sm truncate">{o.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Placed on</div>
                    <div className="text-sm font-medium">{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-semibold">₹{o.total.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="text-sm font-medium">{o.status}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 overflow-hidden">
                  {o.items.slice(0, 6).map((it) => {
                    const hasImage = (it.product.images?.length || 0) > 0
                    const src = hasImage ? getImageUrl(it.product.id, ImageSize.THUMBNAIL) : getFallbackImageUrl()
                    return (
                      <div key={it.id} className="relative w-10 h-10 rounded-md overflow-hidden border">
                        <Image src={src} alt={it.product.name} fill sizes="40px" className="object-cover" />
                      </div>
                    )
                  })}
                  {o.items.length > 6 && (
                    <div className="text-xs text-gray-600">+{o.items.length - 6} more</div>
                  )}
                </div>
              </div>
              <div className="md:self-stretch md:flex md:items-center">
                <Link href={`/orders/${o.id}`} className="inline-block px-4 py-2 rounded-md border">View details</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link href={`/orders?${new URLSearchParams({ sort, page: String(Math.max(1, page-1)) }).toString()}`} className={`px-3 py-1.5 rounded-md border ${page===1 ? 'opacity-50 pointer-events-none' : ''}`}>Previous</Link>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <Link href={`/orders?${new URLSearchParams({ sort, page: String(Math.min(pages, page+1)) }).toString()}`} className={`px-3 py-1.5 rounded-md border ${page===pages ? 'opacity-50 pointer-events-none' : ''}`}>Next</Link>
        </div>
      )}
    </div>
  )
}

