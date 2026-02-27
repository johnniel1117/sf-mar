'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LogoGridBackground from '@/components/LogoBackground'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role

    if (role === 'viewer') {
      router.push('/')
    } else {
      router.push('/')
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">

      {/* ── Background ── */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <LogoGridBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/95 to-black pointer-events-none" />

      {/* ── Logo top-left ── */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <img src="/sf-light.png" alt="SF Express" className="h-5 w-auto" />
        <div className="w-px h-4 bg-[#282828]" />
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E]">Warehouse</span>
      </div>

      {/* ── Centered form ── */}
      <div className="relative z-10 w-full max-w-[480px] px-6">

        {/* Heading */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-yellow-600 mb-4">
            Secure access
          </p>
          <h1 className="text-[2.2rem] font-black text-white leading-[0.95] tracking-tight">
            Sign in to your account
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#3E3E3E]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg text-white text-[13px] placeholder-[#282828] focus:outline-none focus:border-[#3E3E3E] hover:border-[#2e2e2e] transition-colors font-medium"
              placeholder="name@domain.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#3E3E3E]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg text-white text-[13px] placeholder-[#282828] focus:outline-none focus:border-[#3E3E3E] hover:border-[#2e2e2e] transition-colors font-medium pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3E3E3E] hover:text-[#6A6A6A] transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-[#E8192C]/8 border border-[#E8192C]/20 text-[#E8192C] text-[12px] px-4 py-3 rounded-lg">
              <span className="w-1 h-1 rounded-full bg-[#E8192C] mt-1.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2.5 py-3.5 rounded-lg font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
              style={{
                background: loading
                  ? '#1a1a1a'
                  : 'linear-gradient(135deg, #E8192C 0%, #c01020 100%)',
                color: '#fff',
              }}
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #ff2d42 0%, #E8192C 100%)' }} />
              <span className="relative">
                {loading ? 'Signing in…' : 'Sign in'}
              </span>
              {!loading && (
                <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-8 pt-8 border-t border-[#111]">
          <p className="text-[11px] text-[#282828] text-center">
            SF Express · Upper Tingub, Mandaue, Cebu
          </p>
        </div>

      </div>
    </div>
  )
}