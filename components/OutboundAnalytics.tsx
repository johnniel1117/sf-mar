'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import {
  TrendingUp, Package, Truck, FileText,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2, MapPin, ChevronRight,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000, trigger = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!trigger || target === 0) { setValue(0); return }
    let start: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
      else setValue(target)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, trigger])
  return value
}

function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

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

function DeltaBadge({ value, size = 'sm' }: { value: number | null; size?: 'xs' | 'sm' }) {
  if (value === null) return <span className="text-[10px] text-[#777] font-mono">—</span>
  const pos = value >= 0
  const cls = size === 'xs' ? 'text-[9px]' : 'text-[10px]'
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${cls} ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {Math.abs(value)}%
    </span>
  )
}

// ── Animated number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, format = 'number' }: { value: number; format?: 'number' | 'compact' }) {
  const ref = useRef<HTMLSpanElement>(null!)
  const inView = useInView(ref)
  const count = useCountUp(value, 900, inView)
  const display = format === 'compact' && count >= 1000
    ? `${(count / 1000).toFixed(1)}k`
    : count.toLocaleString()
  return <span ref={ref}>{display}</span>
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

type Metric = 'totalQty' | 'totalTrips' | 'totalDocs'

function BarGraph({ data, activeMetric }: { data: ReturnType<typeof buildMonthlyData>; activeMetric: Metric }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null!)
  const inView = useInView(ref)

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setMounted(true), 100)
      return () => clearTimeout(t)
    }
  }, [inView])

  const values = data.map(d => d[activeMetric])
  const max    = Math.max(...values, 1)
  const metricUnit: Record<Metric, string> = { totalQty: 'units', totalTrips: 'trips', totalDocs: 'docs' }
  const allZero = values.every(v => v === 0)

  const CHART_H = 280  // fixed pixel height of the bar area
  const LABEL_H = 28   // height reserved for labels below

  if (allZero) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_H + LABEL_H }}>
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#666]">No data for the last 6 months</p>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: CHART_H + LABEL_H }}>
      
      {/* Y-axis gridlines — inside the bar area only */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: 0, height: CHART_H }}>
        {[100, 75, 50, 25].map(p => (
          <div key={p} className="absolute w-full" style={{ bottom: `${p}%` }}>
            <div className="w-full border-t border-[#111]" />
            <span className="absolute right-0 top-0 -translate-y-full pb-1 text-[9px] font-mono text-[#666] leading-none">
              {Math.round((p / 100) * max).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Bars row */}
      <div className="absolute left-0 right-0 flex gap-2 sm:gap-3" style={{ top: 0, height: CHART_H }}>
        {data.map((d, i) => {
          const val      = d[activeMetric]
          const hPct     = max > 0 ? (val / max) * 100 : 0
          const barH     = mounted ? Math.max(hPct, val > 0 ? 2 : 0) : 0
          const isHovered = hovered === i
          const isCurr   = i === data.length - 1
          const isPrev   = i === data.length - 2
          const prevVal  = i > 0 ? data[i - 1][activeMetric] : null
          const delta    = prevVal !== null ? calcDelta(val, prevVal) : null

          let barBg = 'rgba(255,255,255,0.05)'
          if (isCurr) barBg = 'linear-gradient(180deg, #E8192C 0%, #c8140e 60%, #F5A623 100%)'
          else if (isPrev) barBg = 'rgba(245,166,35,0.35)'
          if (isHovered && !isCurr && !isPrev) barBg = 'rgba(255,255,255,0.13)'

          return (
            <div
              key={d.label}
              className="relative flex-1 h-full cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && val > 0 && (
                <div
                  className="absolute z-40 pointer-events-none"
                  style={{ bottom: `calc(${barH}% + 12px)`, left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div
                    className="relative px-4 py-3 text-center"
                    style={{
                      background: 'rgba(10,10,10,0.97)',
                      border: '1px solid #222',
                      minWidth: 130,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
                    }}
                  >
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2.5 h-2.5 rotate-45"
                      style={{ background: '#222', borderRight: '1px solid #222', borderBottom: '1px solid #222' }}
                    />
                    <p className="text-white font-black text-xl tabular-nums leading-none font-mono">
                      {val.toLocaleString()}
                    </p>
                    <p className="text-[#888] text-[9px] uppercase tracking-widest font-bold mt-1">{metricUnit[activeMetric]}</p>
                    {delta !== null && (
                      <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-[#1a1a1a]">
                        <DeltaBadge value={delta} />
                        <span className="text-[#777] text-[9px] font-mono">vs {data[i - 1]?.label}</span>
                      </div>
                    )}
                    <p className="text-[#666] text-[9px] font-mono mt-1">{d.label} {d.year}</p>
                  </div>
                </div>
              )}

              {/* Bar — anchored to bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{
                  height: `${barH}%`,
                  minHeight: val > 0 && mounted ? '4px' : '0px',
                  background: barBg,
                  transition: 'height 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${i * 60}ms`,
                  boxShadow: isCurr
                    ? '0 0 20px rgba(232,25,44,0.5), 0 0 60px rgba(232,25,44,0.15)'
                    : isPrev
                    ? '0 0 12px rgba(245,166,35,0.2)'
                    : 'none',
                }}
              >
                {isCurr && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: 'shimmer 2.5s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Labels row */}
      <div className="absolute left-0 right-0 flex gap-2 sm:gap-3" style={{ top: CHART_H, height: LABEL_H }}>
        {data.map((d, i) => {
          const isCurr = i === data.length - 1
          const isPrev = i === data.length - 2
          const isHov  = hovered === i
          return (
            <div key={d.label} className="flex-1 flex items-center justify-center pt-2">
              <span className={`text-[9px] font-mono font-bold leading-none ${
                isCurr ? 'text-[#E8192C]' : isPrev ? 'text-[#6a5010]' : isHov ? 'text-[#888]' : 'text-[#666]'
              }`}>
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

// ── Ring chart (donut) ────────────────────────────────────────────────────────

function RingChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null!)
  const inView = useInView(ref)

  useEffect(() => { if (inView) { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) } }, [inView])

  if (total === 0) return null

  const SIZE = 120
  const STROKE = 14
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  let offset = 0

  return (
    <div ref={ref} className="flex items-center gap-8">
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#111" strokeWidth={STROKE} />
          {data.map((d, i) => {
            const pct = d.value / total
            const len = pct * CIRC
            const gap = 3
            const thisOffset = offset
            offset += len + gap
            const isHov = hovered === i
            return (
              <circle
                key={d.label}
                cx={SIZE/2}
                cy={SIZE/2}
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={isHov ? STROKE + 2 : STROKE}
                strokeDasharray={mounted ? `${len - gap} ${CIRC - len + gap}` : `0 ${CIRC}`}
                strokeDashoffset={-thisOffset}
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)', transitionDelay: `${i * 100}ms`, opacity: hovered !== null && !isHov ? 0.3 : 1 }}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hovered !== null ? (
            <>
              <span className="text-white font-black text-base font-mono tabular-nums leading-none">{((data[hovered].value / total) * 100).toFixed(0)}%</span>
              <span className="text-[#888] text-[8px] font-bold uppercase tracking-widest mt-0.5">{data[hovered].label.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <span className="text-white font-black text-base font-mono tabular-nums leading-none">{data.length}</span>
              <span className="text-[#888] text-[8px] font-bold uppercase tracking-widest mt-0.5">types</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ opacity: hovered !== null && hovered !== i ? 0.35 : 1, transition: 'opacity 0.15s' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[11px] font-semibold text-[#888] truncate">{d.label}</span>
            </div>
            <span className="text-[11px] font-black text-white font-mono tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
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
    return [...map.entries()].map(([name, s]) => ({ name, ...s })).sort((a, b) => b.qty - a.qty).slice(0, 7)
  }, [manifests])

  const maxQty = Math.max(...destinations.map(d => d.qty), 1)
  if (!destinations.length) return <EmptyState label="No destination data yet" />

  return (
    <div className="space-y-1">
      {destinations.map((dest, i) => {
        const pct = (dest.qty / maxQty) * 100
        const isTop = i === 0
        return (
          <div key={dest.name} className="group relative py-4 px-0">
            {/* Rank + name row */}
            <div className="flex items-center justify-between mb-3 gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="text-[11px] font-mono font-bold w-5 flex-shrink-0 transition-colors group-hover:text-[#E8192C]"
                  style={{ color: isTop ? '#E8192C' : '#666' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0 text-[#666] group-hover:text-[#666] transition-colors" />
                  <span className="text-[14px] font-black text-[#C0C0C0] group-hover:text-white transition-colors truncate leading-tight">
                    {dest.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#666] hidden sm:block">
                  {dest.docs} doc{dest.docs !== 1 ? 's' : ''}
                </span>
                <span className="text-[22px] font-black text-white tabular-nums font-mono leading-none">
                  {dest.qty.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div className="ml-9 h-px bg-[#111] overflow-hidden">
              <div
                className="h-full origin-left"
                style={{
                  width: `${pct}%`,
                  background: isTop
                    ? 'linear-gradient(90deg, #E8192C, #F5A623)'
                    : i === 1
                    ? 'rgba(245,166,35,0.5)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${i * 80}ms`,
                  boxShadow: isTop ? '0 0 8px rgba(232,25,44,0.5)' : 'none',
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
    return [...map.entries()].map(([name, s]) => ({ name, ...s })).sort((a, b) => b.trips - a.trips).slice(0, 5)
  }, [manifests])

  const drivers = useMemo(() => {
    const map = new Map<string, number>()
    manifests.forEach(m => { const n = m.driver_name?.trim() || 'Unknown'; map.set(n, (map.get(n) || 0) + 1) })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [manifests])

  const truckTypes = useMemo(() => {
    const map = new Map<string, number>()
    manifests.forEach(m => { if (m.truck_type) map.set(m.truck_type, (map.get(m.truck_type) || 0) + 1) })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [manifests])

  const TRUCK_COLORS = ['#E8192C', '#F5A623', '#3b82f6', '#8b5cf6', '#10b981']

  if (!truckers.length) return <EmptyState label="No trucker data yet" />

  return (
    <div className="space-y-12">
      {/* Trucking companies */}
      <div>
        <SectionLabel>Trucking companies</SectionLabel>
        <div className="space-y-1 mt-6">
          {truckers.map((t, i) => (
            <div
              key={t.name}
              className="group flex items-center gap-5 py-4 transition-all duration-200 hover:pl-1"
            >
              <span className="text-[11px] font-mono font-bold w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors"
                style={{ color: i === 0 ? '#E8192C' : '#666' }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Avatar */}
              <div
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, #E8192C, #7f0e18)'
                    : `rgba(255,255,255,0.06)`,
                  border: i === 0 ? 'none' : '1px solid #1a1a1a',
                }}
              >
                {t.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-[#C0C0C0] group-hover:text-white transition-colors truncate">{t.name}</p>
                <p className="text-[11px] text-[#777] mt-0.5 font-mono">{t.qty.toLocaleString()} units</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[22px] font-black text-white tabular-nums font-mono leading-none">{t.trips}</p>
                <p className="text-[9px] uppercase tracking-widest font-bold text-[#666]">trips</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: drivers + truck types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-6 border-t border-[#111] pt-10">
        {drivers.length > 0 && (
          <div>
            <SectionLabel>Top drivers</SectionLabel>
            <div className="mt-6 space-y-0 divide-y divide-[#0d0d0d]">
              {drivers.map(([name, trips], i) => (
                <div key={name} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i === 0 ? '#E8192C' : '#222' }}
                    />
                    <span className={`text-[13px] font-semibold ${i === 0 ? 'text-white' : 'text-[#888]'}`}>{name}</span>
                  </div>
                  <span className="text-[13px] font-black font-mono tabular-nums text-[#666]">{trips}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {truckTypes.length > 0 && (
          <div>
            <SectionLabel>Fleet breakdown</SectionLabel>
            <div className="mt-6">
              <RingChart
                data={truckTypes.map(([type, count], i) => ({
                  label: type,
                  value: count,
                  color: TRUCK_COLORS[i] || '#666',
                }))}
              />
            </div>
          </div>
        )}
      </div>
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
    <div className="divide-y divide-[#0d0d0d]">
      {recent.map((m, idx) => {
        const qty  = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
        const date = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'

        return (
          <div
            key={m.id}
            className="group flex items-center justify-between py-5 transition-all duration-200 hover:pl-1"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-5 min-w-0">
              {/* Status dot */}
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                style={{ background: idx === 0 ? '#E8192C' : '#222' }}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-black text-[#C0C0C0] truncate group-hover:text-white transition-colors font-mono">
                  {m.manifest_number || m.id?.slice(0, 8) || '—'}
                </p>
                <p className="text-[11px] text-[#777] mt-0.5 truncate group-hover:text-[#666] transition-colors">
                  {m.driver_name || 'No driver'}{m.trucker ? ` · ${m.trucker}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-[22px] font-black text-white tabular-nums font-mono leading-none">{qty.toLocaleString()}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#666] mt-0.5">{date}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#777]">{children}</p>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="w-8 h-8 border border-[#1a1a1a] flex items-center justify-center">
        <Activity className="w-4 h-4 text-[#666]" />
      </div>
      <p className="text-[11px] font-bold text-[#777] uppercase tracking-widest">{label}</p>
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

  const METRICS: { key: Metric; label: string; value: number; delta: number | null }[] = [
    { key: 'totalQty',   label: 'Qty dispatched', value: current.totalQty,   delta: calcDelta(current.totalQty,   previous.totalQty)   },
    { key: 'totalTrips', label: 'Trips',           value: current.totalTrips, delta: calcDelta(current.totalTrips, previous.totalTrips) },
    { key: 'totalDocs',  label: 'Documents',       value: current.totalDocs,  delta: calcDelta(current.totalDocs,  previous.totalDocs)  },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview'     },
    { key: 'destinations', label: 'Destinations' },
    { key: 'truckers',     label: 'Truckers'     },
    { key: 'activity',     label: 'Activity'     },
  ]

  return (
    <div
      className="h-full overflow-hidden flex flex-col"
      style={{
        background: '#080808',
        border: '1px solid #1a1a1a',
        borderRadius: 16,
      }}
    >
      {/* ── Header ── */}
      <div className="px-6 sm:px-8 pt-8 pb-0">

        {/* Title row */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {/* Live indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8192C] opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8192C]" />
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#F5A623]">Outbound analytics</p>
            </div>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-black text-white leading-none tracking-tight">
              {manifests.length}
              <span className="text-[#666] font-black"> manifest{manifests.length !== 1 ? 's' : ''}</span>
            </h2>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#777] mb-2">All-time units</p>
            <p
              className="font-black text-white tabular-nums font-mono leading-none"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              <AnimatedNumber value={totalAllTime} format="compact" />
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-px" style={{ background: '#111' }}>
          {METRICS.map(({ key, label, value, delta }, i) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className="text-left px-4 sm:px-5 py-5 transition-all duration-150 relative overflow-hidden group/metric"
              style={{
                background: activeMetric === key ? '#0f0f0f' : '#080808',
              }}
            >
              {/* Active indicator line */}
              {activeMetric === key && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, #E8192C, #F5A623)' }}
                />
              )}

              <p className={`text-[9px] uppercase tracking-[0.2em] font-bold mb-3 transition-colors ${
                activeMetric === key ? 'text-[#E8192C]' : 'text-[#666] group-hover/metric:text-[#888]'
              }`}>{label}</p>

              <p className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-black text-white tabular-nums font-mono leading-none">
                <AnimatedNumber value={value} />
              </p>

              <div className="flex items-center gap-1.5 mt-2.5">
                <DeltaBadge value={delta} size="xs" />
                {delta !== null && <span className="text-[9px] text-[#666] font-mono">MoM</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-0 px-6 sm:px-8 mt-6"
        style={{ borderBottom: '1px solid #111' }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="relative py-3.5 mr-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-150"
            style={{ color: activeTab === key ? '#fff' : '#777' }}
          >
            {label}
            {activeTab === key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, #E8192C, #F5A623)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="px-6 sm:px-8 py-8 overflow-y-auto flex-1">

        {activeTab === 'overview' && (
          <div className="space-y-12">

            {/* Chart section */}
            <div>
              <SectionLabel>
                Last 6 months — {METRICS.find(m => m.key === activeMetric)?.label}
              </SectionLabel>
              <div className="mt-6">
                <BarGraph data={monthlyData} activeMetric={activeMetric} />
              </div>
            </div>

            {/* Summary stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4"
              style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111' }}
            >
              {[
                { label: 'All-time qty',   value: totalAllTime,   icon: Package,   fmt: 'number' as const },
                { label: 'Avg qty / trip', value: avgQtyPerTrip,  icon: BarChart2, fmt: 'number' as const },
                { label: 'Truckers',       value: uniqueTruckers, icon: Truck,     fmt: 'number' as const },
                { label: 'Total docs',     value: totalDocs,      icon: FileText,  fmt: 'number' as const },
              ].map(({ label, value, icon: Icon, fmt }, i) => (
                <div
                  key={label}
                  className="px-0 py-6 sm:px-5 sm:first:pl-0 sm:last:pr-0"
                  style={{
                    borderRight: i < 3 ? '1px solid #111' : 'none',
                    paddingLeft: i === 0 ? 0 : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon className="w-3 h-3 text-[#666]" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#666]">{label}</span>
                  </div>
                  <p className="text-[clamp(1.2rem,2vw,1.6rem)] font-black text-white tabular-nums font-mono leading-none">
                    <AnimatedNumber value={value} format={fmt} />
                  </p>
                </div>
              ))}
            </div>

            {/* Monthly breakdown */}
            <div>
              <SectionLabel>Monthly breakdown</SectionLabel>
              <div className="mt-5" style={{ borderTop: '1px solid #0d0d0d' }}>
                {/* Header */}
                <div className="grid grid-cols-5 py-3 border-b border-[#0d0d0d]">
                  {['Month', 'Qty', 'Trips', 'Docs', 'Avg'].map(h => (
                    <span key={h} className="text-[9px] uppercase tracking-widest font-bold text-[#666] font-mono">{h}</span>
                  ))}
                </div>
                <div>
                  {[...monthlyData].reverse().map((d, i) => {
                    const avg     = d.totalTrips > 0 ? Math.round(d.totalQty / d.totalTrips) : 0
                    const isCurr  = i === 0
                    const prevRow = i < monthlyData.length - 1 ? [...monthlyData].reverse()[i + 1] : null
                    const qDelta  = prevRow ? calcDelta(d.totalQty, prevRow.totalQty) : null

                    return (
                      <div
                        key={d.label}
                        className="grid grid-cols-5 py-4 border-b border-[#0d0d0d] transition-colors"
                        style={{ background: isCurr ? 'rgba(232,25,44,0.04)' : 'transparent' }}
                      >
                        <span
                          className="text-[12px] font-black font-mono"
                          style={{ color: isCurr ? '#E8192C' : '#888' }}
                        >
                          {d.label}
                          {isCurr && <span className="ml-2 text-[8px] opacity-50 uppercase tracking-widest">now</span>}
                        </span>
                        <span className="text-[12px] font-black text-white tabular-nums font-mono">
                          {d.totalQty.toLocaleString()}
                          {qDelta !== null && (
                            <span className={`ml-1.5 text-[9px] font-bold ${qDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {qDelta >= 0 ? '↑' : '↓'}{Math.abs(qDelta)}%
                            </span>
                          )}
                        </span>
                        <span className="text-[12px] text-[#666] tabular-nums font-mono">{d.totalTrips}</span>
                        <span className="text-[12px] text-[#666] tabular-nums font-mono">{d.totalDocs}</span>
                        <span className="text-[12px] text-[#666] tabular-nums font-mono">{avg || '—'}</span>
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
            <SectionLabel>Top destinations by volume</SectionLabel>
            <div className="mt-4">
              <TopDestinations manifests={manifests} />
            </div>
          </div>
        )}

        {activeTab === 'truckers' && <TopTruckers manifests={manifests} />}

        {activeTab === 'activity' && (
          <div>
            <SectionLabel>Recent manifests</SectionLabel>
            <div className="mt-4">
              <RecentActivity manifests={manifests} />
            </div>
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
      className="group text-left w-full p-4 sm:p-5 transition-all duration-200"
      style={{
        border: '1px solid #1a1a1a',
        background: '#080808',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#282828' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a' }}
    >
      <div className="relative mb-4">
        {delta !== null && (
          <div className={`absolute top-0 right-0 flex items-center gap-0.5 text-[10px] font-black font-mono ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
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
                    : isPrev ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.06)',
                  boxShadow: isCurrent ? '0 0 14px rgba(232,25,44,0.7)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#777] group-hover:text-[#F5A623] transition-colors mb-1">Outbound</p>
          <p className="text-[11px] text-[#666]">Analytics</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#666] group-hover:text-[#F5A623] transition-colors" />
      </div>
    </button>
  )
}