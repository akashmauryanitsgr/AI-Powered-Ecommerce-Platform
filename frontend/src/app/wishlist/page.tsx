'use client'
import { useEffect, useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/ai/ChatWidget'
import ProductCard from '@/components/product/ProductCard'
import { useWishlistStore } from '@/lib/store'
import { getProduct } from '@/lib/api'

export default function WishlistPage() {
  const wishlist = useWishlistStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = wishlist.productIds
    if (ids.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(ids.map(id => getProduct(id).catch(() => null)))
      .then(results => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [wishlist.productIds.join(',')])

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Saved</p>
          <h1 className="font-display text-4xl font-bold text-ink">Your Wishlist</h1>
          <p className="text-ink/50 mt-1">{wishlist.productIds.length} saved items</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-mist rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-mist mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Nothing saved yet</h2>
            <p className="text-ink/50 mb-8">Click the ♥ on any product to save it here</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-ink text-stone px-6 py-3 rounded-full font-semibold hover:bg-accent transition-colors"
            >
              <ShoppingBag size={18} /> Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
