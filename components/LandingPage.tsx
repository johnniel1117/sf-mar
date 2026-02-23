'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle, Truck, LogOut, Sun, Sunset, Moon } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import LogoGridBackground from './LogoBackground'

// ── Time-based greeting ────────────────────────────────────────────────────────
function useGreeting() {
  const [greeting, setGreeting] = useState<{ text: string; icon: React.ReactNode; color: string }>({
    text: 'Good day',
    icon: null,
    color: 'text-white',
  })

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) {
      setGreeting({
        text: 'Good morning',
        icon: <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" strokeWidth={1.5} />,
        color: 'text-white',
      })
    } else if (h >= 12 && h < 18) {
      setGreeting({
        text: 'Good afternoon',
        icon: <Sunset className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" strokeWidth={1.5} />,
        color: 'text-white',
      })
    } else {
      setGreeting({
        text: 'Good evening',
        icon: <Moon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300" strokeWidth={1.5} />,
        color: 'text-white',
      })
    }
  }, [])

  return greeting
}

interface LandingClientProps {
  displayName: string
  role?: string
}

export function LandingClient({ displayName, role }: LandingClientProps) {
  const greeting = useGreeting()

  const services = [
    {
      href: '/excel-uploader',
      label: 'Serial List',
      desc: 'Upload and process product barcode data',
      icon: FileSpreadsheet,
      gradient: 'from-red-500 to-red-700',
    },
    {
      href: '/trip-manifest',
      label: 'Trip Manifest',
      desc: 'Manage shipment details and delivery logistics',
      icon: Truck,
      gradient: 'from-red-500 to-red-700',
    },
    {
      href: '/damage-report',
      label: 'Damage Report',
      desc: 'Document and track damaged products',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-700',
    },
  ]

 const quickLinks = [
  { 
    href: '/excel-uploader',
    label: 'Upload Files',
    sub: 'Process data',
    icon: FileSpreadsheet,
    bg: 'from-black-700/100 to-red-500/10',
    fg: 'text-white',
    blur: 'blur-[150px]',
    bgImage: '/sf-light.png'
  },
  { 
    href: '/trip-manifest',
    label: 'New Trip',
    sub: 'Create manifest',
    icon: Truck,
    bg: 'from-black-700/100 to-red-500/10',
    fg: 'text-white',
    blur: 'blur-[150px]',
    bgImage: '/sf-light.png'
  },
  { 
    href: '/damage-report',
    label: 'Report Issue',
    sub: 'Log damage',
    icon: AlertTriangle,
    bg: 'from-black-700/100 to-red-500/10',
    fg: 'text-white',
    blur: 'blur-[150px]',
    bgImage: '/sf-light.png'
  },
]

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* ── Fixed background ── */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <LogoGridBackground />
      </div>
      <div className="fixed inset-0 bg-gradient-to-br from-red-950/40 via-black to-black pointer-events-none" />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-red-800/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Foreground ── */}
      <div className="relative z-10 h-full flex flex-col">
        {/* ── Top bar ── */}
        <div
          className="
            fixed sm:static
            top-0 left-0 right-0
            z-50
            px-4 sm:px-8 py-4 sm:py-5
            flex items-center justify-between
            border-b border-[#282828]
            backdrop-blur
          "
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
            <div>
              <p className="hidden sm:block text-[9px] uppercase tracking-widest font-bold text-[#B3B3B3]">SF Express</p>
              <span className="text-white text-sm sm:text-base font-black">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-[#1E1E1E] border border-[#282828]">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">{displayName}</p>
                {role && <p className="text-[10px] text-[#6A6A6A] capitalize mt-0.5">{role}</p>}
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="p-2 sm:p-2.5 rounded-full bg-[#1E1E1E] border border-[#282828]
                         hover:border-white hover:scale-105 transition-all
                         text-[#6A6A6A] hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Scrollable content (mobile only) ── */}
        <div
          className="
            flex-1
            overflow-y-auto sm:overflow-visible
            pt-24 sm:pt-12
            px-4 sm:px-8
            pb-12
            max-w-[1400px] mx-auto
          "
        >
          {/* Greeting */}
          <div className="flex items-center gap-3 mb-2">
            {greeting.icon}
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black ${greeting.color}`}>
              {greeting.text}
            </h1>
          </div>
          <p className="text-[#6A6A6A] text-sm mb-10 sm:mb-14 ml-0.5">
            Welcome back, <span className="text-[#B3B3B3] font-semibold">{displayName}</span>.
          </p>

          {/* Services grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(({ href, label, desc, icon: Icon, gradient }) => (
              <Link key={href} href={href}>
                <div className="group relative bg-[#1E1E1E] border border-[#282828] rounded-xl p-5 sm:p-6 hover:border-[#3E3E3E] hover:bg-[#282828] transition-all overflow-hidden">
                  <div className="flex items-start gap-4 sm:gap-5 relative z-10">
                    <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-white text-sm sm:text-base font-black mb-1.5">{label}</h3>
                      <p className="text-[#6A6A6A] text-xs sm:text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  {/* Arrow action button */}
<div
  className="
    absolute bottom-5 right-5
    w-10 h-10 sm:w-12 sm:h-12
    rounded-full
    flex items-center justify-center
    opacity-0 group-hover:opacity-100
    translate-y-2 group-hover:translate-y-0
    transition-all duration-300
    shadow-2xl
  "
  style={{
    background: 'linear-gradient(135deg, #E8192C, #7f0e18)',
    boxShadow: '0 8px 24px rgba(232,25,44,0.35)',
  }}
>
  <svg
    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</div>
                </div>
                
              </Link>
            ))}
            
          </div>

          {/* Quick access */}
          <div className="mt-12 sm:mt-14">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">Quick access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {quickLinks.map(({ href, label, sub, icon: Icon, bg, fg, bgImage }) => (
                <Link key={href} href={href}>
                  <div className="group bg-[#1E1E1E] border border-[#282828] rounded-xl p-3 sm:p-4 hover:bg-[#282828] hover:border-[#3E3E3E] transition-all">
                    <div
  className={`
    relative
    aspect-square
    bg-gradient-to-br ${bg}
    rounded-xl
    mb-3 sm:mb-4
    flex items-center justify-center
    overflow-hidden
  `}
  style={{
    background: 'linear-gradient(135deg, #2b0004, #000000)',
    boxShadow: '0 8px 24px rgba(20, 18, 18, 0.35)',
  }}
>
  {bgImage && (
    <img
      src={bgImage}
      alt=""
      className="
  absolute
  -right-12 sm:-right-20
  -bottom-12 sm:-bottom-20
  w-52 sm:w-80
  opacity-10
"
    />
  )}

  <Icon
    className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 ${fg}`}
    strokeWidth={1.5}
  />
</div>
                    <h3 className="text-white text-xs sm:text-sm font-bold mb-0.5">{label}</h3>
                    <p className="text-[#6A6A6A] text-[10px] sm:text-xs">{sub}</p>
                  </div>
                </Link>
              ))}

              {/* Coming soon */}
              <div className="group bg-[#1E1E1E] border border-[#282828] rounded-xl p-3 sm:p-4 cursor-not-allowed opacity-50">
                <div className="aspect-square bg-gradient-to-br from-[#282828] to-[#1E1E1E] rounded-xl mb-3 sm:mb-4 flex items-center justify-center border border-[#3E3E3E] border-dashed">
                  <span className="text-[#6A6A6A] text-2xl font-black">+</span>
                </div>
                <h3 className="text-[#B3B3B3] text-xs sm:text-sm font-bold mb-0.5">More</h3>
                <p className="text-[#6A6A6A] text-[10px] sm:text-xs">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}