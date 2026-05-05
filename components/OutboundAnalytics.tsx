'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import {
  TrendingUp, Package, Truck, FileText,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2, MapPin, ChevronRight, TrendingDown,
  Zap, Target, Users, Calendar, AlertCircle,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

// ── Design tokens (SavedManifests theme) ─────────────────────────────────────
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#E8192C',
  accentHover:  '#FF1F30',
  accentGlow:   'rgba(232,25,44,0.25)',

  amber:        '#F5A623',

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
  if (value === null) return <span className="text-[10px] font-mono" style={{color: C.textMuted}}>—</span>
  const pos = value >= 0
  const cls = size === 'xs' ? 'text-[9px]' : 'text-[10px]'
  const Icon = pos ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${cls} ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      <Icon className={size === 'xs' ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
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

  const CHART_H = 280
  const LABEL_H = 28

  if (allZero) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_H + LABEL_H }}>
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold" style={{color: C.textMuted}}>No data for the last 6 months</p>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: CHART_H + LABEL_H }}>
      
      {/* Y-axis gridlines */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: 0, height: CHART_H }}>
        {[100, 75, 50, 25].map(p => (
          <div key={p} className="absolute w-full" style={{ bottom: `${p}%` }}>
            <div className="w-full border-t" style={{borderColor: C.border}} />
            <span className="absolute right-0 top-0 -translate-y-full pb-1 text-[9px] font-mono leading-none" style={{color: C.textGhost}}>
              {Math.round((p / 100) * max).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Bars row */}
      <div className="absolute left-0 right-0 flex gap-2 sm:gap-3" style={{ top: 0, height: CHART_H }}>
        {data.map((d, i) => {
          const val       = d[activeMetric]
          const hPct      = max > 0 ? (val / max) * 100 : 0
          const barH      = mounted ? Math.max(hPct, val > 0 ? 2 : 0) : 0
          const isHovered = hovered === i
          const isCurr    = i === data.length - 1
          const isPrev    = i === data.length - 2
          const prevVal   = i > 0 ? data[i - 1][activeMetric] : null
          const delta     = prevVal !== null ? calcDelta(val, prevVal) : null

          let barBg = C.surfaceHover
          if (isCurr)  barBg = `linear-gradient(180deg, ${C.accent} 0%, #c8140e 60%, ${C.amber} 100%)`
          else if (isPrev) barBg = `rgba(245,166,35,0.35)`
          if (isHovered && !isCurr && !isPrev) barBg = C.borderHover

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
                  className="absolute z-40 pointer-events-none animate-in fade-in"
                  style={{ bottom: `calc(${barH}% + 16px)`, left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div
                    className="relative px-5 py-4 text-center rounded-lg"
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      minWidth: 150,
                      boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rotate-45"
                      style={{ background: C.border, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}
                    />
                    <div className="mb-2">
                      <p className="font-bold text-xl tabular-nums leading-none font-mono" style={{color: C.textPrimary}}>
                        {val.toLocaleString()}
                      </p>
                      <p className="text-[9px] uppercase tracking-widest font-bold mt-2" style={{color: C.textMuted}}>{metricUnit[activeMetric]}</p>
                    </div>
                    {delta !== null && (
                      <div className="flex items-center justify-center gap-1.5 mt-3 pt-3" style={{borderTop: `1px solid ${C.divider}`}}>
                        <DeltaBadge value={delta} />
                        <span className="text-[9px] font-mono" style={{color: C.textMuted}}>vs {data[i - 1]?.label}</span>
                      </div>
                    )}
                    <p className="text-[8px] font-mono mt-2.5 opacity-70" style={{color: C.textGhost}}>{d.label} {d.year}</p>
                  </div>
                </div>
              )}

              {/* Bar */}
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{
                  height: `${barH}%`,
                  minHeight: val > 0 && mounted ? '4px' : '0px',
                  background: barBg,
                  transition: 'height 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${i * 60}ms`,
                  boxShadow: isCurr
                    ? `0 0 20px ${C.accentGlow}, 0 0 60px rgba(232,25,44,0.1)`
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
              <span
                className="text-[9px] font-mono font-bold leading-none uppercase tracking-widest"
                style={{
                  color: isCurr ? C.textPrimary : isPrev ? C.amber + '80' : isHov ? C.textSub : C.textGhost,
                }}
              >
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
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={C.divider} strokeWidth={STROKE} />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hovered !== null ? (
            <>
              <span className="font-bold text-base font-mono tabular-nums leading-none" style={{color: C.textPrimary}}>{((data[hovered].value / total) * 100).toFixed(0)}%</span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{color: C.textMuted}}>{data[hovered].label.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <span className="font-bold text-base font-mono tabular-nums leading-none" style={{color: C.textPrimary}}>{data.length}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{color: C.textMuted}}>types</span>
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
              <span className="text-[11px] font-semibold truncate" style={{color: C.textSub}}>{d.label}</span>
            </div>
            <span className="text-[11px] font-bold font-mono tabular-nums" style={{color: C.textPrimary}}>{d.value}</span>
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
  if (!destinations.length) return <EmptyState label="No destination data yet" icon={MapPin} />

  const totalQty = destinations.reduce((s, d) => s + d.qty, 0)
  const avgQty = Math.round(totalQty / destinations.length)

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg" style={{background: C.surface, borderRadius: 12}}>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{color: C.textMuted}}>Total Locations</p>
          <p className="text-[20px] font-bold font-mono mt-1" style={{color: C.accent}}>{destinations.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{color: C.textMuted}}>Total Volume</p>
          <p className="text-[20px] font-bold font-mono mt-1" style={{color: C.textPrimary}}>{totalQty.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{color: C.textMuted}}>Avg/Location</p>
          <p className="text-[20px] font-bold font-mono mt-1" style={{color: C.textSub}}>{avgQty}</p>
        </div>
      </div>

      {/* Destination list */}
      <div className="space-y-1">
        {destinations.map((dest, i) => {
          const pct = (dest.qty / maxQty) * 100
          const isTop = i === 0
          const Icon = i === 0 ? Target : MapPin
          return (
            <div key={dest.name} className="group relative py-4 px-4 rounded-lg transition-all duration-150" style={{borderBottom: `1px solid ${C.divider}`, background: i % 2 === 0 ? 'transparent' : C.surface + '40'}}>
              <div className="flex items-center justify-between mb-3 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{background: isTop ? C.accent + '20' : C.surface}}>
                    <Icon className="w-3 h-3" style={{color: isTop ? C.accent : C.textGhost}} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono font-bold w-5 flex-shrink-0 transition-colors group-hover:text-white" style={{ color: isTop ? C.textPrimary : C.textGhost }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[14px] font-semibold group-hover:text-white transition-colors truncate leading-tight" style={{color: C.textSilver}}>{dest.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{color: C.textGhost}}>{dest.docs} doc{dest.docs !== 1 ? 's' : ''}</p>
                    <p className="text-[9px] mt-0.5" style={{color: C.textMuted}}>shipped</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-bold tabular-nums font-mono leading-none" style={{color: C.textPrimary}}>{dest.qty.toLocaleString()}</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold" style={{color: C.textGhost}}>units</p>
                  </div>
                </div>
              </div>

              {/* Progress track */}
              <div className="ml-10 h-1.5 overflow-hidden rounded-full" style={{background: C.divider}}>
                <div
                  className="h-full origin-left rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isTop ? `linear-gradient(90deg, ${C.accent}, ${C.amber})` : i === 1 ? `rgba(245,166,35,0.5)` : C.border,
                    transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${i * 80}ms`,
                    boxShadow: isTop ? `0 0 8px ${C.accentGlow}` : 'none',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
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

  const TRUCK_COLORS = [C.accent, C.amber, '#3b82f6', '#8b5cf6', '#10b981']

  if (!truckers.length) return <EmptyState label="No trucker data yet" icon={Truck} />

  return (
    <div className="space-y-12">
      {/* Trucking companies */}
      <div>
        <SectionLabel icon={<Truck className="w-4 h-4" />} description="Top performing trucking partners">Trucking companies</SectionLabel>
        <div className="space-y-1 mt-6">
          {truckers.map((t, i) => (
            <div
              key={t.name}
              className="group flex items-center gap-5 py-4 px-4 transition-all duration-200 hover:pl-5 rounded-lg"
              style={{borderBottom: `1px solid ${C.divider}`, background: i % 2 === 0 ? 'transparent' : C.surface + '40'}}
            >
              <span
                  className="text-[11px] font-mono font-bold w-5 flex-shrink-0 transition-colors group-hover:text-white"
                  style={{ color: i === 0 ? C.textPrimary : C.textGhost }}
                >
                  {String(i + 1).padStart(2, '0')}
              </span>

              {/* Avatar */}
              <div
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[11px] font-bold rounded-lg"
                style={{
                  background: i === 0
                    ? `linear-gradient(135deg, ${C.accent}, #7f0e18)`
                    : C.surface,
                  border: i === 0 ? 'none' : `1px solid ${C.border}`,
                  color: i === 0 ? '#fff' : C.textSilver,
                }}
              >
                {t.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold group-hover:text-white transition-colors truncate" style={{color: C.textSilver}}>{t.name}</p>
                <p className="text-[11px] font-mono mt-0.5 truncate" style={{color: C.textMuted}}>{t.qty.toLocaleString()} units shipped</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-[22px] font-bold tabular-nums font-mono leading-none" style={{color: C.textPrimary}}>{t.trips}</p>
                <p className="text-[9px] uppercase tracking-widest font-bold" style={{color: C.textGhost}}>trips</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: drivers + truck types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-6 pt-10" style={{borderTop: `1px solid ${C.divider}`}}>
        {drivers.length > 0 && (
          <div>
            <SectionLabel icon={<Users className="w-4 h-4" />} description="Most active drivers">Top drivers</SectionLabel>
            <div className="mt-6 space-y-0 rounded-lg overflow-hidden" style={{border: `1px solid ${C.divider}`}}>
              {drivers.map(([name, trips], i) => (
                <div key={name} className="flex items-center justify-between py-4 px-4 transition-colors" style={{borderBottom: i < drivers.length - 1 ? `1px solid ${C.divider}` : 'none', background: i % 2 === 0 ? 'transparent' : C.surface + '40'}}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: i === 0 ? C.accent : C.border }}
                    />
                    <span className="text-[13px] font-semibold" style={{color: i === 0 ? C.textPrimary : C.textSub}}>{name}</span>
                  </div>
                  <span className="text-[13px] font-bold font-mono tabular-nums px-3 py-1 rounded-md" style={{color: C.accent, background: C.accent + '15'}}>{trips}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {truckTypes.length > 0 && (
          <div>
            <SectionLabel icon={<Package className="w-4 h-4" />} description="Vehicle type distribution">Fleet breakdown</SectionLabel>
            <div className="mt-6 p-6 rounded-lg" style={{border: `1px solid ${C.divider}`, background: C.surface}}>
              <RingChart
                data={truckTypes.map(([type, count], i) => ({
                  label: type,
                  value: count,
                  color: TRUCK_COLORS[i] || C.textGhost,
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
  if (!recent.length) return <EmptyState label="No activity yet" icon={Activity} />

  return (
    <div style={{borderTop: `1px solid ${C.divider}`}} className="rounded-lg overflow-hidden">
      {recent.map((m, idx) => {
        const qty  = (m.items || []).reduce((s, i) => s + (i.total_quantity || 0), 0)
        const date = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'
        const isRecent = idx === 0

        return (
          <div
            key={m.id}
            className="group flex items-center justify-between py-5 px-4 transition-all duration-200 hover:pl-5"
            style={{ borderBottom: `1px solid ${C.divider}`, background: isRecent ? C.surface + '50' : idx % 2 === 0 ? 'transparent' : C.divider + '10', animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                style={{ background: isRecent ? C.accent : C.border }}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate group-hover:text-white transition-colors font-mono" style={{color: C.textSilver}}>
                  {m.manifest_number || m.id?.slice(0, 8) || '—'}
                </p>
                <p className="text-[11px] mt-1 truncate transition-colors" style={{color: C.textMuted}}>
                  <span style={{color: C.textGhost}}>{m.driver_name || 'No driver'}</span>
                  {m.trucker && <span style={{color: C.textGhost}}> · {m.trucker}</span>}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-[22px] font-bold tabular-nums font-mono leading-none" style={{color: C.textPrimary}}>{qty.toLocaleString()}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold mt-1" style={{color: C.textGhost}}>{date}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children, icon: Icon, description }: { children: React.ReactNode; icon?: React.ReactNode; description?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <div style={{color: C.accent}}>{Icon}</div>}
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{color: C.textMuted}}>{children}</p>
      </div>
      {description && (
        <p className="text-[12px] mt-1" style={{color: C.textGhost}}>{description}</p>
      )}
    </div>
  )
}

function EmptyState({ label, icon: Icon = Activity }: { label: string; icon?: typeof Activity }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-lg" style={{border: `2px solid ${C.border}`, background: C.surface}}>
        <Icon className="w-6 h-6" style={{color: C.textGhost}} />
      </div>
      <div>
        <p className="text-[12px] font-bold" style={{color: C.textPrimary}}>{label}</p>
        <p className="text-[11px] mt-1" style={{color: C.textMuted}}>No data available yet</p>
      </div>
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
        background: C.bg,
        border: `1px solid ${C.divider}`,
        borderRadius: 16,
      }}
    >
      {/* ── Header ── */}
      <div className="px-6 sm:px-8 pt-8 pb-0" style={{borderBottom: `1px solid ${C.divider}`}}>

        {/* Title row */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{background: C.accent}} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{background: C.accent}} />
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{color: C.amber}}>Outbound analytics</p>
            </div>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)]  text-white leading-none tracking-tight">
              {manifests.length}
              <span className="font-normal" style={{color: C.textGhost}}> manifest{manifests.length !== 1 ? 's' : ''}</span>
            </h2>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2" style={{color: C.textMuted}}>All-time units</p>
            <p
              className="font-bold text-white tabular-nums font-mono leading-none"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              <AnimatedNumber value={totalAllTime} format="compact" />
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-3 rounded-lg overflow-hidden" style={{borderTop: `1px solid ${C.border}`, border: `1px solid ${C.border}`, marginBottom: 16}}>
          {METRICS.map(({ key, label, value, delta }, i) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className="text-left px-4 sm:px-5 py-6 transition-all duration-150 relative overflow-hidden group/metric"
              style={{
                background: activeMetric === key ? C.surface : 'transparent',
                borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {/* Active indicator line */}
              {activeMetric === key && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.amber})` }}
                />
              )}

              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 transition-colors" style={{color: activeMetric === key ? C.textPrimary : C.textGhost}}>
                {label}
              </p>

              <p className="text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold tabular-nums font-mono leading-none" style={{color: C.textPrimary}}>
                <AnimatedNumber value={value} />
              </p>

              <div className="flex items-center gap-1.5 mt-3">
                <DeltaBadge value={delta} size="xs" />
                {delta !== null && <span className="text-[9px] font-mono" style={{color: C.textGhost}}>MoM</span>}
              </div>

              {/* Hover effect indicator */}
              <div
                className="absolute top-1/2 -right-20 w-40 h-20 bg-gradient-to-l from-white/10 to-transparent rounded-full opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{transform: 'translateY(-50%)'}}
              />
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b" style={{borderColor: C.divider}}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="relative py-4 mr-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-150"
              style={{ color: activeTab === key ? C.textPrimary : C.textMuted }}
            >
              {label}
              {activeTab === key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.amber})`, borderRadius: '1px 1px 0 0' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 sm:px-8 py-8 overflow-y-auto flex-1">

        {activeTab === 'overview' && (
          <div className="space-y-12">

            {/* Chart section */}
            <div>
              <SectionLabel icon={<BarChart2 className="w-4 h-4" />} description="Monthly trends for the selected metric">
                Last 6 months — {METRICS.find(m => m.key === activeMetric)?.label}
              </SectionLabel>
              <div className="mt-6">
                <BarGraph data={monthlyData} activeMetric={activeMetric} />
              </div>
            </div>

            {/* Summary stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-lg overflow-hidden"
              style={{ border: `1px solid ${C.divider}`, background: C.surface }}
            >
              {[
                { label: 'All-time qty',   value: totalAllTime,   icon: Package,   fmt: 'number' as const },
                { label: 'Avg qty / trip', value: avgQtyPerTrip,  icon: BarChart2, fmt: 'number' as const },
                { label: 'Truckers',       value: uniqueTruckers, icon: Truck,     fmt: 'number' as const },
                { label: 'Total docs',     value: totalDocs,      icon: FileText,  fmt: 'number' as const },
              ].map(({ label, value, icon: Icon, fmt }, i) => (
                <div
                  key={label}
                  className="px-4 sm:px-5 py-6 sm:py-8 text-center transition-all duration-150 hover:bg-opacity-80"
                  style={{
                    borderRight: i < 3 ? `1px solid ${C.divider}` : 'none',
                    borderBottom: i < 2 ? `1px solid ${C.divider}` : 'none',
                  }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg mb-3 mx-auto" style={{background: C.divider}}>
                    <Icon className="w-4 h-4" style={{color: C.amber}} />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest font-bold mb-2" style={{color: C.textGhost}}>{label}</p>
                  <p className="text-[clamp(1.2rem,2vw,1.6rem)] font-bold tabular-nums font-mono leading-none" style={{color: C.textPrimary}}>
                    <AnimatedNumber value={value} format={fmt} />
                  </p>
                </div>
              ))}
            </div>

            {/* Monthly breakdown */}
            <div>
              <SectionLabel icon={<Calendar className="w-4 h-4" />} description="Detailed month-by-month analysis">Monthly breakdown</SectionLabel>
              <div className="mt-5 rounded-lg overflow-hidden" style={{border: `1px solid ${C.divider}`, background: C.surface}}>
                {/* Header */}
                <div className="grid grid-cols-5 py-4 px-5" style={{borderBottom: `1px solid ${C.divider}`, background: C.divider + '30'}}>
                  {['Month', 'Qty', 'Trips', 'Docs', 'Avg'].map(h => (
                    <span key={h} className="text-[9px] uppercase tracking-widest font-bold font-mono" style={{color: C.textMuted}}>{h}</span>
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
                        className="grid grid-cols-5 py-4 px-5 transition-colors"
                        style={{
                          borderBottom: `1px solid ${C.divider}`,
                          background: isCurr ? `${C.accent}08` : i % 2 === 0 ? 'transparent' : C.divider + '10',
                        }}
                      >
                        <span
                          className="text-[12px] font-bold font-mono"
                          style={{ color: isCurr ? C.accent : C.textSub }}
                        >
                          {d.label}
                          {isCurr && <span className="ml-2 text-[8px] opacity-50 uppercase tracking-widest" style={{color: C.accent}}>now</span>}
                        </span>
                        <span className="text-[12px] font-bold tabular-nums font-mono" style={{color: C.textPrimary}}>
                          {d.totalQty.toLocaleString()}
                          {qDelta !== null && (
                            <span className={`ml-1.5 text-[9px] font-bold ${qDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {qDelta >= 0 ? '↑' : '↓'}{Math.abs(qDelta)}%
                            </span>
                          )}
                        </span>
                        <span className="text-[12px] tabular-nums font-mono" style={{color: C.textSub}}>{d.totalTrips}</span>
                        <span className="text-[12px] tabular-nums font-mono" style={{color: C.textSub}}>{d.totalDocs}</span>
                        <span className="text-[12px] tabular-nums font-mono" style={{color: C.textSub}}>{avg || '—'}</span>
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
            <SectionLabel icon={<Target className="w-4 h-4" />} description="Track where your shipments are going">Top destinations by volume</SectionLabel>
            <div className="mt-4">
              <TopDestinations manifests={manifests} />
            </div>
          </div>
        )}

        {activeTab === 'truckers' && <TopTruckers manifests={manifests} />}

        {activeTab === 'activity' && (
          <div>
            <SectionLabel icon={<Activity className="w-4 h-4" />} description="Latest shipment updates">Recent manifests</SectionLabel>
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
        border: `1px solid ${C.border}`,
        background: C.bg,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}
    >
      <div className="relative mb-4">
        {delta !== null && (
          <div className={`absolute top-0 right-0 flex items-center gap-0.5 text-[10px] font-bold font-mono ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
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
                    ? `linear-gradient(180deg, ${C.accent} 0%, ${C.amber} 100%)`
                    : isPrev
                    ? `rgba(245,166,35,0.4)`
                    : C.surfaceHover,
                  boxShadow: isCurrent ? `0 0 14px ${C.accentGlow}` : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1 transition-colors group-hover:text-white" style={{color: C.textMuted}}>Outbound</p>
          <p className="text-[11px]" style={{color: C.textGhost}}>Analytics</p>
        </div>
        <ArrowUpRight className="w-4 h-4 transition-colors group-hover:text-white" style={{color: C.textGhost}} />
      </div>
    </button>
  )
}