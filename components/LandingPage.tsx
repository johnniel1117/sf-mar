'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle, Truck, LogOut, Sun, Sunset, Moon } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import LogoGridBackground from './LogoBackground'

// ── Time-based greeting ────────────────────────────────────────────────────────
function useGreeting() {
  const [greeting, setGreeting] = useState<{ text: string; icon: React.ReactNode; color: string }>({
    text: 'Good day', icon: null, color: 'text-white',
  })

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) {
      setGreeting({
        text: 'Good morning',
        icon: <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" strokeWidth={1.5} />,
        color: 'text-yellow-100',
      })
    } else if (h >= 12 && h < 18) {
      setGreeting({
        text: 'Good afternoon',
        icon: <Sunset className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" strokeWidth={1.5} />,
        color: 'text-orange-100',
      })
    } else {
      setGreeting({
        text: 'Good evening',
        icon: <Moon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300" strokeWidth={1.5} />,
        color: 'text-blue-100',
      })
    }
  }, [])

  return greeting
}

// ── Props passed from the server component wrapper ─────────────────────────────
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
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      href: '/trip-manifest',
      label: 'Trip Manifest',
      desc: 'Manage shipment details and delivery logistics',
      icon: Truck,
      gradient: 'from-emerald-500 to-emerald-700',
    },
    {
      href: '/damage-report',
      label: 'Damage Report',
      desc: 'Document and track damaged products',
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-orange-700',
    },
  ]

  const quickLinks = [
    { href: '/excel-uploader', label: 'Upload Files',  sub: 'Process data',     icon: FileSpreadsheet, bg: 'from-blue-500/20 to-blue-700/20',     fg: 'text-blue-400' },
    { href: '/trip-manifest',  label: 'New Trip',      sub: 'Create manifest',  icon: Truck,           bg: 'from-emerald-500/20 to-emerald-700/20', fg: 'text-emerald-400' },
    { href: '/damage-report',  label: 'Report Issue',  sub: 'Log damage',       icon: AlertTriangle,   bg: 'from-orange-500/20 to-orange-700/20',   fg: 'text-orange-400' },
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 opacity-30">
            <LogoGridBackground />
          </div>
    
          {/* Gradient overlays - more subtle */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-black" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-800/5 rounded-full blur-[100px]" />
      {/* Ambient glow */}
      {/* <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8192C]/4 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#E8192C]/3 rounded-full blur-[100px]" /> */}

      <div className="relative z-10">
        {/* ── Top bar ── */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-[#282828]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
              <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#B3B3B3] leading-none mb-0.5 hidden sm:block">SF Express</p>
              <span className="text-white text-sm sm:text-base font-black">Logistics Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User chip */}
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1E1E1E] border border-[#282828] hover:border-[#3E3E3E] transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                {displayName?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none">{displayName}</p>
                {role && <p className="text-[10px] text-[#6A6A6A] capitalize mt-0.5">{role}</p>}
              </div>
            </div>

            {/* Sign out */}
            <form action={signOut}>
                <button
                    type="submit"
                    className="p-2 sm:p-2.5 rounded-full bg-[#1E1E1E] border border-[#282828]
                            hover:border-white hover:scale-105 transition-all
                            text-[#6A6A6A] hover:text-white"
                    title="Log out"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </form>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="px-4 sm:px-8 py-8 sm:py-12 max-w-[1400px] mx-auto">

          {/* Greeting */}
          <div className="flex items-center gap-3 mb-2">
            {greeting.icon}
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black ${greeting.color}`}>
              {greeting.text}
            </h1>
          </div>
          <p className="text-[#6A6A6A] text-sm mb-10 sm:mb-14 ml-0.5">
            Welcome back, <span className="text-[#B3B3B3] font-semibold">{displayName}</span>. Here's your workspace.
          </p>

          {/* ── Services grid ── */}
          {/* <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">Your apps</h2> */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(({ href, label, desc, icon: Icon, gradient }) => (
              <Link key={href} href={href}>
                <div className="group relative bg-[#1E1E1E] border border-[#282828] rounded-xl p-5 sm:p-6 hover:border-[#3E3E3E] hover:bg-[#282828] transition-all duration-300 cursor-pointer overflow-hidden">
                  {/* Subtle red glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'radial-gradient(circle at top right, rgba(232,25,44,0.06), transparent 60%)' }} />

                  <div className="flex items-start gap-4 sm:gap-5 relative z-10">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-white text-sm sm:text-base font-black mb-1.5">{label}</h3>
                      <p className="text-[#6A6A6A] text-xs sm:text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>

                  {/* Spotify-style play button */}
                  <div className="absolute bottom-5 right-5 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)', boxShadow: '0 8px 24px rgba(232,25,44,0.35)' }}>
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

          {/* ── Quick access ── */}
          <div className="mt-12 sm:mt-14">
            <h2 className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">Quick access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {quickLinks.map(({ href, label, sub, icon: Icon, bg, fg }) => (
                <Link key={href} href={href}>
                  <div className="group bg-[#1E1E1E] border border-[#282828] rounded-xl p-3 sm:p-4 hover:bg-[#282828] hover:border-[#3E3E3E] transition-all cursor-pointer">
                    <div className={`aspect-square bg-gradient-to-br ${bg} rounded-xl mb-3 sm:mb-4 flex items-center justify-center`}>
                      <Icon className={`w-9 h-9 sm:w-11 sm:h-11 ${fg}`} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white text-xs sm:text-sm font-bold mb-0.5">{label}</h3>
                    <p className="text-[#6A6A6A] text-[10px] sm:text-xs">{sub}</p>
                  </div>
                </Link>
              ))}

              {/* Coming soon placeholder */}
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

        {/* ── Footer ── */}
        {/* <div className="px-4 sm:px-8 py-6 mt-8 border-t border-[#282828] text-center">
          <p className="text-[#6A6A6A] text-[10px] uppercase tracking-widest">
            © 2026 SF Express Logistics Dashboard · Developed by <span className="text-[#B3B3B3] font-bold">MAR</span>
          </p>
        </div> */}
      </div>
    </div>
  )
}