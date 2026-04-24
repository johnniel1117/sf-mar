'use client'

import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Home, CheckCircle2, Search, Printer, AlertCircle,
  X, ChevronRight, FileSpreadsheet, Download, Layers,
  Hash, Package,
} from 'lucide-react'
import Link from 'next/link'
import JsBarcode from 'jsbarcode'
import { getCategoryFromBinCode } from '../components/CategoryMapping'
import { MATCODE_CBM_MAP } from '../lib/category-mapping'

const getCBMFromMatcode = (code: string): number | null => {
  if (!code) return null
  return MATCODE_CBM_MAP[code] ?? MATCODE_CBM_MAP[code.toUpperCase()] ?? null
}

// ── Design tokens — identical to existing pages ───────────────────────────────
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
  stripeEven:   '#161B22',
  stripeOdd:    '#0D1117',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SerialRow {
  dnNo:          string
  orderItem:     string
  factoryCode:   string
  location:      string
  binCode:       string
  materialCode:  string
  materialDesc:  string
  barcode:       string
  materialType:  string
  productStatus: string
  shipTo:        string
  shipToName:    string
  shipToAddress: string
  soldTo:        string
  soldToName:    string
  scanBy:        string
  scanTime:      string
}

interface DNGroup {
  dnNo:         string
  shipToName:   string
  shipToAddress:string
  rows:         SerialRow[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDN(val: unknown): string {
  if (val == null) return ''
  const s = typeof val === 'number' ? String(Math.round(val)) : String(val)
  return s.trim().replace(/\s+/g, '')
}

function parseDNList(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map(s => s.trim().replace(/\s+/g, ''))
    .filter(Boolean)
}

// ── Excel parser ──────────────────────────────────────────────────────────────

function parseSerialExcel(wb: XLSX.WorkBook): SerialRow[] {
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const hdr  = (rows[0] as unknown[]) || []

  const idx = (terms: string[]) =>
    (hdr as unknown[]).findIndex(h =>
      h && terms.some(t => String(h).toLowerCase().trim().includes(t.toLowerCase()))
    )

  const col = {
    dnNo:          idx(['dn no', 'dn_no', 'dnno', 'order no', 'orderno']),
    orderItem:     idx(['order item', 'orderitem']),
    factoryCode:   idx(['factory code', 'factorycode']),
    location:      idx(['location', 'gi location']),
    binCode:       idx(['gr location', 'bin code', 'bincode']),
    materialCode:  idx(['material code', 'materialcode']),
    materialDesc:  idx(['material desc', 'material description', 'materialdesc']),
    barcode:       idx(['barcode', 'bar code', 'serial']),
    materialType:  idx(['material type', 'materialtype']),
    productStatus: idx(['product status', 'productstatus']),
    shipTo:        idx(['ship to', 'shipto']),
    shipToName:    idx(['ship to name', 'shiptoname', 'ship name']),
    shipToAddress: idx(['ship to address', 'shiptoaddress']),
    soldTo:        idx(['sold to', 'soldto']),
    soldToName:    idx(['sold to name', 'soldtoname']),
    scanBy:        idx(['scan by', 'scanby', 'create by', 'createby']),
    scanTime:      idx(['scan time', 'scantime', 'create date', 'createdate']),
  }

  const result: SerialRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] as unknown[]
    const matCode = String(r[col.materialCode] ?? '').trim()
    const barcode  = col.barcode >= 0 ? String(r[col.barcode] ?? '').trim() : ''
    if (!matCode && !barcode) continue

    const dnRaw = col.dnNo >= 0 ? normalizeDN(r[col.dnNo]) : ''

    result.push({
      dnNo:          dnRaw,
      orderItem:     col.orderItem     >= 0 ? String(r[col.orderItem]     ?? '') : '',
      factoryCode:   col.factoryCode   >= 0 ? String(r[col.factoryCode]   ?? '') : '',
      location:      col.location      >= 0 ? String(r[col.location]      ?? '') : '',
      binCode:       col.binCode       >= 0 ? String(r[col.binCode]       ?? '') : '',
      materialCode:  matCode,
      materialDesc:  col.materialDesc  >= 0 ? String(r[col.materialDesc]  ?? '') : '',
      barcode,
      materialType:  col.materialType  >= 0 ? String(r[col.materialType]  ?? '') : '',
      productStatus: col.productStatus >= 0 ? String(r[col.productStatus] ?? '') : '',
      shipTo:        col.shipTo        >= 0 ? String(r[col.shipTo]        ?? '') : '',
      shipToName:    col.shipToName    >= 0 ? String(r[col.shipToName]    ?? '') : '',
      shipToAddress: col.shipToAddress >= 0 ? String(r[col.shipToAddress] ?? '') : '',
      soldTo:        col.soldTo        >= 0 ? String(r[col.soldTo]        ?? '') : '',
      soldToName:    col.soldToName    >= 0 ? String(r[col.soldToName]    ?? '') : '',
      scanBy:        col.scanBy        >= 0 ? String(r[col.scanBy]        ?? '') : '',
      scanTime:      col.scanTime      >= 0 ? String(r[col.scanTime]      ?? '') : '',
    })
  }
  return result
}

function groupByDN(rows: SerialRow[]): Record<string, DNGroup> {
  const map: Record<string, DNGroup> = {}
  for (const row of rows) {
    if (!map[row.dnNo]) {
      map[row.dnNo] = {
        dnNo:          row.dnNo,
        shipToName:    row.shipToName,
        shipToAddress: row.shipToAddress,
        rows:          [],
      }
    }
    map[row.dnNo].rows.push(row)
    if (!map[row.dnNo].shipToName && row.shipToName) map[row.dnNo].shipToName = row.shipToName
    if (!map[row.dnNo].shipToAddress && row.shipToAddress) map[row.dnNo].shipToAddress = row.shipToAddress
  }
  return map
}



// ── PDF — exact same format as handleDownloadIndividualDNPDF ─────────────────

function generateBarcodeSVG(value: string): string {
  const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svgElement, value, { format: 'CODE128', width: 2, height: 60, displayValue: false })
  return svgElement.outerHTML
}

function formatDateShort(): string {
  return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function buildDNPageHtml(group: DNGroup): string {
  const rows = group.rows.filter(r => r.materialCode && r.barcode)
  const totalQuantity = rows.length

  const rowsHtml = rows.map((r, idx) => `
    <tr>
      <td style="text-align:center">${idx + 1}</td>
      <td style="text-align:center">${getCategoryFromBinCode(r.barcode).toUpperCase()}</td>
      <td style="text-align:center">${r.materialDesc || r.materialCode}</td>
      <td style="text-align:center;font-weight:bold">${r.barcode}</td>
      <td style="text-align:center">${getCBMFromMatcode(r.materialCode) != null ? getCBMFromMatcode(r.materialCode) : '—'}</td>
      <td></td>
    </tr>`).join('')

  return `
    <div class="header-section">
      <div>
        <img src="/sf.png" alt="SF Express Logo" style="height:60px;width:auto"/>
        <div style="font-size:9px;line-height:1.4;margin-top:5px"><strong>SF Express Warehouse</strong><br/>TINGUB, MANDAUE, CEBU</div>
      </div>
      <div style="text-align:right">
        <div class="dealer-copy">DEALER'S COPY</div>
        <div style="margin-top:8px">${generateBarcodeSVG(group.dnNo)}</div>
      </div>
    </div>
    <div class="document-header">
      <div class="doc-number">ORDER NO : ${group.dnNo}</div>
    </div>
    <div class="info-row"><div class="info-label">Client</div><div>HAIER PHILIPPINES INC.</div></div>
    <div class="info-row"><div class="info-label">Date</div><div>${formatDateShort()}</div></div>
    <div class="info-row"><div class="info-label">Customer</div><div>${group.shipToName || 'N/A'}</div></div>
    <div class="info-row"><div class="info-label">Address</div><div>${group.shipToAddress || ''}</div></div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:35px">NO.</th>
          <th style="width:110px">CATEGORY</th>
          <th style="width:240px">MATERIAL DESCRIPTION</th>
          <th style="width:180px">SERIAL NUMBER</th>
          <th style="width:60px">CBM</th>
          <th style="width:80px">REMARKS</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="footer-info" style="display:flex;gap:24px;">
      <div><strong>TOTAL QTY: ${totalQuantity}</strong></div>
      <div><strong>TOTAL CBM: ${rows.reduce((s, r) => { const c = getCBMFromMatcode(r.materialCode); return c != null ? s + c : s }, 0).toFixed(2)}</strong></div>
    </div>`
}

const PDF_STYLES = `
  @page{size:portrait;margin:10mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:15px;font-size:11px}
  .header-section{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #000}
  .dealer-copy{font-size:18px;font-weight:bold;letter-spacing:1px;color:#FF2C2C}
  .document-header{text-align:center;margin:15px 0}
  .doc-number{font-size:20px;font-weight:bold}
  .info-row{display:flex;gap:8px;margin-bottom:4px;font-size:10px}
  .info-label{font-weight:bold;width:80px}
  .data-table{width:100%;border-collapse:collapse;margin:15px 0;border:2px }
  .data-table th{border:1px solid #000;padding:8px 6px;font-weight:bold;font-size:10px;text-align:center;}
  .data-table td{border:1px solid #000;padding:6px;font-size:10px}
  .footer-info{margin:10px 0;font-size:11px}
  .separator{text-align:center;margin:15px 0;font-size:10px}
  @media print{body{margin:0;padding:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:portrait;margin:10mm}}
`

function printSerialLists(groups: DNGroup[]): void {
  const win = window.open('', '', 'width=1200,height=800')
  if (!win) return
  const pages = groups.map((g, i) => {
    const isLast = i === groups.length - 1
    return `<div style="${isLast ? '' : 'page-break-after:always'}">${buildDNPageHtml(g)}</div>`
  }).join('\n')
  win.document.write(`<!DOCTYPE html><html><head><title>Serial Lists</title><style>${PDF_STYLES}</style></head><body>${pages}</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ── Excel export ──────────────────────────────────────────────────────────────

function exportExcel(groups: DNGroup[]): void {
  const allRows = groups.flatMap(g =>
    g.rows.filter(r => r.barcode || r.materialCode).map(r => ({
      'DN No':            r.dnNo,
      'Location':         r.location,
      'Bin Code':         r.binCode,
      'Material Code':    r.materialCode,
      'Material Desc':    r.materialDesc,
      'Barcode':          r.barcode,
      'Ship To Name':     r.shipToName,
      'Ship To Address':  r.shipToAddress,
    }))
  )
  const ws = XLSX.utils.json_to_sheet(allRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Serial List')
  XLSX.writeFile(wb, 'Filtered_Serial_List.xlsx')
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (file: File) => void
  loaded: boolean
  fileName: string | null
}

function DropZone({ onFile, loaded, fileName }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
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
        background: loaded ? 'rgba(34,197,94,0.04)' : dragging ? `${C.inputFocus}10` : C.surface,
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
            {loaded ? fileName : 'Serial List Excel File'}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
            {loaded ? 'Click to replace' : 'Upload the full barcode / serial Excel (.xlsx)'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SerialListPrinter() {
  const [allRows,      setAllRows]      = useState<SerialRow[]>([])
  const [dnMap,        setDnMap]        = useState<Record<string, DNGroup>>({})
  const [fileName,     setFileName]     = useState<string | null>(null)
  const [dnInput,      setDnInput]      = useState('')
  const [matchedDNs,   setMatchedDNs]   = useState<DNGroup[]>([])
  const [unmatchedDNs, setUnmatchedDNs] = useState<string[]>([])
  const [processed,    setProcessed]    = useState(false)
  const [expandedDN,   setExpandedDN]   = useState<string | null>(null)
  const [search,       setSearch]       = useState('')

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '', type: 'success', show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3500)
  }

  const handleFile = async (file: File) => {
    try {
      const ab = await file.arrayBuffer()
      const wb = XLSX.read(ab)
      const rows = parseSerialExcel(wb)
      const grouped = groupByDN(rows)
      setAllRows(rows)
      setDnMap(grouped)
      setFileName(file.name)
      setProcessed(false)
      showToast(`Loaded ${rows.length} rows · ${Object.keys(grouped).length} DNs`, 'success')
    } catch {
      showToast('Error reading file. Check format.', 'error')
    }
  }

  const saveToSupabase = async (groups: DNGroup[]) => {
    for (const group of groups) {
      try {
        const rows = group.rows.filter(r => r.materialCode && r.barcode)
        const totalQuantity = rows.length

        // Build materialData summary per DN (grouped by materialCode)
        const matMap = new Map<string, { materialCode: string; materialDescription: string; qty: number; cbm: number | null }>()
        for (const r of rows) {
          const key = r.materialCode
          if (matMap.has(key)) matMap.get(key)!.qty += 1
          else matMap.set(key, { materialCode: r.materialCode, materialDescription: r.materialDesc, qty: 1, cbm: getCBMFromMatcode(r.materialCode) })
        }

        const isDN = group.dnNo.startsWith('DN') || group.dnNo.includes('-DN-')
        const totalCbm = rows.reduce((s, r) => { const c = getCBMFromMatcode(r.materialCode); return c != null ? s + c : s }, 0)
        const payload = {
          fileName:      group.dnNo,
          dnNo:          isDN ? group.dnNo : undefined,
          traNo:         !isDN ? group.dnNo : undefined,
          totalQuantity,
          totalCbm:      +totalCbm.toFixed(2),
          data:          Array.from(matMap.values()),
          serialData:    rows,
        }

        const response = await fetch('/api/save-excel-upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })

        if (!response.ok) {
          const error = await response.json()
          showToast(`Failed to save ${group.dnNo}: ${error.error}`, 'error')
        } else {
          showToast(`Saved ${group.dnNo} (Qty: ${totalQuantity} · CBM: ${totalCbm.toFixed(2)})`, 'success')
        }
      } catch (err) {
        showToast(`Error saving ${group.dnNo}: ${err instanceof Error ? err.message : 'Unknown'}`, 'error')
      }
    }
  }

  const handleMatch = () => {
    const requested = parseDNList(dnInput)
    if (!requested.length) { showToast('Enter at least one DN number', 'error'); return }

    const matched: DNGroup[] = []
    const unmatched: string[] = []

    for (const dn of requested) {
      // Try direct match first, then try stripping leading zeros both ways
      const group = dnMap[dn]
        ?? dnMap[dn.replace(/^0+/, '')]
        ?? Object.values(dnMap).find(g => g.dnNo.replace(/^0+/, '') === dn.replace(/^0+/, ''))
      if (group) matched.push(group)
      else unmatched.push(dn)
    }

    setMatchedDNs(matched)
    setUnmatchedDNs(unmatched)
    setProcessed(true)
    showToast(`${matched.length} matched · ${unmatched.length} not found`, matched.length ? 'success' : 'error')
    if (matched.length > 0) saveToSupabase(matched)
  }



  const canMatch = !!fileName && !!dnInput.trim()

  const filtered = matchedDNs.filter(g =>
    !search ||
    g.dnNo.toLowerCase().includes(search.toLowerCase()) ||
    g.shipToName.toLowerCase().includes(search.toLowerCase())
  )

  const totalQty = matchedDNs.reduce((s, g) => s + g.rows.filter(r => r.barcode || r.materialCode).length, 0)

  const availableDNs = Object.keys(dnMap)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: C.bg }}>

      {/* ── Nav ── */}
      <nav className="relative flex-shrink-0 h-[73px] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-4"
        style={{ background: C.bg, borderBottom: `1px solid ${C.divider}` }}>
        <Link href="/" className="p-2 rounded-full transition-colors flex-shrink-0" style={{ color: C.textSub }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.surfaceHover }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }} title="Home">
          <Home className="w-4 h-4 transition-colors" />
        </Link>
        <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{ backgroundColor: C.divider }} />
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 hidden sm:block" style={{ backgroundColor: C.divider }} />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block" style={{ color: C.textSub }}>
            Serial List Printer
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 sm:gap-3">
          {processed && matchedDNs.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 flex-shrink-0"
              style={{ border: `1px solid rgba(245,166,35,0.3)`, background: 'rgba(245,166,35,0.05)' }}>
              <Package className="w-3.5 h-3.5" style={{ color: C.amber }} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: C.amber }}>Total Qty</span>
              <span className="text-[11px] tabular-nums" style={{ color: C.textPrimary }}>{totalQty}</span>
            </div>
          )}
          {processed && matchedDNs.length > 0 && (
            <>
              <button
                onClick={() => exportExcel(matchedDNs)}
                className="flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
                style={{ borderColor: C.border, color: C.textSub }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textPrimary }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => printSerialLists(matchedDNs)}
                className="flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
                style={{ borderColor: C.accent, color: C.accent, background: `${C.accent}08` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}18` }}
                onMouseLeave={e => { e.currentTarget.style.background = `${C.accent}08` }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print All ({matchedDNs.length})</span>
                <span className="sm:hidden">Print</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="overflow-hidden rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>

            {/* Header */}
            <div className="px-5 sm:px-8 pt-8 pb-7" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.accent }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.accent }} />
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: C.amber }}>
                      Serial List Printer
                    </p>
                  </div>
                  <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-[0.93] tracking-tight" style={{ color: C.textPrimary }}>
                    Print by DN Number
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
                  { n: 1, short: 'Upload Excel', done: !!fileName },
                  { n: 2, short: 'Enter DNs',    done: !!dnInput.trim() },
                  { n: 3, short: 'Print',        done: processed },
                ].map((step, i) => {
                  const isActive = (step.n === 1 && !fileName) || (step.n === 2 && !!fileName && !dnInput.trim()) || (step.n === 3 && !!fileName && !!dnInput.trim() && !processed)
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
                      {i < 2 && (
                        <div className="w-12 sm:w-20 mx-2 sm:mx-4">
                          <div className="h-px transition-all duration-500" style={{ background: step.done ? 'rgba(34,197,94,0.35)' : C.divider }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-8 space-y-6">

              {/* Step 1: Upload */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>Step 1 — Upload File</p>
                <DropZone onFile={handleFile} loaded={!!fileName} fileName={fileName} />
                {fileName && (
                  <div className="flex items-center justify-between px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" style={{ color: C.textGhost }} />
                      <span className="text-[11px]" style={{ color: C.textSub }}>
                        <span style={{ color: C.accent }}>{availableDNs.length}</span> DNs found in file
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: C.textSub }}>
                      <span style={{ color: C.textPrimary }}>{allRows.length}</span> rows total
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: DN Input */}
              <div className="space-y-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>Step 2 — Enter DN Numbers</p>
                  <span className="text-[10px]" style={{ color: C.textGhost }}>
                    Separate by newline, comma, or semicolon
                  </span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3.5 w-4 h-4" style={{ color: C.textGhost }} />
                  <textarea
                    value={dnInput}
                    onChange={e => setDnInput(e.target.value)}
                    placeholder={"Enter DN numbers, one per line:\n\n0004500001\n0004500002\n0004500003"}
                    rows={6}
                    className="w-full pl-10 pr-4 py-3 text-[13px] outline-none resize-none transition-all font-mono"
                    style={{
                      background:   C.surface,
                      border:       `1px solid ${C.border}`,
                      color:        C.textPrimary,
                      lineHeight:   '1.7',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                  />
                  {dnInput && (
                    <button onClick={() => { setDnInput(''); setProcessed(false) }}
                      className="absolute right-3 top-3 p-1 transition-colors" style={{ color: C.textGhost }}
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
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: C.textMuted }}>Step 3 — Match &amp; Print</p>
                  <p className="text-[12px]" style={{ color: C.textGhost }}>Find serial rows for the entered DN numbers</p>
                </div>
                <button onClick={handleMatch} disabled={!canMatch}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-150 flex-shrink-0"
                  style={{ background: canMatch ? C.accent : C.textGhost, color: '#fff', cursor: canMatch ? 'pointer' : 'not-allowed', boxShadow: canMatch ? `0 8px 24px ${C.accentGlow}` : 'none', opacity: canMatch ? 1 : 0.5 }}>
                  <Search className="w-3.5 h-3.5" />
                  Match DNs
                </button>
              </div>

              {/* Results */}
              {processed && (
                <div className="space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>

                  {/* Search + actions */}
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: C.textSilver }} />
                      <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search DN, Ship To…"
                        className="w-full h-9 pl-9 pr-8 bg-transparent text-[13px] focus:outline-none transition-colors"
                        style={{ border: `1px solid ${C.border}`, color: C.inputText }}
                        onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={e  => (e.currentTarget.style.borderColor = C.border)} />
                      {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: C.textSilver }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column headers */}
                  {filtered.length > 0 && (
                    <div className="flex items-center gap-3 sm:gap-5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
                      style={{ borderBottom: `1px solid ${C.divider}`, color: C.textSilver }}>
                      <span className="flex-1">Ship To</span>
                      <span className="hidden sm:block w-36 flex-shrink-0">DN No.</span>
                      <span className="w-12 text-center flex-shrink-0">Rows</span>
                      <span className="w-16 flex-shrink-0" />
                    </div>
                  )}

                  {/* DN rows */}
                  <div>
                    {filtered.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Search className="w-8 h-8" style={{ color: C.textMuted }} />
                        <div className="text-center">
                          <p className="text-base font-semibold" style={{ color: C.textSilver }}>No results found</p>
                          <p className="text-[12px] mt-1" style={{ color: C.textGhost }}>Try adjusting your search</p>
                        </div>
                      </div>
                    )}

                    {filtered.map(group => {
                      const rows = group.rows.filter(r => r.barcode || r.materialCode)
                      const isExpanded = expandedDN === group.dnNo

                      return (
                        <div key={group.dnNo} className="group border-b transition-colors duration-150"
                          style={{ borderColor: C.divider, background: isExpanded ? C.surfaceHover : 'transparent' }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.surfaceHover }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}>

                          {/* Row */}
                          <div className="flex items-center gap-3 sm:gap-5 px-4 py-5 cursor-pointer select-none"
                            onClick={() => setExpandedDN(isExpanded ? null : group.dnNo)}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold truncate leading-snug group-hover:text-white transition-colors" style={{ color: C.textPrimary }}>
                                {group.shipToName || '—'}
                              </p>
                              <p className="text-[12px] mt-0.5 sm:hidden" style={{ color: C.textSilver }}>{group.dnNo}</p>
                            </div>
                            <span className="hidden sm:block text-[11px] font-bold tabular-nums w-36 flex-shrink-0 font-mono" style={{ color: C.textSilver }}>{group.dnNo}</span>
                            <span className="w-12 text-center text-2xl font-bold group-hover:text-white transition-colors tabular-nums flex-shrink-0" style={{ color: C.textPrimary }}>{rows.length}</span>
                            <div className="flex items-center gap-2 w-16 flex-shrink-0 justify-end">
                              <button
                                onClick={e => { e.stopPropagation(); printSerialLists([group]) }}
                                className="p-1.5 transition-colors"
                                style={{ color: C.textGhost, border: `1px solid ${C.border}` }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.color = C.amber }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textGhost }}
                                title="Print this DN">
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                style={{ color: isExpanded ? C.accent : C.textGhost }} />
                            </div>
                          </div>

                          {/* Expanded */}
                          {isExpanded && (
                            <div className="px-4 pb-6 sm:px-8" style={{ borderTop: `1px solid ${C.divider}` }}>
                              {group.shipToAddress && (
                                <p className="text-[11px] mt-4 mb-3" style={{ color: C.textMuted }}>{group.shipToAddress}</p>
                              )}
                              <div className="mt-4 mb-5 overflow-hidden" style={{ border: `1px solid ${C.divider}` }}>
                                <div className="grid px-3 py-3" style={{ gridTemplateColumns: '40px 1fr 1fr 140px 80px', background: '#1C2128', borderBottom: `1px solid ${C.divider}` }}>
                                  {['#', 'Material Code', 'Description', 'Barcode / Serial', 'Location'].map(h => (
                                    <span key={h} className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.textSilver }}>{h}</span>
                                  ))}
                                </div>
                                {rows.map((r, i) => (
                                  <div key={i} className="grid px-3 py-3 transition-colors"
                                    style={{ gridTemplateColumns: '40px 1fr 1fr 140px 80px', background: i % 2 === 0 ? C.stripeEven : C.stripeOdd, borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.surfaceHover }}
                                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? C.stripeEven : C.stripeOdd }}>
                                    <span className="text-[11px]" style={{ color: C.textGhost }}>{i + 1}</span>
                                    <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>{r.materialCode}</span>
                                    <span className="text-[13px] truncate" style={{ color: C.textPrimary }}>{r.materialDesc || '—'}</span>
                                    <span className="text-[11px] font-mono font-bold" style={{ color: C.accent }}>{r.barcode || '—'}</span>
                                    <span className="text-[11px]" style={{ color: C.textSub }}>{r.location || r.binCode || '—'}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-3 pt-2">
                                <button onClick={() => printSerialLists([group])}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all"
                                  style={{ border: `1px solid ${C.amber}40`, color: C.amber }}
                                  onMouseEnter={e => { e.currentTarget.style.background = `${C.amber}05`; e.currentTarget.style.borderColor = C.amber }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${C.amber}40` }}>
                                  <Printer className="w-3.5 h-3.5" /> Print This DN
                                </button>
                                <button onClick={() => exportExcel([group])}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all"
                                  style={{ border: `1px solid ${C.border}`, color: C.textSub }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textPrimary }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}>
                                  <Download className="w-3.5 h-3.5" /> Export Excel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary footer */}
                  {filtered.length > 1 && (
                    <div className="flex items-center gap-5 py-4 px-4" style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textGhost }}>Grand Total</span>
                      <span className="text-[10px]" style={{ color: C.textGhost }}>·</span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: C.textPrimary }}>
                        {filtered.reduce((s, g) => s + g.rows.filter(r => r.barcode || r.materialCode).length, 0)} rows
                      </span>
                      <span className="text-[10px]" style={{ color: C.textGhost }}>·</span>
                      <span className="text-[11px] tabular-nums" style={{ color: C.textSub }}>
                        {filtered.length} DN{filtered.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Unmatched */}
                  {unmatchedDNs.length > 0 && (
                    <div className="p-4 sm:p-5" style={{ background: 'rgba(245,166,35,0.03)', border: `1px solid rgba(245,166,35,0.15)` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.amber }} />
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>
                          Not Found in Excel ({unmatchedDNs.length})
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
          <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-1 p-0.5 transition-colors" style={{ color: C.textSub }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}