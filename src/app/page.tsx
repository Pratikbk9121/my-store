import { Navigation } from '@/components/navigation'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Premium 925 Silver Jewelry</h1>
          <p className="text-lg text-gray-600 mb-8">
            Discover our exquisite collection of handcrafted silver jewelry
          </p>
          <Link
            href="/products"
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </main>
    </div>
  )
}
