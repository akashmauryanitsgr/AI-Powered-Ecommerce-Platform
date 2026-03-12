'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingBag, Search, Heart, User, Menu, X, Mic, MessageCircle } from 'lucide-react'
import { useCartStore, useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const itemCount = useCartStore(s => s.itemCount())
  const toggleChat = useChatStore(s => s.toggleChat)
  const isChatOpen = useChatStore(s => s.isOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-stone/95 backdrop-blur-md shadow-sm border-b border-mist'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-display font-bold tracking-tight text-ink">
              Shop<span className="text-accent">Mind</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">
              All Products
            </Link>
            <Link href="/products?category=electronics" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">
              Electronics
            </Link>
            <Link href="/products?category=fashion" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">
              Fashion
            </Link>
            <Link href="/categories" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">
              Categories
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="bg-mist border border-mist rounded-full px-4 py-1.5 text-sm outline-none focus:border-accent w-48 md:w-64"
                />
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="p-2 hover:text-accent">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)}
                className="p-2 text-ink/70 hover:text-ink rounded-full hover:bg-mist transition-colors">
                <Search size={20} />
              </button>
            )}

            {/* AI Chat Toggle */}
            <button
              onClick={toggleChat}
              className={cn(
                'p-2 rounded-full transition-colors relative',
                isChatOpen ? 'text-accent bg-accent/10' : 'text-ink/70 hover:text-ink hover:bg-mist'
              )}
              title="AI Shopping Assistant"
            >
              <MessageCircle size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist"
              className="p-2 text-ink/70 hover:text-ink rounded-full hover:bg-mist transition-colors hidden sm:block">
              <Heart size={20} />
            </Link>

            {/* Auth */}
            <Link href="/auth"
              className="p-2 text-ink/70 hover:text-ink rounded-full hover:bg-mist transition-colors hidden sm:block">
              <User size={20} />
            </Link>

            {/* Cart */}
            <Link href="/cart"
              className="relative p-2 text-ink/70 hover:text-ink rounded-full hover:bg-mist transition-colors">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 text-ink/70 hover:text-ink rounded-full hover:bg-mist transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-stone border-t border-mist animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <Link href="/products" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              All Products
            </Link>
            <Link href="/categories" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Categories
            </Link>
            <Link href="/wishlist" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              Wishlist
            </Link>
            <Link href="/auth" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
              My Account
            </Link>
            <button
              onClick={() => { toggleChat(); setMobileOpen(false) }}
              className="flex items-center gap-2 py-2 text-sm font-medium text-accent"
            >
              <MessageCircle size={16} /> AI Assistant
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
