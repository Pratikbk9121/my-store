export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildProductPath(product: { id: string; name: string }): string {
  const slug = slugify(product.name || 'product')
  return `/products/${slug}-${product.id}`
}

export function extractIdFromSlug(slugAndId: string): string {
  const lastDash = slugAndId.lastIndexOf('-')
  return lastDash === -1 ? slugAndId : slugAndId.slice(lastDash + 1)
}

