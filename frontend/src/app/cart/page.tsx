'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/ai/ChatWidget'
import { useCartStore } from '@/lib/store'
import { getCart, updateCartItem, removeCartItem } from '@/lib/api'
import { formatPrice, getSessionId, getProductImage } from '@/lib/utils'

export default function CartPage() {
  const cartStore = useCartStore()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<number | null>(null)

  // Sync cart with backend on load
  useEffect(() => {
    const sessionId = getSessionId()
    getCart(sessionId)
      .then(data => {
        if (data.items) cartStore.setItems(data.items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    setSyncing(itemId)
    try {
      if (newQty <= 0) {
        await removeCartItem(itemId)
        cartStore.removeItem(itemId)
      } else {
        await updateCartItem(itemId, newQty, getSessionId())
        cartStore.updateQuantity(itemId, newQty)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(null)
    }
  }

  const handleRemove = async (itemId: number) => {
    setSyncing(itemId)
    try {
      await removeCartItem(itemId)
      cartStore.removeItem(itemId)
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(null)
    }
  }

  const items = cartStore.items
  const total = cartStore.total()
  const itemCount = cartStore.itemCount()
  const shipping = total > 499 ? 0 : 49

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Your Cart</h1>
        <p className="text-ink/50 text-sm mb-8">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-mist rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="text-mist mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Your cart is empty</h2>
            <p className="text-ink/50 mb-8">Add some products to get started</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-ink text-stone px-6 py-3 rounded-full font-semibold hover:bg-accent transition-colors"
            >
              <ShoppingBag size={18} /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => {
                const imageUrl = item.product_image || getProductImage(item.product_name)
                const isSyncing = syncing === item.id

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-4 flex gap-4 border border-mist transition-opacity ${
                      isSyncing ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Image */}
                    <Link href={`/products/${item.product_id}`}>
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product_id}`}>
                        <h3 className="font-medium text-ink text-sm hover:text-accent transition-colors line-clamp-2 mb-1">
                          {item.product_name}
                        </h3>
                      </Link>
                      <p className="font-bold text-ink">{formatPrice(item.price)}</p>
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-ink/30 hover:text-red-500 transition-colors"
                        disabled={isSyncing}
                      >
                        <Trash2 size={15} />
                      </button>

                      <div className="flex items-center gap-2 bg-stone rounded-full p-0.5">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={isSyncing}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-mist transition-colors shadow-sm"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={isSyncing}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-mist transition-colors shadow-sm"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-ink">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                )
              })}

              {/* Continue Shopping */}
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mt-2"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-2xl border border-mist p-6 sticky top-24">
                <h2 className="font-semibold text-ink mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Subtotal ({itemCount} items)</span>
                    <span className="font-medium">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Shipping</span>
                    <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-ink/40">Add {formatPrice(499 - total)} more for free shipping</p>
                  )}
                </div>

                <div className="border-t border-mist pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-ink">Total</span>
                    <span className="font-bold text-xl text-ink">{formatPrice(total + shipping)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2 w-full bg-ink text-stone py-4 rounded-full font-semibold hover:bg-accent transition-colors"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </Link>

                {/* Payment icons */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  <span className="text-xs text-ink/30">Secure payment via</span>
                  <span className="text-xs font-semibold text-ink/50">UPI · Cards · COD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
