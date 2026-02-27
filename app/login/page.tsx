'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LogoGridBackground from '@/components/LogoBackground'

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

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role

  if (role === 'viewer') {
    router.push('/') // viewers can only see manifests & reports
  } else {
    router.push('/') // admin/user goes to full dashboard
  }

  router.refresh()
}

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-30">
        <LogoGridBackground />
      </div>

      {/* Gradient overlays - more subtle */}
      <div className="absolute inset-0 bg-gradient-to-br from-black-950/40 via-black to-black" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-black-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black-800/5 rounded-full blur-[100px]" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[450px]">
          {/* Logo */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-xl mb-6">
              <img src="/sf-light.png" alt="SF Express" className="h-20 w-auto" />
            </div>
            <h1 className="text-white text-5xl font-bold tracking-tight mb-2">
              Log in to SF Express
            </h1>
          </div>

          {/* Login form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#727272] rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white hover:border-white transition-colors"
                placeholder="name@domain.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
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
                  className="w-full px-4 py-3 bg-[#121212] border border-[#727272] rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white hover:border-white transition-colors"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white font-bold py-3.5 rounded-2xl transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#292929]"></div>
              </div>
            </div>

            {/* <div className="text-center">
              <button 
                type="button" 
                className="text-white text-sm font-medium underline hover:text-black-400 transition-colors"
              >
                Forgot your password?
              </button>
            </div> */}
          </div>

          {/* Footer */}
          <div className="mt-20 text-center text-[#6a6a6a] text-xs">
            <p>© 2026 SF Express Logistics Dashboard</p>
            <p className="mt-2">Developed by MAR</p>
          </div>
        </div>
      </div>
    </div>
  )
}