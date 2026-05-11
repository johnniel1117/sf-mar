'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Download, Calendar, Search, X, ChevronRight,
  TrendingUp, Package, Loader2, Truck, FileText,
  Calendar as CalendarIcon, BarChart3,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx-js-style'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Design tokens — identical to SerialListPrinter ────────────────────────────
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',
  accent:       '#F5A623',
  accentHover:  '#FF1F30',
  accentGlow:   'rgba(245,166,35,0.25)',
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
  stripeEven:   '#161B22',
  stripeOdd:    '#0D1117',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MaterialEntry {
  materialCode:        string
  materialDescription: string
  category:            string
  qty:                 number
  cbm:                 number | null
  remarks:             string
  shipName:            string
}

interface AccrualRow {
  orderNo:      string
  matCode:      string
  matDesc:      string
  category:     string
  shipToName:   string
  qty:          number
  totalVolume:  number
  drAmount:     number
  trucker:      string
  plateNo:      string
  truckType:    string
  manifestDate: string
}

interface TruckerGroup {
  trucker:   string
  plateNo:   string
  truckType: string
  rows:      AccrualRow[]
  totalQty:  number
  totalVol:  number
}

interface DayGroup {
  label:     string
  date:      string
  rows:      AccrualRow[]
  subGroups: TruckerGroup[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Helpers ───────────────────────────────────────────────────────────────────

function getISODate(s: string) { return new Date(s).toISOString().slice(0, 10) }

function formatDayLabel(s: string) {
  const d = new Date(s)
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d)
}

function formatSheetName(s: string) {
  const d = new Date(s)
  return `${MONTH_SHORT[d.getMonth()].toUpperCase()} ${d.getDate()}`
}

function toExcelSerial(s: string) {
  const d = new Date(s)
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc - Date.UTC(1899, 11, 30)) / 86400000)
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

// Batch size kept small to stay well under PostgREST's URL length limit (~8 KB)
const FETCH_BATCH_SIZE = 20

async function fetchBatch(dns: string[]): Promise<{ document_number: string; material_data: string | null }[]> {
  const { data, error } = await supabase
    .from('excel_uploads')
    .select('document_number, material_data')
    .in('document_number', dns)

  if (error) {
    console.error('[AccrualReport] batch fetch error:', error.message)
    return []
  }
  return data ?? []
}

async function fetchMaterialsForDNs(dns: string[]): Promise<Map<string, MaterialEntry[]>> {
  const map = new Map<string, MaterialEntry[]>()
  if (!dns.length) return map

  // Build variant list: original + leading-zero-stripped versions
  const unique   = [...new Set(dns)]
  const stripped = unique.map(d => d.replace(/^0+/, '')).filter(s => s && !unique.includes(s))
  const variants = [...unique, ...stripped]

  // Split into chunks to avoid PostgREST URL-length 400 errors
  const chunks: string[][] = []
  for (let i = 0; i < variants.length; i += FETCH_BATCH_SIZE) {
    chunks.push(variants.slice(i, i + FETCH_BATCH_SIZE))
  }

  // Fetch all batches in parallel
  const results = await Promise.all(chunks.map(fetchBatch))
  const rows = results.flat()

  for (const row of rows) {
    let mats: MaterialEntry[] = []
    try {
      if (row.material_data) {
        const parsed = JSON.parse(row.material_data)
        mats = Array.isArray(parsed) ? parsed : []
      }
    } catch { continue }
    if (!mats.length) continue

    map.set(row.document_number, mats)
    // Also index by stripped key so lookup works regardless of leading zeros
    const sk = row.document_number.replace(/^0+/, '')
    if (sk !== row.document_number) map.set(sk, mats)
  }
  return map
}

// ── Row builder ───────────────────────────────────────────────────────────────

function buildAccrualRows(
  manifests: TripManifest[],
  materialsMap: Map<string, MaterialEntry[]>
): AccrualRow[] {
  const rows: AccrualRow[] = []

  for (const m of manifests) {
    if (!m.manifest_date) continue
    for (const item of m.items ?? []) {
      const dn   = item.document_number ?? ''
      const mats = materialsMap.get(dn) ?? materialsMap.get(dn.replace(/^0+/, ''))

      if (mats && mats.length > 0) {
        for (const mat of mats) {
          rows.push({
            orderNo:      dn,
            matCode:      mat.materialCode        ?? '',
            matDesc:      mat.materialDescription ?? '',
            category:     mat.category            ?? '',
            shipToName:   item.ship_to_name       ?? '—',
            qty:          mat.qty                 ?? 0,
            totalVolume:  mat.cbm                 ?? 0,
            drAmount:     0,
            trucker:      m.trucker               ?? '',
            plateNo:      m.plate_no              ?? '',
            truckType:    m.truck_type            ?? '',
            manifestDate: m.manifest_date,
          })
        }
      } else {
        rows.push({
          orderNo:      dn,
          matCode:      '',
          matDesc:      '',
          category:     '',
          shipToName:   item.ship_to_name  ?? '—',
          qty:          item.total_quantity ?? 0,
          totalVolume:  item.total_cbm      ?? 0,
          drAmount:     0,
          trucker:      m.trucker           ?? '',
          plateNo:      m.plate_no          ?? '',
          truckType:    m.truck_type        ?? '',
          manifestDate: m.manifest_date,
        })
      }
    }
  }
  return rows
}

// ── Grouping ──────────────────────────────────────────────────────────────────

function groupByDay(rows: AccrualRow[]): DayGroup[] {
  const dayMap = new Map<string, AccrualRow[]>()
  for (const r of rows) {
    const key = getISODate(r.manifestDate)
    if (!dayMap.has(key)) dayMap.set(key, [])
    dayMap.get(key)!.push(r)
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows]) => {
      const truckerMap = new Map<string, TruckerGroup>()
      for (const r of dayRows) {
        const key = `${r.trucker}||${r.plateNo}`
        if (!truckerMap.has(key)) {
          truckerMap.set(key, { trucker: r.trucker, plateNo: r.plateNo, truckType: r.truckType, rows: [], totalQty: 0, totalVol: 0 })
        }
        const g = truckerMap.get(key)!
        g.rows.push(r)
        g.totalQty += r.qty
        g.totalVol += r.totalVolume
      }
      return { label: formatDayLabel(date), date, rows: dayRows, subGroups: Array.from(truckerMap.values()) }
    })
}

// ── Excel export ──────────────────────────────────────────────────────────────

function exportAccrualExcel(dayGroups: DayGroup[], monthLabel: string) {
  const wb   = XLSX.utils.book_new()
  const bThin = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }

  const headerStyle = {
    font:      { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
    fill:      { fgColor: { rgb: '1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border:    bThin,
  }
  const subtotalStyle = {
    font:      { bold: true, sz: 10, color: { rgb: '1E3A5F' } },
    fill:      { fgColor: { rgb: 'EBF0FA' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    bThin,
  }

  const COLS       = ['ORDER NO','MAT CODE','MAT DESC','CATEGORY','SHIP TO NAME','QTY','TOTAL CBM','DR AMOUNT','TRUCKER','PLATE NO.','TRUCK TYPE','DATE DISPATCHED']
  const COL_WIDTHS = [20, 16, 36, 14, 30, 8, 12, 12, 20, 12, 14, 16]

  for (const day of dayGroups) {
    const ws: XLSX.WorkSheet = {}
    ws['!merges'] = []
    let row = 0

    const setCell = (r: number, c: number, v: any, s: any = {}, t: XLSX.CellObject['t'] = 's') => {
      ws[XLSX.utils.encode_cell({ r, c })] = { v, t, s } as XLSX.CellObject
    }

    COLS.forEach((h, c) => setCell(row, c, h, headerStyle))
    row++

    for (const sub of day.subGroups) {
      sub.rows.forEach((r2, idx) => {
        const fill = { fgColor: { rgb: idx % 2 === 0 ? 'F6F8FA' : 'FFFFFF' } }
        const base = { font:{sz:10}, fill, border:bThin, alignment:{vertical:'center',wrapText:true} }
        const ctr  = { ...base, alignment:{horizontal:'center',vertical:'center'} }
        const bold = { ...base, font:{sz:10,bold:true} }

        setCell(row,  0, r2.orderNo,                    bold)
        setCell(row,  1, r2.matCode     || '—',          base)
        setCell(row,  2, r2.matDesc     || '—',          base)
        setCell(row,  3, r2.category    || '—',          ctr)
        setCell(row,  4, r2.shipToName,                  base)
        setCell(row,  5, r2.qty,                         ctr, 'n')
        setCell(row,  6, r2.totalVolume,                 ctr, 'n')
        setCell(row,  7, r2.drAmount,                    ctr, 'n')
        setCell(row,  8, r2.trucker,                     base)
        setCell(row,  9, r2.plateNo,                     ctr)
        setCell(row, 10, r2.truckType,                   ctr)
        setCell(row, 11, toExcelSerial(r2.manifestDate), { ...ctr, numFmt:'MM/DD/YYYY' }, 'n')
        row++
      })

      COLS.forEach((_, c) => {
        const v = c === 5 ? sub.totalQty : c === 6 ? sub.totalVol : c === 0 ? 'SUBTOTAL' : ''
        setCell(row, c, v, subtotalStyle, (c === 5 || c === 6) ? 'n' : 's')
      })
      row++
    }

    ws['!ref']  = `A1:L${row + 1}`
    ws['!cols'] = COL_WIDTHS.map(wch => ({ wch }))
    ws['!rows'] = [{ hpt: 28 }]
    XLSX.utils.book_append_sheet(wb, ws, formatSheetName(day.date))
  }

  XLSX.writeFile(wb, `Accrual-${monthLabel.replace(' ', '-')}-${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon?: any }) {
  return (
    <div className="px-5 py-4 rounded-lg transition-all duration-200"
      style={{ 
        background: C.surface, 
        border: `1px solid ${C.border}`,
        cursor: 'pointer'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.backgroundColor = C.surfaceHover }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.backgroundColor = C.surface }}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
            style={{ background: color === C.amber ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: C.textMuted }}>{label}</p>
          <p className="text-xl font-bold tabular-nums leading-none mt-2" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  )
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: string }) {
  if (!category) return null
  const colors: Record<string, { bg: string; text: string }> = {
    TV:   { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA' },
    REF:  { bg: 'rgba(63,185,80,0.12)',   text: '#3FB950' },
    AC:   { bg: 'rgba(245,166,35,0.12)',  text: '#F5A623' },
    WM:   { bg: 'rgba(168,85,247,0.12)', text: '#C084FC' },
  }
  const style = colors[category.toUpperCase()] ?? { bg: 'rgba(139,148,158,0.12)', text: '#8B949E' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm"
      style={{ background: style.bg, color: style.text }}>
      {category}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AccrualReportTab({ manifests }: { manifests: TripManifest[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [search,       setSearch]       = useState('')
  const [expandedDay,  setExpandedDay]  = useState<string | null>(null)
  const [materialsMap, setMaterialsMap] = useState<Map<string, MaterialEntry[]>>(new Map())
  const [loading,      setLoading]      = useState(false)

  const [selYear, selMonth] = selectedMonth.split('-').map(Number)
  const monthLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`

  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    for (const m of manifests) {
      if (!m.manifest_date) continue
      const d = new Date(m.manifest_date)
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return Array.from(set).sort().reverse()
  }, [manifests])

  const monthManifests = useMemo(() =>
    manifests.filter(m => {
      if (!m.manifest_date) return false
      const d = new Date(m.manifest_date)
      return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth
    }),
  [manifests, selYear, selMonth])

  const dnsKey = useMemo(() => {
    return [...new Set(
      monthManifests.flatMap(m => (m.items ?? []).map(i => i.document_number ?? '').filter(Boolean))
    )].sort().join(',')
  }, [monthManifests])

  useEffect(() => {
    const dns = dnsKey ? dnsKey.split(',') : []
    if (!dns.length) { setMaterialsMap(new Map()); return }

    let cancelled = false
    setLoading(true)
    fetchMaterialsForDNs(dns).then(map => {
      if (!cancelled) { setMaterialsMap(map); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [dnsKey])

  const allRows = useMemo(() => buildAccrualRows(monthManifests, materialsMap), [monthManifests, materialsMap])

  const dayGroups = useMemo(() => {
    let groups = groupByDay(allRows)
    if (search.trim()) {
      const q = search.toLowerCase()
      groups = groups.filter(g =>
        g.label.toLowerCase().includes(q) ||
        g.rows.some(r =>
          r.orderNo.toLowerCase().includes(q)    ||
          r.matCode.toLowerCase().includes(q)    ||
          r.matDesc.toLowerCase().includes(q)    ||
          r.shipToName.toLowerCase().includes(q) ||
          r.trucker.toLowerCase().includes(q)    ||
          r.plateNo.toLowerCase().includes(q)
        )
      )
    }
    return groups
  }, [allRows, search])

  const totalQty   = allRows.reduce((s, r) => s + r.qty, 0)
  const totalVol   = allRows.reduce((s, r) => s + r.totalVolume, 0)
  const totalDays  = dayGroups.length
  const hasMatData = allRows.some(r => r.matCode)

  // Table column layout
  const gridCols   = hasMatData ? '120px 90px 1fr 72px 1fr 56px 72px' : '120px 1fr 56px 72px'
  const minWidth   = hasMatData ? '680px' : '380px'
  const colHeaders = hasMatData
    ? ['Order No.', 'Mat Code', 'Description', 'Category', 'Ship To', 'Qty', 'CBM']
    : ['Order No.', 'Ship To', 'Qty', 'CBM']

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: C.bg, border: `1px solid ${C.border}` }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <div className="px-6 sm:px-8 pt-8 pb-8 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border}` }}>

        {/* Title section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
            <BarChart3 className="w-5 h-5" style={{ color: C.accent }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: C.textMuted }}>
                Accrual Report
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1" style={{ color: C.textPrimary }}>
                {monthLabel}
              </h2>
            </div>
          </div>
        </div>

        {/* Stats grid — shown when data exists */}
        {monthManifests.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <StatCard 
              label="Active Days" 
              value={String(totalDays)} 
              color={C.accent}
              icon={CalendarIcon}
            />
            <StatCard 
              label="Total Qty" 
              value={totalQty.toLocaleString()} 
              color={C.textPrimary}
              icon={Package}
            />
            {totalVol > 0 && (
              <StatCard 
                label="Total CBM" 
                value={totalVol.toFixed(2)} 
                color={C.amber}
                icon={TrendingUp}
              />
            )}
          </div>
        )}

        {/* Controls row */}
        <div className="flex gap-3 flex-wrap items-center"
          style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${C.border}` }}>

          {/* Month selector */}
          <div className="relative flex-shrink-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: C.textMuted }} />
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setExpandedDay(null) }}
              className="h-10 pl-10 pr-4 text-[13px] font-medium appearance-none cursor-pointer outline-none rounded-md transition-colors"
              style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSilver }}
              onFocus={e => (e.currentTarget.style.borderColor = C.inputFocus)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}
            >
              {availableMonths.length === 0 && <option value={selectedMonth}>{monthLabel}</option>}
              {availableMonths.map(m => {
                const [y, mo] = m.split('-').map(Number)
                return <option key={m} value={m}>{MONTH_NAMES[mo - 1]} {y}</option>
              })}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: C.textMuted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search DN, material, trucker…"
              className="w-full h-10 pl-10 pr-4 bg-transparent text-[13px] rounded-md focus:outline-none transition-all"
              style={{ border: `1px solid ${C.border}`, color: C.textSilver }}
              onFocus={e => {
                e.currentTarget.style.borderColor = C.inputFocus
                e.currentTarget.style.background = C.surface
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.background = 'transparent'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-60 p-1"
                style={{ color: C.textSub }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={() => exportAccrualExcel(dayGroups, monthLabel)}
            disabled={dayGroups.length === 0 || loading}
            className="flex items-center gap-2 px-4 h-10 text-[13px] font-bold rounded-md transition-all flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wide"
            style={{ background: C.accent, color: 'white', border: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.accentHover; e.currentTarget.style.boxShadow = `0 0 12px ${C.accentGlow}` }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.accent; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ══ LIST HEADER ═════════════════════════════════════════════════════════ */}
      {dayGroups.length > 0 && !loading && (
        <div className="grid px-6 sm:px-8 py-3.5 text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
          style={{
            gridTemplateColumns: '1fr 80px 64px 72px 20px',
            borderBottom: `1px solid ${C.border}`,
            background: `${C.surface}80`,
            color: C.textMuted,
          }}>
          <span>Dispatch Date</span>
          <span className="hidden sm:block text-center">DNs</span>
          <span className="text-right">Qty</span>
          <span className="text-right" style={{ color: C.amber }}>CBM</span>
          <span />
        </div>
      )}

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.accent }} />
            <div className="text-center">
              <p className="text-[14px] font-semibold" style={{ color: C.textPrimary }}>
                Fetching material data…
              </p>
              <p className="text-[12px] mt-1" style={{ color: C.textMuted }}>
                Please wait while we load your reports
              </p>
            </div>
          </div>
        )}

        {/* Empty month */}
        {!loading && monthManifests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${C.border}` }}>
              <TrendingUp className="w-8 h-8" style={{ color: C.accent }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: C.textPrimary }}>No manifests for {monthLabel}</p>
              <p className="text-[13px] mt-1 max-w-xs" style={{ color: C.textMuted }}>
                Dispatch manifests will appear here once you create and complete your first trip manifest.
              </p>
            </div>
          </div>
        )}

        {/* No search results */}
        {!loading && monthManifests.length > 0 && dayGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${C.border}` }}>
              <Search className="w-8 h-8" style={{ color: C.textSub }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: C.textPrimary }}>No results found</p>
              <p className="text-[13px] mt-1 max-w-xs" style={{ color: C.textMuted }}>
                No manifests match your search for "{search}"
              </p>
            </div>
            <button onClick={() => setSearch('')} className="px-4 py-2 rounded-md text-[12px] font-semibold mt-2 transition-all"
              style={{ background: 'rgba(232,25,44,0.1)', color: C.accent, border: `1px solid rgba(232,25,44,0.2)` }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,25,44,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,25,44,0.1)' }}>
              Clear search
            </button>
          </div>
        )}

        {/* Day rows */}
        {!loading && dayGroups.map(day => {
          const isOpen    = expandedDay === day.date
          const dayQty    = day.rows.reduce((s, r) => s + r.qty, 0)
          const dayVol    = day.rows.reduce((s, r) => s + r.totalVolume, 0)
          const uniqueDNs = [...new Set(day.rows.map(r => r.orderNo))].length

          return (
            <div key={day.date} 
              className="transition-all duration-200 mx-4 my-2 rounded-lg overflow-hidden"
              style={{ 
                border: `1px solid ${isOpen ? C.accent : C.border}`,
                background: isOpen ? 'rgba(232,25,44,0.04)' : 'transparent',
              }}>

              {/* ── Summary row (clickable) ── */}
              <button
                className="w-full text-left transition-all duration-150"
                style={{ background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                onClick={() => setExpandedDay(isOpen ? null : day.date)}
              >
                <div className="grid px-6 py-4 items-center"
                  style={{ gridTemplateColumns: '1fr 80px 64px 72px 20px' }}>

                  {/* Date + truck info */}
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: C.textPrimary }}>
                      {day.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {day.subGroups.map((sg, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide"
                          style={{ background: 'rgba(255,255,255,0.04)', color: C.textSilver, border: `1px solid ${C.border}` }}>
                          <Truck className="w-3 h-3 flex-shrink-0" />
                          <span className="font-mono">{sg.plateNo || sg.trucker || 'N/A'}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* DN count */}
                  <div className="hidden sm:block text-center">
                    <span className="inline-flex items-center justify-center text-[12px] font-bold px-2.5 py-1 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border: `1px solid ${C.border}` }}>
                      {uniqueDNs}
                    </span>
                  </div>

                  {/* Qty */}
                  <p className="text-right text-[18px] font-bold tabular-nums" style={{ color: C.textPrimary }}>
                    {dayQty.toLocaleString()}
                  </p>

                  {/* CBM */}
                  <p className="text-right text-[14px] font-bold tabular-nums" style={{ color: dayVol > 0 ? C.amber : C.textGhost }}>
                    {dayVol > 0 ? dayVol.toFixed(2) : '—'}
                  </p>

                  {/* Chevron */}
                  <ChevronRight className={`w-5 h-5 ml-auto transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`}
                    style={{ color: isOpen ? C.accent : C.textGhost }} />
                </div>
              </button>

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div className="px-6 pb-6" style={{ borderTop: `1px solid ${C.border}` }}>

                  {day.subGroups.map((sub, si) => (
                    <div key={si} className={si > 0 ? 'mt-6 pt-6 border-t' : 'mt-4'} style={si > 0 ? { borderColor: C.border } : {}}>

                      {/* Truck header with badge */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg flex-1"
                          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                          <Truck className="w-4 h-4 flex-shrink-0" style={{ color: C.accent }} />
                          <div className="min-w-0">
                            <span className="text-[12px] font-bold block" style={{ color: C.textPrimary }}>
                              {sub.trucker || 'Unknown Trucker'}
                            </span>
                            {sub.plateNo && (
                              <span className="text-[11px] font-mono" style={{ color: C.textSub }}>
                                {sub.plateNo} {sub.truckType && `· ${sub.truckType}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[12px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 uppercase tracking-wide"
                          style={{ background: 'rgba(255,255,255,0.04)', color: C.textSilver, border: `1px solid ${C.border}` }}>
                          {sub.rows.length} {sub.rows.length !== 1 ? 'items' : 'item'}
                        </span>
                      </div>

                      {/* Detail table */}
                      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>

                        {/* Table header */}
                        <div className="grid px-4 py-3 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            gridTemplateColumns: gridCols,
                            minWidth: minWidth,
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: `1px solid ${C.border}`,
                            color: C.textMuted,
                          }}>
                          {colHeaders.map(h => (
                            <span key={h} style={{ color: h === 'CBM' ? C.amber : C.textMuted }}>{h}</span>
                          ))}
                        </div>

                        {/* Data rows */}
                        {sub.rows.map((r, idx) => (
                          <div key={idx}
                            className="grid px-4 py-2.5 transition-all duration-100 group/row"
                            style={{
                              gridTemplateColumns: gridCols,
                              minWidth: minWidth,
                              background: idx % 2 === 0 ? C.stripeEven : C.stripeOdd,
                              borderBottom: idx < sub.rows.length - 1 ? `1px solid ${C.border}` : 'none',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover }}
                            onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.stripeEven : C.stripeOdd }}
                          >
                            {/* Order No */}
                            <span className="text-[12px] font-bold font-mono truncate"
                              style={{ color: C.accent }}>{r.orderNo}</span>

                            {hasMatData && <>
                              {/* Mat Code */}
                              <span className="text-[12px] font-mono truncate"
                                style={{ color: r.matCode ? C.textSilver : C.textGhost }}>
                                {r.matCode || '—'}
                              </span>

                              {/* Mat Desc */}
                              <span className="text-[12px] truncate pr-2"
                                style={{ color: r.matDesc ? C.textPrimary : C.textGhost }}>
                                {r.matDesc || '—'}
                              </span>

                              {/* Category */}
                              <span><CategoryPill category={r.category} /></span>
                            </>}

                            {/* Ship To */}
                            <span className="text-[12px] truncate" style={{ color: C.textSilver }}>
                              {r.shipToName}
                            </span>

                            {/* Qty */}
                            <span className="text-[13px] font-bold tabular-nums"
                              style={{ color: C.textPrimary }}>{r.qty}</span>

                            {/* CBM */}
                            <span className="text-[12px] tabular-nums font-medium"
                              style={{ color: r.totalVolume > 0 ? C.amber : C.textGhost }}>
                              {r.totalVolume > 0 ? r.totalVolume.toFixed(3) : '—'}
                            </span>
                          </div>
                        ))}

                        {/* Subtotal row */}
                        <div className="grid px-4 py-3"
                          style={{
                            gridTemplateColumns: gridCols,
                            minWidth: minWidth,
                            background: 'rgba(255,255,255,0.02)',
                            borderTop: `1px solid ${C.border}`,
                          }}>
                          <span className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: C.accent }}>Subtotal</span>
                          {hasMatData && <span />}
                          {hasMatData && <span />}
                          {hasMatData && <span />}
                          <span style={{ color: C.textMuted }} />
                          <span className="text-[13px] font-bold tabular-nums"
                            style={{ color: C.textPrimary }}>{sub.totalQty.toLocaleString()}</span>
                          <span className="text-[12px] font-bold tabular-nums"
                            style={{ color: sub.totalVol > 0 ? C.amber : C.textGhost }}>
                            {sub.totalVol > 0 ? sub.totalVol.toFixed(3) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Day summary */}
                  <div className="flex items-center justify-between mt-5 pt-4 px-2"
                    style={{ borderTop: `1px solid ${C.border}` }}>
                    <span className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
                      {uniqueDNs} document{uniqueDNs !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: C.textMuted }}>Day Qty</span>
                        <span className="text-[16px] font-bold tabular-nums"
                          style={{ color: C.textPrimary }}>{dayQty.toLocaleString()}</span>
                      </div>
                      {dayVol > 0 && (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: C.amber }}>Day CBM</span>
                          <span className="text-[16px] font-bold tabular-nums"
                            style={{ color: C.amber }}>{dayVol.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      {dayGroups.length > 0 && !loading && (
        <div className="flex-shrink-0 px-6 sm:px-8 py-3.5 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>

          <p className="text-[11px] font-medium" style={{ color: C.textMuted }}>
            {monthLabel} · <span style={{ color: C.textSub }}>{totalDays} dispatch day{totalDays !== 1 ? 's' : ''}</span>
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
              <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.textPrimary }}>
                {totalQty.toLocaleString()}
                <span className="text-[10px] font-normal ml-1" style={{ color: C.textMuted }}>pcs</span>
              </span>
            </div>
            {totalVol > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>CBM</span>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: C.amber }}>
                  {totalVol.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
