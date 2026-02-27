'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet, AlertTriangle, Truck, LogOut,
  TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight, X,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import LogoGridBackground from './LogoBackground'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { OutboundAnalyticsPanel } from '@/components/OutboundAnalytics'
import type { TripManifest } from '@/lib/services/tripManifestService'

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useGreeting() {
  const [greeting, setGreeting] = useState('Good day')
  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) setGreeting('Good morning')
    else if (h >= 12 && h < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])
  return greeting
}

function useTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SERVICES = [
  { href: '/excel-uploader', label: 'Serial List',   desc: 'Upload and process barcode data',     icon: FileSpreadsheet, index: '01' },
  { href: '/trip-manifest',  label: 'Trip Manifest', desc: 'Manage shipment details',             icon: Truck,           index: '02' },
  { href: '/damage-report',  label: 'Damage Report', desc: 'Document and track damaged products', icon: AlertTriangle,   index: '03' },
]

const QUICK_JUMPS = [
  { href: '/excel-uploader', label: 'Upload Files' },
  { href: '/trip-manifest',  label: 'New Trip'     },
  { href: '/damage-report',  label: 'Report Issue' },
]

// ── Sidebar analytics ─────────────────────────────────────────────────────────

function OutboundSidebar({ manifests, onExpand }: { manifests: TripManifest[]; onExpand: () => void }) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const relevant = manifests.filter(m => {
        const md = new Date(m.manifest_date || '')
        return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth()
      })
      return {
        label: MONTH_LABELS[d.getMonth()],
        qty:   relevant.reduce((s, m) => s + (m.items || []).reduce((si, it) => si + (it.total_quantity || 0), 0), 0),
        trips: relevant.length,
      }
    })
  }, [manifests])

  const maxQty   = Math.max(...monthlyData.map(d => d.qty), 1)
  const current  = monthlyData[monthlyData.length - 1]
  const prev     = monthlyData[monthlyData.length - 2]
  const delta    = prev.qty === 0 ? null : Math.round(((current.qty - prev.qty) / prev.qty) * 100)
  const positive = delta !== null && delta >= 0
  const totalAllTime = manifests.reduce((s, m) => s + (m.items || []).reduce((si, it) => si + (it.total_quantity || 0), 0), 0)

  return (
    <div className="space-y-7">
      {/* Sparkline */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#3E3E3E] mb-3">Qty · last 6 months</p>
        <div className="flex items-end gap-1.5" style={{ height: 80 }}>
          {monthlyData.map((d, i) => {
            const isCurrent = i === monthlyData.length - 1
            const hPct = Math.max((d.qty / maxQty) * 100, d.qty > 0 ? 6 : 0)
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${hPct}%`,
                    background: isCurrent
                      ? 'linear-gradient(180deg, #E8192C 0%, #7f0e18 100%)'
                      : 'rgba(255,255,255,0.07)',
                    boxShadow: isCurrent ? '0 0 10px rgba(232,25,44,0.35)' : 'none',
                  }}
                />
                <span className={`text-[9px] font-bold ${isCurrent ? 'text-[#E8192C]' : 'text-[#3E3E3E]'}`}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider stats */}
      <div className="divide-y divide-[#1a1a1a]">
        <div className="flex items-baseline justify-between pb-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">
            {MONTH_LABELS[new Date().getMonth()]} qty
          </span>
          <div className="text-right">
            <p className="text-2xl font-black text-white tabular-nums leading-none">{current.qty.toLocaleString()}</p>
            {delta !== null && (
              <div className={`flex items-center justify-end gap-0.5 mt-0.5 text-[10px] font-bold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta)}% vs {prev.label}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-baseline justify-between py-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">Trips</span>
          <p className="text-2xl font-black text-white tabular-nums">{current.trips}</p>
        </div>
        <div className="flex items-baseline justify-between py-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">All-time qty</span>
          <p className="text-2xl font-black text-white tabular-nums">{totalAllTime.toLocaleString()}</p>
        </div>
        <div className="flex items-baseline justify-between pt-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">Manifests</span>
          <p className="text-2xl font-black text-white tabular-nums">{manifests.length}</p>
        </div>
      </div>

      <button
        onClick={onExpand}
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3E3E3E] hover:text-[#E8192C] transition-colors group"
      >
        Full analytics
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface LandingClientProps {
  displayName: string
  role?: string
  manifests?: TripManifest[]
}

export function LandingClient({ displayName, role, manifests = [] }: LandingClientProps) {
  const greeting = useGreeting()
  const time     = useTime()
  const [showSignOutModal,   setShowSignOutModal]   = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const isViewer = role?.toLowerCase() === 'viewer'

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const now   = new Date()

  const thisMonthManifests  = manifests.filter(m => {
    const d = new Date(m.manifest_date || '')
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalTripsThisMonth = thisMonthManifests.length
  const totalQtyThisMonth   = thisMonthManifests.reduce(
    (sum, m) => sum + (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0), 0
  )

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      <ConfirmationModal
        isOpen={showSignOutModal}
        title="Sign out"
        message={`You'll be signed out of your account, ${displayName}.`}
        confirmText="Sign out"
        cancelText="Cancel"
        onConfirm={async () => { await signOut() }}
        onCancel={() => setShowSignOutModal(false)}
      />

      {/* ── Analytics modal — bigger, scrollable ── */}
      {showAnalyticsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowAnalyticsModal(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div
            className="relative z-10 w-full max-w-3xl"
            style={{ maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="absolute -top-3 -right-3 z-20 w-9 h-9 rounded-full bg-[#1E1E1E] border border-[#3E3E3E] flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] transition-all shadow-xl"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="overflow-y-auto" style={{ maxHeight: '92vh' }}>
              <OutboundAnalyticsPanel manifests={manifests} />
            </div>
          </div>
        </div>
      )}

      {/* ── Original background (preserved exactly) ── */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <LogoGridBackground />
      </div>
      <div className="fixed inset-0 bg-gradient-to-br from-black/5 via-black/95 to-black pointer-events-none" />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-black/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-black/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Foreground ── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <header className="fixed sm:static top-0 left-0 right-0 z-50 border-b border-[#282828] backdrop-blur">
          <div className="px-5 sm:px-8 h-[72px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
              <div className="w-px h-4 bg-[#282828]" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#6A6A6A]">Dashboard</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-5">
              <span className="hidden sm:block text-[11px] font-mono text-[#3E3E3E] tabular-nums">{time}</span>

              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[12px] font-semibold text-white leading-none">{displayName}</p>
                  {role && <p className="text-[10px] text-[#6A6A6A] capitalize mt-0.5">{role}</p>}
                </div>
              </div>

              <div className="w-px h-4 bg-[#282828]" />

              <button
                onClick={() => setShowSignOutModal(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#6A6A6A] hover:text-white transition-colors uppercase tracking-widest"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto pt-[72px] sm:pt-0">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8">

            {/* Hero */}
            <div className="pt-12 sm:pt-16 pb-10 sm:pb-14 border-b border-[#1a1a1a]">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#E8192C] mb-3">{today}</p>
                  <h1 className="text-[clamp(2.2rem,5.5vw,4.2rem)] font-black text-white leading-[0.93] tracking-tight">
                    {greeting},<br />
                    <span className="text-[#3E3E3E]">{displayName}.</span>
                  </h1>
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-8 sm:gap-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E] mb-1.5">
                      {now.toLocaleString('en-US', { month: 'short' })} trips
                    </p>
                    <p className="text-5xl font-black text-white tabular-nums leading-none">
                      {String(totalTripsThisMonth).padStart(2, '0')}
                    </p>
                  </div>
                  <div className="w-px h-14 bg-[#1a1a1a]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E] mb-1.5">Units out</p>
                    <p className="text-5xl font-black text-white tabular-nums leading-none">
                      {totalQtyThisMonth >= 1000
                        ? `${(totalQtyThisMonth / 1000).toFixed(1)}k`
                        : totalQtyThisMonth.toLocaleString()}
                    </p>
                  </div>
                  {manifests.length > 0 && (
                    <>
                      <div className="hidden sm:block w-px h-14 bg-[#1a1a1a]" />
                      <button
                        onClick={() => setShowAnalyticsModal(true)}
                        className="hidden sm:flex flex-col items-start gap-2 group"
                      >
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E] group-hover:text-[#E8192C] transition-colors">Analytics</p>
                        <div className="flex items-center gap-1.5 text-[#3E3E3E] group-hover:text-[#E8192C] transition-colors">
                          <TrendingUp className="w-5 h-5" />
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Two-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1a]">

              {/* LEFT — services */}
              <div className="py-10 sm:py-12 lg:pr-12">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-7">Services</p>

                <div className="divide-y divide-[#1a1a1a]">
                  {SERVICES.map(({ href, label, desc, icon: Icon, index }) => (
                    <Link key={href} href={href} className="group block">
                      <div className="flex items-center gap-5 sm:gap-6 py-5 sm:py-6 transition-all duration-200 group-hover:pl-1.5">
                        <span className="text-[11px] font-mono font-bold text-[#282828] w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors">
                          {index}
                        </span>
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-[#232323] bg-[#161616] group-hover:border-[#E8192C]/20 group-hover:bg-[#E8192C]/6 transition-all duration-200">
                          <Icon className="w-4 h-4 text-[#484848] group-hover:text-[#E8192C] transition-colors" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-[#B3B3B3] group-hover:text-white transition-colors leading-snug">
                            {label}
                          </p>
                          <p className="text-[12px] text-[#3E3E3E] mt-0.5 group-hover:text-[#6A6A6A] transition-colors">
                            {desc}
                          </p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#282828] group-hover:text-[#E8192C] flex-shrink-0 transition-all duration-200 translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Quick jumps */}
                <div className="mt-9 pt-7 border-t border-[#1a1a1a]">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-4">Quick jump</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_JUMPS.map(({ href, label }) => (
                      <Link key={href} href={href}>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#232323] text-[11px] font-semibold text-[#484848] hover:border-[#E8192C]/30 hover:text-white hover:bg-[#E8192C]/5 transition-all duration-200 cursor-pointer">
                          <ChevronRight className="w-3 h-3" />
                          {label}
                        </span>
                      </Link>
                    ))}
                    <button
                      onClick={() => setShowAnalyticsModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#232323] text-[11px] font-semibold text-[#484848] hover:border-[#E8192C]/30 hover:text-white hover:bg-[#E8192C]/5 transition-all duration-200 lg:hidden"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Analytics
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT — analytics sidebar */}
              <div className="hidden lg:block py-10 sm:py-12 pl-12">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-7">Outbound</p>
                {manifests.length === 0 ? (
                  <div className="space-y-3 py-2">
                    <TrendingUp className="w-5 h-5 text-[#282828]" />
                    <p className="text-sm font-bold text-[#3E3E3E]">No data yet</p>
                    <p className="text-[12px] text-[#282828] leading-relaxed max-w-[200px]">
                      Create your first trip manifest to see outbound analytics.
                    </p>
                    <Link href="/trip-manifest">
                      <span className="text-[11px] font-bold text-[#E8192C] uppercase tracking-widest hover:underline cursor-pointer">
                        Get started →
                      </span>
                    </Link>
                  </div>
                ) : (
                  <OutboundSidebar manifests={manifests} onExpand={() => setShowAnalyticsModal(true)} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#1a1a1a] py-5 flex items-center justify-between">
              <p className="text-[11px] text-[#282828] font-mono">SF Express · Cebu Warehouse</p>
              <p className="text-[11px] text-[#282828] font-mono">{new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}