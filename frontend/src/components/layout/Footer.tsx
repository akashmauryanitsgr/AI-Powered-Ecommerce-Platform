import Link from 'next/link'
import { MessageCircle, Mail, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-ink text-stone/70 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold text-stone mb-3">
              Shop<span className="text-accent">Mind</span>
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Intelligent shopping powered by AI. Find exactly what you need through voice or chat.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-stone/10 hover:bg-accent/20 rounded-full transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="p-2 bg-stone/10 hover:bg-accent/20 rounded-full transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="p-2 bg-stone/10 hover:bg-accent/20 rounded-full transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-stone text-sm font-semibold uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-stone transition-colors">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-stone transition-colors">Categories</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-stone transition-colors">Featured</Link></li>
              <li><Link href="/products?sort=price_asc" className="hover:text-stone transition-colors">Best Value</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-stone text-sm font-semibold uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=electronics" className="hover:text-stone transition-colors">Electronics</Link></li>
              <li><Link href="/products?category=fashion" className="hover:text-stone transition-colors">Fashion</Link></li>
              <li><Link href="/products?category=beauty" className="hover:text-stone transition-colors">Beauty</Link></li>
              <li><Link href="/products?category=fitness" className="hover:text-stone transition-colors">Fitness</Link></li>
              <li><Link href="/products?category=books" className="hover:text-stone transition-colors">Books</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-stone text-sm font-semibold uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/orders" className="hover:text-stone transition-colors">Order Tracking</Link></li>
              <li><Link href="/auth" className="hover:text-stone transition-colors">My Account</Link></li>
              <li><Link href="/cart" className="hover:text-stone transition-colors">Cart</Link></li>
              <li><Link href="/wishlist" className="hover:text-stone transition-colors">Wishlist</Link></li>
            </ul>

            <div className="mt-6 p-3 bg-accent/20 rounded-lg border border-accent/30">
              <div className="flex items-center gap-2 text-accent mb-1">
                <MessageCircle size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">AI Support</span>
              </div>
              <p className="text-xs">Chat with ShopMind AI for instant shopping help.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-stone/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2024 ShopMind. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-stone transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone transition-colors">Terms</a>
            <a href="#" className="hover:text-stone transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
