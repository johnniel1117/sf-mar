'use client'

import { useEffect, useRef } from 'react'
import {
  X, Truck, User, Hash, Clock, Package,
  Edit, Download, FileText
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

interface ViewManifestModalProps {
  isOpen: boolean
  manifest: TripManifest | null
  onClose: () => void
  onEdit: (manifest: TripManifest) => void
  onDownloadPDF: (manifest: TripManifest) => void
}

const formatTime12hr = (time: string | undefined): string => {
  if (!time) return '—'
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minuteStr} ${ampm}`
}

const getDuration = (timeStart?: string, timeEnd?: string): string | null => {
  if (!timeStart || !timeEnd) return null
  const [h1, m1] = timeStart.split(':').map(Number)
  const [h2, m2] = timeEnd.split(':').map(Number)
  let minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (minutes < 0) minutes += 24 * 60
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function ViewManifestModal({ isOpen, manifest, onClose, onEdit, onDownloadPDF }: ViewManifestModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !manifest) return null

  const manifestId   = manifest.manifest_number || manifest.id || '—'
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '—'
  const totalQty  = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const duration  = getDuration(manifest.time_start, manifest.time_end)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="relative w-full sm:max-w-2xl bg-black sm:rounded-2xl shadow-2xl border border-[#1a1a1a] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-t-2xl">

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-6 sm:px-8 pt-7 pb-6 border-b border-[#1a1a1a]">

          {/* Close */}
          <div className="flex justify-end mb-5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#0a0a0a] text-[#9A9A9A] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Eyebrow + manifest number — landing hero style */}
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-yellow-600  mb-2">
            Trip Manifest
          </p>
          <h2 className="text-[clamp(1.4rem,4vw,2.2rem)] font-black text-white leading-[0.93] tracking-tight mb-1.5">
            {manifestId}
          </h2>
          <p className="text-[11px]  text-[#9A9A9A] uppercase tracking-widest">{manifestDate}</p>

          {/* Stats strip — landing hero style */}
          <div className="flex items-center gap-6 sm:gap-8 mt-6">
            <div>
              <p className="text-[10px]  uppercase tracking-widest text-[#9A9A9A] mb-1">Documents</p>
              <p className="text-3xl font-black text-white tabular-nums leading-none">
                {String(totalDocs).padStart(2, '0')}
              </p>
            </div>
            <div className="w-px h-10 bg-[#1a1a1a]" />
            <div>
              <p className="text-[10px]  uppercase tracking-widest text-[#9A9A9A] mb-1">Total Qty</p>
              <p className="text-3xl font-black text-white tabular-nums leading-none">
                {totalQty >= 1000 ? `${(totalQty / 1000).toFixed(1)}k` : totalQty}
              </p>
            </div>
            {duration && (
              <>
                <div className="w-px h-10 bg-[#1a1a1a]" />
                <div>
                  <p className="text-[10px]  uppercase tracking-widest text-[#9A9A9A] mb-1">Duration</p>
                  <p className="text-3xl font-black text-[#F5A623] tabular-nums leading-none">{duration}</p>
                </div>
              </>
            )}
          </div>

          {/* Action buttons — landing pill style */}
          <div className="flex items-center gap-2.5 mt-6">
            <button
              onClick={() => { onEdit(manifest); onClose() }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8192C] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDownloadPDF(manifest)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1a1a1a] text-[#9A9A9A] text-[11px] font-bold uppercase tracking-widest hover:border-[#3E3E3E] hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Trip details — landing services-list style */}
          <div className="px-6 sm:px-8 py-6 border-b border-[#1a1a1a]">
            <p className="text-[10px]  uppercase tracking-[0.25em] font-bold text-[#9A9A9A] mb-5">
              Trip Details
            </p>
            <div className="divide-y divide-[#1a1a1a]">
              {[
                { label: 'Driver',      value: manifest.driver_name  || '—', icon: User  },
                { label: 'Plate No.',   value: manifest.plate_no     || '—', icon: Hash  },
                { label: 'Trucker',     value: manifest.trucker      || '—', icon: Truck },
                { label: 'Truck Type',  value: manifest.truck_type   || '—', icon: Truck },
                { label: 'Time Start',  value: formatTime12hr(manifest.time_start), icon: Clock },
                { label: 'Time End',    value: formatTime12hr(manifest.time_end),   icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}
                  className="flex items-center gap-5 sm:gap-6 py-3.5 group transition-all duration-200 hover:pl-1.5"
                >
                  <Icon className="w-4 h-4 text-[#5A5A5A] group-hover:text-[#E8192C] transition-colors flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[11px]  uppercase tracking-[0.15em] text-[#9A9A9A] w-20 flex-shrink-0">{label}</span>
                  <span className="font-black text-[#D0D0D0] text-sm group-hover:text-white transition-colors">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents list — landing services-list style */}
          <div className="px-6 sm:px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px]  uppercase tracking-[0.25em] font-bold text-[#9A9A9A]">
                Documents
              </p>
              <span className="text-[10px]  text-[#9A9A9A]">
                {totalDocs} doc{totalDocs !== 1 ? 's' : ''}
              </span>
            </div>

            {totalDocs === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#1a1a1a] rounded-xl">
                <Package className="w-8 h-8 text-[#1a1a1a] mx-auto mb-3" />
                <p className="text-[#5A5A5A] font-black text-sm uppercase tracking-widest">No documents</p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 pb-2.5 text-[10px]  uppercase tracking-[0.15em] text-[#5A5A5A] border-b border-[#1a1a1a] mb-0">
                  <span>#</span>
                  <span>Ship To</span>
                  <span className="hidden sm:block">DN/TRA</span>
                  <span className="text-right">Qty</span>
                </div>

                <div className="divide-y divide-[#1a1a1a]">
                  {manifest.items!.map((item, idx) => (
                    <div key={idx}
                      className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 py-3.5 group transition-all duration-200 hover:pl-1 items-center"
                    >
                      <span className="text-[11px]  font-bold text-[#5A5A5A] group-hover:text-[#E8192C] transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-[#D0D0D0] text-sm truncate group-hover:text-white transition-colors">
                          {item.ship_to_name || '—'}
                        </p>
                        {/* DN visible on mobile under ship-to */}
                        <p className="text-[11px]  text-[#9A9A9A] mt-0.5 sm:hidden">{item.document_number || '—'}</p>
                      </div>
                      <span className="hidden sm:block text-[11px]  text-[#9A9A9A] text-right flex-shrink-0">
                        {item.document_number || '—'}
                      </span>
                      <span className="text-sm font-black text-[#E8192C] tabular-nums text-right flex-shrink-0">
                        ×{item.total_quantity ?? 0}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer total */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1a1a1a]">
                  <span className="text-[10px]  uppercase tracking-[0.2em] text-[#9A9A9A]">
                    {totalDocs} document{totalDocs !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px]  font-black text-white tabular-nums">
                    Total: <span className="text-[#E8192C]">{totalQty}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer — landing style */}
          <div className="border-t border-[#1a1a1a] mx-6 sm:mx-8 py-4 flex items-center justify-between mb-2">
            <p className="text-[11px] text-[#1a1a1a] ">SF Express · Cebu Warehouse</p>
            <p className="text-[11px] text-[#1a1a1a] ">{new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}