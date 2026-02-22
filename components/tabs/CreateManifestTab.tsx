'use client'

import {
  Truck, Barcode, Save, ChevronRight, ChevronLeft, Trash2, X,
  Package, CheckCircle2, AlertCircle, Search, Clock
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { useEffect, useState, useRef } from 'react'
import React from 'react'

interface CreateManifestTabProps {
  currentStep: 1 | 2 | 3
  setCurrentStep: (step: 1 | 2 | 3) => void
  manifest: TripManifest
  setManifest: (manifest: TripManifest) => void
  barcodeInput: string
  setBarcodeInput: (value: string) => void
  scanningDocument: boolean
  barcodeInputRef: React.RefObject<HTMLInputElement | null>
  isLoading: boolean
  isEditMode: boolean
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => void
  removeItem: (index: number) => void
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  resetForm: () => void
  saveManifest: () => void
  showManualEntryModal: boolean
  setShowManualEntryModal: (show: boolean) => void
  pendingDocument: { documentNumber: string; quantity: number } | null
  setPendingDocument: (doc: { documentNumber: string; quantity: number } | null) => void
  addDocumentWithManualShipTo: (shipToName: string) => void
  searchDocument: (documentNumber: string) => Promise<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

interface ManualEntryModalProps {
  isOpen: boolean; onClose: () => void; onSave: (shipToName: string) => void
  documentNumber: string; quantity: number
}

function ManualEntryModal({ isOpen, onClose, onSave, documentNumber, quantity }: ManualEntryModalProps) {
  const [shipToName, setShipToName] = useState('')

  useEffect(() => { if (isOpen) setShipToName('') }, [isOpen])

  const handleSave = () => {
    if (shipToName.trim()) { onSave(shipToName.trim()); onClose() }
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    else if (e.key === 'Escape') { onClose() }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#3E3E3E]">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8192C]/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-[#E8192C]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Ship-To Name Required</h3>
              <p className="text-xs text-[#B3B3B3] mt-0.5">Document not found in system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#3E3E3E] rounded-full transition-colors">
            <X className="w-4 h-4 text-[#B3B3B3]" />
          </button>
        </div>

        <div className="bg-[#282828] rounded-xl p-4 mb-5 border border-[#3E3E3E]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Document No.</p>
              <p className="text-sm font-semibold text-white">{documentNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Quantity</p>
              <p className="text-sm font-semibold text-[#E8192C]">{quantity}</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-2">
            Ship-To Name <span className="text-[#E8192C]">*</span>
          </label>
          <input
            type="text"
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter customer or delivery location..."
            className="w-full px-4 py-3 bg-[#282828] border border-[#3E3E3E] text-white rounded-xl focus:ring-2 focus:ring-[#E8192C]/50 focus:border-[#E8192C] transition-all text-sm placeholder-[#6A6A6A] outline-none"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full hover:border-white hover:text-white font-semibold text-sm transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!shipToName.trim()}
            className="flex-1 px-4 py-2.5 bg-[#E8192C] text-white rounded-full hover:bg-[#FF1F30] font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-100 shadow-lg shadow-[#E8192C]/25"
          >
            Save & Add
          </button>
        </div>
      </div>
    </div>
  )
}

const formatTime12hr = (time: string | undefined): string => {
  if (!time) return '—'
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minuteStr} ${ampm}`
}

// ── Shared input class ─────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 bg-[#282828] border border-[#3E3E3E] text-white rounded-xl focus:ring-2 focus:ring-[#E8192C]/50 focus:border-[#E8192C] outline-none transition-all text-sm placeholder-[#6A6A6A]"
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-1.5"

export function CreateManifestTab({
  currentStep, setCurrentStep, manifest, setManifest,
  barcodeInput, setBarcodeInput, scanningDocument, barcodeInputRef,
  isLoading, isEditMode, handleBarcodeInput, removeItem,
  canProceedToStep2, canProceedToStep3, resetForm, saveManifest,
  showManualEntryModal, setShowManualEntryModal, pendingDocument,
  setPendingDocument, addDocumentWithManualShipTo, searchDocument, showToast,
}: CreateManifestTabProps) {
  const [searchResults, setSearchResults] = useState<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (barcodeInput.trim().length >= 1 && searchDocument) {
      if (searchTimeout) clearTimeout(searchTimeout)
      const timeout = setTimeout(async () => {
        setIsSearching(true)
        try {
          const result = await searchDocument(barcodeInput.trim())
          if (isMountedRef.current) setSearchResults(result)
        } catch {
          if (isMountedRef.current) setSearchResults(null)
        } finally {
          if (isMountedRef.current) {
            setIsSearching(false)
            setTimeout(() => {
              if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current)
                barcodeInputRef.current.focus()
            }, 0)
          }
        }
      }, 300)
      setSearchTimeout(timeout)
    } else {
      setSearchResults(null)
      setIsSearching(false)
    }
    return () => { if (searchTimeout) clearTimeout(searchTimeout) }
  }, [barcodeInput])

  useEffect(() => {
    if (currentStep === 2 && barcodeInputRef.current) {
      const timer = setTimeout(() => barcodeInputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [currentStep, searchResults, isSearching])

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchResults && searchResults.length === 1) { selectDocument(searchResults[0]); return }
      handleBarcodeInput(e)
      setSearchResults(null); setBarcodeInput('')
      requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
    } else if (e.key === 'Escape') {
      setSearchResults(null); setBarcodeInput('')
      if (barcodeInputRef.current) barcodeInputRef.current.focus()
    }
  }

  const selectDocument = async (doc: { documentNumber: string; shipToName: string; quantity: number }) => {
    const exists = manifest.items.some(item => item.document_number === doc.documentNumber)
    if (exists) {
      if (showToast) showToast(`Document ${doc.documentNumber} already added`, 'error')
      setSearchResults(null); setBarcodeInput(''); return
    }
    const normalizedShipTo = (doc.shipToName || '').trim().toLowerCase()
    if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
      setPendingDocument({ documentNumber: doc.documentNumber, quantity: doc.quantity })
      setShowManualEntryModal(true)
      setSearchResults(null); setBarcodeInput('')
      requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
      return
    }
    const newItem: ManifestItem = {
      item_number: manifest.items.length + 1,
      document_number: doc.documentNumber,
      ship_to_name: doc.shipToName,
      total_quantity: doc.quantity,
    }
    setManifest({ ...manifest, items: [...manifest.items, newItem] })
    if (showToast) showToast(`Document ${doc.documentNumber} added`, 'success')
    setSearchResults(null); setBarcodeInput('')
    requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
  }

  const getDuration = () => {
    if (!manifest.time_start || !manifest.time_end) return null
    const [h1, m1] = manifest.time_start.split(':').map(Number)
    const [h2, m2] = manifest.time_end.split(':').map(Number)
    let minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minutes < 0) minutes += 24 * 60
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
  }

  const steps = [
    { number: 1, title: 'Trip Info', icon: Truck },
    { number: 2, title: 'Scan Docs', icon: Barcode },
    { number: 3, title: 'Review', icon: Save },
  ]

  return (
    <div className="space-y-5">
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => { setShowManualEntryModal(false); setPendingDocument(null) }}
        onSave={addDocumentWithManualShipTo}
        documentNumber={pendingDocument?.documentNumber || ''}
        quantity={pendingDocument?.quantity || 0}
      />

      <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden">
      
        <div
          className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 border-b border-[#282828]"
          style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.18) 0%, #121212 100%)' }}
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg shadow-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
            >
              <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-0.5">
                {isEditMode ? 'Editing' : 'New'}
              </p>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {isEditMode ? 'Edit Manifest' : 'Create Manifest'}
              </h2>
              <p className="text-xs text-[#B3B3B3] mt-0.5">SF Express Warehouse</p>
            </div>
          </div>

          {/* ── Step indicator — Spotify tracklist style ── */}
          <div className="flex items-center gap-0">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              const Icon = step.icon
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-[#E8192C] text-white shadow-lg shadow-[#E8192C]/40 scale-110'
                        : isCompleted
                        ? 'bg-[#E8192C]/20 text-[#E8192C] border border-[#E8192C]/40'
                        : 'bg-[#282828] text-[#6A6A6A] border border-[#3E3E3E]'
                    }`}>
                      {isCompleted
                        ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      }
                    </div>
                    <p className={`text-[10px] sm:text-xs font-bold mt-1.5 text-center ${
                      isActive ? 'text-white' : isCompleted ? 'text-[#E8192C]' : 'text-[#6A6A6A]'
                    }`}>{step.title}</p>
                  </div>
                  {index < 2 && (
                    <div className="flex-shrink-0 mx-1 sm:mx-2" style={{ marginBottom: '22px' }}>
                      <div className={`h-0.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#E8192C]' : 'bg-[#3E3E3E]'}`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="p-4 sm:p-6">

          {/* STEP 1 — Vehicle & Trip Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Manifest Number</label>
                  <input
                    type="text"
                    value={manifest.manifest_number}
                    readOnly
                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                    placeholder="TM-YYYYMMDD-XXX"
                  />
                </div>
                <div>
                  <label className={labelCls}>Manifest Date <span className="text-[#E8192C]">*</span></label>
                  <input type="date" value={manifest.manifest_date}
                    onChange={(e) => setManifest({ ...manifest, manifest_date: e.target.value })}
                    className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Trucker <span className="text-[#E8192C]">*</span></label>
                  <input type="text" value={manifest.trucker}
                    onChange={(e) => setManifest({ ...manifest, trucker: e.target.value.toUpperCase() })}
                    className={inputCls} placeholder="ACCLI, SF EXPRESS, SUYLI" required />
                </div>
                <div>
                  <label className={labelCls}>Driver Name <span className="text-[#E8192C]">*</span></label>
                  <input type="text" value={manifest.driver_name}
                    onChange={(e) => setManifest({ ...manifest, driver_name: e.target.value.toUpperCase() })}
                    className={inputCls} placeholder="Driver's full name" required />
                </div>
                <div>
                  <label className={labelCls}>Plate No. <span className="text-[#E8192C]">*</span></label>
                  <input type="text" value={manifest.plate_no}
                    onChange={(e) => setManifest({ ...manifest, plate_no: e.target.value.toUpperCase() })}
                    className={inputCls} placeholder="e.g., ABC-1234" required />
                </div>
                <div>
                  <label className={labelCls}>Time Start <span className="text-[#E8192C]">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A6A] pointer-events-none" />
                    <input type="time" value={manifest.time_start || ''}
                      onChange={(e) => setManifest({ ...manifest, time_start: e.target.value })}
                      className={`${inputCls} pl-10`} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Time End</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A6A] pointer-events-none" />
                    <input type="time" value={manifest.time_end || ''}
                      onChange={(e) => setManifest({ ...manifest, time_end: e.target.value })}
                      className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Truck Type</label>
                  <input type="text" value={manifest.truck_type}
                    onChange={(e) => setManifest({ ...manifest, truck_type: e.target.value.toUpperCase() })}
                    className={inputCls} placeholder="E.G., 10W - 6W" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Scan Documents */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Search box */}
              <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">
                  <Search className="w-3.5 h-3.5 text-[#E8192C]" /> Document Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A6A]" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="Enter DN / TRA number and press Enter…"
                    className={`${inputCls} pl-10`}
                    disabled={scanningDocument}
                    inputMode="search" autoComplete="off"
                  />
                </div>

                {isSearching && barcodeInput.trim().length >= 1 && (
                  <div className="mt-3 p-3 bg-[#282828] rounded-xl flex items-center gap-2 text-sm text-[#B3B3B3] border border-[#3E3E3E]">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E8192C] border-t-transparent" />
                    Searching…
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button key={idx} onClick={() => selectDocument(result)} type="button"
                        className="w-full text-left p-3 rounded-xl bg-[#282828] hover:bg-[#3E3E3E] transition-colors border border-[#3E3E3E] hover:border-[#E8192C]/40 group"
                      >
                        <div className="font-bold text-white text-sm group-hover:text-[#E8192C] transition-colors">{result.documentNumber}</div>
                        <div className="text-xs text-[#B3B3B3] mt-0.5">{result.shipToName}</div>
                        <div className="text-xs text-[#6A6A6A] mt-0.5">Qty: <span className="font-bold text-[#E8192C]">{result.quantity}</span></div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length === 0 && (
                  <div className="mt-3 p-3 bg-[#282828] border border-[#3E3E3E] rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#E8192C] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-xs">Not Found</p>
                      <p className="text-xs text-[#B3B3B3] mt-0.5">Press Enter to add "<span className="text-white">{barcodeInput}</span>" manually</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3]">
                    <Package className="w-3.5 h-3.5 text-[#E8192C]" />
                    Scanned ({totalDocuments})
                  </h3>
                  {totalQuantity > 0 && (
                    <span className="text-xs text-[#B3B3B3]">
                      Total Qty: <span className="font-black text-[#E8192C]">{totalQuantity}</span>
                    </span>
                  )}
                </div>

                {manifest.items.length === 0 ? (
                  <div className="py-10 text-center bg-[#1E1E1E] rounded-xl border-2 border-dashed border-[#3E3E3E]">
                    <Package className="w-10 h-10 text-[#3E3E3E] mx-auto mb-3" />
                    <p className="text-[#6A6A6A] font-semibold text-sm">No documents yet</p>
                    <p className="text-xs text-[#6A6A6A] mt-1">Scan or type a DN/TRA above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manifest.items.map((item, idx) => (
                      <div key={idx} className="group flex items-center gap-3 p-3 sm:p-4 bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl hover:border-[#E8192C]/30 hover:bg-[#282828] transition-all">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 text-white"
                          style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                          {item.item_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate group-hover:text-[#E8192C] transition-colors">{item.ship_to_name}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-[#B3B3B3] truncate">{item.document_number}</span>
                            <span className="text-xs font-bold text-[#E8192C] flex-shrink-0">×{item.total_quantity}</span>
                          </div>
                        </div>
                        <button onClick={() => removeItem(idx)}
                          className="p-1.5 text-[#6A6A6A] hover:text-[#E8192C] hover:bg-[#E8192C]/10 rounded-full transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Trip info summary */}
              <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-4">
                  <Truck className="w-3.5 h-3.5 text-[#E8192C]" /> Trip Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  {[
                    ['Manifest No.', manifest.manifest_number],
                    ['Date', manifest.manifest_date],
                    ['Time Start', formatTime12hr(manifest.time_start)],
                    ['Time End', formatTime12hr(manifest.time_end)],
                    ['Driver', manifest.driver_name || '—'],
                    ['Plate No.', manifest.plate_no || '—'],
                    ['Trucker', manifest.trucker || '—'],
                    ['Truck Type', manifest.truck_type || '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">{label}</p>
                      <p className="font-semibold text-white text-xs sm:text-sm truncate">{val}</p>
                    </div>
                  ))}
                  {manifest.time_start && manifest.time_end && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Duration</p>
                      <p className="font-black text-[#E8192C] text-xs sm:text-sm">{getDuration()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents summary */}
              <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3]">
                    <Package className="w-3.5 h-3.5 text-[#E8192C]" /> Documents ({totalDocuments})
                  </h3>
                  <span className="text-xs text-[#B3B3B3]">
                    Qty: <span className="font-black text-[#E8192C]">{totalQuantity}</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[280px]">
                    <thead>
                      <tr className="border-b border-[#3E3E3E] text-[#6A6A6A] uppercase tracking-widest text-[10px]">
                        <th className="pb-2.5 text-left font-bold w-8">#</th>
                        <th className="pb-2.5 text-left font-bold">Ship To</th>
                        <th className="pb-2.5 text-left font-bold hidden sm:table-cell">DN/TRA</th>
                        <th className="pb-2.5 text-right font-bold">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manifest.items.map((item) => (
                        <tr key={item.item_number} className="border-b border-[#282828] hover:bg-[#282828] transition-colors group">
                          <td className="py-2.5 text-[#6A6A6A] font-medium">{item.item_number}</td>
                          <td className="py-2.5 text-white font-medium group-hover:text-[#E8192C] transition-colors truncate max-w-[120px] sm:max-w-none">{item.ship_to_name}</td>
                          <td className="py-2.5 text-[#B3B3B3] hidden sm:table-cell">{item.document_number}</td>
                          <td className="py-2.5 text-right font-black text-[#E8192C]">{item.total_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 pt-5 border-t border-[#282828]">
            <button
              onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
              disabled={currentStep === 1}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 ${
                currentStep === 1
                  ? 'bg-[#282828] text-[#6A6A6A] cursor-not-allowed'
                  : 'border border-[#727272] text-white hover:border-white hover:scale-105 active:scale-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !canProceedToStep2()) return
                  if (currentStep === 2 && !canProceedToStep3()) return
                  setCurrentStep((currentStep + 1) as 1 | 2 | 3)
                }}
                disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#E8192C] text-white font-bold text-sm hover:bg-[#FF1F30] hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-[#E8192C]/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-3 sm:gap-3 w-full sm:w-auto">
                <button onClick={resetForm}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-[#727272] text-white rounded-full font-semibold text-sm hover:border-white hover:scale-105 active:scale-100 transition-all duration-150">
                  <X className="w-4 h-4" /> Clear
                </button>
                <button onClick={saveManifest} disabled={isLoading}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-150 hover:scale-105 active:scale-100 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    isEditMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                      : 'bg-[#E8192C] hover:bg-[#FF1F30] text-white shadow-[#E8192C]/25'
                  }`}>
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving…' : isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}