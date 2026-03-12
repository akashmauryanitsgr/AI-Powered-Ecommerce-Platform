'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, ShoppingBag, Eye } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { formatPrice, getDiscountPercent, getProductImage, getSessionId } from '@/lib/utils'
import { addToCart } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Product {
  id: number
  name: string
  price: number
  original_price?: number
  category_id?: number
  category_name?: string
  image_url?: string
  rating: number
  review_count: number
  brand?: string
  is_featured: boolean
  description?: string
}

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact'
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const wishlist = useWishlistStore()
  const cartStore = useCartStore()
  const isWished = wishlist.has(product.id)

  const imageUrl = getProductImage(product.name, product.category_name?.toLowerCase().replace(' ', '-'))
  const discount = getDiscountPercent(product.original_price || 0, product.price)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    try {
      const sessionId = getSessionId()
      const result = await addToCart({
        product_id: product.id,
        quantity: 1,
        session_id: sessionId,
      })

      // Also update local store
      cartStore.addItem({
        id: Date.now(),
        product_id: product.id,
        product_name: product.name,
        product_image: imageUrl,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      })

      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      console.error('Add to cart failed:', e)
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    wishlist.toggle(product.id)
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className={cn(
        'product-card bg-white rounded-2xl overflow-hidden border border-mist/50 hover:shadow-lg hover:border-accent/20',
        variant === 'compact' && 'rounded-xl'
      )}>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-mist">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
            {product.is_featured && (
              <span className="bg-ink text-stone text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-ink/10">
            <button
              onClick={handleWishlist}
              className={cn(
                'p-2.5 rounded-full shadow-md transition-colors',
                isWished ? 'bg-red-50 text-red-500' : 'bg-white text-ink hover:bg-stone'
              )}
            >
              <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
            </button>
            <span
              className="p-2.5 bg-white text-ink rounded-full shadow-md hover:bg-stone transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <Eye size={16} />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.brand && (
            <p className="text-[11px] font-semibold text-accent/80 uppercase tracking-wider mb-1">
              {product.brand}
            </p>
          )}

          <h3 className="font-medium text-sm text-ink line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={i < Math.floor(product.rating) ? 'text-accent fill-accent' : 'text-mist fill-mist'}
                />
              ))}
            </div>
            <span className="text-[11px] text-ink/50">({product.review_count.toLocaleString()})</span>
          </div>

          {/* Price + Cart */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-ink">{formatPrice(product.price)}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-ink/40 line-through ml-1.5">
                  {formatPrice(product.original_price)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-ink text-stone hover:bg-accent'
              )}
            >
              <ShoppingBag size={13} />
              {adding ? '...' : added ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
