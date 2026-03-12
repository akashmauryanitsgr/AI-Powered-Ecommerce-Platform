'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, ShoppingBag, Mic, Star } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import ChatWidget from '@/components/ai/ChatWidget'
import { getCategories, getFeaturedProducts } from '@/lib/api'
import { getCategoryImage } from '@/lib/utils'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
}

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

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Product[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
    getFeaturedProducts().then(setFeatured).catch(console.error)
  }, [])

  return (
    <>
      <Navbar />

      <main>
        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-ink">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />

          {/* Accent gradient blob */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-warm/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: Copy */}
              <div>
                {/* AI badge */}
                <div className="inline-flex items-center gap-2 bg-accent/20 text-accent rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-accent/30">
                  <Sparkles size={14} />
                  AI-Powered Shopping
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-stone leading-[0.95] mb-6">
                  Shop
                  <br />
                  <em className="not-italic text-accent">smarter</em>
                  <br />
                  with AI
                </h1>

                <p className="text-stone/60 text-lg leading-relaxed mb-10 max-w-lg">
                  Your intelligent shopping companion. Find exactly what you need through 
                  voice commands or chat — no endless scrolling required.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3.5 rounded-full font-semibold hover:bg-accent-light transition-colors"
                  >
                    <ShoppingBag size={18} />
                    Shop Now
                  </Link>
                  <button
                    className="inline-flex items-center gap-2 bg-stone/10 text-stone px-6 py-3.5 rounded-full font-semibold hover:bg-stone/20 transition-colors border border-stone/20"
                    onClick={() => {
                      // Open chat widget
                      document.dispatchEvent(new CustomEvent('open-chat'))
                    }}
                  >
                    <Mic size={18} />
                    Try Voice AI
                  </button>
                </div>

                {/* Trust signals */}
                <div className="flex items-center gap-6 mt-10 pt-8 border-t border-stone/10">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-stone">50k+</p>
                    <p className="text-xs text-stone/50">Products</p>
                  </div>
                  <div className="w-px h-8 bg-stone/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-stone">9</p>
                    <p className="text-xs text-stone/50">Categories</p>
                  </div>
                  <div className="w-px h-8 bg-stone/10" />
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-accent fill-accent" />
                    <p className="text-2xl font-bold text-stone">4.8</p>
                    <p className="text-xs text-stone/50 ml-1">Rating</p>
                  </div>
                </div>
              </div>

              {/* Right: Visual */}
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  {/* Main product image */}
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=90"
                      alt="Shopping"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  </div>

                  {/* Floating AI chat bubble */}
                  <div className="absolute -left-12 top-12 bg-white rounded-2xl p-4 shadow-xl max-w-[200px] animate-slide-up">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles size={13} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-ink mb-0.5">ShopMind AI</p>
                        <p className="text-[11px] text-ink/60 leading-snug">
                          "Show me wireless earbuds under ₹4000"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Floating price card */}
                  <div className="absolute -right-8 bottom-16 bg-white rounded-2xl p-3 shadow-xl">
                    <p className="text-[11px] text-ink/50">AirWave Pro</p>
                    <p className="font-bold text-ink">₹3,499</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={9} className="text-accent fill-accent" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────────────── */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Browse</p>
              <h2 className="font-display text-4xl font-bold text-ink">Shop by Category</h2>
            </div>
            <Link
              href="/categories"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-accent transition-colors"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-mist"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Image
                  src={getCategoryImage(cat.slug)}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-2xl mb-1">{cat.icon}</p>
                  <p className="text-stone font-semibold text-sm">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── AI Banner ──────────────────────────────────────────────────── */}
        <section className="mx-4 sm:mx-8 lg:mx-auto max-w-7xl mb-20">
          <div className="bg-ink rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-accent mb-3">
                <Sparkles size={18} />
                <span className="text-sm font-semibold uppercase tracking-wide">AI Shopping</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone mb-3">
                Shop with your voice
              </h2>
              <p className="text-stone/60 max-w-md">
                Say "Show me running shoes under ₹5000" or "Add the first product to cart" — 
                ShopMind understands you.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-stone/10 rounded-xl px-4 py-3 border border-stone/10">
                <p className="text-stone/60 text-xs mb-1">Try saying:</p>
                <p className="text-stone text-sm font-medium">"Find me a yoga mat"</p>
              </div>
              <div className="bg-stone/10 rounded-xl px-4 py-3 border border-stone/10">
                <p className="text-stone/60 text-xs mb-1">Try saying:</p>
                <p className="text-stone text-sm font-medium">"Go to cart"</p>
              </div>
              <div className="bg-accent/20 rounded-xl px-4 py-3 border border-accent/30 flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors">
                <Mic size={18} className="text-accent" />
                <span className="text-accent font-semibold text-sm">Try it now</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Products ─────────────────────────────────────────── */}
        <section className="py-4 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Curated</p>
              <h2 className="font-display text-4xl font-bold text-ink">Featured Products</h2>
            </div>
            <Link
              href="/products?featured=true"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-accent transition-colors"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-mist rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          )}
        </section>

        {/* ── Features Strip ────────────────────────────────────────────── */}
        <section className="bg-white border-y border-mist py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹499' },
                { icon: '🔄', title: 'Easy Returns', desc: '30-day return policy' },
                { icon: '🔒', title: 'Secure Payment', desc: '100% protected checkout' },
                { icon: '🤖', title: 'AI Assistant', desc: '24/7 voice & chat support' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="font-semibold text-ink text-sm">{f.title}</p>
                    <p className="text-ink/50 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
