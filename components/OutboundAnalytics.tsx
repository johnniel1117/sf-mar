'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, Package, Truck, FileText,
  ArrowUpRight, ArrowDownRight, Activity, ChevronRight,
  BarChart2,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
    return {
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      totalQty, totalTrips, totalDocs,
    }
  })
}

function calcDelta(curr: number, prev: number): number | null {
  return prev === 0 ? null : Math.round(((curr - prev) / prev) * 100)
}

// ── Delta badge ───────────────────────────────────────────────────────────────

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-[#6A6A6A] font-bold">—</span>
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

function BarGraph({
  data,
  activeMetric,
}: {
  data: ReturnType<typeof buildMonthlyData>
  activeMetric: Metric
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const values = data.map(d => d[activeMetric])
  const max    = Math.max(...values, 1)
  const metricUnit: Record<Metric, string> = { totalQty: 'units', totalTrips: 'trips', totalDocs: 'docs' }

  const allZero = values.every(v => v === 0)

  return (
    <div className="relative w-full">
      {/* Ghost grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: 28 }}>
        {[100, 66, 33, 0].map(p => (
          <div key={p} className="w-full border-t border-[#1E1E1E]" />
        ))}
      </div>

      {allZero ? (
        <div className="h-[200px] flex items-center justify-center text-[#484848] text-sm font-medium">
          No data for the selected metric in the last 6 months
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 w-full" style={{ minHeight: 180, height: 'clamp(160px, 28vh, 240px)' }}>
          {data.map((d, i) => {
            const val       = d[activeMetric]
            const hPct      = max > 0 ? (val / max) * 100 : 0
            const displayH  = Math.max(hPct, val > 0 ? 6 : 0) // min visible height for non-zero
            const isHov     = hovered === i
            const isCurr    = i === data.length - 1
            const prevVal   = i > 0 ? data[i - 1][activeMetric] : null
            const delta     = prevVal !== null ? calcDelta(val, prevVal) : null

            return (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end gap-2 cursor-default relative group/bar"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHov && val > 0 && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl px-3 py-2.5 shadow-2xl text-center whitespace-nowrap">
                      <p className="text-white font-black text-sm tabular-nums">
                        {val.toLocaleString()}
                        <span className="text-[#6A6A6A] font-normal text-[10px] ml-1">{metricUnit[activeMetric]}</span>
                      </p>
                      {delta !== null && (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <DeltaBadge value={delta} />
                          <span className="text-[#6A6A6A] text-[10px]">vs {data[i - 1].label}</span>
                        </div>
                      )}
                      <p className="text-[#6A6A6A] text-[10px] mt-0.5">{d.label} {d.year}</p>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300 relative overflow-hidden"
                  style={{
                    height: `${displayH}%`,
                    minHeight: val > 0 ? '16px' : '0px',
                    background: isCurr
                      ? 'linear-gradient(180deg, #E8192C 0%, #7f0e18 100%)'
                      : isHov
                      ? 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)'
                      : 'linear-gradient(180deg, #2e2e2e 0%, #1a1a1a 100%)',
                    boxShadow: isCurr
                      ? '0 0 20px rgba(232,25,44,0.4), 0 4px 12px rgba(232,25,44,0.2)'
                      : isHov
                      ? '0 0 12px rgba(255,255,255,0.08)'
                      : 'none',
                  }}
                >
                  {val === 0 && displayH === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-[10px] text-[#6A6A6A] font-medium">0</span>
                    </div>
                  )}
                  {val > 0 && isCurr && (
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 60%)' }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] font-bold transition-colors leading-none pt-1 ${
                  isCurr ? 'text-[#E8192C]' : isHov ? 'text-white' : 'text-[#484848]'
                } group-hover/bar:text-white`}>
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
    <div className="space-y-3">
      {destinations.map((dest, i) => (
        <div key={dest.name} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-mono font-bold text-[#3E3E3E] w-5 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[13px] font-semibold text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                {dest.name}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              <span className="text-[11px] text-[#484848] tabular-nums hidden sm:block">{dest.docs} doc{dest.docs !== 1 ? 's' : ''}</span>
              <span className="text-[13px] font-black text-white tabular-nums">{dest.qty.toLocaleString()}</span>
            </div>
          </div>
          <div className="h-1 bg-[#1E1E1E] rounded-full overflow-hidden ml-7">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(dest.qty / maxQty) * 100}%`,
                background: i === 0
                  ? 'linear-gradient(90deg, #E8192C, #ff4d5e)'
                  : `rgba(255,255,255,${Math.max(0.07, 0.18 - i * 0.02)})`,
                boxShadow: i === 0 ? '0 0 8px rgba(232,25,44,0.3)' : 'none',
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
    <div className="space-y-7">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848] mb-4">Trucking companies</p>
        <div className="divide-y divide-[#1E1E1E]">
          {truckers.map((t, i) => (
            <div key={t.name} className="flex items-center justify-between py-3 group hover:bg-[#161616] -mx-1 px-1 rounded-lg transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(135deg, #E8192C, #7f0e18)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <span className={i === 0 ? 'text-white' : 'text-[#484848]'}>
                    {t.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                  {t.name}
                </span>
              </div>
              <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                <span className="text-[11px] text-[#484848] tabular-nums hidden sm:block">{t.qty.toLocaleString()} units</span>
                <span className="text-[13px] font-black text-white tabular-nums">{t.trips} trip{t.trips !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {drivers.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848] mb-4">Top drivers</p>
          <div className="divide-y divide-[#1E1E1E]">
            {drivers.map(([name, trips]) => (
              <div key={name} className="flex items-center justify-between py-3">
                <span className="text-[13px] font-semibold text-[#B3B3B3]">{name}</span>
                <span className="text-[12px] font-black text-[#6A6A6A] tabular-nums">{trips} trip{trips !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {truckTypes.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848] mb-3">Truck types</p>
          <div className="flex flex-wrap gap-2">
            {truckTypes.map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E1E1E] border border-[#282828]">
                <span className="text-[11px] font-semibold text-[#B3B3B3]">{type}</span>
                <span className="text-[10px] font-black text-[#484848] tabular-nums">×{count}</span>
              </div>
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
    <div className="divide-y divide-[#1E1E1E]">
      {recent.map(m => {
        const qty  = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
        const date = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'
        return (
          <div key={m.id} className="flex items-center justify-between py-3.5 group hover:bg-[#161616] -mx-1 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#282828] flex-shrink-0 group-hover:bg-[#E8192C] transition-colors" />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#B3B3B3] truncate group-hover:text-white transition-colors">
                  {m.manifest_number || m.id?.slice(0, 8) || '—'}
                </p>
                <p className="text-[11px] text-[#484848] truncate mt-0.5">
                  {m.driver_name || 'No driver'}{m.trucker ? ` · ${m.trucker}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-[13px] font-black text-white tabular-nums">{qty.toLocaleString()}</p>
              <p className="text-[11px] text-[#484848]">{date}</p>
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#282828] flex items-center justify-center mb-3">
        <BarChart2 className="w-5 h-5 text-[#3E3E3E]" />
      </div>
      <p className="text-sm font-bold text-[#484848]">{label}</p>
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
  const previous       = monthlyData[monthlyData.length - 2]
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
    <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#282828]"
        style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.08) 0%, #121212 100%)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}
            >
              <Activity className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Outbound Analytics</h3>
              <p className="text-[11px] text-[#6A6A6A] mt-0.5">{manifests.length} manifests · {totalDocs} documents all-time</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848]">All-time units</p>
            <p className="text-2xl font-black text-white tabular-nums">{totalAllTime.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {METRICS.map(({ key, label, value, delta }) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`text-left px-3 sm:px-4 py-3 rounded-xl border transition-all duration-150 ${
                activeMetric === key
                  ? 'bg-[#E8192C]/10 border-[#E8192C]/35 shadow-sm'
                  : 'bg-[#1A1A1A] border-[#282828] hover:border-[#3E3E3E] hover:bg-[#1E1E1E]'
              }`}
            >
              <p className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-1.5 ${
                activeMetric === key ? 'text-[#E8192C]' : 'text-[#484848]'
              }`}>{label}</p>
              <p className="text-white font-black text-lg sm:text-xl leading-none tabular-nums">{value}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <DeltaBadge value={delta} />
                {delta !== null && <span className="text-[9px] text-[#484848]">MoM</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#282828] px-6 sm:px-8 bg-[#121212]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`py-3.5 mr-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all duration-150 -mb-px ${
              activeTab === key
                ? 'border-[#E8192C] text-white'
                : 'border-transparent text-[#484848] hover:text-[#B3B3B3]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 py-6 overflow-y-auto bg-[#121212]" style={{ maxHeight: 520 }}>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848]">
                  Last 6 months — {METRICS.find(m => m.key === activeMetric)?.label}
                </p>
              </div>
              <BarGraph data={monthlyData} activeMetric={activeMetric} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#282828] rounded-xl overflow-hidden divide-x divide-y sm:divide-y-0 divide-[#282828]">
              {[
                { label: 'All-time qty',   value: totalAllTime.toLocaleString(),  icon: <Package   className="w-3.5 h-3.5" /> },
                { label: 'Avg qty / trip', value: avgQtyPerTrip.toLocaleString(), icon: <BarChart2 className="w-3.5 h-3.5" /> },
                { label: 'Truckers',       value: String(uniqueTruckers),          icon: <Truck     className="w-3.5 h-3.5" /> },
                { label: 'Total docs',     value: totalDocs.toLocaleString(),      icon: <FileText  className="w-3.5 h-3.5" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex flex-col gap-2 px-4 py-4 bg-[#161616]">
                  <div className="flex items-center gap-1.5 text-[#E8192C]">
                    {icon}
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#484848]">{label}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#484848] mb-3">Monthly breakdown</p>
              <div className="border border-[#282828] rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-[#282828] bg-[#161616]">
                      {['Month', 'Qty', 'Trips', 'Docs', 'Avg/trip'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[#484848]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1E1E]">
                    {[...monthlyData].reverse().map((d, i) => {
                      const avg     = d.totalTrips > 0 ? Math.round(d.totalQty / d.totalTrips) : 0
                      const isCurr  = i === 0
                      const prevRow = i < monthlyData.length - 1 ? [...monthlyData].reverse()[i + 1] : null
                      const qDelta  = prevRow ? calcDelta(d.totalQty, prevRow.totalQty) : null
                      return (
                        <tr
                          key={d.label}
                          className={`transition-colors ${isCurr ? 'bg-[#E8192C]/5' : 'hover:bg-[#161616]'}`}
                        >
                          <td className={`px-4 py-3 font-bold ${isCurr ? 'text-[#E8192C]' : 'text-[#6A6A6A]'}`}>
                            {d.label} <span className="font-normal text-[10px] text-[#3E3E3E]">{d.year}</span>
                            {isCurr && <span className="ml-1.5 text-[9px] text-[#E8192C]/50 font-bold">current</span>}
                          </td>
                          <td className="px-4 py-3 font-black text-white tabular-nums">
                            {d.totalQty.toLocaleString()}
                            {qDelta !== null && (
                              <span className={`ml-2 text-[10px] font-bold ${qDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {qDelta >= 0 ? '+' : ''}{qDelta}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#6A6A6A] tabular-nums">{d.totalTrips}</td>
                          <td className="px-4 py-3 text-[#6A6A6A] tabular-nums">{d.totalDocs}</td>
                          <td className="px-4 py-3 text-[#484848] tabular-nums">{avg || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'destinations' && <TopDestinations manifests={manifests} />}
        {activeTab === 'truckers'     && <TopTruckers     manifests={manifests} />}
        {activeTab === 'activity'     && <RecentActivity  manifests={manifests} />}
      </div>
    </div>
  )
}

// ── Quick Access Card (unchanged for brevity) ─────────────────────────────────

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
      className="group bg-[#1E1E1E] border border-[#282828] rounded-xl p-3 sm:p-4 hover:bg-[#282828] hover:border-[#3E3E3E] transition-all text-left w-full"
    >
      <div
        className="relative aspect-square rounded-xl mb-3 sm:mb-4 flex items-end overflow-hidden px-2 pb-2"
        style={{ background: 'linear-gradient(135deg, #181818, #0d0d0d)' }}
      >
        {delta !== null && (
          <div className={`absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full z-10 ${
            positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}

        <div className="relative z-10 flex items-end gap-1 w-full h-16">
          {monthlyData.map((d, i) => {
            const isCurrent = i === monthlyData.length - 1
            const h = max > 0 ? Math.max((d.totalQty / max) * 100, d.totalQty > 0 ? 6 : 0) : 0
            return (
              <div
                key={d.label}
                className="flex-1 rounded-t-sm transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: isCurrent
                    ? 'linear-gradient(180deg, #E8192C 0%, #7f0e18 100%)'
                    : 'rgba(255,255,255,0.09)',
                  boxShadow: isCurrent ? '0 0 10px rgba(232,25,44,0.5)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-1">
        <div>
          <h3 className="text-white text-xs sm:text-sm font-bold mb-0.5">Outbound</h3>
          <p className="text-[#6A6A6A] text-[10px] sm:text-xs">Analytics</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#6A6A6A] group-hover:text-[#E8192C] transition-colors mt-0.5 flex-shrink-0" />
      </div>
    </button>
  )
}