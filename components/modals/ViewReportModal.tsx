'use client'

import React, { useEffect, useRef } from 'react'
import {
  X, FileText, Truck, ClipboardList, Users, Camera,
  Info, Edit, Download, Play, Package, Hash, User, Barcode
} from 'lucide-react'
import type { DamageReport } from '@/lib/services/damageReportService'

interface ViewReportModalProps {
  isOpen: boolean
  report: DamageReport | null
  onClose: () => void
  onEdit: (report: DamageReport) => void
  onDownload: (report: DamageReport) => void
}

// ── Avatar (same pattern as ManifestAvatar) ───────────────────────────────────
function ReportAvatar({ seed, size = 'lg' }: { seed: string; size?: 'sm' | 'lg' }) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const lightness = 25 + (Math.abs(hash) % 15)
  const sz     = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-9 h-9'
  const iconSz = size === 'lg' ? 'w-7 h-7 sm:w-9 sm:h-9'    : 'w-4 h-4'
  return (
    <div
      className={`${sz} rounded-xl shadow-2xl flex items-center justify-center flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, hsl(352,${70 + (Math.abs(hash) % 20)}%,${lightness}%) 0%, hsl(5,80%,${lightness - 8}%) 100%)`
      }}
    >
      <FileText className={`${iconSz} text-white/40`} />
    </div>
  )
}

// ── Meta chip (same as manifest) ──────────────────────────────────────────────
function MetaChip({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-[#6A6A6A]">
        <span className="text-[#E8192C]">{icon}</span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-xs sm:text-sm font-semibold truncate ${highlight ? 'text-[#E8192C] font-black' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Damage type badge ─────────────────────────────────────────────────────────
function DamageBadge({ type }: { type: string }) {
  if (!type) return <span className="text-[#6A6A6A] text-xs">Not specified</span>
  return (
    <span className="inline-block px-2.5 py-1 bg-[#E8192C]/15 border border-[#E8192C]/30 text-[#E8192C] rounded-full text-[10px] font-bold uppercase tracking-widest">
      {type}
    </span>
  )
}

export function ViewReportModal({ isOpen, report, onClose, onEdit, onDownload }: ViewReportModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !report) return null

  const items      = report.items || (report as any).damage_items || []
  const reportId   = report.report_number || report.id || '—'
  const reportDate = report.report_date
    ? new Date(report.report_date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : '—'
  const totalItems = items.length

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Sheet — slides up on mobile, centred modal on sm+ */}
      <div className="relative w-full sm:max-w-2xl bg-[#121212] sm:rounded-2xl shadow-2xl border border-[#282828] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-t-2xl">

        {/* ── Spotify-style album gradient header ── */}
        <div
          className="flex-shrink-0 px-5 sm:px-6 pt-6 pb-5"
          style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.25) 0%, #121212 100%)' }}
        >
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#282828] hover:bg-gray-500 text-[#B3B3B3] hover:text-white transition-all duration-150 hover:scale-105 active:scale-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar + title */}
          <div className="flex items-end gap-4 sm:gap-5">
            <ReportAvatar seed={reportId} size="lg" />
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-1">Damage Report</p>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-none tracking-tight truncate mb-1">
                {reportId}
              </h2>
              <p className="text-xs sm:text-sm text-[#B3B3B3]">{reportDate}</p>
            </div>
          </div>

          {/* Quick stats — like "X songs · duration" */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8192C]" />
              <span className="text-xs text-[#B3B3B3] font-medium">
                <span className="text-white font-bold">{totalItems}</span> item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>
            {report.driver_name && (
              <>
                <span className="text-[#6A6A6A] text-xs">·</span>
                <span className="text-xs text-[#B3B3B3] font-medium">{report.driver_name}</span>
              </>
            )}
            {report.plate_no && (
              <>
                <span className="text-[#6A6A6A] text-xs">·</span>
                <span className="text-xs text-[#B3B3B3] font-medium">{report.plate_no}</span>
              </>
            )}
          </div>

          {/* Action buttons — Spotify play-bar style */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => { onEdit(report); onClose() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-600 hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-[#E8192C]/30"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => onDownload(report)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#727272] text-white text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all duration-150"
            >
              <Download className="w-4 h-4 text-[#E8192C]" /> Download
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── Trip / shipment info ── */}
          <div className="px-5 sm:px-6 py-5 border-b border-[#282828]">
            <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">
              <Truck className="w-3.5 h-3.5 text-[#E8192C]" /> Shipment Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              <MetaChip icon={<User className="w-3 h-3" />}    label="Driver"       value={report.driver_name || '—'} />
              <MetaChip icon={<Hash className="w-3 h-3" />}    label="Plate No."    value={report.plate_no    || '—'} />
              <MetaChip icon={<Hash className="w-3 h-3" />}    label="Seal No."     value={report.seal_no     || '—'} />
              {report.container_no && (
                <MetaChip icon={<Package className="w-3 h-3" />} label="Container No." value={report.container_no} />
              )}
              <MetaChip icon={<ClipboardList className="w-3 h-3" />} label="Total Items" value={String(totalItems)} highlight />
            </div>
          </div>

          {/* ── Damaged items tracklist ── */}
          <div className="px-5 sm:px-6 py-5 border-b border-[#282828]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A]">
                <ClipboardList className="w-3.5 h-3.5 text-[#E8192C]" /> Damaged Items
              </h3>
              <span className="text-xs text-[#6A6A6A]">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            </div>

            {/* Column headers */}
            {totalItems > 0 && (
              <div className="flex items-center gap-3 px-3 pb-2 border-b border-[#282828] text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-1">
                <span className="w-6 text-center">#</span>
                <span className="w-8" />
                <span className="flex-1">Description</span>
                <span className="hidden sm:block w-28 text-right">Damage Type</span>
              </div>
            )}

            {totalItems === 0 ? (
              <div className="py-10 text-center bg-[#1E1E1E] rounded-xl border-2 border-dashed border-gray-500">
                <ClipboardList className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-[#6A6A6A] font-semibold text-sm">No items recorded</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1E1E1E] transition-colors duration-100 cursor-default"
                  >
                    {/* Track number → play icon on hover */}
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#6A6A6A] tabular-nums group-hover:hidden">{idx + 1}</span>
                      <Play className="w-3.5 h-3.5 text-white hidden group-hover:block fill-white" />
                    </div>

                    {/* Mini avatar */}
                    <div
                      className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center shadow-md"
                      style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}
                    >
                      <span className="text-[10px] font-black text-white">{idx + 1}</span>
                    </div>

                    {/* Description + barcode */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#E8192C] transition-colors">
                        {item.material_description || 'Unknown Item'}
                      </p>
                      <p className="text-[10px] text-[#6A6A6A]  truncate">
                        {item.barcode || item.material_code || '—'}
                      </p>
                    </div>

                    {/* Damage type badge — hidden on mobile */}
                    <div className="hidden sm:block w-28 text-right flex-shrink-0">
                      <DamageBadge type={item.damage_type} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Expanded item details (damage description + photo) ── */}
          {items.some((i: any) => i.damage_description || i.photo_url || i.damage_type) && (
            <div className="px-5 sm:px-6 py-5 border-b border-[#282828]">
              <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">
                <Info className="w-3.5 h-3.5 text-[#E8192C]" /> Item Details
              </h3>
              <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#1E1E1E] border border-[#282828] rounded-xl p-4 hover:border-gray-500 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                        {idx + 1}
                      </div>
                      <p className="text-sm font-bold text-white truncate">{item.material_description || 'Unknown Item'}</p>
                      {/* Mobile damage badge */}
                      <div className="sm:hidden ml-auto flex-shrink-0">
                        <DamageBadge type={item.damage_type} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Barcode / Serial</p>
                        <p className="text-xs  text-white">{item.barcode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Material Code</p>
                        <p className="text-xs  text-white">{item.material_code || '—'}</p>
                      </div>
                    </div>

                    {item.damage_description && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-1">Description</p>
                        <p className="text-xs text-[#B3B3B3] leading-relaxed bg-[#282828] rounded-lg px-3 py-2.5 border border-gray-500">
                          {item.damage_description}
                        </p>
                      </div>
                    )}

                    {item.photo_url && (
                      <a
                        href={item.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-[#282828] border border-gray-500 text-white rounded-full text-xs font-bold hover:border-white transition-all hover:scale-105 active:scale-100"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#E8192C]" /> View Photo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Narrative findings ── */}
          {report.narrative_findings && (
            <div className="px-5 sm:px-6 py-5 border-b border-[#282828]">
              <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-3">
                <Info className="w-3.5 h-3.5 text-[#E8192C]" /> Narrative Findings
              </h3>
              <p className="text-sm text-[#B3B3B3] leading-relaxed bg-[#1E1E1E] rounded-xl px-4 py-3 border border-[#282828]">
                {report.narrative_findings}
              </p>
            </div>
          )}

          {/* ── Personnel ── */}
          <div className="px-5 sm:px-6 py-5">
            <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">
              <Users className="w-3.5 h-3.5 text-[#E8192C]" /> Personnel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { role: 'Prepared By', name: report.prepared_by, sub: 'Admin Staff' },
                { role: 'Noted By',    name: report.noted_by,    sub: 'Security Guard' },
                { role: 'Acknowledged By', name: report.acknowledged_by, sub: 'Supervisor' },
              ].map(({ role, name, sub }) => (
                <div key={role} className="bg-[#1E1E1E] border border-[#282828] rounded-xl p-4 hover:border-gray-500 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-1">{role}</p>
                  <p className="text-sm font-bold text-white">{name || '—'}</p>
                  <p className="text-[10px] text-[#6A6A6A] mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom safe area */}
          <div className="h-4 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}