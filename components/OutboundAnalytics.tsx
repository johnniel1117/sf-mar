'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, Package, Truck, FileText,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Data builders ─────────────────────────────────────────────────────────────

function buildMonthlyData(manifests: TripManifest[]) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const relevant = manifests.filter(m => {
      const md = new Date(m.manifest_date || m.created_at || '')
      return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth()
    })
    const totalQty   = relevant.reduce((s, m) => s + (m.items || []).reduce((si, it) => si + (it.total_quantity || 0), 0), 0)
    const totalTrips = relevant.length
    const totalDocs  = relevant.reduce((s, m) => s + (m.items?.length || 0), 0)
    return { label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), totalQty, totalTrips, totalDocs }
  })
}

function calcDelta(curr: number, prev: number): number | null {
  return prev === 0 ? null : Math.round(((curr - prev) / prev) * 100)
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-[#3E3E3E] font-bold">—</span>
  const pos = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

type Metric = 'totalQty' | 'totalTrips' | 'totalDocs'

function BarGraph({ data, activeMetric }: { data: ReturnType<typeof buildMonthlyData>; activeMetric: Metric }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const values = data.map(d => d[activeMetric])
  const max    = Math.max(...values, 1)
  const metricUnit: Record<Metric, string> = { totalQty: 'units', totalTrips: 'trips', totalDocs: 'docs' }
  const allZero = values.every(v => v === 0)

  return (
    <div className="relative w-full">
      {/* Ghost grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: 28 }}>
        {[100, 75, 50, 25, 0].map(p => (
          <div key={p} className="w-full border-t border-[#1a1a1a]" />
        ))}
      </div>

      {allZero ? (
        <div className="h-[220px] flex items-center justify-center text-[#3E3E3E] text-xs font-bold uppercase tracking-widest">
          No data for the last 6 months
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 w-full" style={{ minHeight: 200, height: 'clamp(180px, 32vh, 260px)' }}>
          {data.map((d, i) => {
            const val       = d[activeMetric]
            const hPct      = max > 0 ? (val / max) * 100 : 0
            const displayH  = Math.max(hPct, val > 0 ? 8 : 0)
            const isHovered = hovered === i
            const isCurr    = i === data.length - 1
            const isPrev    = i === data.length - 2
            const prevVal   = i > 0 ? data[i - 1][activeMetric] : null
            const delta     = prevVal !== null ? calcDelta(val, prevVal) : null

            let barBg     = 'rgba(255,255,255,0.06)'
            let barShadow = 'none'

            if (isCurr) {
              barBg     = 'linear-gradient(180deg, #E8192C 0%, #F5A623 100%)'
              barShadow = '0 0 14px rgba(232,25,44,0.7), 0 0 28px rgba(245,166,35,0.35)'
            } else if (isPrev) {
              barBg     = 'rgba(245,166,35,0.40)'
              barShadow = '0 0 8px rgba(245,166,35,0.25)'
            }

            return (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end gap-2 cursor-default relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && val > 0 && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{ bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div className="bg-black border border-[#282828] px-4 py-3 shadow-2xl text-center min-w-[140px]">
                      <p className="text-white font-black text-base tabular-nums">
                        {val.toLocaleString()}
                        <span className="text-[#6A6A6A] text-xs ml-2 font-normal">{metricUnit[activeMetric]}</span>
                      </p>
                      {delta !== null && (
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          <DeltaBadge value={delta} />
                          <span className="text-[#6A6A6A] text-[10px]">vs prev</span>
                        </div>
                      )}
                      <p className="text-[#3E3E3E] text-[10px] mt-1 uppercase tracking-widest font-bold">{d.label} {d.year}</p>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-sm transition-all duration-300 relative overflow-hidden"
                  style={{
                    height: `${displayH}%`,
                    minHeight: val > 0 ? '8px' : '0px',
                    background: isHovered && !isCurr && !isPrev
                      ? 'rgba(255,255,255,0.15)'
                      : barBg,
                    boxShadow: barShadow,
                  }}
                />

                {/* Label */}
                <span className={`text-[9px] font-bold leading-none pt-1.5 ${
                  isCurr ? 'text-[#F5A623]' : isPrev ? 'text-[#8a6820]' : isHovered ? 'text-[#B3B3B3]' : 'text-[#3E3E3E]'
                }`}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Top destinations ──────────────────────────────────────────────────────────

function TopDestinations({ manifests }: { manifests: TripManifest[] }) {
  const destinations = useMemo(() => {
    const map = new Map<string, { qty: number; docs: number }>()
    manifests.forEach(m => {
      ;(m.items || []).forEach(it => {
        const name = it.ship_to_name?.trim() || 'Unknown'
        const ex = map.get(name) || { qty: 0, docs: 0 }
        map.set(name, { qty: ex.qty + (it.total_quantity || 0), docs: ex.docs + 1 })
      })
    })
    return [...map.entries()]
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 7)
  }, [manifests])

  const maxQty = Math.max(...destinations.map(d => d.qty), 1)
  if (!destinations.length) return <EmptyState label="No destination data yet" />

  return (
    <div className="divide-y divide-[#1a1a1a]">
      {destinations.map((dest, i) => (
        <div key={dest.name} className="group py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-[11px] font-mono font-bold text-[#282828] w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[15px] font-black text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                {dest.name}
              </span>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0 ml-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E] hidden sm:block">{dest.docs} doc{dest.docs !== 1 ? 's' : ''}</span>
              <span className="text-2xl font-black text-white tabular-nums">{dest.qty.toLocaleString()}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-px bg-[#1a1a1a] ml-9 overflow-hidden">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${(dest.qty / maxQty) * 100}%`,
                background: i === 0
                  ? 'linear-gradient(90deg, #E8192C, #F5A623)'
                  : i === 1
                  ? 'rgba(245,166,35,0.6)'
                  : 'rgba(255,255,255,0.15)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Top truckers ──────────────────────────────────────────────────────────────

function TopTruckers({ manifests }: { manifests: TripManifest[] }) {
  const truckers = useMemo(() => {
    const map = new Map<string, { trips: number; qty: number }>()
    manifests.forEach(m => {
      const name = m.trucker?.trim() || 'Unknown'
      const ex = map.get(name) || { trips: 0, qty: 0 }
      const qty = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
      map.set(name, { trips: ex.trips + 1, qty: ex.qty + qty })
    })
    return [...map.entries()]
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5)
  }, [manifests])

  const drivers = useMemo(() => {
    const map = new Map<string, number>()
    manifests.forEach(m => {
      const n = m.driver_name?.trim() || 'Unknown'
      map.set(n, (map.get(n) || 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [manifests])

  const truckTypes = useMemo(() => {
    const map = new Map<string, number>()
    manifests.forEach(m => {
      if (m.truck_type) map.set(m.truck_type, (map.get(m.truck_type) || 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [manifests])

  if (!truckers.length) return <EmptyState label="No trucker data yet" />

  return (
    <div className="space-y-10">
      {/* Trucking companies */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-6">Trucking companies</p>
        <div className="divide-y divide-[#1a1a1a]">
          {truckers.map((t, i) => (
            <div key={t.name} className="group flex items-center gap-5 sm:gap-6 py-5 sm:py-6 transition-all duration-200 hover:pl-1.5">
              <span className="text-[11px] font-mono font-bold text-[#282828] w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white"
                style={{ background: i === 0 ? 'linear-gradient(135deg, #E8192C, #7f0e18)' : 'rgba(255,255,255,0.08)' }}
              >
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-[#B3B3B3] group-hover:text-white transition-colors truncate">{t.name}</p>
                <p className="text-[12px] text-[#3E3E3E] mt-0.5 group-hover:text-[#6A6A6A] transition-colors hidden sm:block">{t.qty.toLocaleString()} units</p>
              </div>
              <p className="text-2xl font-black text-white tabular-nums flex-shrink-0">{t.trips}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top drivers */}
      {drivers.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-6">Top drivers</p>
          <div className="divide-y divide-[#1a1a1a]">
            {drivers.map(([name, trips], i) => (
              <div key={name} className="flex items-center justify-between py-4">
                <span className={`text-[13px] font-semibold ${i === 0 ? 'text-white' : 'text-[#B3B3B3]'}`}>{name}</span>
                <span className="text-[13px] font-black text-[#6A6A6A] tabular-nums">{trips} trip{trips !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Truck types */}
      {truckTypes.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-4">Truck types</p>
          <div className="flex flex-wrap gap-2">
            {truckTypes.map(([type, count], i) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border text-[11px] font-semibold transition-colors ${
                  i === 0
                    ? 'border-[#E8192C]/30 text-[#E8192C] bg-[#E8192C]/5'
                    : 'border-[#282828] text-[#484848]'
                }`}
              >
                {type}
                <span className="font-black text-[#3E3E3E]">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recent activity ───────────────────────────────────────────────────────────

function RecentActivity({ manifests }: { manifests: TripManifest[] }) {
  const recent = useMemo(() =>
    [...manifests]
      .sort((a, b) =>
        new Date(b.manifest_date || b.created_at || '').getTime() -
        new Date(a.manifest_date || a.created_at || '').getTime()
      )
      .slice(0, 8),
    [manifests]
  )
  if (!recent.length) return <EmptyState label="No activity yet" />

  return (
    <div className="divide-y divide-[#1a1a1a]">
      {recent.map(m => {
        const qty  = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
        const date = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'

        return (
          <div key={m.id} className="group flex items-center justify-between py-5 hover:pl-1.5 transition-all duration-200">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#282828] group-hover:bg-[#E8192C] transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-black text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                  {m.manifest_number || m.id?.slice(0, 8) || '—'}
                </p>
                <p className="text-[11px] text-[#3E3E3E] mt-0.5 truncate group-hover:text-[#6A6A6A] transition-colors">
                  {m.driver_name || 'No driver'}{m.trucker ? ` · ${m.trucker}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black text-white tabular-nums">{qty.toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">{date}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <TrendingUp className="w-5 h-5 text-[#282828]" />
      <p className="text-sm font-bold text-[#3E3E3E]">{label}</p>
    </div>
  )
}

// ── Full Analytics Panel ──────────────────────────────────────────────────────

type Tab = 'overview' | 'destinations' | 'truckers' | 'activity'

interface OutboundAnalyticsPanelProps {
  manifests: TripManifest[]
}

export function OutboundAnalyticsPanel({ manifests }: OutboundAnalyticsPanelProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('totalQty')
  const [activeTab,    setActiveTab]    = useState<Tab>('overview')

  const monthlyData    = useMemo(() => buildMonthlyData(manifests), [manifests])
  const current        = monthlyData[monthlyData.length - 1]
  const previous       = monthlyData[monthlyData.length - 2] || { totalQty: 0, totalTrips: 0, totalDocs: 0 }
  const totalAllTime   = manifests.reduce((s, m) => s + (m.items || []).reduce((si, i) => si + (i.total_quantity || 0), 0), 0)
  const uniqueTruckers = new Set(manifests.map(m => m.trucker).filter(Boolean)).size
  const avgQtyPerTrip  = manifests.length > 0 ? Math.round(totalAllTime / manifests.length) : 0
  const totalDocs      = manifests.reduce((s, m) => s + (m.items?.length || 0), 0)

  const METRICS: { key: Metric; label: string; value: string; delta: number | null }[] = [
    { key: 'totalQty',   label: 'Qty dispatched', value: current.totalQty.toLocaleString(),  delta: calcDelta(current.totalQty,   previous.totalQty)   },
    { key: 'totalTrips', label: 'Trips',           value: String(current.totalTrips),         delta: calcDelta(current.totalTrips, previous.totalTrips) },
    { key: 'totalDocs',  label: 'Documents',       value: String(current.totalDocs),          delta: calcDelta(current.totalDocs,  previous.totalDocs)  },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview'     },
    { key: 'destinations', label: 'Destinations' },
    { key: 'truckers',     label: 'Truckers'     },
    { key: 'activity',     label: 'Activity'     },
  ]

  return (
    <div className="bg-black border border-[#1a1a1a] overflow-hidden flex flex-col min-h-0">

      {/* ── Header ── */}
      <div className="px-6 sm:px-8 pt-8 pb-7 border-b border-[#1a1a1a]">

        {/* Title row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#F5A623] mb-3">Outbound analytics</p>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-black text-white leading-[0.93] tracking-tight">
              {manifests.length} manifest{manifests.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E] mb-1.5">All-time units</p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">{totalAllTime.toLocaleString()}</p>
          </div>
        </div>

        {/* Metric selectors — styled like the hero stats strip */}
        <div className="flex items-stretch gap-0 border border-[#1a1a1a] divide-x divide-[#1a1a1a]">
          {METRICS.map(({ key, label, value, delta }) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`flex-1 text-left px-4 sm:px-5 py-4 transition-all duration-150 group ${
                activeMetric === key ? 'bg-[#E8192C]/6' : 'hover:bg-[#0a0a0a]'
              }`}
            >
              <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 transition-colors ${
                activeMetric === key ? 'text-[#E8192C]' : 'text-[#3E3E3E] group-hover:text-[#6A6A6A]'
              }`}>{label}</p>
              <p className="text-xl sm:text-2xl font-black text-white tabular-nums leading-none">{value}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <DeltaBadge value={delta} />
                {delta !== null && <span className="text-[10px] text-[#3E3E3E]">MoM</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#1a1a1a] px-6 sm:px-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`py-4 mr-7 text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all duration-150 -mb-px ${
              activeTab === key
                ? 'border-[#E8192C] text-white'
                : 'border-transparent text-[#3E3E3E] hover:text-[#B3B3B3]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="px-6 sm:px-8 py-8 overflow-y-auto" style={{ maxHeight: 520 }}>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-10">

            {/* Bar chart */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-6">
                Last 6 months — {METRICS.find(m => m.key === activeMetric)?.label}
              </p>
              <BarGraph data={monthlyData} activeMetric={activeMetric} />
            </div>

            {/* Summary stats — same divider style as sidebar */}
            <div className="border-t border-[#1a1a1a]">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#1a1a1a]">
                {[
                  { label: 'All-time qty',   value: totalAllTime.toLocaleString(),  icon: <Package   className="w-3.5 h-3.5" /> },
                  { label: 'Avg qty / trip', value: avgQtyPerTrip.toLocaleString(), icon: <BarChart2 className="w-3.5 h-3.5" /> },
                  { label: 'Truckers',       value: String(uniqueTruckers),          icon: <Truck     className="w-3.5 h-3.5" /> },
                  { label: 'Total docs',     value: totalDocs.toLocaleString(),      icon: <FileText  className="w-3.5 h-3.5" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="px-5 py-6 first:pl-0 last:pr-0">
                    <div className="flex items-center gap-1.5 text-[#3E3E3E] mb-2">
                      {icon}
                      <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
                    </div>
                    <p className="text-2xl font-black text-white tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly breakdown table */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-5">Monthly breakdown</p>
              <div className="border-t border-[#1a1a1a]">
                {/* Table header */}
                <div className="grid grid-cols-5 border-b border-[#1a1a1a] pb-3 pt-4">
                  {['Month', 'Qty', 'Trips', 'Docs', 'Avg/trip'].map(h => (
                    <span key={h} className="text-[10px] uppercase tracking-widest font-bold text-[#3E3E3E]">{h}</span>
                  ))}
                </div>

                <div className="divide-y divide-[#1a1a1a]">
                  {[...monthlyData].reverse().map((d, i) => {
                    const avg    = d.totalTrips > 0 ? Math.round(d.totalQty / d.totalTrips) : 0
                    const isCurr = i === 0
                    const prevRow = i < monthlyData.length - 1 ? [...monthlyData].reverse()[i + 1] : null
                    const qDelta = prevRow ? calcDelta(d.totalQty, prevRow.totalQty) : null

                    return (
                      <div
                        key={d.label}
                        className={`grid grid-cols-5 py-4 transition-colors ${isCurr ? 'bg-[#E8192C]/4' : 'hover:bg-[#0a0a0a]'}`}
                      >
                        <span className={`text-[13px] font-black ${isCurr ? 'text-[#E8192C]' : 'text-[#B3B3B3]'}`}>
                          {d.label}
                          {isCurr && <span className="ml-2 text-[9px] text-[#E8192C]/50 font-bold uppercase tracking-widest">now</span>}
                        </span>
                        <span className="text-[13px] font-black text-white tabular-nums">
                          {d.totalQty.toLocaleString()}
                          {qDelta !== null && (
                            <span className={`ml-2 text-[10px] font-bold ${qDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {qDelta >= 0 ? '↑' : '↓'}{Math.abs(qDelta)}%
                            </span>
                          )}
                        </span>
                        <span className="text-[13px] text-[#6A6A6A] tabular-nums">{d.totalTrips}</span>
                        <span className="text-[13px] text-[#6A6A6A] tabular-nums">{d.totalDocs}</span>
                        <span className="text-[13px] text-[#3E3E3E] tabular-nums">{avg || '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'destinations' && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-2">Top destinations</p>
            <TopDestinations manifests={manifests} />
          </div>
        )}

        {activeTab === 'truckers' && <TopTruckers manifests={manifests} />}

        {activeTab === 'activity' && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] mb-2">Recent manifests</p>
            <RecentActivity manifests={manifests} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quick Access Card ─────────────────────────────────────────────────────────

export function OutboundQuickCard({ manifests, onClick }: { manifests: TripManifest[]; onClick: () => void }) {
  const monthlyData = useMemo(() => buildMonthlyData(manifests), [manifests])
  const values      = monthlyData.map(d => d.totalQty)
  const max         = Math.max(...values, 1)
  const curr        = values[values.length - 1]
  const prev        = values[values.length - 2]
  const delta       = prev === 0 ? null : Math.round(((curr - prev) / prev) * 100)
  const positive    = delta !== null && delta >= 0

  return (
    <button
      onClick={onClick}
      className="group border border-[#1a1a1a] hover:border-[#282828] transition-all text-left w-full p-4 sm:p-5"
    >
      {/* Sparkline */}
      <div className="relative mb-4">
        {delta !== null && (
          <div className={`absolute top-0 right-0 flex items-center gap-0.5 text-[10px] font-black ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}
        <div className="flex items-end gap-1 h-12">
          {monthlyData.map((d, i) => {
            const isCurrent = i === monthlyData.length - 1
            const isPrev    = i === monthlyData.length - 2
            const h = max > 0 ? Math.max((d.totalQty / max) * 100, d.totalQty > 0 ? 8 : 0) : 0
            return (
              <div
                key={d.label}
                className="flex-1 rounded-sm transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: isCurrent
                    ? 'linear-gradient(180deg, #E8192C 0%, #F5A623 100%)'
                    : isPrev
                    ? 'rgba(245,166,35,0.4)'
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: isCurrent ? '0 0 14px rgba(232,25,44,0.7)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#3E3E3E] group-hover:text-[#F5A623] transition-colors mb-1">Outbound</p>
          <p className="text-xs text-[#3E3E3E]">Analytics</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#282828] group-hover:text-[#F5A623] transition-colors" />
      </div>
    </button>
  )
}