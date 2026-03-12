'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, CreditCard, Truck, Wallet } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useCartStore, useAuthStore } from '@/lib/store'
import { createOrder } from '@/lib/api'
import { formatPrice, getSessionId } from '@/lib/utils'

type PaymentMethod = 'cod' | 'card' | 'upi'

export default function CheckoutPage() {
  const router = useRouter()
  const cartStore = useCartStore()
  const auth = useAuthStore()

  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address')
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)

  const [address, setAddress] = useState({
    name: auth.user?.name || '',
    email: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')

  const items = cartStore.items
  const total = cartStore.total()
  const shipping = total > 499 ? 0 : 49
  const grandTotal = total + shipping

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('payment')
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirm')
  }

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const sessionId = getSessionId()
      const shippingAddress = `${address.name}, ${address.line1}, ${address.city}, ${address.state} - ${address.pincode}`

      const order = await createOrder({
        session_id: sessionId,
        user_id: auth.user?.id,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        total: grandTotal,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.price,
          quantity: i.quantity,
        })),
      })

      cartStore.clearCart()
      setOrderId(order.id)
      setStep('confirm')
    } catch (e) {
      console.error('Order failed:', e)
      alert('Could not place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // Success screen
  if (orderId) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-ink mb-2">Order Placed!</h1>
            <p className="text-ink/60 mb-2">Order #{orderId}</p>
            <p className="text-ink/50 text-sm mb-8">
              Thank you for your order. We'll send a confirmation shortly.
              Expected delivery: 3–5 business days.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 bg-ink text-stone px-6 py-3 rounded-full font-semibold hover:bg-accent transition-colors"
              >
                Track Order
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 border border-mist text-ink px-6 py-3 rounded-full font-semibold hover:border-accent transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <ChatWidget />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-20 text-center">
          <p className="text-ink/50 text-lg mb-4">Your cart is empty</p>
          <Link href="/products" className="text-accent font-medium hover:underline">
            Go shopping
          </Link>
        </main>
        <ChatWidget />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['address', 'payment', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s || (step === 'confirm' && s !== 'confirm')
                  ? 'bg-ink text-stone'
                  : 'bg-mist text-ink/40'
              }`}>
                {i + 1}
              </div>
              <span className="text-sm capitalize hidden sm:block text-ink/60">{s}</span>
              {i < 2 && <div className="w-12 h-px bg-mist mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Form */}
          <div className="lg:col-span-2">

            {/* Step 1: Address */}
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="bg-white rounded-2xl border border-mist p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Truck size={20} className="text-accent" />
                  <h2 className="font-semibold text-ink">Shipping Address</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'name', required: true, colSpan: 'sm:col-span-2' },
                    { label: 'Email', key: 'email', type: 'email', required: true },
                    { label: 'Phone', key: 'phone', type: 'tel', required: true },
                    { label: 'Address Line', key: 'line1', required: true, colSpan: 'sm:col-span-2' },
                    { label: 'City', key: 'city', required: true },
                    { label: 'State', key: 'state', required: true },
                    { label: 'Pincode', key: 'pincode', required: true },
                  ].map(field => (
                    <div key={field.key} className={field.colSpan || ''}>
                      <label className="block text-xs font-medium text-ink/50 mb-1.5">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        required={field.required}
                        value={(address as any)[field.key]}
                        onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                        className="w-full border border-mist rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-ink text-stone py-4 rounded-full font-semibold hover:bg-accent transition-colors"
                >
                  Continue to Payment
                </button>
              </form>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl border border-mist p-6">
                <div className="flex items-center gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="text-ink/50 hover:text-ink transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <CreditCard size={20} className="text-accent" />
                  <h2 className="font-semibold text-ink">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'cod' as const, label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
                    { value: 'upi' as const, label: 'UPI / GPay / PhonePe', icon: '📱', desc: 'Instant payment' },
                    { value: 'card' as const, label: 'Credit / Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === option.value
                          ? 'border-accent bg-accent/5'
                          : 'border-mist hover:border-ink/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.value}
                        checked={paymentMethod === option.value}
                        onChange={() => setPaymentMethod(option.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-ink">{option.label}</p>
                        <p className="text-xs text-ink/50">{option.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === option.value ? 'border-accent' : 'border-mist'
                      }`}>
                        {paymentMethod === option.value && (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 bg-ink text-stone py-4 rounded-full font-semibold hover:bg-accent transition-colors"
                >
                  Review Order
                </button>
              </form>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && (
              <div className="bg-white rounded-2xl border border-mist p-6">
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={() => setStep('payment')}
                    className="text-ink/50 hover:text-ink transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-semibold text-ink">Review & Place Order</h2>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-stone rounded-xl">
                    <p className="text-xs font-semibold text-ink/50 mb-1">Shipping to</p>
                    <p className="text-sm text-ink">{address.name}</p>
                    <p className="text-sm text-ink/60">{address.line1}, {address.city} - {address.pincode}</p>
                  </div>
                  <div className="p-3 bg-stone rounded-xl">
                    <p className="text-xs font-semibold text-ink/50 mb-1">Payment</p>
                    <p className="text-sm text-ink capitalize">{paymentMethod.toUpperCase()}</p>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full bg-accent text-white py-4 rounded-full font-semibold hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {placing ? 'Placing Order...' : `Place Order · ${formatPrice(grandTotal)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-mist p-5 sticky top-24">
              <h3 className="font-semibold text-ink mb-4">Order ({items.length} items)</h3>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-ink/70 line-clamp-1 flex-1">{item.product_name} × {item.quantity}</span>
                    <span className="font-medium ml-2">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-mist pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
              </div>

              <div className="border-t border-mist mt-3 pt-3 flex justify-between">
                <span className="font-semibold text-ink">Total</span>
                <span className="font-bold text-lg text-ink">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChatWidget />
    </>
  )
}
