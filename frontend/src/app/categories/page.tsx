'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ChatWidget from '@/components/ai/ChatWidget'
import { getCategories } from '@/lib/api'
import { getCategoryImage } from '@/lib/utils'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(setCategories).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Browse</p>
          <h1 className="font-display text-4xl font-bold text-ink">All Categories</h1>
          <p className="text-ink/50 mt-2">Explore our curated selection of products</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-mist rounded-3xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-3xl h-64 bg-mist"
              >
                <Image
                  src={getCategoryImage(cat.slug)}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                  <div>
                    <p className="text-3xl mb-2">{cat.icon}</p>
                    <h2 className="text-stone font-display text-2xl font-bold">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-stone/60 text-sm mt-1 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-accent transition-colors">
                    <ArrowRight size={18} className="text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
