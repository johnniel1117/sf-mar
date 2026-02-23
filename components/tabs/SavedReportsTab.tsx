'use client'

import React, { useState } from 'react'
import {
  Download, FileText, Eye, Edit, Trash2, Search, X,
  Calendar, User, Hash, Package, ChevronRight, Play
} from 'lucide-react'
import type { DamageReport } from '@/lib/services/damageReportService'

interface SavedReportsTabProps {
  savedReports: DamageReport[]
  handleViewReport: (report: DamageReport) => void
  handleEditReport: (report: DamageReport) => void
  handleOpenDownloadModal: (report: DamageReport) => void
  handleDeleteReport: (reportNumber: string) => void
}

function ReportAvatar({ seed }: { seed: string }) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const lightness = 25 + (Math.abs(hash) % 15)
  return (
    <div
      className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-md shadow-lg flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(352,${70 + (Math.abs(hash) % 20)}%,${lightness}%) 0%, hsl(5,80%,${lightness - 8}%) 100%)` }}
    >
      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" />
    </div>
  )
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-0.5">{label}</p>
      <p className="text-xs sm:text-sm font-semibold text-white truncate">{value}</p>
    </div>
  )
}

function ReportRow({
  report, index, expanded, onToggle, onView, onEdit, onDownload, onDelete,
}: {
  report: DamageReport; index: number; expanded: boolean
  onToggle: () => void; onView: () => void; onEdit: () => void
  onDownload: () => void; onDelete: () => void
}) {
  const reportItems = report.items || (report as any).damage_items || []
  const totalItems = reportItems.length
  const reportId = report.report_number || report.id || '—'
  const reportDate = report.report_date
    ? new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className={`group border-b border-[#282828] last:border-b-0 transition-colors duration-150 ${expanded ? 'bg-[#1E1E1E]' : 'hover:bg-[#1A1A1A]'}`}>
      {/* ── Collapsed row ── */}
      <div
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Row number — desktop only */}
        <div className="hidden sm:flex flex-shrink-0 w-7 items-center justify-center">
          <span className="text-sm text-[#6A6A6A] tabular-nums group-hover:hidden">{index + 1}</span>
          <Play className="w-4 h-4 text-white hidden group-hover:block fill-white" />
        </div>

        <ReportAvatar seed={reportId} />

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate group-hover:text-[#E8192C] transition-colors leading-tight">
            {reportId}
          </p>
          <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
            {report.driver_name || 'No driver'}
            {report.plate_no ? ` · ${report.plate_no}` : ''}
          </p>
        </div>

        {/* Date — hidden on mobile */}
        <span className="hidden sm:block text-xs text-[#B3B3B3] flex-shrink-0 w-24 text-right">{reportDate}</span>

        {/* Item count */}
        <span className="flex-shrink-0 text-xs font-bold tabular-nums text-[#B3B3B3] group-hover:text-white transition-colors w-8 text-right">
          {totalItems}
        </span>

        {/* Chevron */}
        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90 text-[#E8192C]' : 'text-[#6A6A6A] group-hover:text-[#B3B3B3]'}`} />

        {/* Delete — always visible on mobile, hover on desktop */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 p-1.5 rounded-full text-[#6A6A6A] hover:text-[#E8192C] hover:bg-[#E8192C]/10 transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="border-t border-[#282828] bg-[#121212] px-4 sm:px-5 py-4 sm:py-5">
          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 mb-4 sm:mb-5">
            <DetailChip label="Date" value={reportDate} />
            <DetailChip label="Driver" value={report.driver_name || '—'} />
            <DetailChip label="Plate" value={report.plate_no || '—'} />
            <DetailChip label="Prepared By" value={report.prepared_by || '—'} />
            {report.seal_no && <DetailChip label="Seal No." value={report.seal_no} />}
            {report.container_no && <DetailChip label="Container" value={report.container_no} />}
            <DetailChip label="Items" value={String(totalItems)} />
          </div>

          {/* Damage items mini-table */}
          {totalItems > 0 && (
            <div className="mb-4 sm:mb-5 rounded-lg overflow-hidden border border-[#282828]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1E1E1E] text-[#6A6A6A] uppercase tracking-widest">
                    <th className="text-left px-3 py-2.5 font-bold">#</th>
                    <th className="text-left px-3 py-2.5 font-bold">Description</th>
                    <th className="text-left px-3 py-2.5 font-bold hidden sm:table-cell">Damage Type</th>
                    <th className="text-right px-3 py-2.5 font-bold">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {reportItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t border-[#282828] hover:bg-[#1E1E1E] transition-colors group/row">
                      <td className="px-3 py-2.5 text-[#6A6A6A]">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-white font-medium truncate max-w-[120px] sm:max-w-none group-hover/row:text-[#E8192C] transition-colors">
                        {item.material_description || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-[#B3B3B3] hidden sm:table-cell">{item.damage_type || '—'}</td>
                      <td className="px-3 py-2.5 text-right">
                        {item.photo_url
                          ? <a href={item.photo_url} target="_blank" rel="noopener noreferrer"
                              className="text-[#E8192C] hover:underline font-bold">View</a>
                          : <span className="text-[#6A6A6A]">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={onView}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#E8192C] text-white text-xs sm:text-sm font-bold hover:bg-[#FF1F30] hover:scale-105 active:scale-100 transition-all shadow-lg shadow-[#E8192C]/30">
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button onClick={onEdit}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#727272] text-white text-xs sm:text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onDownload}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#727272] text-white text-xs sm:text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all">
              <Download className="w-3.5 h-3.5 text-[#E8192C]" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const SavedReportsTab: React.FC<SavedReportsTabProps> = ({
  savedReports, handleViewReport, handleEditReport,
  handleOpenDownloadModal, handleDeleteReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = savedReports.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      (r.report_number || '').toLowerCase().includes(q) ||
      (r.driver_name || '').toLowerCase().includes(q) ||
      (r.plate_no || '').toLowerCase().includes(q) ||
      (r.prepared_by || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden flex flex-col min-h-0">
      {/* ── Header ── */}
      <div
        className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-[#282828] flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.18) 0%, #121212 100%)' }}
      >
        {/* Title row */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg shadow-xl flex-shrink-0 flex items-center justify-center"
            // style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
          >
            <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-0.5">View</p>
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">Saved Reports</h3>
            <p className="text-xs text-[#B3B3B3] mt-0.5">
              SF Express · {savedReports.length} report{savedReports.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6A6A]" />
          <input
            type="text"
            placeholder="Search reports…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-8 bg-[#3E3E3E] rounded-full text-sm text-white placeholder-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-[#B3B3B3] mt-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* ── Column headers ── */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-[#282828] flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A]">
          <span className="hidden sm:block w-7 text-center">#</span>
          <span className="w-9 sm:w-10" />
          <span className="flex-1">Report</span>
          <span className="hidden sm:block w-24 text-right">Date</span>
          <span className="w-8 text-right">Items</span>
          <span className="w-4" />
          <span className="w-7" />
        </div>
      )}

      {/* ── Body ── */}
      <div className="overflow-y-auto">
        {savedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}>
              <FileText className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            </div>
            <p className="font-black text-white text-base sm:text-lg">No reports yet</p>
            <p className="text-sm text-[#B3B3B3] mt-1 max-w-xs">Create your first damage report to see it here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-[#6A6A6A]" />
            </div>
            <p className="font-black text-white">No results found</p>
            <p className="text-sm text-[#B3B3B3] mt-1">Try a different search</p>
          </div>
        ) : (
          filtered.map((report, idx) => (
            <ReportRow
              key={report.id}
              report={report}
              index={idx}
              expanded={expandedId === report.id}
              onToggle={() => setExpandedId(expandedId === report.id ? null : (report.id ?? null))}
              onView={() => handleViewReport(report)}
              onEdit={() => handleEditReport(report)}
              onDownload={() => handleOpenDownloadModal(report)}
              onDelete={() => handleDeleteReport(report.report_number || report.id || '')}
            />
          ))
        )}
      </div>
    </div>
  )
}