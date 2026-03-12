'use client'
import { useEffect, useState } from 'react'
import { Package, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/ai/ChatWidget'
import { getOrders } from '@/lib/api'
import { formatPrice, getSessionId } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const auth = useAuthStore()

  useEffect(() => {
    const sessionId = getSessionId()
    getOrders(sessionId, auth.user?.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    confirmed: { icon: CheckCircle, color: 'text-green-600', label: 'Confirmed' },
    pending: { icon: Clock, color: 'text-amber-600', label: 'Pending' },
    shipped: { icon: Package, color: 'text-blue-600', label: 'Shipped' },
    delivered: { icon: CheckCircle, color: 'text-green-700', label: 'Delivered' },
  }

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">My Account</p>
          <h1 className="font-display text-4xl font-bold text-ink">Order History</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-mist rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-mist mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-ink mb-2">No orders yet</h2>
            <p className="text-ink/50 mb-8">Your order history will appear here</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-ink text-stone px-6 py-3 rounded-full font-semibold hover:bg-accent transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              const date = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : 'N/A'

              let items = []
              try { items = JSON.parse(order.items || '[]') } catch {}

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-mist p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-ink/40 mb-0.5">Order #{order.id}</p>
                      <p className="text-xs text-ink/40">{date}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${status.color}`}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {items.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-ink/70">{item.product_name} × {item.quantity}</span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-xs text-ink/40">+{items.length - 3} more items</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-mist">
                    <div>
                      {order.shipping_address && (
                        <p className="text-xs text-ink/50 line-clamp-1">📍 {order.shipping_address}</p>
                      )}
                    </div>
                    <p className="font-bold text-ink">{formatPrice(order.total)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
