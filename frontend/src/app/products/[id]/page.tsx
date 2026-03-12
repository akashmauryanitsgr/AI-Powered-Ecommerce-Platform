'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingBag, Heart, ArrowLeft, Package, RefreshCw, Shield, Plus, Minus } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/ai/ChatWidget'
import { getProduct } from '@/lib/api'
import { addToCart } from '@/lib/api'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { formatPrice, getDiscountPercent, getProductImage, getSessionId } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const wishlist = useWishlistStore()
  const cartStore = useCartStore()
  const isWished = product ? wishlist.has(product.id) : false

  useEffect(() => {
    if (params.id) {
      getProduct(Number(params.id))
        .then(setProduct)
        .catch(() => router.push('/products'))
        .finally(() => setLoading(false))
    }
  }, [params.id, router])

  const handleAddToCart = async () => {
    if (!product) return
    setAdding(true)
    try {
      const sessionId = getSessionId()
      await addToCart({ product_id: product.id, quantity, session_id: sessionId })
      cartStore.addItem({
        id: Date.now(),
        product_id: product.id,
        product_name: product.name,
        product_image: imageUrl,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      })
      setAdded(true)
      setTimeout(() => setAdded(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-mist rounded-3xl" />
            <div className="space-y-4">
              <div className="h-6 bg-mist rounded-full w-1/3" />
              <div className="h-10 bg-mist rounded-full w-3/4" />
              <div className="h-8 bg-mist rounded-full w-1/4" />
              <div className="h-32 bg-mist rounded-xl" />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!product) return null

  const imageUrl = getProductImage(product.name, product.category_name?.toLowerCase().replace(' ', '-'))
  const discount = getDiscountPercent(product.original_price || 0, product.price)

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ink/50 mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <span>/</span>
          <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
          {product.category_name && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${product.category_name.toLowerCase().replace(' ', '-')}`}
                className="hover:text-ink transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

          {/* ── Product Image ─────────────────────────────────────── */}
          <div className="relative">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-mist sticky top-24">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-accent text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discount}% OFF
                </div>
              )}
              <button
                onClick={() => wishlist.toggle(product.id)}
                className={cn(
                  'absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-colors',
                  isWished ? 'bg-red-50 text-red-500' : 'bg-white text-ink hover:bg-stone'
                )}
              >
                <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* ── Product Info ──────────────────────────────────────── */}
          <div>
            {product.brand && (
              <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">
                {product.brand}
              </p>
            )}

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating) ? 'text-accent fill-accent' : 'text-mist fill-mist'}
                  />
                ))}
              </div>
              <span className="font-semibold text-ink">{product.rating}</span>
              <span className="text-ink/40 text-sm">({product.review_count?.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-4xl font-bold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xl text-ink/30 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  You save {formatPrice(product.original_price - product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-ink/70 leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className={cn(
                'w-2 h-2 rounded-full',
                product.stock > 20 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-ink/60">
                {product.stock > 20 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm font-medium text-ink/60">Quantity:</p>
              <div className="flex items-center gap-2 bg-mist rounded-full p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-stone transition-colors shadow-sm"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-stone transition-colors shadow-sm"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-all',
                  added
                    ? 'bg-green-500 text-white'
                    : product.stock === 0
                      ? 'bg-mist text-ink/40 cursor-not-allowed'
                      : 'bg-ink text-stone hover:bg-accent'
                )}
              >
                <ShoppingBag size={20} />
                {adding ? 'Adding...' : added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                onClick={() => wishlist.toggle(product.id)}
                className={cn(
                  'p-4 rounded-full border transition-all',
                  isWished
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-mist bg-white text-ink hover:border-accent'
                )}
              >
                <Heart size={20} fill={isWished ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Buy Now */}
            {added && (
              <Link
                href="/cart"
                className="block text-center w-full py-3 rounded-full border-2 border-ink text-ink font-semibold hover:bg-ink hover:text-stone transition-all mb-6"
              >
                View Cart & Checkout
              </Link>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 border-t border-mist pt-6">
              {[
                { icon: <Package size={18} />, label: 'Free delivery', sub: 'above ₹499' },
                { icon: <RefreshCw size={18} />, label: '30 day returns', sub: 'no questions asked' },
                { icon: <Shield size={18} />, label: 'Secure payment', sub: '100% protected' },
              ].map((f, i) => (
                <div key={i} className="text-center">
                  <div className="flex justify-center text-accent mb-1">{f.icon}</div>
                  <p className="text-xs font-semibold text-ink">{f.label}</p>
                  <p className="text-[10px] text-ink/40">{f.sub}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags && (
              <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-mist">
                {product.tags.split(',').map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-mist text-ink/60 px-2 py-1 rounded-full"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
