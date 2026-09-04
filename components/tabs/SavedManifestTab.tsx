'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Eye, Download, Edit, Trash2, Calendar, FileText,
  ChevronDown, Search, X, BarChart2, ChevronRight,
  Truck, User, Hash, Clock, Package, ArrowUpRight, Boxes,
  Sparkles,
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { fetchSerialData, type SerialEntry } from '@/lib/utils/tripManifestPdfGenerator'
import * as XLSX from 'xlsx-js-style'

// design tokens (match CreateManifestTab)
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#9d7bf8',
  accentHover:  '#b39eff',
  accentGlow:   'rgba(157,123,248,0.25)',
  accentBg:     'rgba(157,123,248,0.08)',
  accentBorder: 'rgba(157,123,248,0.30)',

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

  stripeEven:   '#161B22',
  stripeOdd:    '#0D1117',
}

const MONTHS = [
  'All Months','January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const AI_EXAMPLE_QUERIES = [
  "SF Express trucker last week",
  "Over 500 units",
  "Last 3 days",
]

// Shared keyframes for the AI-assist search — defined once at module scope
const AI_STYLES = `
@property --ai-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes ai-border-spin {
  to {
    --ai-angle: 360deg;
  }
}

@keyframes ai-search-focus {
  0% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes ai-glow-breathe {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.98);
  }
  50% {
    opacity: 0.8;
    transform: scale(1);
  }
}

@keyframes ai-shimmer {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes ai-icon-enter {
  0% {
    opacity: 0;
    transform: scale(0.45) rotate(-25deg);
  }
  70% {
    transform: scale(1.12) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes ai-icon-idle {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(6deg) scale(1.05);
  }
}

@keyframes ai-loading-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.7);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ai-chip-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes ai-result-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ai-placeholder {
  0%, 15% {
    opacity: 0;
    transform: translateY(5px);
  }
  25%, 75% {
    opacity: 1;
    transform: translateY(0);
  }
  85%, 100% {
    opacity: 0;
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`

const stripLeadingZeros = (val: string | undefined) =>
  val ? val.replace(/^0+/, '') : '—'

type MaterialDescCache = Record<string, Record<string, string>>

function normalizeDN(dn: string): string {
  return dn.replace(/^0+/, '')
}

function buildCodeDescMap(serials: SerialEntry[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const s of serials) {
    if (s.materialCode && !map[s.materialCode] && s.materialDesc) {
      map[s.materialCode] = s.materialDesc
    }
  }
  return map
}

function getMaterialDescription(cache: MaterialDescCache, documentNumber: string | undefined, code: string): string {
  if (!documentNumber) return '—'
  const forDoc = cache[documentNumber] ?? cache[normalizeDN(documentNumber)]
  return forDoc?.[code]?.trim() || '—'
}

function itemMatchesQuery(item: ManifestItem, q: string, cache: MaterialDescCache): boolean {
  if ((item.document_number || '').toLowerCase().includes(q)) return true
  if ((item.ship_to_name || '').toLowerCase().includes(q)) return true
  const materials = item.actual_qty_by_material ? Object.keys(item.actual_qty_by_material) : []
  return materials.some(code =>
    code.toLowerCase().includes(q) ||
    getMaterialDescription(cache, item.document_number, code).toLowerCase().includes(q)
  )
}

// ── AI search helpers ─────────────────────────────────────────────────────────

interface AIFilter {
  label: string
  test: (m: TripManifest) => boolean
}

interface AIResult {
  filters: AIFilter[]
  matches: (m: TripManifest) => boolean
  sortDir?: 'asc' | 'desc'
}

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const normalizedCompact = (value: unknown): string =>
  normalizeText(value).replace(/[\s\-_/]+/g, '')

function manifestDate(m: TripManifest): Date {
  return new Date(m.manifest_date || m.created_at || '')
}

function validManifestTime(m: TripManifest): number {
  const t = manifestDate(m).getTime()
  return Number.isFinite(t) ? t : -Infinity
}

function manifestTotalQty(m: TripManifest): number {
  return (m.items || []).reduce(
    (sum, item) => sum + Number(item.total_quantity || 0),
    0
  )
}

function manifestDispatchedQty(m: TripManifest): number {
  return (m.items || []).reduce(
    (sum, item) =>
      sum +
      Number(
        item.actual_qty_dispatch ??
        item.total_quantity ??
        0
      ),
    0
  )
}

function manifestTotalCBM(m: TripManifest): number {
  return (m.items || []).reduce(
    (sum, item) => sum + Number(item.total_cbm || 0),
    0
  )
}

function manifestDocumentCount(m: TripManifest): number {
  return (m.items || []).length
}

function isShortDispatch(m: TripManifest): boolean {
  return (m.items || []).some(item => {
    const ordered = Number(item.total_quantity || 0)
    const dispatched = Number(
      item.actual_qty_dispatch ??
      item.total_quantity ??
      0
    )
    return dispatched < ordered
  })
}

function isFullyDispatched(m: TripManifest): boolean {
  const items = m.items || []
  if (items.length === 0) return false
  return items.every(item => {
    const ordered = Number(item.total_quantity || 0)
    const dispatched = Number(
      item.actual_qty_dispatch ??
      item.total_quantity ??
      0
    )
    return dispatched >= ordered
  })
}

function isNotDispatched(m: TripManifest): boolean {
  const items = m.items || []
  if (items.length === 0) return false
  return items.every(item => {
    const dispatched = Number(
      item.actual_qty_dispatch ??
      item.total_quantity ??
      0
    )
    return dispatched <= 0
  })
}

function hasDocuments(m: TripManifest): boolean {
  return (m.items || []).length > 0
}

function getDispatchDifference(m: TripManifest): number {
  return manifestTotalQty(m) - manifestDispatchedQty(m)
}

function containsText(value: unknown, query: string): boolean {
  return normalizeText(value).includes(normalizeText(query))
}

function compactContains(value: unknown, query: string): boolean {
  return normalizedCompact(value).includes(normalizedCompact(query))
}

function itemMatchesText(item: ManifestItem, query: string): boolean {
  const q = normalizeText(query)
  if (!q) return false
  if (containsText(item.document_number, q)) return true
  if (containsText(item.ship_to_name, q)) return true
  if (
    item.actual_qty_by_material &&
    Object.keys(item.actual_qty_by_material).some(code =>
      containsText(code, q)
    )
  ) {
    return true
  }
  return false
}

function manifestMatchesText(m: TripManifest, query: string): boolean {
  const q = normalizeText(query)
  if (!q) return false

  const headerFields = [
    m.manifest_number,
    m.driver_name,
    m.plate_no,
    m.trucker,
    m.truck_type,
    m.container_van_no,
    m.seal_no,
    m.remarks,
    m.status,
    m.time_start,
    m.time_end,
  ]

  if (headerFields.some(value => containsText(value, q))) {
    return true
  }

  return (m.items || []).some(item =>
    itemMatchesText(item, q)
  )
}

function startOfDay(d: Date): number {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime()
}

function endOfDay(d: Date): number {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  ).getTime()
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function getStartOfMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
}

function getEndOfMonth(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  )
}

function parseNumberWithCommas(value: string): number {
  return Number(value.replace(/,/g, ''))
}

function dedupeFilters(filters: AIFilter[]): AIFilter[] {
  const seen = new Set<string>()
  return filters.filter(filter => {
    const key = normalizeText(filter.label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── AI API client ─────────────────────────────────────────────────────────────

interface FilterSpec {
  type: 'month' | 'dateRange' | 'dispatchStatus' | 'noDocuments' | 'trucker' | 'driver' | 'truckType' | 'plate' | 'qty' | 'freeText' | string
  value?: string
  range?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_n_days' | string
  days?: number
  status?: 'short' | 'complete' | string
  negate?: boolean
  min?: number
  max?: number
  label?: string
}

interface AISearchResponse {
  filters: FilterSpec[]
  sortDir?: 'asc' | 'desc' | null
}

function buildFilterFromSpec(spec: FilterSpec): AIFilter | null {
  switch (spec.type) {
    case 'month': {
      if (!spec.value) return null
      const monthName = spec.value
      return {
        label: spec.label || monthName,
        test: m => MONTHS[manifestDate(m).getMonth() + 1] === monthName,
      }
    }
    case 'dateRange': {
      const now = new Date()
      switch (spec.range) {
        case 'today':
          return {
            label: spec.label || 'Today',
            test: m => startOfDay(manifestDate(m)) === startOfDay(now),
          }
        case 'yesterday': {
          const y = new Date(now)
          y.setDate(y.getDate() - 1)
          return {
            label: spec.label || 'Yesterday',
            test: m => startOfDay(manifestDate(m)) === startOfDay(y),
          }
        }
        case 'this_week': {
          const start = getStartOfWeek(now)
          const end = getEndOfWeek(now)
          return {
            label: spec.label || 'This week',
            test: m => {
              const t = validManifestTime(m)
              return t >= start.getTime() && t <= end.getTime()
            },
          }
        }
        case 'last_week': {
          const thisStart = getStartOfWeek(now)
          const start = new Date(thisStart)
          start.setDate(start.getDate() - 7)
          const end = new Date(thisStart)
          end.setMilliseconds(-1)
          return {
            label: spec.label || 'Last week',
            test: m => {
              const t = validManifestTime(m)
              return t >= start.getTime() && t <= end.getTime()
            },
          }
        }
        case 'this_month': {
          const start = getStartOfMonth(now)
          const end = getEndOfMonth(now)
          return {
            label: spec.label || 'This month',
            test: m => {
              const t = validManifestTime(m)
              return t >= start.getTime() && t <= end.getTime()
            },
          }
        }
        case 'last_n_days': {
          const n = spec.days && spec.days > 0 ? spec.days : 7
          const cutoff = new Date(now)
          cutoff.setDate(cutoff.getDate() - n)
          return {
            label: spec.label || `Last ${n} days`,
            test: m => validManifestTime(m) >= cutoff.getTime(),
          }
        }
        default:
          if (spec.value && spec.value.includes(':')) {
            const [from, to] = spec.value.split(':')
            const start = new Date(from)
            const end = new Date(to)
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
              end.setHours(23, 59, 59, 999)
              return {
                label: spec.label || `${from} – ${to}`,
                test: m => {
                  const t = validManifestTime(m)
                  return t >= startOfDay(start) && t <= end.getTime()
                },
              }
            }
          }
          return null
      }
    }
    case 'dispatchStatus': {
      const negate = !!spec.negate
      if (spec.status === 'short') {
        return {
          label: spec.label || (negate ? 'Not short dispatch' : 'Short dispatch'),
          test: m => (negate ? !isShortDispatch(m) : isShortDispatch(m)),
        }
      }
      if (spec.status === 'complete') {
        return {
          label: spec.label || (negate ? 'Not fully dispatched' : 'Fully dispatched'),
          test: m => (negate ? !isFullyDispatched(m) : isFullyDispatched(m)),
        }
      }
      return null
    }
    case 'noDocuments':
      return {
        label: spec.label || 'No documents',
        test: m => manifestDocumentCount(m) === 0,
      }
    case 'trucker': {
      if (!spec.value) return null
      const negate = !!spec.negate
      const value = spec.value
      return {
        label: spec.label || (negate ? `Not ${value}` : value),
        test: m => {
          const match = normalizeText(m.trucker) === normalizeText(value)
          return negate ? !match : match
        },
      }
    }
    case 'driver': {
      if (!spec.value) return null
      const value = spec.value
      return {
        label: spec.label || value,
        test: m => normalizeText(m.driver_name) === normalizeText(value),
      }
    }
    case 'truckType': {
      if (!spec.value) return null
      const value = spec.value
      return {
        label: spec.label || `${value} truck`,
        test: m => normalizeText(m.truck_type) === normalizeText(value),
      }
    }
    case 'plate': {
      if (!spec.value) return null
      const plate = spec.value.toUpperCase().replace(/[\s-]/g, '')
      return {
        label: spec.label || `Plate ${spec.value}`,
        test: m =>
          (m.plate_no || '')
            .toUpperCase()
            .replace(/[\s-]/g, '')
            .includes(plate),
      }
    }
    case 'qty': {
      const min = typeof spec.min === 'number' ? spec.min : undefined
      const max = typeof spec.max === 'number' ? spec.max : undefined
      if (min === undefined && max === undefined) return null
      return {
        label:
          spec.label ||
          (min !== undefined && max !== undefined
            ? `Qty ${min}–${max}`
            : min !== undefined
              ? `Qty ≥ ${min}`
              : `Qty ≤ ${max}`),
        test: m => {
          const total = manifestTotalQty(m)
          return (
            (min === undefined || total >= min) &&
            (max === undefined || total <= max)
          )
        },
      }
    }
    case 'freeText': {
      const text = (spec.value || '').toLowerCase().trim()
      if (!text) return null
      return {
        label: spec.label || `"${spec.value}"`,
        test: m => manifestMatchesText(m, text),
      }
    }
    default:
      return null
  }
}

async function runAISearch(
  query: string,
  candidates: { truckers: string[]; drivers: string[]; truckTypes: string[] },
  signal?: AbortSignal
): Promise<AISearchResponse> {
  const res = await fetch('/api/trip-manifest/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      truckers: candidates.truckers,
      drivers: candidates.drivers,
      truckTypes: candidates.truckTypes,
    }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`AI search failed (${res.status})`)
  }

  const data = (await res.json()) as AISearchResponse
  return {
    filters: Array.isArray(data.filters) ? data.filters : [],
    sortDir: data.sortDir ?? null,
  }
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({ selectedMonth, onMonthChange, months }: {
  selectedMonth: string; onMonthChange: (m: string) => void; months: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 sm:px-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap"
        style={{ border: `1px solid ${C.border}`, color: C.textSub }}
      >
        <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: C.accent }} />
        <span className="hidden sm:inline">{selectedMonth}</span>
        <span className="sm:hidden">{selectedMonth === 'All Months' ? 'Month' : selectedMonth.slice(0, 3)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-44 bg-[#0D1117] shadow-2xl z-50 max-h-60 overflow-y-auto py-1"
          style={{ background: C.bg, borderColor: C.border }}
        >
          {months.map((month) => (
            <button
              key={month}
              onClick={() => { onMonthChange(month); setIsOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
                selectedMonth === month
                  ? 'text-[#9d7bf8] bg-[#9d7bf8]/6'
                  : 'text-[#B1BAC4] hover:bg-[#21262D] hover:text-[#C9D1D9]'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Manifest Row ──────────────────────────────────────────────────────────────

function ManifestRow({
  manifest, index, expanded, onToggle, onView, onEdit, onDownload, onDelete, isViewer, searchQuery,
}: {
  manifest: TripManifest; index: number; expanded: boolean
  onToggle: () => void; onView: () => void; onEdit: () => void
  onDownload: () => void; onDelete: () => void; isViewer?: boolean; searchQuery: string
}) {
  const totalQty  = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const manifestId   = manifest.manifest_number || manifest.id || '—'
  const manifestDateLabel = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  const [descCache, setDescCache] = useState<MaterialDescCache>({})
  const [loadingDescs, setLoadingDescs] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const dns = (manifest.items || []).map(i => i.document_number).filter(Boolean) as string[]
    const missing = dns.filter(dn => !(dn in descCache))
    if (missing.length === 0) return

    let cancelled = false
    setLoadingDescs(true)
    fetchSerialData(missing)
      .then(serialsMap => {
        if (cancelled) return
        setDescCache(prev => {
          const next = { ...prev }
          missing.forEach(dn => {
            const serials = serialsMap.get(dn) ?? serialsMap.get(normalizeDN(dn)) ?? []
            next[dn] = buildCodeDescMap(serials)
          })
          return next
        })
      })
      .catch(() => { /* leave as "—" on failure */ })
      .finally(() => { if (!cancelled) setLoadingDescs(false) })

    return () => { cancelled = true }
  }, [expanded, manifest.items, descCache])

  useEffect(() => {
    if (!searchQuery) { setExpandedItem(null); return }
    const q = searchQuery.toLowerCase()
    const idx = (manifest.items || []).findIndex(item => itemMatchesQuery(item, q, descCache))
    setExpandedItem(idx >= 0 ? idx : null)
  }, [searchQuery, manifest.items, descCache])

  return (
    <div
      className={`group border-b transition-colors duration-150 ${expanded ? 'bg-[#21262D]' : 'hover:bg-[#21262D]'}`}
      style={{ borderColor: C.divider }}
    >
      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-5 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="hidden sm:block text-[11px] font-bold w-5 flex-shrink-0 transition-colors" style={{ color: C.textMuted }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate group-hover:text-white transition-colors leading-snug" style={{ color: C.textPrimary }}>
            {manifestId}
          </p>
          <p className="text-[12px] mt-0.5 truncate transition-colors" style={{ color: C.textSilver }}>
            {manifest.trucker ? `${manifest.trucker} · ` : ''}
            {manifest.driver_name || 'No driver'}
            {manifest.plate_no ? ` · ${manifest.plate_no}` : ''}
          </p>
        </div>

        <span className="hidden sm:block text-[11px] font-bold transition-colors flex-shrink-0 w-28 text-right tabular-nums" style={{ color: C.textSilver }}>
          {manifestDateLabel}
        </span>

        <span className="flex-shrink-0 text-2xl font-bold group-hover:text-white transition-colors tabular-nums w-12 text-right leading-none" style={{ color: C.textPrimary }}>
          {totalQty}
        </span>

        <span className="hidden sm:block flex-shrink-0 text-[11px] font-bold w-10 text-center tabular-nums uppercase tracking-widest" style={{ color: C.textSilver }}>
          {totalDocs}d
        </span>

        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : 'text-[#6E7681] group-hover:text-[#C9D1D9]'}`}
          style={{ color: expanded ? C.accent : undefined }}
        />

        {!isViewer && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-shrink-0 p-1.5 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            style={{ color: '#6E7681' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.accent }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6E7681' }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className="px-5 sm:px-8 py-6 sm:py-8" style={{ borderTop: `1px solid ${C.divider}` }}>
          {(manifest.items?.length ?? 0) > 0 && (
            <div className="mb-7 sm:mb-8 overflow-hidden" style={{ border: `1px solid ${C.divider}` }}>
              <div
                className="grid grid-cols-5 py-3 px-3"
                style={{ background: '#1C2128', borderBottom: `1px solid ${C.divider}` }}
              >
                {['#', 'Ship To', 'DN / TRA', 'Qty', 'Disp.'].map(h => (
                  <span key={h} className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textSilver }}>{h}</span>
                ))}
              </div>

              <div>
                {manifest.items!.map((item, idx) => {
                  const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity
                  const isShort = dispatchedQty < (item.total_quantity ?? 0)
                  const materials = item.actual_qty_by_material ? Object.entries(item.actual_qty_by_material) : []
                  const hasMaterials = materials.length > 0
                  const isItemExpanded = expandedItem === idx
                  const rowBg = idx % 2 === 0 ? C.stripeEven : C.stripeOdd

                  return (
                    <div key={idx}>
                      <div
                        className={`grid grid-cols-5 py-3.5 px-3 group/row transition-colors duration-100 ${hasMaterials ? 'cursor-pointer' : ''}`}
                        style={{
                          background: rowBg,
                          borderBottom: (idx < manifest.items!.length - 1 && !isItemExpanded) ? `1px solid ${C.divider}` : 'none',
                        }}
                        onClick={() => hasMaterials && setExpandedItem(isItemExpanded ? null : idx)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHover }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = rowBg }}
                      >
                        <span className="flex items-center gap-1 text-[11px] font-bold group-hover/row:text-[#C1F85C] transition-colors" style={{ color: C.textMuted }}>
                          {hasMaterials && (
                            <ChevronDown
                              className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isItemExpanded ? 'rotate-180' : ''}`}
                              style={{ color: isItemExpanded ? C.accent : C.textMuted }}
                            />
                          )}
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[13px] font-semibold truncate group-hover/row:text-white transition-colors col-span-1 sm:col-span-1" style={{ color: C.textPrimary }}>
                          {item.ship_to_name || '—'}
                        </span>
                        <span className="text-[13px] truncate hidden sm:block" style={{ color: C.textSilver }}>
                          {stripLeadingZeros(item.document_number)}
                        </span>
                        <span className="text-[13px] font-bold text-white tabular-nums text-right sm:text-left">
                          {item.total_quantity ?? 0}
                        </span>
                        <span className="text-[13px] font-bold tabular-nums text-right sm:text-left" style={{ color: isShort ? C.amber : 'white' }}>
                          {dispatchedQty}
                        </span>
                      </div>

                      {isItemExpanded && hasMaterials && (
                        <div
                          className="px-3 pt-1 pb-3"
                          style={{
                            background: rowBg,
                            borderBottom: idx < manifest.items!.length - 1 ? `1px solid ${C.divider}` : 'none',
                          }}
                        >
                          <div className="overflow-hidden" style={{ border: `1px solid ${C.divider}`, background: C.bg }}>
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] py-2 px-3" style={{ background: '#1C2128' }}>
                              <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5" style={{ color: C.textSilver }}>
                                Material Code
                              </span>
                              <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: C.textSilver }}>Material Description</span>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-right" style={{ color: C.textSilver }}>Qty</span>
                            </div>
                            {materials.map(([code, qty], mIdx) => {
                              const hasDoc = !!item.document_number && (item.document_number in descCache || normalizeDN(item.document_number) in descCache)
                              const description = hasDoc
                                ? getMaterialDescription(descCache, item.document_number, code)
                                : (loadingDescs ? 'Loading…' : '—')
                              return (
                                <div
                                  key={mIdx}
                                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] py-2 px-3"
                                  style={{ borderTop: `1px solid ${C.divider}` }}
                                >
                                  <span className="text-[12px] font-semibold truncate" style={{ color: C.textPrimary }}>{code}</span>
                                  <span className="text-[12px] truncate" style={{ color: C.textSilver }}>{description}</span>
                                  <span className="text-[12px] tabular-nums text-right" style={{ color: 'white' }}>{qty}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              onClick={onView}
              className="inline-flex items-center gap-1.5 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all"
              style={{ border: `1px solid ${C.amber}40`, color: C.amber }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.amber + '05'; e.currentTarget.style.borderColor = C.amber }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.amber + '40' }}
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            {!isViewer && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all"
                style={{ border: `1px solid ${C.border}`, color: C.textPrimary }}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-black hover:opacity-80 transition-all"
              style={{ background: C.amber }}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detail Item ───────────────────────────────────────────────────────────────

function DetailItem({ icon, label, value, mono, highlight }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: C.textSilver }}>
        <span style={{ color: C.accent }}>{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-sm truncate ${mono ? '' : 'font-bold'}`} style={{ color: highlight ? C.amber : 'white' }}>
        {value}
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
  isViewer?: boolean
}

export function SavedManifestsTab({
  savedManifests, handleViewManifest, handleEditManifest,
  handleDownloadManifest, handleDeleteManifest, isViewer,
}: SavedManifestsTabProps) {
  const [searchQuery,   setSearchQuery]   = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All Months')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [sortDir,       setSortDir]       = useState<'desc' | 'asc'>('desc')
  const [searchFocused, setSearchFocused] = useState(false)
  const [aiMode,        setAiMode]        = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  const [aiResult,  setAiResult]  = useState<{ filters: AIFilter[]; matches: (m: TripManifest) => boolean; sortDir?: 'asc' | 'desc' } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState<string | null>(null)
  const aiAbortRef = useRef<AbortController | null>(null)

  const itemsPerPage = 10
  const searchInputRef = useRef<HTMLInputElement>(null)

  const truckerNames   = useMemo(() => Array.from(new Set(savedManifests.map(m => m.trucker).filter(Boolean))) as string[], [savedManifests])
  const driverNames    = useMemo(() => Array.from(new Set(savedManifests.map(m => m.driver_name).filter(Boolean))) as string[], [savedManifests])
  const truckTypeNames = useMemo(() => Array.from(new Set(savedManifests.map(m => m.truck_type).filter(Boolean))) as string[], [savedManifests])

  // Rotate placeholder examples while AI mode is idle
  useEffect(() => {
    if (!aiMode || searchQuery || searchFocused) return
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % AI_EXAMPLE_QUERIES.length)
    }, 3200)
    return () => clearInterval(id)
  }, [aiMode, searchQuery, searchFocused])

  // Debounced call to the AI search route
  useEffect(() => {
    if (!aiMode || !searchQuery.trim()) {
      aiAbortRef.current?.abort()
      aiAbortRef.current = null
      setAiResult(null)
      setAiLoading(false)
      setAiError(null)
      return
    }

    const query = searchQuery.trim()
    setAiLoading(true)
    setAiError(null)
    aiAbortRef.current?.abort()

    const timer = setTimeout(async () => {
      const controller = new AbortController()
      aiAbortRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      try {
        const result = await runAISearch(
          query,
          { truckers: truckerNames, drivers: driverNames, truckTypes: truckTypeNames },
          controller.signal
        )

        if (controller.signal.aborted) return

        const built = dedupeFilters(
          result.filters
            .map(buildFilterFromSpec)
            .filter((f): f is AIFilter => !!f)
        )

        setAiResult({
          filters: built,
          matches: (manifest) => built.every((filter) => filter.test(manifest)),
          sortDir: result.sortDir || undefined,
        })
        setAiError(null)
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        console.error('AI search route failed:', err)
        setAiResult({ filters: [], matches: () => true, sortDir: undefined })
        setAiError('AI search is unavailable right now.')
      } finally {
        clearTimeout(timeoutId)
        if (aiAbortRef.current === controller) {
          aiAbortRef.current = null
          setAiLoading(false)
        }
      }
    }, 700)

    return () => {
      clearTimeout(timer)
      aiAbortRef.current?.abort()
    }
  }, [aiMode, searchQuery, truckerNames, driverNames, truckTypeNames])

  const sortedManifests = useMemo(() => {
    const parseDate = (val: string | undefined | null): number => {
      if (!val) return -Infinity
      const mdy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (mdy) return new Date(+mdy[3], +mdy[1] - 1, +mdy[2]).getTime()
      const t = new Date(val).getTime()
      return isNaN(t) ? -Infinity : t
    }

    return [...savedManifests].sort((a, b) => {
      const aTime = parseDate(a.manifest_date || a.created_at)
      const bTime = parseDate(b.manifest_date || b.created_at)

      if (aTime !== bTime) return sortDir === 'desc' ? bTime - aTime : aTime - bTime

      const aNum = a.manifest_number ?? ''
      const bNum = b.manifest_number ?? ''
      return sortDir === 'desc' ? bNum.localeCompare(aNum) : aNum.localeCompare(bNum)
    })
  }, [savedManifests, sortDir])

  useEffect(() => {
    if (aiResult?.sortDir) setSortDir(aiResult.sortDir)
  }, [aiResult?.sortDir])

  const filteredManifests = useMemo(() => {
    if (aiResult) {
      if (aiResult.filters.length === 0) {
        const q = searchQuery.toLowerCase().trim()
        return sortedManifests.filter((manifest) =>
          !q ||
          (manifest.manifest_number || '').toLowerCase().includes(q) ||
          (manifest.driver_name || '').toLowerCase().includes(q) ||
          (manifest.plate_no || '').toLowerCase().includes(q) ||
          (manifest.trucker || '').toLowerCase().includes(q) ||
          (manifest.truck_type || '').toLowerCase().includes(q) ||
          (manifest.container_van_no || '').toLowerCase().includes(q) ||
          (manifest.seal_no || '').toLowerCase().includes(q) ||
          (manifest.items || []).some(item => itemMatchesQuery(item, q, {}))
        )
      }
      return sortedManifests.filter(aiResult.matches)
    }
    return sortedManifests.filter((manifest) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q ||
        (manifest.manifest_number || '').toLowerCase().includes(q) ||
        (manifest.driver_name || '').toLowerCase().includes(q) ||
        (manifest.plate_no || '').toLowerCase().includes(q) ||
        (manifest.trucker || '').toLowerCase().includes(q) ||
        (manifest.truck_type || '').toLowerCase().includes(q) ||
        (manifest.container_van_no || '').toLowerCase().includes(q) ||
        (manifest.seal_no || '').toLowerCase().includes(q) ||
        (manifest.items || []).some(item => itemMatchesQuery(item, q, {}))
      if (!matchesSearch) return false
      if (selectedMonth === 'All Months') return true
      const date = new Date(manifest.manifest_date || manifest.created_at || '')
      return MONTHS[date.getMonth() + 1] === selectedMonth
    })
  }, [sortedManifests, searchQuery, selectedMonth, aiResult])

  const totalPages         = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (!searchQuery) return
    const q = searchQuery.toLowerCase()
    const hit = filteredManifests.find(m => (m.items || []).some(i => itemMatchesQuery(i, q, {})))
    if (hit?.id) setExpandedId(hit.id)
  }, [searchQuery, filteredManifests])

  const toggleAiMode = () => {
    setAiMode(v => !v)
    setCurrentPage(1)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  // ── Excel exports ─────────────────────────────────────────────────────────

  const handleDownloadMonitoring = () => {
    const wb = XLSX.utils.book_new()
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
    let row = 0
    const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
      ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: type, s: style } as XLSX.CellObject
    }
    const toDN = (val: string | undefined) => {
      const n = Number(val)
      return !isNaN(n) && val !== undefined && val !== '' ? n : (val || '—')
    }
    const bThin   = { top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'} }
    const bMedium = { top:{style:'medium'},bottom:{style:'medium'},left:{style:'medium'},right:{style:'medium'} }

    setCell(row, 0, 'SF EXPRESS CEBU WAREHOUSE — TRIP MANIFEST MONITORING', {
      font:{bold:true,sz:14,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'DC2626'}},
      alignment:{horizontal:'left',vertical:'center'},
    })
    row++
    setCell(row, 0, `Generated: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}  |  Total Manifests: ${filteredManifests.length}`, {
      font:{sz:10,italic:true},
      fill:{fgColor:{rgb:'FEE2E2'}},
      alignment:{horizontal:'left'},
    })
    row += 2

    ;['MANIFEST NO.','DISPATCH DATE','TRUCKER','DRIVER','PLATE NO.','TRUCK TYPE','CONTAINER VAN NO.','SEAL NO.','TIME START','TIME END','DN / TRA NO.','SHIP TO NAME','QTY','ACTUAL QTY DISPATCH'].forEach((h, c) =>
      setCell(row, c, h, {
        font:{bold:true,sz:11,color:{rgb:'FFFFFF'}},
        fill:{fgColor:{rgb:'1E3A5F'}},
        alignment:{horizontal:'center',vertical:'center',wrapText:true},
        border:bThin,
      })
    )
    row++

    let grandQty = 0, grandDispatchedQty = 0, grandDocs = 0, globalIdx = 0

    filteredManifests.forEach((manifest) => {
      const d = manifest.manifest_date
        ? new Date(manifest.manifest_date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})
        : '—'
      const items = manifest.items || []
      const fill = { fgColor:{ rgb: globalIdx % 2 === 0 ? 'F9FAFB' : 'FFFFFF' } }
      const base   = (ex: any = {}) => ({ font:{sz:10}, fill, border:bThin, alignment:{vertical:'center',wrapText:true}, ...ex })
      const center = (ex: any = {}) => base({ alignment:{horizontal:'center',vertical:'center'}, ...ex })
      const bold   = (ex: any = {}) => base({ font:{sz:10,bold:true}, ...ex })

      if (items.length === 0) {
        setCell(row, 0, manifest.manifest_number || manifest.id || '—', bold())
        setCell(row, 1, d, center())
        setCell(row, 2, manifest.trucker || '—', base())
        setCell(row, 3, manifest.driver_name || '—', base())
        setCell(row, 4, manifest.plate_no || '—', center())
        setCell(row, 5, manifest.truck_type || '—', base())
        setCell(row, 6, manifest.container_van_no || '—', center())
        setCell(row, 7, manifest.seal_no || '—', center())
        setCell(row, 8, manifest.time_start || '—', center())
        setCell(row, 9, manifest.time_end || '—', center())
        setCell(row, 10, '—', center())
        setCell(row, 11, 'No documents', base())
        setCell(row, 12, 0, center(), 'n')
        setCell(row, 13, 0, center(), 'n')
        row++
      } else {
        items.forEach((item) => {
          const dnVal = toDN(item.document_number)
          const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity ?? 0
          const isShort = dispatchedQty < (item.total_quantity || 0)
          setCell(row, 0, manifest.manifest_number || manifest.id || '—', bold({ alignment:{horizontal:'center',vertical:'center'} }))
          setCell(row, 1, d, center())
          setCell(row, 2, manifest.trucker || '—', base())
          setCell(row, 3, manifest.driver_name || '—', base())
          setCell(row, 4, manifest.plate_no || '—', center())
          setCell(row, 5, manifest.truck_type || '—', base())
          setCell(row, 6, manifest.container_van_no || '—', center())
          setCell(row, 7, manifest.seal_no || '—', center())
          setCell(row, 8, manifest.time_start || '—', center())
          setCell(row, 9, manifest.time_end || '—', center())
          setCell(row, 10, dnVal, bold({ alignment:{horizontal:'center',vertical:'center'} }), typeof dnVal === 'number' ? 'n' : 's')
          setCell(row, 11, item.ship_to_name || '—', base())
          setCell(row, 12, item.total_quantity || 0, center(), 'n')
          setCell(row, 13, dispatchedQty, center({ font:{sz:10,bold:true,color:{rgb: isShort ? 'B45309' : '000000'}} }), 'n')
          grandQty += item.total_quantity || 0
          grandDispatchedQty += dispatchedQty
          grandDocs++
          row++
        })
      }
      globalIdx++
    })

    row++
    const totalStyle = {
      font:{bold:true,sz:11,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'1E3A5F'}},
      alignment:{horizontal:'center',vertical:'center'},
      border:bMedium,
    }
    setCell(row, 0, `GRAND TOTAL — ${filteredManifests.length} manifests | ${grandDocs} documents`, totalStyle)
    for (let c = 1; c <= 11; c++) setCell(row, c, '', totalStyle)
    setCell(row, 12, grandQty, totalStyle, 'n')
    setCell(row, 13, grandDispatchedQty, totalStyle, 'n')

    ws['!ref'] = `A1:N${row + 5}`
    ws['!cols'] = [{wch:18},{wch:14},{wch:22},{wch:22},{wch:14},{wch:16},{wch:16},{wch:14},{wch:12},{wch:12},{wch:18},{wch:40},{wch:10},{wch:16}]
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoring')
    XLSX.writeFile(wb, `Manifest-Monitoring-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const handleExportAll = () => {
    const wb = XLSX.utils.book_new()
    filteredManifests.forEach((manifest, manifestIndex) => {
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
      let row = 0
      if (!ws['!merges']) ws['!merges'] = []
      const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
        ws[XLSX.utils.encode_cell({r,c})] = {v:value,t:type,s:style} as XLSX.CellObject
      }
      const bThin = {top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}
      const d = manifest.manifest_date
        ? new Date(manifest.manifest_date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})
        : '—'

      setCell(row,0,'SF EXPRESS CEBU WAREHOUSE',{font:{bold:true,sz:14}})
      setCell(row,1,'UPPER TINGUB, MANDAUE, CEBU')
      row += 2
      setCell(row,4,manifest.manifest_number||'—',{font:{bold:true,sz:16},fill:{fgColor:{rgb:'FFFFC400'}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium'},bottom:{style:'medium'},left:{style:'medium'},right:{style:'medium'}}})
      row += 3
      setCell(row,0,'TRIP MANIFEST',{font:{bold:true,sz:20},alignment:{horizontal:'center',vertical:'center'}})
      ws['!merges'].push({s:{r:row,c:0},e:{r:row,c:5}})
      row += 3
      ;[
        ['Client','HAIER PHILIPPINES INC.','Dispatch Date',d],
        ['Trucker',manifest.trucker||'N/A','Driver',manifest.driver_name||'—'],
        ['Plate No.',manifest.plate_no||'—','Truck Type',manifest.truck_type||'N/A'],
        ['Container Van No.',manifest.container_van_no||'—','Seal No.',manifest.seal_no||'—'],
        ['Time Start',manifest.time_start||'—','Time End',manifest.time_end||'—'],
      ].forEach(([l1,v1,l2,v2]) => {
        setCell(row,0,l1,{font:{bold:true}});setCell(row,1,v1);setCell(row,2,l2,{font:{bold:true}});setCell(row,3,v2);row++
      })
      row++
      const tableStartRow = row
      const hStyle = {font:{bold:true,sz:11},alignment:{horizontal:'center',vertical:'center',wrapText:true},fill:{fgColor:{rgb:'E8E8E8'}},border:bThin}
      ;['NO.','SHIP TO NAME','DN/TRA NO.','QTY','DISPATCHED','REMARKS'].forEach((h,c) => setCell(row,c,h,hStyle))
      row++
      const items = manifest.items || []
      if (items.length === 0) {
        setCell(row,0,'—',{border:bThin,alignment:{horizontal:'center'}})
        setCell(row,1,'No documents added',{border:bThin})
        setCell(row,2,'—',{border:bThin,alignment:{horizontal:'center'}})
        setCell(row,3,0,{border:bThin,alignment:{horizontal:'center'}},'n')
        setCell(row,4,0,{border:bThin,alignment:{horizontal:'center'}},'n')
        setCell(row,5,'—',{border:bThin,alignment:{horizontal:'center'}})
        row++
      } else {
        items.forEach((item, idx) => {
          const cs = {border:bThin,alignment:{horizontal:'center',vertical:'center'}}
          const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity ?? 0
          const isShort = dispatchedQty < (item.total_quantity || 0)
          setCell(row,0,idx+1,cs,'n')
          setCell(row,1,item.ship_to_name||'—',{...cs,alignment:{horizontal:'center',vertical:'center',wrapText:true}})
          setCell(row,2,stripLeadingZeros(item.document_number),{...cs,font:{bold:true}})
          setCell(row,3,item.total_quantity||0,cs,'n')
          setCell(row,4,dispatchedQty,{...cs,font:{bold:true,color:{rgb: isShort ? 'B45309' : '000000'}}},'n')
          setCell(row,5,'',cs)
          row++
        })
      }
      const totalQty = items.reduce((s,i) => s + (i.total_quantity||0), 0)
      const totalDispatchedQty = items.reduce((s,i) => s + (i.actual_qty_dispatch ?? i.total_quantity ?? 0), 0)
      setCell(row,0,'TOTAL',{font:{bold:true},alignment:{horizontal:'right'},border:bThin})
      setCell(row,1,'',{border:bThin})
      setCell(row,2,'',{border:bThin})
      setCell(row,3,totalQty,{font:{bold:true},alignment:{horizontal:'center'},border:bThin},'n')
      setCell(row,4,totalDispatchedQty,{font:{bold:true},alignment:{horizontal:'center'},border:bThin},'n')
      setCell(row,5,'',{border:bThin})
      for (let r = tableStartRow; r <= row; r++)
        for (let c = 0; c <= 5; c++) {
          const addr = XLSX.utils.encode_cell({r,c})
          if (ws[addr]) ws[addr].s = {...(ws[addr].s||{}), border:bThin}
        }
      row += 2
      setCell(row,2,`TOTAL DOCUMENTS: ${items.length}  |  TOTAL QUANTITY: ${totalQty}  |  TOTAL DISPATCHED: ${totalDispatchedQty}`,{font:{bold:true},alignment:{horizontal:'right'}})
      row += 3
      ws['!ref'] = `A1:F${row+10}`
      ws['!cols'] = [{wch:6},{wch:45},{wch:20},{wch:12},{wch:14},{wch:25}]
      XLSX.utils.book_append_sheet(wb, ws, (manifest.manifest_number||`Manifest-${manifestIndex+1}`).replace(/[\\/*?[\]:]/g,'-').slice(0,31))
    })
    XLSX.writeFile(wb, `Manifests-Export-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="border rounded-2xl overflow-hidden flex flex-col h-full" style={{ background: C.bg, borderColor: C.divider }}>
      <style>{AI_STYLES}</style>

      {/* ── Header ── */}
      <div className="px-5 sm:px-8 pt-8 pb-7 flex-shrink-0" style={{ borderBottom: `1px solid ${C.divider}` }}>

        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.accent }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.accent }} />
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold">Trip Manifest</p>
            </div>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-bold text-white leading-[0.93] tracking-tight" style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
              {savedManifests.length} manifest{savedManifests.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-[12px] mt-2" style={{ color: C.textSilver }}>SF Express · Cebu Warehouse</p>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadMonitoring}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ border: `1px solid ${C.border}`, color: C.textPrimary }}
            >
              <BarChart2 className="w-3.5 h-3.5" style={{ color: C.accent }} />
              Monitoring
            </button>
            <button
              onClick={handleExportAll}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{ background: C.amber }}
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>
        </div>

        {/* Search + AI toggle + Filter */}
        {/* ── Search + AI toggle + Filter ── */}
<div className="flex gap-2">
  <div
    className="relative flex-1 rounded-[11px]"
    style={{
      padding: aiMode ? '1px' : '0',
      background: aiMode
        ? `conic-gradient(
            from var(--ai-angle, 0deg),
            transparent 0deg,
            ${C.accent} 65deg,
            ${C.amber} 145deg,
            transparent 220deg,
            ${C.accent} 300deg,
            transparent 360deg
          )`
        : 'transparent',

      animation: aiMode
        ? 'ai-border-spin 5s linear infinite'
        : 'none',

      transition:
        'padding 300ms cubic-bezier(0.22,1,0.36,1), ' +
        'box-shadow 300ms cubic-bezier(0.22,1,0.36,1)',
    }}
  >
    {/* Ambient AI glow */}
    {aiMode && (
      <div
        className="absolute pointer-events-none rounded-[13px]"
        style={{
          inset: '-5px',
          background: `radial-gradient(
            ellipse at center,
            ${C.accentGlow},
            transparent 68%
          )`,
          filter: 'blur(8px)',
          animation: 'ai-glow-breathe 2.8s ease-in-out infinite',
        }}
      />
    )}

    <div
      className="relative flex items-center h-9 rounded-[10px] overflow-hidden"
      style={{
        background: C.bg,

        border: !aiMode
          ? `1px solid ${
              searchFocused
                ? C.inputFocus
                : C.border
            }`
          : 'none',

        boxShadow: searchFocused
          ? aiMode
            ? `0 0 0 1px ${C.accentBorder},
               0 0 22px ${C.accentGlow},
               inset 0 0 20px rgba(157,123,248,0.025)`
            : `0 0 0 3px rgba(31,111,235,0.12)`
          : 'none',

        transform: searchFocused
          ? 'scale(1.002)'
          : 'scale(1)',

        transition:
          'border-color 220ms ease, ' +
          'box-shadow 300ms cubic-bezier(0.22,1,0.36,1), ' +
          'transform 220ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Loading shimmer */}
      {aiLoading && (
        <div
          className="absolute inset-y-0 left-0 w-[45%] pointer-events-none"
          style={{
            background: `linear-gradient(
              90deg,
              transparent,
              ${C.accentBg},
              rgba(193,248,92,0.06),
              transparent
            )`,
            filter: 'blur(2px)',
            animation: 'ai-shimmer 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Search / AI icon */}
      <div
        className="absolute left-3 z-10 w-4 h-4 flex items-center justify-center"
        style={{
          pointerEvents: 'none',
        }}
      >
        {/* Normal search icon */}
        <Search
          className="absolute w-3.5 h-3.5"
          style={{
            color: searchFocused
              ? C.accent
              : C.textSilver,

            opacity: aiMode ? 0 : 1,

            transform: aiMode
              ? 'scale(0.5) rotate(-30deg)'
              : searchFocused
                ? 'scale(1.08)'
                : 'scale(1)',

            transition:
              'opacity 240ms ease, ' +
              'transform 300ms cubic-bezier(0.22,1,0.36,1), ' +
              'color 200ms ease',
          }}
        />

        {/* AI sparkle icon */}
        <Sparkles
          className="absolute w-3.5 h-3.5"
          style={{
            color: C.accent,

            opacity: aiMode ? 1 : 0,

            animation: aiMode
              ? aiLoading
                ? 'ai-icon-idle 1.8s ease-in-out infinite'
                : 'ai-icon-enter 380ms cubic-bezier(0.22,1,0.36,1) both'
              : 'none',

            transform: aiMode
              ? 'scale(1)'
              : 'scale(0.45)',

            transition:
              'opacity 220ms ease, ' +
              'transform 300ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>

      {/* Search input */}
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        placeholder={
          aiMode
            ? searchQuery
              ? ''
              : `Try: "${AI_EXAMPLE_QUERIES[placeholderIdx]}"`
            : 'Search manifests, drivers, plates, DN/TRA, material codes…'
        }
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setCurrentPage(1)
        }}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        className="relative z-[2] w-full h-full pl-9 pr-20 bg-transparent text-[13px] text-white focus:outline-none rounded-[10px]"
        style={{
          color: C.inputText,
          caretColor: aiMode
            ? C.accent
            : C.inputFocus,

          transition:
            'color 200ms ease, ' +
            'caret-color 200ms ease',
        }}
      />

      {/* Animated placeholder accent */}
      {aiMode && !searchQuery && !searchFocused && (
        <div
          className="absolute left-9 right-20 top-0 h-full flex items-center pointer-events-none z-[1]"
          key={placeholderIdx}
          style={{
            color: C.textMuted,
            animation:
              'ai-placeholder 3.2s cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          <span className="text-[13px] truncate">
            Try:{' '}
            <span style={{ color: C.textSilver }}>
              "{AI_EXAMPLE_QUERIES[placeholderIdx]}"
            </span>
          </span>
        </div>
      )}

      {/* Loading dots */}
      {aiLoading && (
        <div
          className="absolute right-12 flex items-center gap-[3px] z-10"
          style={{
            animation:
              'ai-result-in 220ms ease-out both',
          }}
        >
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-[3px] h-[3px] rounded-full"
              style={{
                background:
                  i === 1
                    ? C.amber
                    : C.accent,

                animation:
                  `ai-loading-pulse 1s ease-in-out ${i * 140}ms infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Clear button */}
      {!aiLoading && searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('')
            setCurrentPage(1)
            requestAnimationFrame(() => {
              searchInputRef.current?.focus()
            })
          }}
          aria-label="Clear search"
          className="absolute right-11 z-10 w-6 h-6 flex items-center justify-center rounded-full"
          style={{
            color: C.textSilver,
            background: 'transparent',
            transition:
              'color 180ms ease, ' +
              'background 180ms ease, ' +
              'transform 180ms cubic-bezier(0.22,1,0.36,1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.background = C.surfaceHover
            e.currentTarget.style.transform = 'scale(1.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.textSilver
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* AI toggle */}
      <button
        type="button"
        onClick={toggleAiMode}
        title={
          aiMode
            ? 'Switch to plain search'
            : 'Switch to AI-assist search'
        }
        aria-label={
          aiMode
            ? 'Switch to plain search'
            : 'Switch to AI-assist search'
        }
        className="absolute right-1 z-20 w-7 h-7 rounded-[7px] flex items-center justify-center"
        style={{
          background: aiMode
            ? C.accentBg
            : 'transparent',

          border: aiMode
            ? `1px solid ${C.accentBorder}`
            : '1px solid transparent',

          boxShadow: aiMode
            ? `0 0 10px rgba(157,123,248,0.12)`
            : 'none',

          transition:
            'background 220ms ease, ' +
            'border-color 220ms ease, ' +
            'box-shadow 220ms ease, ' +
            'transform 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          if (!aiMode) {
            e.currentTarget.style.background = C.surfaceHover
            e.currentTarget.style.borderColor = C.border
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          if (!aiMode) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }
        }}
      >
        <Sparkles
          className="w-3.5 h-3.5"
          style={{
            color: aiMode
              ? C.accent
              : C.textGhost,

            animation: aiMode
              ? 'ai-icon-idle 2.4s ease-in-out infinite'
              : 'none',

            transition:
              'color 220ms ease',
          }}
        />
      </button>
    </div>
  </div>

  {!aiMode && (
    <FilterDropdown
      selectedMonth={selectedMonth}
      onMonthChange={(m) => {
        setSelectedMonth(m)
        setCurrentPage(1)
      }}
      months={MONTHS}
    />
  )}
</div>

        {/* AI example chips */}
        {aiMode && !searchQuery && (
          <div className="flex flex-wrap gap-2 mt-3">
            {AI_EXAMPLE_QUERIES.map((example, i) => (
              <button
                key={example}
                onClick={() => { setSearchQuery(example); searchInputRef.current?.focus() }}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-full"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.textSilver,
                  transition: 'all 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  animation: `ai-chip-in 400ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 55}ms both`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.accentBorder
                  e.currentTarget.style.color = C.textPrimary
                  e.currentTarget.style.background = C.accentBg
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.color = C.textSilver
                  e.currentTarget.style.background = C.surface
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {/* Thinking state */}
        {aiMode && aiLoading && (
          <div
            className="flex items-center gap-2 mt-3"
            style={{ animation: 'ai-fade-slide-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            <Sparkles className="w-3 h-3" style={{ color: C.accent, animation: 'ai-glow-pulse 1s ease-in-out infinite' }} />
            <span className="text-[11px] font-semibold" style={{ color: C.textMuted }}>
              Reading your query…
            </span>
          </div>
        )}

        {/* Error */}
        {aiMode && !aiLoading && aiError && (
          <div
            className="flex items-center gap-2 mt-3"
            style={{ animation: 'ai-fade-slide-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            <span
              className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#F5A623' }}
            >
              Unavailable
            </span>
            <span className="text-[11px]" style={{ color: C.textMuted }}>{aiError}</span>
          </div>
        )}

        {/* Understood filters */}
        {!aiLoading && aiResult && aiResult.filters.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 mt-3"
            style={{ animation: 'ai-understood-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textMuted }}>
              <Sparkles className="w-2.5 h-2.5" style={{ color: C.accent }} />
              Understood
            </span>
            {aiResult.filters.map((f, i) => (
              <span
                key={`${f.label}-${i}`}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-full"
                style={{
                  background: C.accentBg,
                  border: `1px solid ${C.accentBorder}`,
                  color: C.accent,
                  animation: `ai-chip-in 380ms cubic-bezier(0.22, 1, 0.36, 1) ${80 + i * 55}ms both`,
                }}
              >
                {f.label}
              </span>
            ))}
          </div>
        )}

        {!aiLoading && aiResult && aiResult.filters.length === 0 && searchQuery.trim() && (
          <p
            className="text-[11px] mt-3"
            style={{ color: C.textMuted, animation: 'ai-fade-slide-in 200ms ease-out both' }}
          >
            Couldn&apos;t pick out a filter from that — showing a plain text match instead.
          </p>
        )}

        {!aiResult && !aiLoading && (searchQuery || selectedMonth !== 'All Months') && (
          <p className="text-[11px] font-bold uppercase tracking-widest mt-3" style={{ color: C.textSilver }}>
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
        {aiResult && !aiLoading && (
          <p className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ color: C.textSilver }}>
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Column headers ── */}
      {filteredManifests.length > 0 && (
        <div
          className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-3 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest"
          style={{ borderBottom: `1px solid ${C.divider}`, color: C.textSilver }}
        >
          <span className="hidden sm:block w-5">No.</span>
          <span className="flex-1">Title</span>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="hidden sm:flex items-center justify-end gap-1 w-28 hover:text-white transition-colors cursor-pointer"
            style={{ color: C.textSilver }}
            title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            Date
            <span style={{ color: C.accent }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
          </button>
          <span className="w-12 text-right">Qty</span>
          <span className="hidden sm:block w-10 text-center">Docs</span>
          <span className="w-4" />
          {!isViewer && <span className="w-7" />}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {savedManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
            <FileText className="w-8 h-8" style={{ color: C.textMuted }} />
            <div>
              <p className="font-bold text-base" style={{ color: C.textSilver }}>No manifests yet</p>
              <p className="text-[12px] text-[#666666] mt-1 max-w-xs">Create your first trip manifest to see it here</p>
            </div>
          </div>
        ) : filteredManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
            <Search className="w-8 h-8" style={{ color: C.textMuted }} />
            <div>
              <p className="font-bold text-base" style={{ color: C.textSilver }}>No results found</p>
              <p className="text-[12px] text-[#666666] mt-1">
                {aiMode ? 'Try rephrasing, or switch back to plain search' : 'Try adjusting your search or filter'}
              </p>
            </div>
          </div>
        ) : (
          paginatedManifests.map((manifest, idx) => (
            <ManifestRow
              key={manifest.id}
              manifest={manifest}
              index={(currentPage - 1) * itemsPerPage + idx}
              expanded={expandedId === manifest.id}
              onToggle={() => setExpandedId(expandedId === manifest.id ? null : (manifest.id ?? null))}
              onView={() => handleViewManifest(manifest)}
              onEdit={() => handleEditManifest(manifest)}
              onDownload={() => handleDownloadManifest(manifest)}
              onDelete={() => manifest.id && handleDeleteManifest(manifest.id)}
              isViewer={isViewer}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          className="flex-shrink-0 px-5 sm:px-8 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${C.divider}` }}
        >
          <p className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-widest tabular-nums">
            <span className="text-white">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 1)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-[11px] font-bold uppercase tracking-widest transition-all ${
                    currentPage === page
                      ? 'text-white'
                      : 'border border-[#282828] text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white'
                  }`}
                  style={{
                    background: currentPage === page ? C.accent : 'transparent',
                  }}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}