'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LogoGridBackground from '@/components/LogoBackground'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#9d7bf8',
  accentHover:  '#5e2ee4f5',

  amber:        '#C1F85C',

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

const TRANSITION_MS = 1600

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string>('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single()

    router.prefetch('/')

    setWelcomeName(profile?.full_name?.trim() || email.split('@')[0])
    setLoading(false)
    setShowWelcome(true)
    setIsTransitioning(true)

    setTimeout(() => {
      router.push('/')
      setTimeout(() => setIsTransitioning(false), 800)
    }, TRANSITION_MS - 400)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: C.bg }}>

      {/* Background */}
      {!showWelcome && (
        <>
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <LogoGridBackground />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br pointer-events-none" 
               style={{ background: `linear-gradient(to bottom right, ${C.bg}10, ${C.bg}f2, ${C.bg})` }} />
        </>
      )}

      {/* Top-left Logo */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <img src="/sf-light.png" alt="SF Express" className="h-5 w-auto" />
        <div className="w-px h-4" style={{ background: C.textGhost }} />
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textSub }}>
          Warehouse
        </span>
      </div>

      {/* Login Form */}
      <div
        className="relative z-10 w-full max-w-[480px] px-6 login-form"
        style={{
          opacity: showWelcome ? 0 : 1,
          transform: showWelcome ? 'scale(0.95) translateY(20px)' : 'scale(1) translateY(0)',
          filter: showWelcome ? 'blur(24px)' : 'blur(0px)',
          pointerEvents: showWelcome ? 'none' : 'auto',
        }}
      >
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold mb-4">
            Secure access
          </p>
          <h1 className="text-[2.2rem] text-white leading-[0.95] tracking-tight" 
              style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
            Sign in to your account
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: C.textSub }}>
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
              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.inputText }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.inputBorder }}
              placeholder="name@domain.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: C.textSub }}>
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
                style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.inputText }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.inputFocus }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.inputBorder }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.inputBorder }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                style={{ color: C.textSub }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-[12px] px-4 py-3 rounded-lg" 
                 style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}30`, color: C.accent }}>
              <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: C.accent }} />
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || showWelcome}
              className="w-full relative flex items-center justify-center gap-2.5 py-3.5 rounded-lg font-medium text-[12px] uppercase tracking-[0.2em] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group text-white"
              style={{
                background: loading ? C.surface : `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%)`,
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, ${C.accentHover} 0%, ${C.accent} 100%)` }} />
              <span className="relative">
                {loading ? 'Signing in…' : 'Sign in'}
              </span>
              {!loading && <ArrowRight className="relative w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8" style={{ borderTop: `1px solid ${C.divider}` }}>
          <p className="text-[11px] text-center" style={{ color: C.textMuted }}>
            SF Express · Upper Tingub, Mandaue, Cebu
          </p>
        </div>
      </div>

      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden welcome-overlay" style={{ background: C.bg }}>
          <div className="absolute inset-0 bg-black/70 transition-blur" />

          <div className="relative z-10 flex flex-col items-center gap-5 welcome-content text-center">
            <img src="/sf-light.png" alt="SF Express" className="h-7 w-auto welcome-logo" />
            
            <div className="flex flex-col items-center gap-2 px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: C.textSub }}>
                Access granted
              </p>
              
              <h2 className="text-[2.1rem] sm:text-[2.5rem] leading-[1.05] tracking-tight">
                <span style={{ color: '#FFFFFF' }}>Welcome back,</span>{' '}
                <span style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
                  {welcomeName}
                </span>
              </h2>
              
              <p className="text-[12px] mt-1" style={{ color: C.textMuted }}>
                Taking you to your dashboard…
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .login-form {
          transition: all 850ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .welcome-overlay {
          animation: overlayFadeIn 500ms ease-out forwards;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .transition-blur {
          animation: continuousBlur 1600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes continuousBlur {
          from { backdrop-filter: blur(0px); }
          to   { backdrop-filter: blur(32px); }
        }

        .welcome-content {
          animation: welcomePop 700ms cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards;
          opacity: 0;
        }

        @keyframes welcomePop {
          from { opacity: 0; transform: scale(0.88) translateY(30px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .welcome-logo {
          animation: logoPulse 1.6s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}