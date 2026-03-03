'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LogoGridBackground from '@/components/LogoBackground'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

// Design tokens (match SavedManifestTab)
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#E8192C',
  accentHover:  '#FF1F30',
  accentGlow:   'rgba(232,25,44,0.25)',

  amber:        '#F5A623',

  textPrimary:  '#C9D1D9',
  textSilver:   '#B1BAC4',
  textSub:      '#8B949E',
  textMuted:    '#6E7681',
  textGhost:    '#484F58',

  inputBg:      '#0D1117',
  inputBorder:  '#30363D',
  inputText:    '#C9D1D9',
  inputFocus:   '#1F6FEB',
}

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{background: C.bg}}>

      {/* ── Background ── */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <LogoGridBackground />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br pointer-events-none" style={{background: `linear-gradient(to bottom right, ${C.bg}10, ${C.bg}f2, ${C.bg})`}} />

      {/* ── Logo top-left ── */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <img src="/sf-light.png" alt="SF Express" className="h-5 w-auto" />
        <div className="w-px h-4" style={{background: C.textGhost}} />
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{color: C.textSub}}>Warehouse</span>
      </div>

      {/* ── Centered form ── */}
      <div className="relative z-10 w-full max-w-[480px] px-6">

        {/* Heading */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4" style={{color: C.amber}}>
            Secure access
          </p>
          <h1 className="text-[2.2rem] text-white leading-[0.95] tracking-tight" style={{color: C.textPrimary}}>
            Sign in to your account
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] font-bold" style={{color: C.textSub}}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-lg text-[13px] placeholder-[#282828] focus:outline-none transition-colors font-medium"
              style={{
                background: C.inputBg,
                border: `1px solid ${C.inputBorder}`,
                color: C.inputText,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.inputFocus
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = C.inputBorder
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.borderHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.inputBorder
              }}
              placeholder="name@domain.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] font-bold" style={{color: C.textSub}}>
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
                className="w-full px-4 py-3.5 rounded-lg text-[13px] placeholder-[#282828] focus:outline-none transition-colors font-medium pr-11"
                style={{
                  background: C.inputBg,
                  border: `1px solid ${C.inputBorder}`,
                  color: C.inputText,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.inputFocus
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.inputBorder
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.borderHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.inputBorder
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                style={{color: C.textSub}}
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
            <div className="flex items-start gap-3 text-[12px] px-4 py-3 rounded-lg" style={{background: `${C.accent}15`, border: `1px solid ${C.accent}30`, color: C.accent}}>
              <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{background: C.accent}} />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2.5 py-3.5 rounded-lg font-[#0D1117] text-[12px] uppercase tracking-[0.2em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group text-white"
              style={{
                background: loading
                  ? C.surface
                  : `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%)`,
              }}
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{background: `linear-gradient(135deg, ${C.accentHover} 0%, ${C.accent} 100%)`}} />
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
        <div className="mt-8 pt-8" style={{borderTop: `1px solid ${C.divider}`}}>
          <p className="text-[11px] text-center" style={{color: C.textMuted}}>
            SF Express · Upper Tingub, Mandaue, Cebu
          </p>
        </div>

      </div>
    </div>
  )
}