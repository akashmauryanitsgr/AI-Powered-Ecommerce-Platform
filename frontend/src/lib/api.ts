import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = (params?: {
  category?: string
  search?: string
  min_price?: number
  max_price?: number
  sort?: string
  featured?: boolean
  page?: number
  page_size?: number
}) => api.get('/products', { params }).then(r => r.data)

export const getFeaturedProducts = () =>
  api.get('/products/featured').then(r => r.data)

export const getProduct = (id: number) =>
  api.get(`/products/${id}`).then(r => r.data)

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = () =>
  api.get('/categories').then(r => r.data)

export const getCategory = (slug: string) =>
  api.get(`/categories/${slug}`).then(r => r.data)

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const getCart = (sessionId?: string, userId?: number) =>
  api.get('/cart', { params: { session_id: sessionId, user_id: userId } }).then(r => r.data)

export const addToCart = (data: {
  product_id: number
  quantity?: number
  session_id?: string
  user_id?: number
}) => api.post('/cart/add', data).then(r => r.data)

export const updateCartItem = (itemId: number, quantity: number, sessionId?: string) =>
  api.put(`/cart/${itemId}`, { quantity, session_id: sessionId }).then(r => r.data)

export const removeCartItem = (itemId: number) =>
  api.delete(`/cart/${itemId}`).then(r => r.data)

export const clearCart = (sessionId?: string, userId?: number) =>
  api.delete('/cart/clear/all', { params: { session_id: sessionId, user_id: userId } }).then(r => r.data)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = (data: { email: string; name: string; password: string }) =>
  api.post('/auth/register', data).then(r => r.data)

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then(r => r.data)

// ─── Orders ───────────────────────────────────────────────────────────────────

export const createOrder = (data: any) =>
  api.post('/orders', data).then(r => r.data)

export const getOrders = (sessionId?: string, userId?: number) =>
  api.get('/orders', { params: { session_id: sessionId, user_id: userId } }).then(r => r.data)

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const sendChat = (data: {
  message: string
  session_id?: string
  user_id?: number
  history?: Array<{ role: string; content: string }>
}) => api.post('/ai/chat', data).then(r => r.data)

export const getChatSuggestions = () =>
  api.get('/ai/suggestions').then(r => r.data)

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const getWishlist = (sessionId?: string) =>
  api.get('/wishlist', { params: { session_id: sessionId } }).then(r => r.data)

export default api
