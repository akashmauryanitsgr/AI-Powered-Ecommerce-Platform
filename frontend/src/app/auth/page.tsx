'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useAuthStore } from '@/lib/store'
import { login, register } from '@/lib/api'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const authStore = useAuthStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let data
      if (mode === 'login') {
        data = await login({ email: form.email, password: form.password })
      } else {
        data = await register({ name: form.name, email: form.email, password: form.password })
      }
      authStore.setUser(data.user, data.token)
      router.push('/')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-ink/50 text-sm">
              {mode === 'login'
                ? 'Sign in to access your account'
                : 'Join ShopMind and discover smarter shopping'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-mist p-8 shadow-sm">

            {/* Toggle */}
            <div className="flex bg-stone rounded-full p-1 mb-8">
              <button
                onClick={() => { setMode('login'); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                  mode === 'login' ? 'bg-ink text-stone' : 'text-ink/60'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                  mode === 'register' ? 'bg-ink text-stone' : 'text-ink/60'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-ink/50 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full border border-mist rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full border border-mist rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    minLength={mode === 'register' ? 8 : 1}
                    className="w-full border border-mist rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-ink text-stone py-4 rounded-full font-semibold hover:bg-accent transition-colors disabled:opacity-50 mt-2"
              >
                {mode === 'login'
                  ? <><LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}</>
                  : <><UserPlus size={18} /> {loading ? 'Creating account...' : 'Create Account'}</>
                }
              </button>
            </form>
          </div>

          {authStore.isLoggedIn() && (
            <div className="mt-4 text-center">
              <p className="text-sm text-ink/50">
                Logged in as <span className="font-medium text-ink">{authStore.user?.name}</span>
                {' · '}
                <button
                  onClick={() => { authStore.logout(); router.push('/') }}
                  className="text-accent hover:underline"
                >
                  Sign out
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
