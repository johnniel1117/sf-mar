'use client'

import { useEffect, useRef } from 'react'
import {
  X, Truck, User, Hash, Clock, Package, Calendar,
  Edit, Download, FileText, Play, ChevronRight
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

function ManifestAvatar({ seed, size = 'lg' }: { seed: string; size?: 'sm' | 'lg' }) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const lightness = 25 + (Math.abs(hash) % 15)
  const sz = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-9 h-9'
  const iconSz = size === 'lg' ? 'w-7 h-7 sm:w-9 sm:h-9' : 'w-4 h-4'
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

function MetaChip({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-[#6A6A6A]">
        <span className="text-[#E8192C]">{icon}</span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-xs sm:text-sm font-semibold truncate ${highlight ? 'text-yellow-500 font-black' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

export function ViewManifestModal({ isOpen, manifest, onClose, onEdit, onDownloadPDF }: ViewManifestModalProps) {
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

  if (!isOpen || !manifest) return null

  const manifestId = manifest.manifest_number || manifest.id || '—'
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '—'
  const totalQty = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const duration = getDuration(manifest.time_start, manifest.time_end)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Sheet — slides up on mobile, centered modal on sm+ */}
      <div className="relative w-full sm:max-w-2xl bg-[#121212] sm:rounded-2xl shadow-2xl border border-[#282828] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden rounded-t-2xl">

        {/* ── Spotify-style "album header" gradient ── */}
        <div
          className="flex-shrink-0 px-5 sm:px-6 pt-6 pb-5"
          style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.25) 0%, #121212 100%)' }}
        >
          {/* Close pill */}
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#282828] hover:bg-[#3E3E3E] text-[#B3B3B3] hover:text-white transition-all duration-150 hover:scale-105 active:scale-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar + title row */}
          <div className="flex items-end gap-4 sm:gap-5">
            <ManifestAvatar seed={manifestId} size="lg" />
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-1">Trip Manifest</p>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-none tracking-tight truncate mb-1">
                {manifestId}
              </h2>
              <p className="text-xs sm:text-sm text-[#B3B3B3]">{manifestDate}</p>
            </div>
          </div>

          {/* Quick stats row — like Spotify's "X songs · duration" */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8192C]" />
              <span className="text-xs text-[#B3B3B3] font-medium">
                <span className="text-white font-bold">{totalDocs}</span> document{totalDocs !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-[#6A6A6A] text-xs">·</span>
            <span className="text-xs text-[#B3B3B3] font-medium">
              <span className="text-[#E8192C] font-black">{totalQty}</span> total qty
            </span>
            {duration && (
              <>
                <span className="text-[#6A6A6A] text-xs">·</span>
                <span className="text-xs text-[#B3B3B3] font-medium">
                  <Clock className="w-3 h-3 inline mr-1 text-[#6A6A6A]" />
                  {duration}
                </span>
              </>
            )}
          </div>

          {/* Action buttons — Spotify play-bar style */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => { onEdit(manifest); onClose() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-600 hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-[#E8192C]/30"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => onDownloadPDF(manifest)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#727272] text-white text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all duration-150"
            >
              <Download className="w-4 h-4 text-[#E8192C]" /> Download
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* Trip details section */}
          <div className="px-5 sm:px-6 py-5 border-b border-[#282828]">
            <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-4">
              <Truck className="w-3.5 h-3.5 text-[#E8192C]" /> Trip Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
              <MetaChip icon={<User className="w-3 h-3" />} label="Driver" value={manifest.driver_name || '—'} />
              <MetaChip icon={<Hash className="w-3 h-3" />} label="Plate No." value={manifest.plate_no || '—'} />
              <MetaChip icon={<Truck className="w-3 h-3" />} label="Trucker" value={manifest.trucker || '—'} />
              <MetaChip icon={<Truck className="w-3 h-3" />} label="Truck Type" value={manifest.truck_type || '—'} />
              <MetaChip icon={<Clock className="w-3 h-3" />} label="Time Start" value={formatTime12hr(manifest.time_start)} />
              <MetaChip icon={<Clock className="w-3 h-3" />} label="Time End" value={formatTime12hr(manifest.time_end)} />
              {duration && (
                <MetaChip icon={<Clock className="w-3 h-3" />} label="Duration" value={duration} highlight />
              )}
              <MetaChip icon={<Package className="w-3 h-3" />} label="Total Qty" value={String(totalQty)} highlight />
            </div>
          </div>

          {/* Documents tracklist section */}
          <div className="px-5 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A]">
                <Package className="w-3.5 h-3.5 text-[#E8192C]" /> Documents
              </h3>
              <span className="text-xs text-[#6A6A6A]">
                {totalDocs} doc{totalDocs !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tracklist column headers */}
            {totalDocs > 0 && (
              <div className="flex items-center gap-3 px-3 pb-2 border-b border-[#282828] text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-1">
                <span className="w-6 text-center">#</span>
                <span className="w-8" />
                <span className="flex-1">Ship To</span>
                <span className="hidden sm:block w-32 text-right">DN / TRA</span>
                <span className="w-10 text-right">Qty</span>
              </div>
            )}

            {totalDocs === 0 ? (
              <div className="py-10 text-center bg-[#1E1E1E] rounded-xl border-2 border-dashed border-[#3E3E3E]">
                <Package className="w-10 h-10 text-[#3E3E3E] mx-auto mb-3" />
                <p className="text-[#6A6A6A] font-semibold text-sm">No documents</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {manifest.items!.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1E1E1E] transition-colors duration-100 cursor-default"
                  >
                    {/* Track number → play icon */}
                    <div className="w-6 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#6A6A6A] tabular-nums group-hover:hidden">{idx + 1}</span>
                      <Play className="w-3.5 h-3.5 text-white hidden group-hover:block fill-white" />
                    </div>

                    {/* Mini avatar */}
                    {/* <div
                      className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center shadow-md"
                      style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}
                    >
                      <span className="text-[10px] font-black text-white">{idx + 1}</span>
                    </div> */}

                    {/* Ship to name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-[#E8192C] transition-colors">
                        {item.ship_to_name || '—'}
                      </p>
                    </div>

                    {/* DN/TRA — hidden on mobile */}
                    <span className="hidden sm:block w-32 text-right text-xs  text-[#B3B3B3] truncate flex-shrink-0">
                      {item.document_number || '—'}
                    </span>

                    {/* Qty */}
                    <span className="w-10 text-right text-sm font-black text-white flex-shrink-0">
                      {item.total_quantity ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer total row — like Spotify's "total duration" */}
            {totalDocs > 0 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#282828] px-3">
                <span className="text-xs text-[#6A6A6A] font-semibold uppercase tracking-widest">
                  {totalDocs} document{totalDocs !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-black text-yellow-500">
                  {totalQty} total qty
                </span>
              </div>
            )}
          </div>

          {/* Bottom safe area padding for mobile */}
          <div className="h-4 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}