'use client'

import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Home, CheckCircle2,
  Search, Printer, AlertCircle, Package,
  X, ChevronRight, FileSpreadsheet, MapPin, Hash,
} from 'lucide-react'
import Link from 'next/link'
import { getMaterialInfoFromMatcode } from '@/lib/category-mapping'

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  inputFocus:   '#F5A623',
  stripeEven:   '#161B22',
  stripeOdd:    '#0D1117',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DNRefItem {
  materialCode: string
  materialDesc: string
  location:     string
  division:     string
  quantity:     number
  customerModel:string
  area:         string
  shipToName:   string
  dealer:       string
}

interface DNRefEntry {
  dnNo:       string
  rawDN:      string
  shipToName: string
  dealer:     string
  area:       string
  items:      DNRefItem[]
}

type DNRefMap = Record<string, DNRefEntry>

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDN(val: unknown): string {
  if (val == null) return ''
  const s = typeof val === 'number' ? String(Math.round(val)) : String(val)
  return s.trim().replace(/^0+/, '')
}

function padDN(val: unknown): string {
  return normalizeDN(val).padStart(10, '0')
}

function parseDNList(raw: string): string[] {
  return raw.split(/[\n,;]+/).map(s => s.trim().replace(/\s+/g, '')).filter(Boolean)
}

// ── DN Reference Excel parser ─────────────────────────────────────────────────
// Reads the DN_Info file — same as before

function parseDNInfo(wb: XLSX.WorkBook): DNRefMap {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const hdr  = (rows[0] as unknown[]) || []
  const idx  = (name: string) =>
    (hdr as unknown[]).findIndex(h => h && String(h).toLowerCase().includes(name.toLowerCase()))

  const col = {
    dn:            idx('DN No'),
    matCode:       idx('Material Code'),
    matDesc:       idx('Material Desc'),
    orderQty:      idx('Order Qty'),
    location:      idx('Location'),
    division:      idx('Division'),
    shipToName:    idx('Ship To Name'),
    customerModel: idx('Customer Model'),
    dealer:        idx('Sold-to'),
    area:          idx('AREA'),
  }

  const map: DNRefMap = {}
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    if (!r[col.dn]) continue
    const dn = normalizeDN(r[col.dn])
    if (!map[dn]) {
      map[dn] = {
        dnNo:       padDN(r[col.dn]),
        rawDN:      dn,
        shipToName: col.shipToName >= 0 ? String(r[col.shipToName] ?? '') : '',
        dealer:     col.dealer     >= 0 ? String(r[col.dealer]     ?? '') : '',
        area:       col.area       >= 0 ? String(r[col.area]       ?? '').trim() : '',
        items:      [],
      }
    }
    map[dn].items.push({
      materialCode:  String(r[col.matCode]       ?? ''),
      materialDesc:  String(r[col.matDesc]        ?? ''),
      location:      String(r[col.location]       ?? ''),
      division:      String(r[col.division]       ?? ''),
      quantity:      Number(r[col.orderQty])      || 0,
      customerModel: col.customerModel >= 0 ? String(r[col.customerModel] ?? '').trim() : '',
      area:          col.area          >= 0 ? String(r[col.area]          ?? '').trim() : '',
      shipToName:    col.shipToName    >= 0 ? String(r[col.shipToName]    ?? '') : '',
      dealer:        col.dealer        >= 0 ? String(r[col.dealer]        ?? '') : '',
    })
  }
  return map
}

// ── PDF ───────────────────────────────────────────────────────────────────────

const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { height: 100%; }
  .container { width: 100%; min-height: 267mm; display: flex; flex-direction: column; }
  .header-section { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; margin-bottom: 10px; padding-bottom: 10px; }
  .logo-section { text-align: center; display: inline-block; line-height: 1; }
  .logo-section img { height: 20px; width: auto; filter: brightness(0) saturate(100%); display: block; }
  .doc-title-block { text-align: center; }
  .doc-title { font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #000; }
  .doc-subtitle { font-size: 10px; color: #292929; margin-top: 4px; letter-spacing: 0.05em; font-family: 'DM Mono', monospace; }
  .print-time { font-family: 'DM Mono', monospace; font-size: 10px; color: #292929; text-align: right; line-height: 1.8; }
  .dn-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 10px; border: 1px solid #000; }
  .dn-cell { padding: 14px 18px; }
  .dn-cell + .dn-cell { border-left: 1px solid #000; }
  .dn-label { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #292929; margin-bottom: 5px; font-weight: 600; }
  .dn-value { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500; letter-spacing: -0.5px; }
  .dealer-value { font-size: 13px; }
  .tag-row { display: flex; gap: 8px; margin-top: 8px; }
  .tag { font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; border: 1px solid #000; padding: 3px 8px; display: inline-block; }
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .data-table th { padding: 10px 12px; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; text-align: left; color: #292929; }
  .data-table th.col-location, .data-table th.col-category, .data-table th.col-qty { text-align: center; }
  .data-table td { padding: 14px 12px; font-size: 12px; border-bottom: 0.5px solid #ddd; vertical-align: middle; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .col-matcode { width: 130px; font-family: 'DM Mono', monospace; font-size: 11px; color: #444; }
  .col-desc { width: 130px; font-family: 'DM Mono', monospace; font-size: 11px; color: #444; }
  .col-location { width: 70px; text-align: center !important; font-family: 'DM Mono', monospace; font-size: 11px; }
  .col-category { width: 120px; text-align: center !important; font-family: 'DM Mono', monospace; font-size: 11px; }
  .col-qty { width: 60px; text-align: center !important; font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; }
  .spacer { flex: 1; min-height: 0; }
  .total-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 12px; padding: 12px 12px 32px; }
  .total-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #292929; font-weight: 600; }
  .total-value { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; }
  .signature-section { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #000; margin-bottom: 16px; }
  .signature-box { padding: 14px 16px 10px; font-size: 11px; }
  .signature-box + .signature-box { border-left: 1px solid #000; }
  .signature-space { height: 48px; }
  .signature-line { border-top: 1px solid #000; margin-bottom: 8px; }
  .signature-label { font-size: 9px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #555; }
  .page-footer { display: flex; justify-content: space-between; align-items: center; }
  .doc-stamp { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #707070; font-weight: 500; }
  @media print { html, body { height: auto !important; margin: 0 !important; } div:last-child { page-break-after: avoid !important; } }
`

function buildPageHtml(entry: DNRefEntry, printTime: string, area: string): string {
  const items    = entry.items
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const areaLabel = area || entry.area || 'N/A'

  const rowsHtml = items.map(item => {
    const category = getMaterialInfoFromMatcode(item.materialCode).category
    return `
    <tr>
      <td class="col-matcode">${item.materialCode}</td>
      <td>${item.customerModel || item.materialDesc || '—'}</td>
      <td class="col-location">${item.location || 'PC8A'}</td>
      <td class="col-category" style="text-align:center">${category}</td>
      <td class="col-qty">${item.quantity}</td>
    </tr>`
  }).join('')

  return `
  <div class="container">
    <div class="header-section">
      <div class="logo-section"><img src="/haier3.png" alt="Haier" /></div>
      <div class="doc-title-block">
        <div class="doc-title">Picking List</div>
        <div class="doc-subtitle">SF EXPRESS CEBU WAREHOUSE</div>
      </div>
      <div class="print-time">Print Time<br>${printTime}</div>
    </div>
    <div class="dn-info-row">
      <div class="dn-cell">
        <div class="dn-label">DN Number</div>
        <div class="dn-value">${entry.dnNo}</div>
      </div>
      <div class="dn-cell">
        <div class="dn-label">Dealer / Ship To</div>
        <div class="dn-value dealer-value">${entry.shipToName || entry.dealer || '—'}</div>
        <div class="tag-row"><span class="tag">${areaLabel}</span></div>
      </div>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-matcode">Material Code</th>
          <th class="col-desc">Description</th>
          <th class="col-location">Location</th>
          <th class="col-category">Category</th>
          <th class="col-qty">Qty</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="spacer"></div>
    <div class="total-row">
      <span class="total-label">Total Quantity</span>
      <span class="total-value">${totalQty}</span>
    </div>
    <div class="signature-section">
      <div class="signature-box"><div class="signature-space"></div><div class="signature-line"></div><div class="signature-label">Checked By</div></div>
      <div class="signature-box"><div class="signature-space"></div><div class="signature-line"></div><div class="signature-label">Picked By</div></div>
      <div class="signature-box"><div class="signature-space"></div><div class="signature-line"></div><div class="signature-label">Scanned By</div></div>
    </div>
    <div class="page-footer">
      <span class="doc-stamp">PREPARED BY: JOHNNIEL MAR</span>
    </div>
  </div>`
}

function printPickingList(entry: DNRefEntry, printTime: string, area: string = ''): void {
  const win = window.open('', '', 'width=1000,height=800')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>Picking List - ${entry.dnNo}</title><style>${PDF_STYLES}</style></head><body>${buildPageHtml(entry, printTime, area)}</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

function printAllPickingLists(entries: DNRefEntry[], printTime: string, area: string = ''): void {
  const pages = entries.map((entry, i) => {
    const isLast = i === entries.length - 1
    return `<div style="${isLast ? '' : 'page-break-after:always'}">${buildPageHtml(entry, printTime, area)}</div>`
  }).join('\n')
  const win = window.open('', '', 'width=1000,height=800')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>All Picking Lists</title><style>${PDF_STYLES}</style></head><body>${pages}</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ── Drop Zone (DN Reference only) ─────────────────────────────────────────────

function DropZone({ onFile, loaded, fileName }: { onFile: (f: File) => void; loaded: boolean; fileName: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative cursor-pointer transition-all duration-200"
      style={{
        border:     `1px solid ${loaded ? 'rgba(34,197,94,0.4)' : dragging ? C.inputFocus : C.border}`,
        background: loaded ? 'rgba(34,197,94,0.04)' : dragging ? `${C.inputFocus}08` : C.surface,
        padding: '20px 18px',
      }}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />

      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold"
          style={{ background: loaded ? 'rgba(34,197,94,0.15)' : 'rgba(232,25,44,0.1)', border: `1px solid ${loaded ? 'rgba(34,197,94,0.3)' : 'rgba(232,25,44,0.2)'}`, color: loaded ? '#22c55e' : C.accent }}>
          {loaded ? '✓' : '1'}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: C.textMuted }}>
          {loaded ? 'Loaded' : 'Required'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: loaded ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${loaded ? 'rgba(34,197,94,0.25)' : C.border}` }}>
          {loaded
            ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
            : <FileSpreadsheet className="w-4 h-4" style={{ color: C.textGhost }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-snug" style={{ color: loaded ? '#86efac' : C.textSilver }}>
            {loaded ? fileName : 'DN Reference File'}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
            {loaded ? 'Click to replace' : 'DN_Info Excel (.xlsx)'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Area Badge ────────────────────────────────────────────────────────────────

function AreaBadge({ area, size = 'sm' }: { area: string; size?: 'sm' | 'md' }) {
  const hasArea = !!area
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider ${size === 'md' ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'}`}
      style={{ background: hasArea ? 'rgba(88,166,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hasArea ? 'rgba(88,166,255,0.25)' : C.border}`, color: hasArea ? '#58A6FF' : C.textGhost, whiteSpace: 'nowrap' }}
    >
      <MapPin className={size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
      {hasArea ? area : 'N/A'}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PickingListMaker() {
  const [dnInfoMap,    setDnInfoMap]    = useState<DNRefMap | null>(null)
  const [dnInfoFile,   setDnInfoFile]   = useState<string | null>(null)
  const [dnInput,      setDnInput]      = useState('')
  const [matchedDNs,   setMatchedDNs]   = useState<DNRefEntry[]>([])
  const [unmatchedDNs, setUnmatchedDNs] = useState<string[]>([])
  const [processed,    setProcessed]    = useState(false)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [search,       setSearch]       = useState('')
  const [expandedDN,   setExpandedDN]   = useState<string | null>(null)
  const [printArea,    setPrintArea]    = useState('')

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '', type: 'success', show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000)
  }

  const readXLSX = (file: File): Promise<XLSX.WorkBook> =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(XLSX.read(e.target!.result, { type: 'array' }))
      reader.readAsArrayBuffer(file)
    })

  const handleDNInfo = async (file: File) => {
    const wb = await readXLSX(file)
    setDnInfoMap(parseDNInfo(wb))
    setDnInfoFile(file.name)
    setProcessed(false)
    showToast('DN reference file loaded', 'success')
  }

  const handleMatch = () => {
    if (!dnInfoMap) return
    const requested = parseDNList(dnInput)
    if (!requested.length) { showToast('Enter at least one DN number', 'error'); return }

    const matched:   DNRefEntry[] = []
    const unmatched: string[]     = []

    for (const dn of requested) {
      // Try direct, strip-leading-zeros, and padded variants
      const entry = dnInfoMap[dn]
        ?? dnInfoMap[dn.replace(/^0+/, '')]
        ?? Object.values(dnInfoMap).find(e => e.rawDN.replace(/^0+/, '') === dn.replace(/^0+/, ''))
      if (entry) matched.push(entry)
      else unmatched.push(dn)
    }

    setMatchedDNs(matched)
    setUnmatchedDNs(unmatched)
    setSelected(new Set(matched.map(e => e.rawDN)))
    setProcessed(true)
    showToast(`${matched.length} DN${matched.length !== 1 ? 's' : ''} matched · ${unmatched.length} not found`, matched.length ? 'success' : 'error')
  }

  const toggleSelect = (rawDN: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(rawDN)) next.delete(rawDN); else next.add(rawDN)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === matchedDNs.length) setSelected(new Set())
    else setSelected(new Set(matchedDNs.map(d => d.rawDN)))
  }

  const printTime = new Date().toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '')

  const canProcess = !!dnInfoMap && !!dnInput.trim()

  const filtered = matchedDNs.filter(dn =>
    !search ||
    dn.dnNo.includes(search) ||
    dn.shipToName.toLowerCase().includes(search.toLowerCase()) ||
    dn.area.toLowerCase().includes(search.toLowerCase())
  )

  const totalSelectedQty = matchedDNs
    .filter(dn => selected.has(dn.rawDN))
    .reduce((sum, dn) => sum + dn.items.reduce((s, i) => s + i.quantity, 0), 0)

  const availableDNs = dnInfoMap ? Object.keys(dnInfoMap).length : 0

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: C.bg }}>

      {/* ── Nav ── */}
      <nav className="relative flex-shrink-0 h-[73px] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-4"
        style={{ background: C.bg, borderBottom: `1px solid ${C.divider}` }}>
        <Link href="/" className="p-2 rounded-full transition-colors flex-shrink-0" style={{ color: C.textSub }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHover; const svg = e.currentTarget.querySelector('svg') as SVGElement | null; if (svg) svg.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; const svg = e.currentTarget.querySelector('svg') as SVGElement | null; if (svg) svg.style.color = C.textSub }}
          title="Home">
          <Home className="w-4 h-4 transition-colors" />
        </Link>
        <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: C.divider }} />
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: C.divider }} />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block" style={{ color: C.textSub }}>Picking List</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 sm:gap-3">
          {processed && selected.size > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 flex-shrink-0"
              style={{ border: `1px solid ${C.inputFocus}40`, background: `${C.inputFocus}05` }}>
              <Package className="w-3.5 h-3.5" style={{ color: C.inputFocus }} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: C.inputFocus }}>Total Qty</span>
              <span className="text-[11px] tabular-nums" style={{ color: C.textPrimary }}>{totalSelectedQty.toLocaleString()}</span>
            </div>
          )}
          {processed && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 flex-shrink-0" style={{ border: `1px solid ${C.border}` }}>
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: C.textSub }}>Selected</span>
              <span className="text-[11px] tabular-nums font-bold" style={{ color: C.textPrimary }}>{selected.size} / {matchedDNs.length}</span>
            </div>
          )}
          {processed && (
            <button
              onClick={() => { const toPrint = matchedDNs.filter(dn => selected.has(dn.rawDN)); if (!toPrint.length) return; printAllPickingLists(toPrint, printTime, printArea) }}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
              style={{ borderColor: selected.size > 0 ? C.accent : C.border, color: selected.size > 0 ? C.accent : C.textSub, background: selected.size > 0 ? `${C.accent}08` : 'transparent', cursor: selected.size > 0 ? 'pointer' : 'not-allowed' }}>
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print All ({selected.size})</span>
              <span className="sm:hidden">Print</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="overflow-hidden rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>

            {/* Card header */}
            <div className="px-5 sm:px-8 pt-8 pb-7" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.accent }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.accent }} />
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: C.amber }}>Picking List Generator</p>
                  </div>
                  <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-[0.93] tracking-tight" style={{ color: C.textPrimary }}>
                    Generate Picking Lists
                  </h2>
                  <p className="text-[12px] mt-2" style={{ color: C.textSilver }}>SF Express · Cebu Warehouse</p>
                </div>
                {processed && (
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.textMuted }}>Matched</p>
                      <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#22c55e' }}>{matchedDNs.length}</p>
                    </div>
                    {unmatchedDNs.length > 0 && (
                      <>
                        <div className="w-px h-10" style={{ background: C.divider }} />
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.textMuted }}>Not Found</p>
                          <p className="text-3xl font-black tabular-nums leading-none" style={{ color: C.textGhost }}>{unmatchedDNs.length}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Steps */}
              <div className="flex items-center justify-center gap-0">
                {[
                  { n: 1, short: 'DN Reference', done: !!dnInfoMap },
                  { n: 2, short: 'Enter DNs',    done: !!dnInput.trim() },
                  { n: 3, short: 'Match & Print', done: processed },
                ].map((step, idx) => {
                  const isActive =
                    (step.n === 1 && !dnInfoMap) ||
                    (step.n === 2 && !!dnInfoMap && !dnInput.trim()) ||
                    (step.n === 3 && !!dnInfoMap && !!dnInput.trim() && !processed)
                  return (
                    <div key={step.n} className="flex items-center">
                      <div className="flex items-center gap-1.5 sm:gap-2.5">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                          style={{ background: step.done ? 'rgba(34,197,94,0.1)' : isActive ? C.accent : 'transparent', border: step.done ? '1px solid rgba(34,197,94,0.3)' : isActive ? 'none' : `1px solid ${C.border}`, color: step.done ? '#22c55e' : isActive ? '#fff' : C.textGhost }}>
                          {step.done ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <span className="text-[11px] font-bold">{step.n}</span>}
                        </div>
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                          style={{ color: step.done ? '#22c55e' : isActive ? C.textPrimary : C.textMuted }}>{step.short}</p>
                      </div>
                      {idx < 2 && (
                        <div className="w-12 sm:w-20 mx-2 sm:mx-4">
                          <div className="h-px transition-all duration-500" style={{ background: step.done ? 'rgba(34,197,94,0.35)' : C.divider }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 sm:p-8 space-y-6">

              {/* Step 1 — DN Reference upload */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>Step 1 — Upload DN Reference</p>
                <DropZone onFile={handleDNInfo} loaded={!!dnInfoMap} fileName={dnInfoFile} />
                {dnInfoMap && (
                  <div className="flex items-center justify-between px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: C.textGhost }} />
                      <span className="text-[11px]" style={{ color: C.textSub }}>
                        <span style={{ color: C.accent }}>{availableDNs}</span> DNs found in reference file
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 — DN number input */}
              <div className="space-y-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>Step 2 — Enter DN Numbers</p>
                  <span className="text-[10px]" style={{ color: C.textGhost }}>Separate by newline, comma, or semicolon</span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: C.textGhost }} />
                  <textarea
                    value={dnInput}
                    onChange={e => setDnInput(e.target.value)}
                    placeholder={'Enter DN numbers, one per line:\n\n0004500001\n0004500002\n0004500003'}
                    rows={6}
                    className="w-full pl-10 pr-4 py-3 text-[13px] outline-none resize-none transition-all font-mono"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textPrimary, lineHeight: '1.7' }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.inputFocus)}
                    onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                  />
                  {dnInput && (
                    <button onClick={() => { setDnInput(''); setProcessed(false) }} className="absolute right-3 top-3 p-1 transition-colors" style={{ color: C.textGhost }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textGhost)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {dnInput.trim() && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <Hash className="w-3.5 h-3.5" style={{ color: C.textGhost }} />
                    <span className="text-[11px]" style={{ color: C.textSub }}>
                      <span style={{ color: C.textPrimary }}>{parseDNList(dnInput).length}</span> DN numbers entered
                    </span>
                  </div>
                )}
              </div>

              {/* Match button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 pb-1"
                style={{ borderTop: `1px solid ${C.border}` }}>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: C.textMuted }}>Step 3 — Match &amp; Generate</p>
                  <p className="text-[12px]" style={{ color: C.textGhost }}>Look up each DN in the reference file and generate picking lists</p>
                </div>
                <button onClick={handleMatch} disabled={!canProcess}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-150 flex-shrink-0"
                  style={{ background: canProcess ? C.accent : C.textGhost, color: '#fff', cursor: canProcess ? 'pointer' : 'not-allowed', boxShadow: canProcess ? `0 8px 24px ${C.accentGlow}` : 'none', opacity: canProcess ? 1 : 0.5 }}>
                  <Search className="w-3.5 h-3.5" />
                  Match &amp; Generate
                </button>
              </div>

              {/* Results */}
              {processed && (
                <div className="space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>

                  {/* Area Input */}
                  <div className="p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold mb-1" style={{ color: C.textMuted }}>Area / Batch Name</p>
                        <p className="text-[12px]" style={{ color: C.textSub }}>Enter the area or batch name to be printed on the picking lists</p>
                      </div>
                      <div className="relative flex-1 sm:flex-none sm:w-64">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                        <input
                          value={printArea}
                          onChange={e => setPrintArea(e.target.value)}
                          placeholder="e.g., BATCH 1 CEBU AREA"
                          className="w-full h-10 pl-10 pr-4 text-[13px] outline-none transition-all font-mono"
                          style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.inputText }}
                          onFocus={e => (e.currentTarget.style.borderColor = C.inputFocus)}
                          onBlur={e => (e.currentTarget.style.borderColor = C.inputBorder)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search + Select All */}
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: C.textSilver }} />
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search DN No., Ship To Name, or Area…"
                        className="w-full h-9 pl-9 pr-8 bg-transparent text-[13px] focus:outline-none transition-colors"
                        style={{ border: `1px solid ${C.border}`, color: C.inputText }}
                        onFocus={e => (e.currentTarget.style.borderColor = C.inputFocus)}
                        onBlur={e  => (e.currentTarget.style.borderColor = C.border)} />
                      {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors" style={{ color: C.textSilver }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button onClick={toggleAll}
                      className="h-9 px-4 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                      style={{ border: `1px solid ${C.border}`, color: C.textSub }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textPrimary }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}>
                      {selected.size === matchedDNs.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Column headers */}
                  {filtered.length > 0 && (
                    <div className="flex items-center gap-3 sm:gap-5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                      style={{ borderBottom: `1px solid ${C.divider}`, color: C.textSilver }}>
                      <span className="w-5 flex-shrink-0" />
                      <span className="flex-1">Ship To</span>
                      <span className="hidden sm:block w-32 flex-shrink-0">DN No.</span>
                      <span className="hidden sm:block w-28 flex-shrink-0">Area</span>
                      <span className="w-10 text-center flex-shrink-0">Lines</span>
                      <span className="w-12 text-right flex-shrink-0">Qty</span>
                      <span className="w-4" />
                    </div>
                  )}

                  {/* DN rows */}
                  <div>
                    {filtered.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
                        <Search className="w-8 h-8" style={{ color: C.textMuted }} />
                        <div>
                          <p className="text-base" style={{ color: C.textSilver }}>No results found</p>
                          <p className="text-[12px] mt-1" style={{ color: C.textGhost }}>Try adjusting your search</p>
                        </div>
                      </div>
                    )}

                    {filtered.map(dn => {
                      const items      = dn.items
                      const totalQty   = items.reduce((s, i) => s + i.quantity, 0)
                      const isSelected = selected.has(dn.rawDN)
                      const isExpanded = expandedDN === dn.rawDN

                      return (
                        <div key={dn.rawDN} className="group border-b transition-colors duration-150"
                          style={{ borderColor: C.divider, background: isExpanded ? C.surfaceHover : 'transparent' }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.surfaceHover }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}>

                          {/* Collapsed row */}
                          <div className="flex items-center gap-3 sm:gap-5 px-4 py-5 cursor-pointer select-none"
                            onClick={() => setExpandedDN(isExpanded ? null : dn.rawDN)}>
                            {/* Checkbox */}
                            <div onClick={e => { e.stopPropagation(); toggleSelect(dn.rawDN) }}
                              className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer text-white text-[12px]"
                              style={{ border: `2px solid ${isSelected ? '#3b82f6' : C.border}`, background: isSelected ? '#3b82f6' : 'transparent' }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = C.borderHover }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = C.border }}>
                              {isSelected ? '✓' : ''}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold truncate leading-snug transition-colors group-hover:text-white" style={{ color: C.textPrimary }}>
                                {dn.shipToName || dn.dealer || '—'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 sm:hidden">
                                <p className="text-[12px]" style={{ color: C.textSilver }}>{dn.dnNo}</p>
                                <AreaBadge area={dn.area} size="sm" />
                              </div>
                            </div>

                            <span className="hidden sm:block text-[11px] font-bold tabular-nums w-32 flex-shrink-0 font-mono" style={{ color: C.textSilver }}>{dn.dnNo}</span>

                            <div className="hidden sm:flex w-28 flex-shrink-0">
                              <AreaBadge area={dn.area} size="sm" />
                            </div>

                            <span className="w-10 text-center text-2xl font-bold group-hover:text-white transition-colors tabular-nums flex-shrink-0" style={{ color: C.textPrimary }}>
                              {items.length}
                            </span>
                            <span className="w-12 text-right text-2xl font-bold group-hover:text-white transition-colors tabular-nums leading-none flex-shrink-0" style={{ color: C.textPrimary }}>
                              {totalQty}
                            </span>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                              style={{ color: isExpanded ? C.accent : C.textGhost }} />
                          </div>

                          {/* Expanded panel */}
                          {isExpanded && (
                            <div className="px-4 pb-6 sm:px-8" style={{ borderTop: `1px solid ${C.divider}` }}>
                              <div className="flex items-center gap-3 mt-5 mb-5">
                                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textMuted }}>Area</span>
                                <AreaBadge area={dn.area} size="md" />
                              </div>
                              <div className="mb-5 overflow-hidden" style={{ border: `1px solid ${C.divider}` }}>
                                <div className="grid grid-cols-4 py-3 px-3" style={{ background: '#1C2128', borderBottom: `1px solid ${C.divider}` }}>
                                  {['Material Code', 'Description', 'Location', 'Qty'].map(h => (
                                    <span key={h} className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textSilver }}>{h}</span>
                                  ))}
                                </div>
                                {items.map((item, idx) => (
                                  <div key={idx} className="grid grid-cols-4 py-3.5 px-3 group/row transition-colors duration-100"
                                    style={{ background: idx % 2 === 0 ? C.stripeEven : C.stripeOdd, borderBottom: idx < items.length - 1 ? `1px solid ${C.divider}` : 'none' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover }}
                                    onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? C.stripeEven : C.stripeOdd }}>
                                    <span className="text-[11px] font-bold group-hover/row:text-[#58A6FF] transition-colors" style={{ color: C.textMuted }}>{item.materialCode}</span>
                                    <span className="text-[13px] truncate group-hover/row:text-white transition-colors" style={{ color: C.textPrimary }}>{item.customerModel || item.materialDesc || '—'}</span>
                                    <span className="text-[13px] hidden sm:block" style={{ color: C.textSilver }}>{item.location || '—'}</span>
                                    <span className="text-[13px] font-bold text-white tabular-nums text-right sm:text-left">{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-3 items-center pt-2">
                                <button onClick={() => printPickingList(dn, printTime, printArea)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all"
                                  style={{ border: `1px solid ${C.amber}40`, color: C.amber }}
                                  onMouseEnter={e => { e.currentTarget.style.background = `${C.amber}05`; e.currentTarget.style.borderColor = C.amber }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${C.amber}40` }}>
                                  <Printer className="w-3.5 h-3.5" /> Print
                                </button>
                                <button onClick={() => toggleSelect(dn.rawDN)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all"
                                  style={{ border: `1px solid ${C.border}`, color: C.textPrimary }}>
                                  {isSelected
                                    ? <><X className="w-3.5 h-3.5" /> Deselect</>
                                    : <><CheckCircle2 className="w-3.5 h-3.5" /> Select</>}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Unmatched warning */}
                  {unmatchedDNs.length > 0 && (
                    <div className="p-4 sm:p-5" style={{ background: 'rgba(245,166,35,0.03)', border: `1px solid rgba(245,166,35,0.15)` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.amber }} />
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>
                          Not Found in Reference ({unmatchedDNs.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unmatchedDNs.map(dn => (
                          <span key={dn} className="px-3 py-1 text-[12px] font-mono"
                            style={{ background: 'rgba(245,166,35,0.06)', border: `1px solid rgba(245,166,35,0.15)`, color: C.textSub }}>
                            {dn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 px-5 py-3.5 shadow-2xl flex items-center gap-3 z-[100] border"
          style={{ backgroundColor: C.bg, borderColor: toast.type === 'success' ? '#22C55E' : C.accent }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: toast.type === 'success' ? '#22C55E' : C.accent }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textPrimary }}>{toast.message}</span>
          <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-1 p-0.5 transition-colors" style={{ color: C.textSub }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHover }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}