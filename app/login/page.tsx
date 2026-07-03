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

  accent:       '#9d7bf8',
  accentHover:  '#5e2ee4f5',
  accentGlow:   'rgba(104, 25, 232, 0.25)',

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

// How long the welcome transition plays before we actually navigate.
const TRANSITION_MS = 1400

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Welcome-transition state
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string>('')

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

    // Prefetch so the dashboard route is warm by the time the animation ends
    router.prefetch('/')

    setWelcomeName(email.split('@')[0])
    setLoading(false)
    setShowWelcome(true)

    window.setTimeout(() => {
      router.push('/')
      router.refresh()
    }, TRANSITION_MS)
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
      <div
        className="relative z-10 w-full max-w-[480px] px-6 transition-all duration-300"
        style={{
          opacity: showWelcome ? 0 : 1,
          filter: showWelcome ? 'blur(6px)' : 'blur(0px)',
          transform: showWelcome ? 'scale(0.98)' : 'scale(1)',
          pointerEvents: showWelcome ? 'none' : 'auto',
        }}
      >

        {/* Heading */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold mb-4" >
            Secure access
          </p>
          <h1 className="text-[2.2rem] text-white leading-[0.95] tracking-tight" style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
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
              disabled={loading || showWelcome}
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

      {/* ── Welcome transition overlay ── */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" style={{background: C.bg}}>

          {/* Expanding glow disc that zooms to fill the screen */}
          <div
            className="absolute rounded-full welcome-zoom-disc"
            style={{
              width: 40,
              height: 40,
              background: `radial-gradient(circle, ${C.accent} 0%, ${C.accentHover} 55%, transparent 75%)`,
            }}
          />

          {/* Subtle radial glow behind text, fades in fast */}
          <div
            className="absolute inset-0 welcome-glow-fade pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${C.accentGlow} 0%, transparent 60%)`,
            }}
          />

          {/* Content: logo mark + welcome copy, scales/fades in */}
          <div className="relative z-10 flex flex-col items-center gap-5 welcome-content">
            <img src="/sf-light.png" alt="SF Express" className="h-7 w-auto welcome-logo" />
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{color: C.textSub}}>
                Access granted
              </p>
              <h2
                className="text-[2rem] sm:text-[2.4rem] leading-[1.05] tracking-tight capitalize"
                style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}
              >
                Welcome back, {welcomeName}
              </h2>
              <p className="text-[12px] mt-1" style={{color: C.textMuted}}>
                Taking you to your dashboard…
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes welcomeZoomDisc {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          60% {
            opacity: 0.5;
          }
          100% {
            transform: scale(60);
            opacity: 0;
          }
        }
        .welcome-zoom-disc {
          animation: welcomeZoomDisc ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes welcomeGlowFade {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 1; }
        }
        .welcome-glow-fade {
          opacity: 0;
          animation: welcomeGlowFade 500ms ease-out 100ms forwards;
        }

        @keyframes welcomeContentIn {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .welcome-content {
          opacity: 0;
          animation: welcomeContentIn 550ms cubic-bezier(0.16, 1, 0.3, 1) 250ms forwards;
        }

        @keyframes welcomeLogoPulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        .welcome-logo {
          animation: welcomeLogoPulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}