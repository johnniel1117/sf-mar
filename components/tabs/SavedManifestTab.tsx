'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Eye, Download, Edit, Trash2, Calendar, FileText,
  ChevronDown, Search, X, BarChart2, ChevronRight,
  Truck, User, Hash, Clock, Package, ArrowUpRight, Boxes,
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

  stripeEven:   '#161B22',   // slightly lighter than bg — the "filled" stripe
  stripeOdd:    '#0D1117',   // same as bg — the "empty" stripe
}


const MONTHS = [
  'All Months','January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const stripLeadingZeros = (val: string | undefined) =>
  val ? val.replace(/^0+/, '') : '—'

// Material descriptions aren't stored on the saved manifest — they live in
// excel_uploads.serial_data (SerialEntry.materialDesc), the same source the
// detailed PDF pulls from via fetchSerialData(). So descriptions are fetched
// live per manifest (see the effect in ManifestRow below) and cached here as
// documentNumber -> materialCode -> description.
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
        className="h-9 px-3 sm:px-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap" style={{border: `1px solid ${C.border}`, color: C.textSub}}
      >
        <Calendar className="w-3 h-3 flex-shrink-0" style={{color: C.accent}} />
        <span className="hidden sm:inline">{selectedMonth}</span>
        <span className="sm:hidden">{selectedMonth === 'All Months' ? 'Month' : selectedMonth.slice(0, 3)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-[#0D1117] shadow-2xl z-50 max-h-60 overflow-y-auto py-1" style={{background: C.bg, borderColor: C.border}}>
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
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  // Which order/item row has its material breakdown open (index within manifest.items).
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  // documentNumber -> materialCode -> description, fetched live from
  // excel_uploads.serial_data the first time this manifest is opened.
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

  // Auto-open the order that matches an active search (e.g. a material code hit).
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
        {/* Index */}
        <span className="hidden sm:block text-[11px] font-bold w-5 flex-shrink-0 transition-colors" style={{color: C.textMuted}}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-[#0D1117] truncate group-hover:text-white transition-colors leading-snug" style={{color: C.textPrimary}}>
            {manifestId}
          </p>
          <p className="text-[12px] mt-0.5 truncate transition-colors" style={{color: C.textSilver}}>
            {manifest.trucker ? `${manifest.trucker} · ` : ''}
            {manifest.driver_name || 'No driver'}
            {manifest.plate_no ? ` · ${manifest.plate_no}` : ''}
          </p>
        </div>

        {/* Date */}
        <span className="hidden sm:block text-[11px] font-bold transition-colors flex-shrink-0 w-28 text-right tabular-nums" style={{color: C.textSilver}}>
          {manifestDate}
        </span>

        {/* Qty */}
        <span className="flex-shrink-0 text-2xl font-[#0D1117] group-hover:text-white transition-colors tabular-nums w-12 text-right leading-none" style={{color: C.textPrimary}}>
          {totalQty}
        </span>

        {/* Docs */}
        <span className="hidden sm:block flex-shrink-0 text-[11px] font-bold w-10 text-center tabular-nums uppercase tracking-widest" style={{color: C.textSilver}}>
          {totalDocs}d
        </span>

        {/* Chevron */}
        <ChevronRight
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : 'text-[#6E7681] group-hover:text-[#C9D1D9]'}`}
            style={{color: expanded ? C.accent : undefined}}
        />

        {/* Delete */}
        {!isViewer && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-shrink-0 p-1.5 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            style={{color: '#6E7681'}}
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
        <div className="px-5 sm:px-8 py-6 sm:py-8" style={{borderTop: `1px solid ${C.divider}`}}>

          {/* Items table */}
          {(manifest.items?.length ?? 0) > 0 && (
            <div className="mb-7 sm:mb-8 overflow-hidden" style={{border: `1px solid ${C.divider}`}}>
              {/* Table header */}
              <div
                className="grid grid-cols-5 py-3 px-3"
                style={{background: '#1C2128', borderBottom: `1px solid ${C.divider}`}}
              >
                {['#', 'Ship To', 'DN / TRA', 'Qty', 'Disp.'].map(h => (
                  <span key={h} className="text-[10px] uppercase tracking-widest font-bold" style={{color: C.textSilver}}>{h}</span>
                ))}
              </div>

              {/* Striped rows */}
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
                      <span className="flex items-center gap-1 text-[11px] font-bold group-hover/row:text-[#C1F85C] transition-colors" style={{color: C.textMuted}}>
                        {hasMaterials && (
                          <ChevronDown
                            className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isItemExpanded ? 'rotate-180' : ''}`}
                            style={{color: isItemExpanded ? C.accent : C.textMuted}}
                          />
                        )}
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[13px] font-semibold truncate group-hover/row:text-white transition-colors col-span-1 sm:col-span-1" style={{color: C.textPrimary}}>
                        {item.ship_to_name || '—'}
                      </span>
                      <span className="text-[13px] truncate hidden sm:block" style={{color: C.textSilver}}>
                        {stripLeadingZeros(item.document_number)}
                      </span>
                      <span className="text-[13px] font-[#0D1117] text-white tabular-nums text-right sm:text-left">
                        {item.total_quantity ?? 0}
                      </span>
                      <span className="text-[13px] font-[#0D1117] tabular-nums text-right sm:text-left" style={{color: isShort ? C.amber : 'white'}}>
                        {dispatchedQty}
                      </span>
                    </div>

                    {/* Material code / description dropdown for this order */}
                    {isItemExpanded && hasMaterials && (
                      <div
                        className="px-3 pt-1 pb-3"
                        style={{
                          background: rowBg,
                          borderBottom: idx < manifest.items!.length - 1 ? `1px solid ${C.divider}` : 'none',
                        }}
                      >
                        <div className="overflow-hidden" style={{border: `1px solid ${C.divider}`, background: C.bg}}>
                          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] py-2 px-3" style={{background: '#1C2128'}}>
                            <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5" style={{color: C.textSilver}}>
                              
                              Material Code
                            </span>
                            <span className="text-[9px] uppercase tracking-widest font-bold" style={{color: C.textSilver}}>Material Description</span>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-right" style={{color: C.textSilver}}>Qty</span>
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
                                <span className="text-[12px] font-semibold truncate" style={{color: C.textPrimary}}>{code}</span>
                                <span className="text-[12px] truncate" style={{color: C.textSilver}}>{description}</span>
                                <span className="text-[12px] tabular-nums text-right" style={{color: 'white'}}>{qty}</span>
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              onClick={onView}
              className="inline-flex items-center gap-1.5 px-4 py-2 border text-[11px] font-bold uppercase tracking-widest transition-all"
              style={{border: `1px solid ${C.amber}40`, color: C.amber}}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.amber + '05'; e.currentTarget.style.borderColor = C.amber }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.amber + '40' }}
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            {!isViewer && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all"
                style={{border: `1px solid ${C.border}`, color: C.textPrimary}}
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-black hover:opacity-80 transition-all"
              style={{background: C.amber}}
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
      <div className="flex items-center gap-1.5 mb-1.5" style={{color: C.textSilver}}>
        <span style={{color: C.accent}}>{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-sm truncate ${mono ? '' : 'font-[#0D1117]'}`} style={{color: highlight ? C.amber : 'white'}}>
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
  const itemsPerPage = 10
  const searchInputRef = useRef<HTMLInputElement>(null)

  // "/" focuses search, Escape clears it — standard list-view shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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

  const filteredManifests = useMemo(() =>
    sortedManifests.filter((manifest) => {
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
    }), [sortedManifests, searchQuery, selectedMonth])

  const totalPages         = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Auto-expand on search hit (document number, ship-to, or material code/description)
  useEffect(() => {
    if (!searchQuery) return
    const q = searchQuery.toLowerCase()
    const hit = filteredManifests.find(m => (m.items || []).some(i => itemMatchesQuery(i, q, {})))
    if (hit?.id) setExpandedId(hit.id)
  }, [searchQuery, filteredManifests])

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

    // Column order: Container Van No. / Seal No. sit right after Truck Type,
    // before Time Start / Time End — matches the form, PDF, and Excel export order.
    // ACTUAL QTY DISPATCH sits right after QTY, since it's a per-line-item
    // measure of what actually left the warehouse for that document.
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
      // Container Van No. / Seal No. sit before Time Start / Time End,
      // matching the order used on the form, PDF, and single-manifest export.
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
      // DISPATCHED sits right after QTY (the ordered amount), before REMARKS.
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
    <div className="border rounded-2xl overflow-hidden flex flex-col h-full" style={{background: C.bg, borderColor: C.divider}}>

      {/* ── Header ── */}
      <div className="px-5 sm:px-8 pt-8 pb-7 flex-shrink-0" style={{borderBottom: `1px solid ${C.divider}`}}>

        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{background: C.accent}} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{background: C.accent}} />
              </span>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold" >Trip Manifest</p>
            </div>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-[#0D1117] text-white leading-[0.93] tracking-tight" style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
              {savedManifests.length} manifest{savedManifests.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-[12px] mt-2" style={{color: C.textSilver}}>SF Express · Cebu Warehouse</p>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadMonitoring}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{border: `1px solid ${C.border}`, color: C.textPrimary}}
            >
              <BarChart2 className="w-3.5 h-3.5" style={{color: C.accent}} />
              Monitoring
            </button>
            <button
              onClick={handleExportAll}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest  transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
              style={{background: C.amber}}
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors" style={{color: searchFocused ? C.accent : C.textSilver}} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search manifests, drivers, plates, DN/TRA, material codes…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              onFocus={e => { setSearchFocused(true); e.currentTarget.style.borderColor = C.inputFocus }}
              onBlur={e => { setSearchFocused(false); e.currentTarget.style.borderColor = C.border }}
              className="w-full h-9 pl-9 pr-9 bg-transparent text-[13px] text-white focus:outline-none transition-colors" style={{border: `1px solid ${C.border}`, color: C.inputText}}
            />
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); searchInputRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition-colors" style={{color: C.textSilver}}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : !searchFocused && (
              <kbd
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 leading-none"
                style={{color: C.textMuted, border: `1px solid ${C.border}`}}
              >
                /
              </kbd>
            )}
          </div>
          <FilterDropdown
            selectedMonth={selectedMonth}
            onMonthChange={(m) => { setSelectedMonth(m); setCurrentPage(1) }}
            months={MONTHS}
          />
        </div>

        {(searchQuery || selectedMonth !== 'All Months') && (
          <p className="text-[11px] font-bold uppercase tracking-widest mt-3" style={{color: C.textSilver}}>
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Column headers ── */}
      {filteredManifests.length > 0 && (
        <div className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-3 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest" style={{borderBottom: `1px solid ${C.divider}`, color: C.textSilver}}>
          <span className="hidden sm:block w-5">No.</span>
          <span className="flex-1">Title</span>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="hidden sm:flex items-center justify-end gap-1 w-28 hover:text-white transition-colors cursor-pointer" style={{color: C.textSilver}}
            title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            Date
            <span style={{color: C.accent}}>{sortDir === 'desc' ? '↓' : '↑'}</span>
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
            <FileText className="w-8 h-8" style={{color: C.textMuted}} />
            <div>
              <p className="font-[#0D1117] text-base" style={{color: C.textSilver}}>No manifests yet</p>
              <p className="text-[12px] text-[#666666] mt-1 max-w-xs">Create your first trip manifest to see it here</p>
            </div>
          </div>
        ) : filteredManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
            <Search className="w-8 h-8" style={{color: C.textMuted}} />
            <div>
              <p className="font-[#0D1117] text-base" style={{color: C.textSilver}}>No results found</p>
              <p className="text-[12px] text-[#666666] mt-1">Try adjusting your search or filter</p>
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
        <div className="flex-shrink-0 px-5 sm:px-8 py-4 flex items-center justify-between gap-3" style={{borderTop: `1px solid ${C.divider}`}}>
          <p className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-widest tabular-nums">
            <span className="text-white">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 1)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-[11px] font-[#0D1117] uppercase tracking-widest transition-all ${
                    currentPage === page
                      ? `text-white`
                      : 'border border-[#282828] text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white'
                  }`}
                  style={{
                    background: currentPage === page ? C.accent : 'transparent',
                  }}
                >{page}</button>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  )
}