'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Filter, X, ChevronDown } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import ChatWidget from '@/components/ai/ChatWidget'
import { getProducts, getCategories } from '@/lib/api'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
]

const PRICE_RANGES = [
  { label: 'Under Rs 1,000', min: 0, max: 1000 },
  { label: 'Rs 1,000 - Rs 5,000', min: 1000, max: 5000 },
  { label: 'Rs 5,000 - Rs 15,000', min: 5000, max: 15000 },
  { label: 'Rs 15,000 - Rs 50,000', min: 15000, max: 50000 },
  { label: 'Above Rs 50,000', min: 50000, max: 999999 },
]

export default function ProductsPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined)
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts({
        category: category || undefined,
        search: search || undefined,
        sort,
        min_price: minPrice,
        max_price: maxPrice,
        featured: searchParams.get('featured') === 'true' ? true : undefined,
        page,
        page_size: 12,
      })
      setProducts(data.products || [])
      setTotal(data.total || 0)
    } catch (e) {
      console.error('Failed to load products:', e)
    } finally {
      setLoading(false)
    }
  }, [category, sort, search, minPrice, maxPrice, page, searchParams])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setCategory(searchParams.get('category') || '')
    setSort(searchParams.get('sort') || 'newest')
    setSearch(searchParams.get('search') || '')
    setMinPrice(searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined)
    setMaxPrice(searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined)
    setPage(1)
  }, [searchParams])

  const updateFilter = (key: string, value: string | number | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, String(value))
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/products')
  }

  const hasFilters = category || search || minPrice || maxPrice || searchParams.get('featured')

  return (
    <>
      <Navbar />

      <main className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <h1 className="font-display text-3xl font-bold text-ink mb-1">
            {category
              ? categories.find(c => c.slug === category)?.name || 'Products'
              : search
                ? `Search: "${search}"`
                : 'All Products'}
          </h1>
          <p className="text-ink/50 text-sm">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-3">Category</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilter('category', '')}
                    className={cn(
                      'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                      !category ? 'bg-ink text-stone font-medium' : 'text-ink/70 hover:bg-mist'
                    )}
                  >
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={cn(
                        'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
                        category === cat.slug ? 'bg-ink text-stone font-medium' : 'text-ink/70 hover:bg-mist'
                      )}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-3">Price Range</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      updateFilter('min_price', '')
                      updateFilter('max_price', '')
                    }}
                    className={cn(
                      'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                      !minPrice && !maxPrice ? 'bg-ink text-stone font-medium' : 'text-ink/70 hover:bg-mist'
                    )}
                  >
                    Any price
                  </button>
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.label}
                      onClick={() => {
                        updateFilter('min_price', range.min)
                        updateFilter('max_price', range.max)
                      }}
                      className={cn(
                        'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                        minPrice === range.min && maxPrice === range.max
                          ? 'bg-ink text-stone font-medium'
                          : 'text-ink/70 hover:bg-mist'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-accent hover:text-warm transition-colors"
                >
                  <X size={14} /> Clear filters
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium bg-white border border-mist rounded-full px-4 py-2"
              >
                <Filter size={15} />
                Filters
                {hasFilters && <span className="w-1.5 h-1.5 bg-accent rounded-full" />}
              </button>

              <div className="flex-1" />

              <div className="relative">
                <select
                  value={sort}
                  onChange={e => updateFilter('sort', e.target.value)}
                  className="appearance-none bg-white border border-mist rounded-full px-4 py-2 pr-8 text-sm font-medium outline-none focus:border-accent cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink/50" />
              </div>
            </div>

            {showFilters && (
              <div className="lg:hidden mb-6 p-4 bg-white rounded-2xl border border-mist animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">Category</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {[{ name: 'All', slug: '' }, ...categories].map(cat => (
                        <button
                          key={cat.slug}
                          onClick={() => { updateFilter('category', cat.slug); setShowFilters(false) }}
                          className={cn(
                            'w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                            category === cat.slug ? 'bg-ink text-stone' : 'text-ink/70 hover:bg-mist'
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">Price</p>
                    <div className="space-y-1">
                      {PRICE_RANGES.map(range => (
                        <button
                          key={range.label}
                          onClick={() => {
                            updateFilter('min_price', range.min)
                            updateFilter('max_price', range.max)
                            setShowFilters(false)
                          }}
                          className={cn(
                            'w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors',
                            minPrice === range.min && maxPrice === range.max
                              ? 'bg-ink text-stone'
                              : 'text-ink/70 hover:bg-mist'
                          )}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-mist rounded-2xl aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {total > 12 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {page > 1 && (
                      <button
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-sm bg-white border border-mist rounded-full hover:border-accent transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    <span className="px-4 py-2 text-sm text-ink/50">
                      Page {page} of {Math.ceil(total / 12)}
                    </span>
                    {page * 12 < total && (
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-sm bg-white border border-mist rounded-full hover:border-accent transition-colors"
                      >
                        Next
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="font-display text-xl font-bold text-ink mb-2">No products found</p>
                <p className="text-ink/50 text-sm mb-6">Try adjusting your filters or search term</p>
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-accent hover:text-warm transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pb-20" />
      </main>

      <Footer />
      <ChatWidget />
    </>
  )
}
