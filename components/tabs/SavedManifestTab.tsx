'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Eye, Download, Edit, Trash2, Calendar, FileText,
  ChevronDown, Search, X, BarChart2, ChevronRight,
  Truck, User, Hash, Clock, Package
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'
import * as XLSX from 'xlsx-js-style'

// ── Filter Dropdown ────────────────────────────────────────────────────────────
const MONTHS = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function FilterDropdown({
  selectedMonth, onMonthChange, months,
}: { selectedMonth: string; onMonthChange: (m: string) => void; months: string[] }) {
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
        className="h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
      >
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span className="hidden sm:inline">{selectedMonth}</span>
        <span className="sm:hidden">{selectedMonth === 'All Months' ? 'Month' : selectedMonth.slice(0, 3)}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => { onMonthChange(month); setIsOpen(false) }}
              className={`w-full px-3.5 py-2 text-left text-sm transition-colors ${
                selectedMonth === month
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
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

// ── Manifest Row ───────────────────────────────────────────────────────────────
function ManifestRow({
  manifest,
  expanded,
  onToggle,
  onView, onEdit, onDownload, onDelete,
}: {
  manifest: TripManifest
  expanded: boolean
  onToggle: () => void
  onView: () => void
  onEdit: () => void
  onDownload: () => void
  onDelete: () => void
}) {

  const totalQty = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const manifestId = manifest.manifest_number || manifest.id || '—'
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-2 px-3 sm:px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Expand toggle */}
        <ChevronRight
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />

        {/* Status dot */}
        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />

        {/* Manifest number */}
        <span className="font-semibold text-gray-900 text-sm truncate flex-1 min-w-0">
          {manifestId}
        </span>

        {/* Date — hidden on very small screens */}
        <span className="hidden sm:block text-xs text-gray-500 flex-shrink-0 w-28 text-right">
          {manifestDate}
        </span>

        {/* Driver — visible md+ */}
        <span className="hidden md:block text-xs text-gray-600 flex-shrink-0 w-36 truncate text-right">
          {manifest.driver_name || '—'}
        </span>

        {/* Plate — visible lg+ */}
        <span className="hidden lg:block text-xs font-mono text-gray-600 flex-shrink-0 w-24 text-center bg-gray-100 rounded px-1.5 py-0.5">
          {manifest.plate_no || '—'}
        </span>

        {/* Docs badge */}
        <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">
          {totalDocs} doc{totalDocs !== 1 ? 's' : ''}
        </span>

        {/* Qty badge */}
        <span className="flex-shrink-0 text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
          {totalQty} qty
        </span>

        {/* Delete — stop propagation */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 sm:px-6 py-4">
          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 mb-4">
            <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date" value={manifestDate} />
            <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Driver" value={manifest.driver_name || '—'} />
            <DetailItem icon={<Hash className="w-3.5 h-3.5" />} label="Plate" value={manifest.plate_no || '—'} mono />
            <DetailItem icon={<Truck className="w-3.5 h-3.5" />} label="Trucker" value={manifest.trucker || '—'} />
            <DetailItem icon={<Truck className="w-3.5 h-3.5" />} label="Truck Type" value={manifest.truck_type || '—'} />
            <DetailItem icon={<Clock className="w-3.5 h-3.5" />} label="Time Start" value={manifest.time_start || '—'} />
            <DetailItem icon={<Clock className="w-3.5 h-3.5" />} label="Time End" value={manifest.time_end || '—'} />
            <DetailItem icon={<Package className="w-3.5 h-3.5" />} label="Total Qty" value={String(totalQty)} highlight />
          </div>

          {/* Items mini-table — shown if there are any */}
          {(manifest.items?.length ?? 0) > 0 && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2 font-semibold">#</th>
                    <th className="text-left px-3 py-2 font-semibold">Ship To</th>
                    <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">DN / TRA</th>
                    <th className="text-right px-3 py-2 font-semibold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.items!.map((item, idx) => (
                    <tr key={idx} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 text-gray-800 font-medium truncate max-w-[140px] sm:max-w-none">{item.ship_to_name || '—'}</td>
                      <td className="px-3 py-2 font-mono text-gray-600 hidden sm:table-cell">{item.document_number || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{item.total_quantity ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onView}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({
  icon, label, value, mono, highlight,
}: { icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-gray-400 mb-0.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className={`text-sm truncate ${mono ? 'font-mono' : 'font-medium'} ${highlight ? 'text-orange-600 font-bold' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
}

export function SavedManifestsTab({
  savedManifests,
  handleViewManifest,
  handleEditManifest,
  handleDownloadManifest,
  handleDeleteManifest,
}: SavedManifestsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All Months')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const itemsPerPage = 10

  const sortedManifests = useMemo(() =>
    [...savedManifests].sort((a, b) => {
      if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (a.manifest_date && b.manifest_date) return new Date(b.manifest_date).getTime() - new Date(a.manifest_date).getTime()
      if (a.id && b.id) return b.id.localeCompare(a.id)
      return 0
    }), [savedManifests])

  const filteredManifests = useMemo(() =>
    sortedManifests.filter((manifest) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (manifest.manifest_number || '').toLowerCase().includes(q) ||
        (manifest.driver_name || '').toLowerCase().includes(q) ||
        (manifest.plate_no || '').toLowerCase().includes(q) ||
        (manifest.trucker || '').toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (selectedMonth === 'All Months') return true

      const date = new Date(manifest.manifest_date || manifest.created_at || '')
      return MONTHS[date.getMonth() + 1] === selectedMonth
    }), [sortedManifests, searchQuery, selectedMonth])

  const totalPages = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  )

  // ── Export helpers (unchanged logic, kept here) ────────────────────────────
  const handleDownloadMonitoring = () => {
    const wb = XLSX.utils.book_new()
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
    let row = 0

    const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
      ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: type, s: style } as XLSX.CellObject
    }
    if (!ws['!merges']) ws['!merges'] = []
    const bThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    const bMedium = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } }

    setCell(row, 0, 'SF EXPRESS WAREHOUSE — TRIP MANIFEST MONITORING', { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'CC6600' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: bMedium })
    ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 10 } })
    row++
    setCell(row, 0, `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}  |  Total Manifests: ${filteredManifests.length}`, { font: { sz: 10, italic: true }, fill: { fgColor: { rgb: 'FFF3E0' } }, alignment: { horizontal: 'center' }, border: bThin })
    ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 10 } })
    row += 2
    ;['MANIFEST NO.', 'DISPATCH DATE', 'TRUCKER', 'DRIVER', 'PLATE NO.', 'TRUCK TYPE', 'TIME START', 'TIME END', 'DN / TRA NO.', 'SHIP TO NAME', 'QTY'].forEach((h, c) =>
      setCell(row, c, h, { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: bThin }))
    row++

    let grandQty = 0, grandDocs = 0, globalIdx = 0
    filteredManifests.forEach((manifest) => {
      const d = manifest.manifest_date ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—'
      const items = manifest.items || []
      const rowCount = Math.max(items.length, 1)
      const fill = { fgColor: { rgb: globalIdx % 2 === 0 ? 'F9FAFB' : 'FFFFFF' } }
      const base = (ex: any = {}) => ({ font: { sz: 10 }, fill, border: bThin, alignment: { vertical: 'center', wrapText: true }, ...ex })
      const center = (ex: any = {}) => base({ alignment: { horizontal: 'center', vertical: 'center' }, ...ex })
      const bold = (ex: any = {}) => base({ font: { sz: 10, bold: true }, ...ex })
      const startRow = row

      if (items.length === 0) {
        setCell(row, 0, manifest.manifest_number || manifest.id || '—', bold())
        setCell(row, 1, d, center()); setCell(row, 2, manifest.trucker || '—', base())
        setCell(row, 3, manifest.driver_name || '—', base()); setCell(row, 4, manifest.plate_no || '—', center())
        setCell(row, 5, manifest.truck_type || '—', base()); setCell(row, 6, manifest.time_start || '—', center())
        setCell(row, 7, manifest.time_end || '—', center()); setCell(row, 8, '—', center())
        setCell(row, 9, 'No documents', base()); setCell(row, 10, 0, center(), 'n')
        row++
      } else {
        items.forEach((item, idx) => {
          const first = idx === 0
          setCell(row, 0, first ? (manifest.manifest_number || manifest.id || '—') : '', first ? bold() : base())
          setCell(row, 1, first ? d : '', first ? center() : base())
          setCell(row, 2, first ? (manifest.trucker || '—') : '', base())
          setCell(row, 3, first ? (manifest.driver_name || '—') : '', base())
          setCell(row, 4, first ? (manifest.plate_no || '—') : '', first ? center() : base())
          setCell(row, 5, first ? (manifest.truck_type || '—') : '', base())
          setCell(row, 6, first ? (manifest.time_start || '—') : '', first ? center() : base())
          setCell(row, 7, first ? (manifest.time_end || '—') : '', first ? center() : base())
          setCell(row, 8, item.document_number || '—', bold({ alignment: { horizontal: 'center', vertical: 'center' } }))
          setCell(row, 9, item.ship_to_name || '—', base())
          setCell(row, 10, item.total_quantity || 0, center(), 'n')
          grandQty += item.total_quantity || 0; grandDocs++; row++
        })
        if (rowCount > 1) {
          const endRow = startRow + rowCount - 1
          ;[0, 1, 2, 3, 4, 5, 6, 7].forEach(c => ws['!merges']!.push({ s: { r: startRow, c }, e: { r: endRow, c } }))
        }
      }
      globalIdx++
    })
    row++
    const totalStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: bMedium }
    setCell(row, 0, `GRAND TOTAL  —  ${filteredManifests.length} manifests  |  ${grandDocs} documents`, totalStyle)
    ws['!merges']!.push({ s: { r: row, c: 0 }, e: { r: row, c: 9 } })
    setCell(row, 10, grandQty, totalStyle, 'n')
    ws['!ref'] = `A1:K${row + 5}`
    ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoring')
    XLSX.writeFile(wb, `Manifest-Monitoring-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportAll = () => {
    const wb = XLSX.utils.book_new()
    filteredManifests.forEach((manifest, manifestIndex) => {
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
      let row = 0
      if (!ws['!merges']) ws['!merges'] = []
      const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
        ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: type, s: style } as XLSX.CellObject
      }
      const bThin = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
      const d = manifest.manifest_date ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—'
      setCell(row, 0, 'SF EXPRESS WAREHOUSE', { font: { bold: true, sz: 14 } })
      setCell(row, 1, 'UPPER TINGUB, MANDAUE, CEBU')
      row += 2
      setCell(row, 4, manifest.manifest_number || '—', { font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: 'FFFFC400' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } } })
      row += 3
      setCell(row, 0, 'TRIP MANIFEST', { font: { bold: true, sz: 20 }, alignment: { horizontal: 'center', vertical: 'center' } })
      ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: 4 } })
      row += 3
      ;[['Client', 'HAIER PHILIPPINES INC.', 'Dispatch Date', d], ['Trucker', manifest.trucker || 'N/A', 'Driver', manifest.driver_name || '—'], ['Plate No.', manifest.plate_no || '—', 'Truck Type', manifest.truck_type || 'N/A'], ['Time Start', manifest.time_start || '—', 'Time End', manifest.time_end || '—']].forEach(([l1, v1, l2, v2]) => {
        setCell(row, 0, l1, { font: { bold: true } }); setCell(row, 1, v1); setCell(row, 2, l2, { font: { bold: true } }); setCell(row, 3, v2); row++
      })
      row++
      const tableStartRow = row
      const hStyle = { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, fill: { fgColor: { rgb: 'E8E8E8' } }, border: bThin }
      ;['NO.', 'SHIP TO NAME', 'DN/TRA NO.', 'QTY', 'REMARKS'].forEach((h, c) => setCell(row, c, h, hStyle))
      row++
      const items = manifest.items || []
      if (items.length === 0) {
        setCell(row, 0, '—', { border: bThin, alignment: { horizontal: 'center' } }); setCell(row, 1, 'No documents added', { border: bThin }); setCell(row, 2, '—', { border: bThin, alignment: { horizontal: 'center' } }); setCell(row, 3, 0, { border: bThin, alignment: { horizontal: 'center' } }, 'n'); setCell(row, 4, '—', { border: bThin, alignment: { horizontal: 'center' } }); row++
      } else {
        items.forEach((item, idx) => {
          const cs = { border: bThin, alignment: { horizontal: 'center', vertical: 'center' } }
          setCell(row, 0, idx + 1, cs, 'n'); setCell(row, 1, item.ship_to_name || '—', { ...cs, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } }); setCell(row, 2, item.document_number || '—', { ...cs, font: { bold: true } }); setCell(row, 3, item.total_quantity || 0, cs, 'n'); setCell(row, 4, '', cs); row++
        })
      }
      const totalQty = items.reduce((s, i) => s + (i.total_quantity || 0), 0)
      setCell(row, 0, 'TOTAL', { font: { bold: true }, alignment: { horizontal: 'right' }, border: bThin }); setCell(row, 1, '', { border: bThin }); setCell(row, 2, '', { border: bThin }); setCell(row, 3, totalQty, { font: { bold: true }, alignment: { horizontal: 'center' }, border: bThin }, 'n'); setCell(row, 4, '', { border: bThin })
      for (let r = tableStartRow; r <= row; r++) for (let c = 0; c <= 4; c++) { const addr = XLSX.utils.encode_cell({ r, c }); if (ws[addr]) ws[addr].s = { ...(ws[addr].s || {}), border: bThin } }
      row += 2
      setCell(row, 2, `TOTAL DOCUMENTS: ${items.length}  |  TOTAL QUANTITY: ${totalQty}`, { font: { bold: true }, alignment: { horizontal: 'right' } })
      row += 3
      ws['!ref'] = `A1:E${row + 10}`
      ws['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 20 }, { wch: 12 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(wb, ws, (manifest.manifest_number || `Manifest-${manifestIndex + 1}`).replace(/[\\/*?[\]:]/g, '-').slice(0, 31))
    })
    XLSX.writeFile(wb, `Manifests-Export-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* ── Header ── */}
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Saved Manifests
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {savedManifests.length} manifest{savedManifests.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadMonitoring}
              disabled={filteredManifests.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Monitoring</span>
              <span className="sm:hidden">Monitor</span>
            </button>
            <button
              onClick={handleExportAll}
              disabled={filteredManifests.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search manifests…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full h-10 pl-9 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <FilterDropdown
            selectedMonth={selectedMonth}
            onMonthChange={(m) => { setSelectedMonth(m); setCurrentPage(1) }}
            months={MONTHS}
          />
        </div>

        {/* Results count */}
        {(searchQuery || selectedMonth !== 'All Months') && (
          <p className="text-xs text-gray-400 mt-2">
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Column headers (desktop hint) ── */}
      {filteredManifests.length > 0 && (
        <div className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          <span className="w-4" /> {/* chevron */}
          <span className="w-2" /> {/* dot */}
          <span className="flex-1">Manifest No.</span>
          <span className="w-28 text-right">Date</span>
          <span className="hidden md:block w-36 text-right">Driver</span>
          <span className="hidden lg:block w-24 text-center">Plate</span>
          <span className="w-16 text-center">Docs</span>
          <span className="w-14 text-center">Qty</span>
          <span className="w-7" /> {/* delete */}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        {savedManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No manifests yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first trip manifest to see it here</p>
          </div>
        ) : filteredManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No results found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          paginatedManifests.map((manifest) => (
            <ManifestRow
              key={manifest.id}
              manifest={manifest}
              expanded={expandedId === manifest.id}
              onToggle={() => setExpandedId(expandedId === manifest.id ? null : (manifest.id ?? null))}
              onView={() => handleViewManifest(manifest)}
              onEdit={() => handleEditManifest(manifest)}
              onDownload={() => handleDownloadManifest(manifest)}
              onDelete={() => manifest.id && handleDeleteManifest(manifest.id)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 2)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}