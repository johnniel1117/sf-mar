'use client'

import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Home, CheckCircle2,
  Search, Printer, AlertCircle, Package,
  X, ChevronRight, FileSpreadsheet, MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { getMaterialInfoFromMatcode } from '@/lib/category-mapping'

// ── Design tokens — identical to TripManifestForm / SavedManifestsTab ─────────
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface DNRefItem {
  materialCode: string
  materialDesc: string
  location: string
  division: string
  quantity: number
}

interface DNRefEntry {
  dnNo: string
  shipToName: string
  items: DNRefItem[]
}

interface BookingItem {
  materialCode: string
  customerModel: string
  quantity: number
  location: string
}

interface BookingEntry {
  dnNo: string
  rawDN: string
  shipToName: string
  dealer: string
  area: string
  items: BookingItem[]
}

interface ResolvedItem {
  materialCode: string
  customerModel: string
  materialDesc: string
  location: string
  division: string
  quantity: number
}

type DNRefMap   = Record<string, DNRefEntry>
type BookingMap = Record<string, BookingEntry>

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeDN(val: unknown): string {
  if (val == null) return ''
  const s = typeof val === 'number' ? String(Math.round(val)) : String(val)
  return s.trim().replace(/^0+/, '')
}

function padDN(val: unknown): string {
  return normalizeDN(val).padStart(10, '0')
}

// ── Excel parsers ──────────────────────────────────────────────────────────────

function parseDNInfo(wb: XLSX.WorkBook): DNRefMap {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const hdr  = (rows[0] as unknown[]) || []
  const idx  = (name: string) =>
    (hdr as unknown[]).findIndex((h) => h && String(h).toLowerCase().includes(name.toLowerCase()))

  const col = {
    dn:         idx('DN No'),
    matCode:    idx('Material Code'),
    matDesc:    idx('Material Desc'),
    orderQty:   idx('Order Qty'),
    location:   idx('Location'),
    division:   idx('Division'),
    shipToName: idx('Ship To Name'),
  }

  const map: DNRefMap = {}
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    if (!r[col.dn]) continue
    const dn = normalizeDN(r[col.dn])
    if (!map[dn]) {
      map[dn] = { dnNo: padDN(r[col.dn]), shipToName: String(r[col.shipToName] ?? ''), items: [] }
    }
    map[dn].items.push({
      materialCode: String(r[col.matCode] ?? ''),
      materialDesc: String(r[col.matDesc] ?? ''),
      location:     String(r[col.location] ?? ''),
      division:     String(r[col.division] ?? ''),
      quantity:     Number(r[col.orderQty]) || 0,
    })
  }
  return map
}

function parseBooking(wb: XLSX.WorkBook): BookingMap {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const hdr  = (rows[0] as unknown[]) || []
  const idx  = (name: string) =>
    (hdr as unknown[]).findIndex((h) => h && String(h).toLowerCase().includes(name.toLowerCase()))

  const col = {
    dn:     idx('DN NO'),
    shipTo: idx('Ship-to Name'),
    matNo:  idx('Material NO'),
    model:  idx('Customer Model'),
    qty:    idx('Sales order quantity'),
    loc:    idx('storage location'),
    dealer: idx('Sold-to-party Name'),
    area:   idx('AREA'),
  }

  const seen  = new Set<string>()
  const dnMap: BookingMap = {}

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    if (!r[col.dn]) continue
    const dn    = normalizeDN(r[col.dn])
    const matNo = String(r[col.matNo] ?? '').trim()
    const key   = `${dn}||${matNo}`
    if (seen.has(key)) continue
    seen.add(key)

    if (!dnMap[dn]) {
      dnMap[dn] = {
        dnNo:       padDN(r[col.dn]),
        rawDN:      dn,
        shipToName: String(r[col.shipTo] ?? ''),
        dealer:     String(r[col.dealer] ?? ''),
        area:       col.area >= 0 ? String(r[col.area] ?? '').trim() : '',
        items:      [],
      }
    }
    dnMap[dn].items.push({
      materialCode:  matNo,
      customerModel: String(r[col.model] ?? '').trim(),
      quantity:      Number(r[col.qty]) || 0,
      location:      String(r[col.loc] ?? 'PC8A').trim(),
    })
  }
  return dnMap
}

function buildItems(dn: BookingEntry, dnInfoMap: DNRefMap): ResolvedItem[] {
  const ref = dnInfoMap[dn.rawDN]
  return dn.items.map((bi) => {
    const ri = ref?.items.find((r) => r.materialCode.trim() === bi.materialCode.trim()) ?? null
    return {
      materialCode:  bi.materialCode,
      customerModel: bi.customerModel,
      materialDesc:  ri?.materialDesc ?? '',
      location:      ri?.location ?? bi.location,
      division:      ri?.division ?? '',
      quantity:      bi.quantity,
    }
  })
}

// ── PDF helpers ────────────────────────────────────────────────────────────────

const PDF_STYLES = `
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { height: 100%; }
  .container { width: 100%; min-height: 267mm; display: flex; flex-direction: column; }

  .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .logo-section img {
  height: 100px;
  width: auto;
  filter: brightness(0) saturate(100%) invert(27%) sepia(93%) saturate(500%) hue-rotate(190deg) brightness(95%);
}
  .doc-title { font-size: 20px; font-weight: bold; text-align: center; }
  .print-time { font-size: 10px; text-align: right; color: #333; }

  .dn-info-row { display: flex; align-items: center; border: 1.5px solid #000; margin-bottom: 18px; padding: 7px 12px; }
  .dn-label { font-weight: bold; font-size: 11px; margin-right: 6px; white-space: nowrap; }
  .dn-value { font-weight: bold; font-size: 13px; margin-right: 24px; }
  .dealer-label { font-weight: bold; font-size: 11px; margin-right: 6px; }
  .dealer-value { font-size: 11px; flex: 1; }
  .area-badge { font-size: 10px; font-weight: bold; margin-left: 16px; padding: 2px 8px; border: 1px solid #000; white-space: nowrap; }
  .sl-badge { font-weight: bold; font-size: 11px; margin-left: auto; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .data-table th { border: 1px solid #000; padding: 6px 8px; text-align: left; font-weight: bold; font-size: 11px; background: #fff; }
  .data-table td { border: 1px solid #000; padding: 10px 8px; font-size: 11px; vertical-align: middle; }
  .col-matcode { width: 120px; }
  .col-location { width: 70px; text-align: center !important; }
  .col-category { width: 110px; text-align: center !important; }
  .col-qty { width: 60px; text-align: center !important; }

  .spacer { flex: 1; min-height: 0; }

  .total-row { text-align: right; font-weight: bold; font-size: 11px; padding-right: 4px; margin-bottom: 40px; }

  .signature-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 40px; margin-bottom: 8px; }
  .signature-box { font-size: 11px; text-align: center; }
  .signature-space { height: 50px; }
  .signature-line { border-top: 1.5px solid #000; }
  .signature-label { font-weight: bold; font-size: 11px; margin-top: 6px; }

  .page-number { font-size: 10px; text-align: right; color: #333; margin-top: 6px; }
  
  @media print {
    html, body { height: auto !important; margin: 0 !important; }
    div:last-child { page-break-after: avoid !important; }
  }
`

function buildPageHtml(dn: BookingEntry, items: ResolvedItem[], printTime: string): string {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  const rowsHtml = items.map((item) => {
    const category = getMaterialInfoFromMatcode(item.materialCode).category
    return `
    <tr>
      <td class="col-matcode">${item.materialCode}</td>
      <td>${item.customerModel || item.materialDesc || '—'}</td>
      <td class="col-location" style="text-align:center">${item.location || 'PC8A'}</td>
      <td class="col-category" style="text-align:center">${category}</td>
      <td class="col-qty" style="text-align:center">${item.quantity}</td>
    </tr>`
  }).join('')

  const areaLabel = dn.area ? dn.area : 'N/A'

  return `
  <div class="container">

    <div class="header-section">
      <div class="logo-section">
        <img src="/haier2.png" alt="Haier" />
      </div>
      <div class="doc-title">Picking List</div>
      <div class="print-time">Print Time:&nbsp;&nbsp;${printTime}</div>
    </div>

    <div class="dn-info-row">
      <span class="dn-label">DN NO.</span>
      <span class="dn-value">${dn.dnNo}</span>
      <span class="dealer-label">Dealer/Ship</span>
      <span class="dealer-value">${dn.shipToName || dn.dealer || '—'}</span>
      <span class="area-badge">${areaLabel}</span>
      
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th class="col-matcode">Material Code</th>
          <th>Material Desc</th>
          <th class="col-location" style="text-align:center">Location</th>
          <th class="col-category" style="text-align:center">Category</th>
          <th class="col-qty" style="text-align:center">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="spacer"></div>

    <div class="total-row">Total Quantity/Bulk</div>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-line"></div>
        <div class="signature-label">Checked By</div>
      </div>
      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-line"></div>
        <div class="signature-label">Picked By</div>
      </div>
      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-line"></div>
        <div class="signature-label">Scanned By</div>
      </div>
    </div>

    <div class="page-number">Page 1 of 1</div>

  </div>`
}

// ── PDF print ──────────────────────────────────────────────────────────────────

function printPickingList(dn: BookingEntry, items: ResolvedItem[], printTime: string): void {
  const win = window.open('', '', 'width=1000,height=800')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html><head><title>Picking List - ${dn.dnNo}</title>
<style>${PDF_STYLES}</style>
</head><body>
${buildPageHtml(dn, items, printTime)}
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

function printAllPickingLists(toPrint: BookingEntry[], dnInfoMap: DNRefMap, printTime: string): void {
  const pages = toPrint.map((dn, i) => {
    const items = buildItems(dn, dnInfoMap)
    const isLast = i === toPrint.length - 1
    const style = isLast
      ? 'style="page-break-after:avoid"'
      : 'style="page-break-after:always"'
    return `<div ${style}>${buildPageHtml(dn, items, printTime)}</div>`
  }).join('\n')

  const win = window.open('', '', 'width=1000,height=800')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html><head><title>All Picking Lists</title>
<style>${PDF_STYLES}</style>
</head><body>
${pages}
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ── Drop Zone ──────────────────────────────────────────────────────────────────

interface DropZoneProps {
  label: string
  hint: string
  onFile: (file: File) => void
  loaded: boolean
  fileName: string | null
  step: string
}

function DropZone({ label, hint, onFile, loaded, fileName, step }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative flex-1 cursor-pointer transition-all duration-200"
      style={{
        border: `1px solid ${loaded ? 'rgba(34,197,94,0.4)' : dragging ? C.inputFocus : C.border}`,
        background: loaded ? 'rgba(34,197,94,0.04)' : dragging ? `${C.inputFocus}08` : C.surface,
        padding: '20px 18px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files?.[0]) onFile(e.target.files[0])
        }}
      />

      {/* Step badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-5 h-5 flex items-center justify-center text-[10px] font-bold"
          style={{
            background: loaded ? 'rgba(34,197,94,0.15)' : 'rgba(232,25,44,0.1)',
            border:     `1px solid ${loaded ? 'rgba(34,197,94,0.3)' : 'rgba(232,25,44,0.2)'}`,
            color:      loaded ? '#22c55e' : C.accent,
          }}
        >
          {loaded ? '✓' : step}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: C.textMuted }}>
          {loaded ? 'Loaded' : 'Required'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: loaded ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
            border:     `1px solid ${loaded ? 'rgba(34,197,94,0.25)' : C.border}`,
          }}
        >
          {loaded
            ? <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
            : <FileSpreadsheet className="w-4 h-4" style={{ color: C.textGhost }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-snug" style={{ color: loaded ? '#86efac' : C.textSilver }}>
            {loaded ? fileName : label}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
            {loaded ? 'Click to replace' : hint}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Area Badge component ───────────────────────────────────────────────────────

function AreaBadge({ area, size = 'sm' }: { area: string; size?: 'sm' | 'md' }) {
  const hasArea = !!area
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider ${size === 'md' ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'}`}
      style={{
        background: hasArea ? 'rgba(88,166,255,0.08)' : 'rgba(255,255,255,0.03)',
        border:     `1px solid ${hasArea ? 'rgba(88,166,255,0.25)' : C.border}`,
        color:      hasArea ? '#58A6FF' : C.textGhost,
        whiteSpace: 'nowrap',
      }}
    >
      <MapPin className={size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
      {hasArea ? area : 'N/A'}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PickingListMaker() {
  const [dnInfoMap,    setDnInfoMap]    = useState<DNRefMap | null>(null)
  const [dnInfoFile,   setDnInfoFile]   = useState<string | null>(null)
  const [bookingMap,   setBookingMap]   = useState<BookingMap | null>(null)
  const [bookingFile,  setBookingFile]  = useState<string | null>(null)
  const [matchedDNs,   setMatchedDNs]   = useState<BookingEntry[]>([])
  const [unmatchedDNs, setUnmatchedDNs] = useState<BookingEntry[]>([])
  const [processed,    setProcessed]    = useState(false)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())
  const [search,       setSearch]       = useState('')
  const [expandedDN,   setExpandedDN]   = useState<string | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '', type: 'success', show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
  }

  const readXLSX = (file: File): Promise<XLSX.WorkBook> =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        resolve(XLSX.read(e.target!.result, { type: 'array' }))
      }
      reader.readAsArrayBuffer(file)
    })

  const handleDNInfo = async (file: File) => {
    const wb = await readXLSX(file)
    setDnInfoMap(parseDNInfo(wb))
    setDnInfoFile(file.name)
    setProcessed(false)
    showToast('DN reference file loaded', 'success')
  }

  const handleBooking = async (file: File) => {
    const wb = await readXLSX(file)
    setBookingMap(parseBooking(wb))
    setBookingFile(file.name)
    setProcessed(false)
    showToast('Booking file loaded', 'success')
  }

  const handleProcess = () => {
    if (!dnInfoMap || !bookingMap) return
    const matched:   BookingEntry[] = []
    const unmatched: BookingEntry[] = []
    for (const [rawDN, dn] of Object.entries(bookingMap)) {
      if (dnInfoMap[rawDN]) matched.push(dn)
      else unmatched.push(dn)
    }
    setMatchedDNs(matched)
    setUnmatchedDNs(unmatched)
    setSelected(new Set(matched.map((d) => d.rawDN)))
    setProcessed(true)
    showToast(`${matched.length} DNs matched`, 'success')
  }

  const toggleSelect = (rawDN: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rawDN)) next.delete(rawDN)
      else next.add(rawDN)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === matchedDNs.length) setSelected(new Set())
    else setSelected(new Set(matchedDNs.map((d) => d.rawDN)))
  }

  const printTime = new Date().toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '')

  const canProcess = !!dnInfoMap && !!bookingMap

  const filtered = matchedDNs.filter(
    (dn) =>
      !search ||
      dn.dnNo.includes(search) ||
      dn.shipToName.toLowerCase().includes(search.toLowerCase()) ||
      dn.area.toLowerCase().includes(search.toLowerCase())
  )

  const totalSelectedQty = matchedDNs
    .filter((dn) => selected.has(dn.rawDN))
    .reduce((sum, dn) => {
      return sum + buildItems(dn, dnInfoMap ?? {}).reduce((s, i) => s + i.quantity, 0)
    }, 0)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: C.bg }}>

      {/* ── Top Nav ── */}
      <nav
        className="relative flex-shrink-0 h-[73px] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-4"
        style={{ background: C.bg, borderBottom: `1px solid ${C.divider}` }}
      >
        <Link
          href="/"
          className="p-2 rounded-full transition-colors flex-shrink-0"
          style={{ color: C.textSub }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.surfaceHover
            const svg = e.currentTarget.querySelector('svg') as SVGElement | null
            if (svg) svg.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            const svg = e.currentTarget.querySelector('svg') as SVGElement | null
            if (svg) svg.style.color = C.textSub
          }}
          title="Home"
        >
          <Home className="w-4 h-4 transition-colors" />
        </Link>

        <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: C.divider }} />

        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: C.divider }} />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block" style={{ color: C.textSub }}>
            Picking List
          </p>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total qty pill */}
          {processed && selected.size > 0 && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 flex-shrink-0"
              style={{ border: `1px solid ${C.inputFocus}40`, background: `${C.inputFocus}05` }}
            >
              <Package className="w-3.5 h-3.5" style={{ color: C.inputFocus }} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: C.inputFocus }}>
                Total Qty
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: C.textPrimary }}>
                {totalSelectedQty.toLocaleString()}
              </span>
            </div>
          )}

          {/* Selected count */}
          {processed && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 flex-shrink-0"
              style={{ border: `1px solid ${C.border}` }}
            >
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: C.textSub }}>
                Selected
              </span>
              <span className="text-[11px] tabular-nums font-bold" style={{ color: C.textPrimary }}>
                {selected.size} / {matchedDNs.length}
              </span>
            </div>
          )}

          {/* Print all */}
          {processed && (
            <button
              onClick={() => {
                const toPrint = matchedDNs.filter((dn) => selected.has(dn.rawDN))
                if (!toPrint.length || !dnInfoMap) return
                printAllPickingLists(toPrint, dnInfoMap, printTime)
              }}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
              style={{
                borderColor: selected.size > 0 ? C.accent : C.border,
                color:        selected.size > 0 ? C.accent : C.textSub,
                background:   selected.size > 0 ? `${C.accent}08` : 'transparent',
                cursor:       selected.size > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print All ({selected.size})</span>
              <span className="sm:hidden">Print</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 sm:p-8 lg:p-10">

          {/* ── Main card ── */}
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
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: C.amber }}>
                      Picking List Generator
                    </p>
                  </div>
                  <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-[#0D1117] text-white leading-[0.93] tracking-tight" style={{ color: C.textPrimary }}>
                    Generate Picking Lists
                  </h2>
                  <p className="text-[12px] mt-2" style={{color: C.textSilver }}>SF Express · Cebu Warehouse</p>
                </div>

                {processed && (
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.textMuted }}>Matched</p>
                      <p className="text-3xl font-black tabular-nums leading-none" style={{ color: '#22c55e' }}>
                        {matchedDNs.length}
                      </p>
                    </div>
                    {unmatchedDNs.length > 0 && (
                      <>
                        <div className="w-px h-10" style={{ background: C.divider }} />
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: C.textMuted }}>Not Found</p>
                          <p className="text-3xl font-black tabular-nums leading-none" style={{ color: C.textGhost }}>
                            {unmatchedDNs.length}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Step indicators */}
              <div className="flex items-center">
                {[
                  { n: 1, title: 'DN Reference',  short: 'Reference', done: !!dnInfoMap },
                  { n: 2, title: 'Booking File',  short: 'Booking',   done: !!bookingMap },
                  { n: 3, title: 'Match & Print', short: 'Print',     done: processed },
                ].map((step, idx) => {
                  const isActive =
                    (step.n === 1 && !dnInfoMap) ||
                    (step.n === 2 && !!dnInfoMap && !bookingMap) ||
                    (step.n === 3 && !!dnInfoMap && !!bookingMap && !processed)
                  return (
                    <div key={step.n} className="flex items-center flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 min-w-0">
                        <div
                          className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                          style={{
                            background: step.done
                              ? 'rgba(34,197,94,0.1)'
                              : isActive ? C.accent : 'transparent',
                            border: step.done
                              ? '1px solid rgba(34,197,94,0.3)'
                              : isActive ? 'none'
                              : `1px solid ${C.border}`,
                            color: step.done ? '#22c55e' : isActive ? '#fff' : C.textGhost,
                          }}
                        >
                          {step.done
                            ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            : <span className="text-[11px] font-bold">{step.n}</span>
                          }
                        </div>
                        <p
                          className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                          style={{ color: step.done ? '#22c55e' : isActive ? C.textPrimary : C.textMuted }}
                        >
                          <span className="sm:hidden">{step.short}</span>
                          <span className="hidden sm:inline">{step.title}</span>
                        </p>
                      </div>
                      {idx < 2 && (
                        <div className="flex-1 mx-2 sm:mx-4">
                          <div className="h-px transition-all duration-500"
                            style={{ background: step.done ? 'rgba(34,197,94,0.35)' : C.divider }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 sm:p-8 space-y-6">

              {/* Upload */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>
                  Upload Files
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <DropZone step="1" label="DN Reference File"      hint="DN_Info Excel (.xlsx)"  onFile={handleDNInfo}  loaded={!!dnInfoMap}  fileName={dnInfoFile}  />
                  <DropZone step="2" label="Booking / Picklist File" hint="Booking Excel (.xlsx)"  onFile={handleBooking} loaded={!!bookingMap} fileName={bookingFile} />
                </div>
              </div>

              {/* Match button */}
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 pb-1"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: C.textMuted }}>
                    Match &amp; Generate
                  </p>
                  <p className="text-[12px]" style={{ color: C.textGhost }}>
                    Cross-reference both files to find matching DN numbers
                  </p>
                </div>
                <button
                  onClick={handleProcess}
                  disabled={!canProcess}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-150 flex-shrink-0"
                  style={{
                    background:  canProcess ? C.accent : C.textGhost,
                    color:       '#fff',
                    cursor:      canProcess ? 'pointer' : 'not-allowed',
                    boxShadow:   canProcess ? `0 8px 24px ${C.accentGlow}` : 'none',
                    opacity:     canProcess ? 1 : 0.5,
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  Match &amp; Generate
                </button>
              </div>

              {/* Results */}
              {processed && (
                <div className="space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>

                  {/* Search + Select All */}
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: C.textSilver }} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search DN No., Ship To Name, or Area…"
                        className="w-full h-9 pl-9 pr-8 bg-transparent text-[13px] text-white focus:outline-none transition-colors"
                        style={{ border: `1px solid ${C.border}`, color: C.inputText }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.inputFocus)}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = C.border)}
                      />
                      {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors" style={{ color: C.textSilver }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={toggleAll}
                      className="h-9 px-4 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                      style={{ border: `1px solid ${C.border}`, color: C.textSub }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textPrimary }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}
                    >
                      {selected.size === matchedDNs.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Column headers */}
                  {filtered.length > 0 && (
                    <div
                      className="flex items-center gap-3 sm:gap-5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                      style={{ borderBottom: `1px solid ${C.divider}`, color: C.textSilver }}
                    >
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
                        <Search className="w-8 h-8" style={{color: C.textMuted}} />
                        <div>
                          <p className="font-[#0D1117] text-base" style={{color: C.textSilver}}>No results found</p>
                          <p className="text-[12px] text-[#666666] mt-1">Try adjusting your search</p>
                        </div>
                      </div>
                    )}

                    {filtered.map((dn) => {
                      const items      = buildItems(dn, dnInfoMap!)
                      const totalQty   = items.reduce((s, i) => s + i.quantity, 0)
                      const isSelected = selected.has(dn.rawDN)
                      const isExpanded = expandedDN === dn.rawDN

                      return (
                        <div
                          key={dn.rawDN}
                          className="group border-b transition-colors duration-150"
                          style={{
                            borderColor: C.divider,
                            background: isExpanded ? C.surfaceHover : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = C.surfaceHover }}
                          onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                        >
                          {/* Collapsed row */}
                          <div
                            className="flex items-center gap-3 sm:gap-5 px-4 py-5 cursor-pointer select-none"
                            onClick={() => setExpandedDN(isExpanded ? null : dn.rawDN)}
                          >
                            {/* Checkbox */}
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleSelect(dn.rawDN) }}
                              className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer text-white text-[12px]"
                              style={{
                                border:     `2px solid ${isSelected ? '#3b82f6' : C.border}`,
                                background: isSelected ? '#3b82f6' : 'transparent',
                              }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = C.borderHover }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = C.border }}
                            >
                              {isSelected ? '✓' : ''}
                            </div>

                            {/* Ship To + DN (mobile) */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[15px] font-[#0D1117] truncate leading-snug transition-colors group-hover:text-white"
                                style={{ color: C.textPrimary }}
                              >
                                {dn.shipToName}
                              </p>
                              {/* Mobile: show DN + Area below ship to */}
                              <div className="flex items-center gap-2 mt-1 sm:hidden">
                                <p className="text-[12px]" style={{ color: C.textSilver }}>
                                  {dn.dnNo}
                                </p>
                                <AreaBadge area={dn.area} size="sm" />
                              </div>
                            </div>

                            {/* DN No — desktop */}
                            <span className="hidden sm:block text-[11px] font-bold tabular-nums w-32 flex-shrink-0 transition-colors" style={{ color: C.textSilver }}>
                              {dn.dnNo}
                            </span>

                            {/* Area badge — desktop */}
                            <div className="hidden sm:flex w-28 flex-shrink-0">
                              <AreaBadge area={dn.area} size="sm" />
                            </div>

                            {/* Lines */}
                            <span className="w-10 text-center text-2xl font-[#0D1117] group-hover:text-white transition-colors tabular-nums flex-shrink-0" style={{ color: C.textPrimary }}>
                              {items.length}
                            </span>

                            {/* Qty */}
                            <span className="w-12 text-right text-2xl font-[#0D1117] group-hover:text-white transition-colors tabular-nums leading-none flex-shrink-0" style={{ color: C.textPrimary }}>
                              {totalQty}
                            </span>

                            {/* Chevron */}
                            <ChevronRight
                              className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'text-[#6E7681] group-hover:text-[#C9D1D9]'}`}
                              style={{color: isExpanded ? C.accent : undefined}}
                            />
                          </div>

                          {/* Expanded panel */}
                          {isExpanded && (
                            <div className="px-4 pb-6 sm:px-8" style={{ borderTop: `1px solid ${C.divider}` }}>

                              {/* Area display in expanded panel */}
                              <div className="flex items-center gap-3 mt-5 mb-5">
                                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textMuted }}>Area</span>
                                <AreaBadge area={dn.area} size="md" />
                              </div>

                              {/* Items table */}
                              <div className="mb-5 overflow-hidden" style={{ border: `1px solid ${C.divider}` }}>
                                <div
                                  className="grid grid-cols-4 py-3 px-3"
                                  style={{ background: '#1C2128', borderBottom: `1px solid ${C.divider}` }}
                                >
                                  {['Material Code', 'Description', 'Location', 'Qty'].map((h) => (
                                    <span key={h} className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textSilver }}>
                                      {h}
                                    </span>
                                  ))}
                                </div>
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="grid grid-cols-4 py-3.5 px-3 group/row transition-colors duration-100"
                                    style={{
                                      background: idx % 2 === 0 ? C.stripeEven : C.stripeOdd,
                                      borderBottom: idx < items.length - 1 ? `1px solid ${C.divider}` : 'none',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHover }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? C.stripeEven : C.stripeOdd }}
                                  >
                                    <span className="text-[11px] font-bold group-hover/row:text-[#58A6FF] transition-colors" style={{ color: C.textMuted }}>
                                      {item.materialCode}
                                    </span>
                                    <span className="text-[13px] truncate group-hover/row:text-white transition-colors" style={{ color: C.textPrimary }}>
                                      {item.customerModel || item.materialDesc || '—'}
                                    </span>
                                    <span className="text-[13px] hidden sm:block" style={{ color: C.textSilver }}>
                                      {item.location || '—'}
                                    </span>
                                    <span className="text-[13px] font-[#0D1117] text-white tabular-nums text-right sm:text-left">
                                      {item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Row actions */}
                              <div className="flex flex-wrap gap-3 items-center pt-2">
                                <button
                                  onClick={() => { if (dnInfoMap) printPickingList(dn, items, printTime) }}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all"
                                  style={{ border: `1px solid ${C.amber}40`, color: C.amber }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = `${C.amber}05`; e.currentTarget.style.borderColor = C.amber }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${C.amber}40` }}
                                >
                                  <Printer className="w-3.5 h-3.5" /> Print
                                </button>
                                <button
                                  onClick={() => toggleSelect(dn.rawDN)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all"
                                  style={{ border: `1px solid ${C.border}`, color: C.textPrimary }}
                                >
                                  {isSelected
                                    ? <><X className="w-3.5 h-3.5" /> Deselect</>
                                    : <><CheckCircle2 className="w-3.5 h-3.5" /> Select</>
                                  }
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
                    <div
                      className="p-4 sm:p-5 rounded-lg"
                      style={{ background: 'rgba(245,166,35,0.03)', border: `1px solid rgba(245,166,35,0.15)` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.amber }} />
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>
                          Not Found in Reference ({unmatchedDNs.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unmatchedDNs.map((dn) => (
                          <span
                            key={dn.rawDN}
                            className="px-3 py-1 text-[12px]"
                            style={{ background: 'rgba(245,166,35,0.06)', border: `1px solid rgba(245,166,35,0.15)`, color: C.textSub }}
                          >
                            {dn.dnNo} — {dn.shipToName || 'Unknown'}
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
        <div
          className="fixed bottom-6 right-6 px-5 py-3.5 shadow-2xl flex items-center gap-3 z-[100] border"
          style={{ backgroundColor: C.bg, borderColor: toast.type === 'success' ? '#22C55E' : C.accent }}
        >
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: toast.type === 'success' ? '#22C55E' : C.accent }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.textPrimary }}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast((p) => ({ ...p, show: false }))}
            className="ml-1 p-0.5 transition-colors"
            style={{ color: C.textSub }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceHover }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}