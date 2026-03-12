'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number
  product_id: number
  product_name: string
  product_image?: string
  price: number
  quantity: number
  subtotal: number
}

export interface User {
  id: number
  email: string
  name: string
  phone?: string
  address?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: { type: string; data?: any }
  timestamp: Date
}

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  sessionId: string
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  removeItem: (itemId: number) => void
  updateQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,

      setItems: (items) => set({ items }),

      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.product_id === item.product_id)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity, subtotal: i.price * (i.quantity + item.quantity) }
                : i
            )
          }
        }
        return { items: [...state.items, item] }
      }),

      removeItem: (itemId) => set((state) => ({
        items: state.items.filter(i => i.id !== itemId)
      })),

      updateQuantity: (itemId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(i => i.id !== itemId)
          : state.items.map(i =>
            i.id === itemId ? { ...i, quantity, subtotal: i.price * quantity } : i
          )
      })),

      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'shopmind-cart' }
  )
)

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface AuthStore {
  user: User | null
  token: string | null
  setUser: (user: User, token: string) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isLoggedIn: () => !!get().token,
    }),
    { name: 'shopmind-auth' }
  )
)

// ─── Wishlist Store ───────────────────────────────────────────────────────────

interface WishlistStore {
  productIds: number[]
  toggle: (id: number) => void
  has: (id: number) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (id) => set((state) => ({
        productIds: state.productIds.includes(id)
          ? state.productIds.filter(i => i !== id)
          : [...state.productIds, id]
      })),
      has: (id) => get().productIds.includes(id),
    }),
    { name: 'shopmind-wishlist' }
  )
)

// ─── Chat Store ───────────────────────────────────────────────────────────────

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (v: boolean) => void
  toggleChat: () => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      { ...msg, id: Date.now().toString(), timestamp: new Date() }
    ]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  clearMessages: () => set({ messages: [] }),
}))
