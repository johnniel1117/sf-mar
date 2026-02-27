'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, Package, Truck, FileText,
  ArrowUpRight, ArrowDownRight, Activity, ChevronRight,
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
    return {
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      totalQty,
      totalTrips,
      totalDocs,
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

// ── Rank styling helper ──────────────────────────────────────────────────────

const getRankStyle = (rank: number) => {
  if (rank === 0) return {
    bg: 'linear-gradient(135deg, #E8192C, #b71c1c)',
    text: 'text-white',
    shadow: '0 0 12px rgba(232,25,44,0.5)'
  }
  if (rank === 1) return {
    bg: 'linear-gradient(135deg, #ff5252, #d32f2f)',
    text: 'text-white',
    shadow: '0 0 8px rgba(244,67,54,0.35)'
  }
  if (rank === 2) return {
    bg: 'linear-gradient(135deg, #ff8a80, #ef5350)',
    text: 'text-white',
    shadow: '0 0 6px rgba(255,138,128,0.3)'
  }
  return {
    bg: 'rgba(255,255,255,0.07)',
    text: 'text-[#B3B3B3]',
    shadow: 'none'
  }
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
        {[100, 75, 50, 25, 0].map(p => (
          <div key={p} className="w-full border-t border-[#222]/70" />
        ))}
      </div>

      {allZero ? (
        <div className="h-[220px] flex items-center justify-center text-[#555] text-sm font-medium">
          No data for the selected metric in the last 6 months
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 w-full" style={{ minHeight: 200, height: 'clamp(180px, 32vh, 260px)' }}>
          {data.map((d, i) => {
            const val       = d[activeMetric]
            const hPct      = max > 0 ? (val / max) * 100 : 0
            const displayH  = Math.max(hPct, val > 0 ? 8 : 0)
            const isHovered = hovered === i
            const isCurr    = i === data.length - 1
            const prevVal   = i > 0 ? data[i - 1][activeMetric] : null
            const delta     = prevVal !== null ? calcDelta(val, prevVal) : null

            let barBg = 'linear-gradient(180deg, #424242, #212121)'
            let barShadow = 'none'

            if (isCurr) {
              barBg = 'linear-gradient(180deg, #E8192C, #b71c1c)'
              barShadow = '0 6px 20px rgba(232,25,44,0.55)'
            } else if (val >= max * 0.85) {
              barBg = 'linear-gradient(180deg, #ff5252, #d32f2f)'
              barShadow = '0 4px 16px rgba(244,67,54,0.4)'
            } else if (val >= max * 0.55) {
              barBg = 'linear-gradient(180deg, #ffab91, #f4511e)'
              barShadow = '0 3px 12px rgba(255,171,145,0.3)'
            }

            return (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end gap-2 cursor-default relative group/bar"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Tooltip */}
                {isHovered && val > 0 && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{ bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg px-4 py-3 shadow-2xl text-center min-w-[150px]">
                      <p className="text-white font-black text-base tabular-nums">
                        {val.toLocaleString()}
                        <span className="text-[#aaa] text-xs ml-2 font-normal">{metricUnit[activeMetric]}</span>
                      </p>
                      {delta !== null && (
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          <DeltaBadge value={delta} />
                          <span className="text-[#888] text-xs">vs prev</span>
                        </div>
                      )}
                      <p className="text-[#777] text-xs mt-1">{d.label} {d.year}</p>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-300 relative overflow-hidden"
                  style={{
                    height: `${displayH}%`,
                    minHeight: val > 0 ? '20px' : '0px',
                    background: isHovered ? 'linear-gradient(180deg, #888, #555)' : barBg,
                    boxShadow: isHovered ? '0 0 18px rgba(255,255,255,0.15)' : barShadow,
                  }}
                >
                  {val === 0 && displayH === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-xs text-[#555] font-medium">0</span>
                    </div>
                  )}
                  {val > 0 && isCurr && (
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)' }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-bold transition-colors leading-none pt-2 ${
                  isCurr ? 'text-[#ff5252]' :
                  isHovered ? 'text-white' :
                  delta && delta > 20 ? 'text-emerald-400' :
                  delta && delta < -20 ? 'text-red-400' :
                  'text-[#777]'
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
    <div className="space-y-4">
      {destinations.map((dest, i) => {
        const rank = getRankStyle(i)
        return (
          <div key={dest.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-mono font-bold w-6 flex-shrink-0 ${i < 3 ? 'text-white' : 'text-[#666]'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={`text-sm font-semibold truncate transition-colors ${rank.text} group-hover:text-white`}>
                  {dest.name}
                </span>
              </div>
              <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                <span className="text-xs text-[#777] tabular-nums hidden sm:block">{dest.docs} doc{dest.docs !== 1 ? 's' : ''}</span>
                <span className="text-lg font-black text-white tabular-nums">{dest.qty.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-2 bg-[#222] rounded-full overflow-hidden ml-9">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(dest.qty / maxQty) * 100}%`,
                  background: rank.bg,
                  boxShadow: rank.shadow,
                }}
              />
            </div>
          </div>
        )
      })}
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
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wider font-bold text-[#555] mb-4">Trucking companies</p>
        <div className="space-y-2">
          {truckers.map((t, i) => {
            const rank = getRankStyle(i)
            return (
              <div
                key={t.name}
                className="flex items-center justify-between py-3.5 px-4 rounded-xl transition-all hover:bg-[#1a1a1a]"
                style={{ background: i < 3 ? 'rgba(232,25,44,0.06)' : 'transparent' }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black shadow-md flex-shrink-0"
                    style={{ background: rank.bg, boxShadow: rank.shadow }}
                  >
                    <span className={i < 3 ? 'text-white' : 'text-[#888]'}>{t.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className={`font-semibold truncate transition-colors ${rank.text} group-hover:text-white`}>
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-base font-black text-white tabular-nums">{t.trips} trip{t.trips !== 1 ? 's' : ''}</span>
                  <span className="text-sm text-[#888] tabular-nums hidden sm:block">{t.qty.toLocaleString()} units</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {drivers.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-[#555] mb-4">Top drivers</p>
          <div className="divide-y divide-[#222]">
            {drivers.map(([name, trips], i) => (
              <div key={name} className="flex items-center justify-between py-3">
                <span className={`text-sm font-semibold ${i === 0 ? 'text-[#ff8a80]' : 'text-[#ccc]'}`}>{name}</span>
                <span className="text-sm font-black text-[#888] tabular-nums">{trips} trip{trips !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {truckTypes.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-[#555] mb-3">Truck types</p>
          <div className="flex flex-wrap gap-2">
            {truckTypes.map(([type, count], i) => (
              <div
                key={type}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                  i === 0 ? 'bg-[#E8192C]/10 border-[#E8192C]/30' : 'bg-[#1E1E1E] border-[#282828]'
                }`}
              >
                <span className="text-sm font-semibold text-[#ddd]">{type}</span>
                <span className="text-xs font-black text-[#888] tabular-nums">×{count}</span>
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
    <div className="divide-y divide-[#222]">
      {recent.map(m => {
        const qty  = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
        const date = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'

        const qtyColor = qty > 800 ? 'text-[#ff5252]' :
                         qty > 300 ? 'text-[#ffab91]' :
                         'text-white'

        return (
          <div key={m.id} className="flex items-center justify-between py-4 group hover:bg-[#161616] rounded-lg transition-colors px-2 -mx-2">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#333] group-hover:bg-[#E8192C] transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#ddd] truncate group-hover:text-white transition-colors">
                  {m.manifest_number || m.id?.slice(0, 8) || '—'}
                </p>
                <p className="text-xs text-[#777] mt-0.5 truncate">
                  {m.driver_name || 'No driver'}{m.trucker ? ` · ${m.trucker}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-base font-black tabular-nums ${qtyColor}`}>{qty.toLocaleString()}</p>
              <p className="text-xs text-[#666]">{date}</p>
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
    <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#282828]"
        style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.10) 0%, #121212 100%)' }}
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
              className={`text-left px-3 sm:px-4 py-3.5 rounded-xl border transition-all duration-150 ${
                activeMetric === key
                  ? 'bg-[#E8192C]/15 border-[#E8192C]/50 shadow-md shadow-[#E8192C]/20'
                  : 'bg-[#1A1A1A] border-[#282828] hover:border-[#555] hover:bg-[#222]'
              }`}
            >
              <p className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 ${
                activeMetric === key ? 'text-[#ff5252]' : 'text-[#484848]'
              }`}>{label}</p>
              <p className="text-white font-black text-lg sm:text-xl leading-none tabular-nums">{value}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <DeltaBadge value={delta} />
                {delta !== null && <span className="text-[10px] text-[#666]">MoM</span>}
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
            className={`py-3.5 mr-6 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-150 -mb-px ${
              activeTab === key
                ? 'border-[#E8192C] text-white'
                : 'border-transparent text-[#666] hover:text-[#ccc]'
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
                <p className="text-xs uppercase tracking-wider font-bold text-[#666]">
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
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#666]">{label}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#666] mb-3">Monthly breakdown</p>
              <div className="border border-[#282828] rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-[#282828] bg-[#161616]">
                      {['Month', 'Qty', 'Trips', 'Docs', 'Avg/trip'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-[#666]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {[...monthlyData].reverse().map((d, i) => {
                      const avg     = d.totalTrips > 0 ? Math.round(d.totalQty / d.totalTrips) : 0
                      const isCurr  = i === 0
                      const prevRow = i < monthlyData.length - 1 ? [...monthlyData].reverse()[i + 1] : null
                      const qDelta  = prevRow ? calcDelta(d.totalQty, prevRow.totalQty) : null

                      return (
                        <tr
                          key={d.label}
                          className={`transition-colors ${
                            isCurr
                              ? 'bg-[#E8192C]/10'
                              : qDelta && qDelta > 25
                              ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                              : qDelta && qDelta < -25
                              ? 'bg-red-950/20 hover:bg-red-950/30'
                              : 'hover:bg-[#1e1e1e]'
                          }`}
                        >
                          <td className={`px-4 py-3 font-bold ${isCurr ? 'text-[#ff5252]' : 'text-[#aaa]'}`}>
                            {d.label} <span className="font-normal text-[10px] text-[#555]">{d.year}</span>
                            {isCurr && <span className="ml-1.5 text-[9px] text-[#ff5252]/70 font-bold">current</span>}
                          </td>
                          <td className="px-4 py-3 font-black text-white tabular-nums">
                            {d.totalQty.toLocaleString()}
                            {qDelta !== null && (
                              <span className={`ml-3 text-xs font-bold ${qDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {qDelta >= 0 ? '↑' : '↓'} {Math.abs(qDelta)}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#aaa] tabular-nums">{d.totalTrips}</td>
                          <td className="px-4 py-3 text-[#aaa] tabular-nums">{d.totalDocs}</td>
                          <td className="px-4 py-3 text-[#777] tabular-nums">{avg || '—'}</td>
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

// ── Quick Access Card (minor color tweak) ─────────────────────────────────────

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
      className="group bg-[#1E1E1E] border border-[#282828] rounded-xl p-3 sm:p-4 hover:bg-[#282828] hover:border-[#555] transition-all text-left w-full"
    >
      <div
        className="relative aspect-square rounded-xl mb-3 sm:mb-4 flex items-end overflow-hidden px-2 pb-2"
        style={{ background: 'linear-gradient(135deg, #181818, #0d0d0d)' }}
      >
        {delta !== null && (
          <div className={`absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full z-10 ${
            positive ? 'bg-emerald-600/30 text-emerald-300' : 'bg-red-600/30 text-red-300'
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
                    ? 'linear-gradient(180deg, #E8192C 0%, #b71c1c 100%)'
                    : 'rgba(255,255,255,0.10)',
                  boxShadow: isCurrent ? '0 0 12px rgba(232,25,44,0.5)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-1">
        <div>
          <h3 className="text-white text-xs sm:text-sm font-bold mb-0.5">Outbound</h3>
          <p className="text-[#888] text-[10px] sm:text-xs">Analytics</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#888] group-hover:text-[#E8192C] transition-colors mt-0.5 flex-shrink-0" />
      </div>
    </button>
  )
}