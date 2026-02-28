'use client'

import {
  Truck, Barcode, Save, ChevronRight, ChevronLeft, Trash2, X,
  Package, CheckCircle2, AlertCircle, Search, Clock,
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { useEffect, useState, useRef } from 'react'
import React from 'react'
import { useTheme, t } from '@/components/ThemeContext'

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

// ── Manual entry modal ────────────────────────────────────────────────────────

interface ManualEntryModalProps {
  isOpen: boolean; onClose: () => void; onSave: (shipToName: string) => void
  documentNumber: string; quantity: number
}

function ManualEntryModal({ isOpen, onClose, onSave, documentNumber, quantity }: ManualEntryModalProps) {
  const { isDark } = useTheme()
  const tk = t(isDark)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`${tk.navBg} rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 border ${tk.border}`}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8192C]/10 flex items-center justify-center flex-shrink-0 border border-[#E8192C]/20">
              <AlertCircle className="w-4 h-4 text-[#E8192C]" />
            </div>
            <div>
              <h3 className={`text-sm font-black ${tk.textPrimary} tracking-tight`}>Ship-To Name Required</h3>
              <p className={`text-[11px] ${tk.textMuted} uppercase tracking-widest mt-0.5`}>Document not found in system</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${tk.textMuted}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`${tk.surface} rounded-xl p-4 mb-5 border ${tk.border}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-1`}>Document No.</p>
              <p className={`text-sm font-black ${tk.textPrimary} tabular-nums`}>{documentNumber}</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-1`}>Quantity</p>
              <p className="text-sm font-black text-[#E8192C] tabular-nums">{quantity}</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className={`block text-[10px] uppercase tracking-[0.2em] ${tk.textSub} mb-2`}>
            Ship-To Name <span className="text-[#E8192C]">*</span>
          </label>
          <input
            type="text"
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter customer or delivery location..."
            className={`w-full px-4 py-3 ${tk.inputBg} border ${tk.inputBorder} ${tk.inputText} rounded-xl focus:ring-1 ${tk.inputFocus} transition-all text-sm ${tk.inputPlaceholder} outline-none`}
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 px-4 py-3 border ${tk.border} ${tk.textMuted} rounded-full font-bold text-xs uppercase tracking-widest transition-all`}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!shipToName.trim()}
            className="flex-1 px-4 py-3 bg-[#E8192C] text-white rounded-full hover:bg-[#FF1F30] font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#E8192C]/20"
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

// ── Main component ────────────────────────────────────────────────────────────

export function CreateManifestTab({
  currentStep, setCurrentStep, manifest, setManifest,
  barcodeInput, setBarcodeInput, scanningDocument, barcodeInputRef,
  isLoading, isEditMode, handleBarcodeInput, removeItem,
  canProceedToStep2, canProceedToStep3, resetForm, saveManifest,
  showManualEntryModal, setShowManualEntryModal, pendingDocument,
  setPendingDocument, addDocumentWithManualShipTo, searchDocument, showToast,
}: CreateManifestTabProps) {
  const { isDark } = useTheme()
  const tk = t(isDark)

  const [searchResults, setSearchResults] = useState<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)

  const inputCls = `w-full px-4 py-3 ${tk.inputBg} border ${tk.inputBorder} ${tk.inputText} rounded-xl focus:ring-1 ${tk.inputFocus} outline-none transition-all text-sm ${tk.inputPlaceholder}`
  const labelCls = `block text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-2`

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
    { number: 1, title: 'Trip Info',  shortTitle: 'Info',  icon: Truck  },
    { number: 2, title: 'Scan Docs',  shortTitle: 'Scan',  icon: Barcode },
    { number: 3, title: 'Review',     shortTitle: 'Review', icon: Save   },
  ]

  return (
    <div className="space-y-0">
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => { setShowManualEntryModal(false); setPendingDocument(null) }}
        onSave={addDocumentWithManualShipTo}
        documentNumber={pendingDocument?.documentNumber || ''}
        quantity={pendingDocument?.quantity || 0}
      />

      {/* Outer container */}
      <div className={`${tk.navBg} border ${tk.border} rounded-2xl overflow-hidden transition-colors duration-300`}>

        {/* Header */}
        <div className={`px-4 sm:px-8 pt-5 sm:pt-8 pb-5 sm:pb-7 border-b ${tk.border}`}>

          {/* Title row */}
          <div className="flex items-center justify-between mb-5 sm:mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-yellow-600 mb-1 sm:mb-2">
                {isEditMode ? 'Editing manifest' : 'New manifest'}
              </p>
              <h2 className={`text-2xl sm:text-[clamp(1.6rem,4vw,2.4rem)] font-black ${tk.textPrimary} leading-[0.93] tracking-tight`}>
                {isEditMode ? 'Edit Manifest' : 'Create Manifest'}
              </h2>
              <p className={`text-[11px] ${tk.textMuted} uppercase tracking-widest mt-1`}>
                SF Express · Cebu Warehouse
              </p>
            </div>

            {/* Step counter — visible on all sizes, compact on mobile */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <p className={`text-3xl sm:text-4xl font-black ${tk.textPrimary} tabular-nums leading-none`}>
                {String(currentStep).padStart(2, '0')}
              </p>
              <span className={`text-base sm:text-lg ${tk.textGhost} leading-none`}>/03</span>
            </div>
          </div>

          {/* Step indicator — compact on mobile */}
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              const Icon = step.icon
              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 min-w-0">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-[#E8192C] text-white shadow-lg shadow-[#E8192C]/30'
                        : isCompleted
                        ? 'bg-[#E8192C]/10 text-[#E8192C] border border-[#E8192C]/30'
                        : `bg-transparent ${tk.textMuted} border ${tk.border}`
                    }`}>
                      {isCompleted
                        ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        : <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      }
                    </div>
                    {/* Show short title on mobile, full title on sm+ */}
                    <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] font-bold transition-colors truncate ${
                      isActive ? tk.textPrimary : isCompleted ? 'text-[#E8192C]' : tk.textMuted
                    }`}>
                      <span className="sm:hidden">{step.shortTitle}</span>
                      <span className="hidden sm:inline">{step.title}</span>
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="flex-1 mx-2 sm:mx-4">
                      <div className={`h-px transition-all duration-500 ${isCompleted ? 'bg-[#E8192C]/40' : isDark ? 'bg-[#1a1a1a]' : 'bg-[#e5e3df]'}`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="p-4 sm:p-8">

          {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">

                {/* Manifest number */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Manifest Number</label>
                  <div className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 ${tk.surface} border ${tk.border} rounded-xl`}>
                    <div className="w-0.5 h-9 rounded-full bg-[#E8192C]/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Auto-generated</p>
                      <p className={`text-lg sm:text-2xl font-black ${tk.textPrimary} tracking-wider tabular-nums truncate leading-none`}>
                        {manifest.manifest_number || '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 bg-yellow-600/10 border border-yellow-600/20 rounded-full">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">System</span>
                    </div>
                  </div>
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
                    <Clock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${tk.textGhost} pointer-events-none`} />
                    <input type="time" value={manifest.time_start || ''}
                      onChange={(e) => setManifest({ ...manifest, time_start: e.target.value })}
                      className={`${inputCls} pl-10`} required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Time End</label>
                  <div className="relative">
                    <Clock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${tk.textGhost} pointer-events-none`} />
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

          {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Search box */}
              <div className={`border ${tk.border} rounded-xl p-4 sm:p-6`}>
                <label className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold ${tk.textMuted} mb-3 sm:mb-4`}>
                  <Search className="w-3.5 h-3.5 text-[#E8192C]" /> Document Search
                </label>
                <div className="relative">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${tk.textGhost}`} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="DN / TRA number…"
                    className={`${inputCls} pl-10`}
                    disabled={scanningDocument}
                    inputMode="search" autoComplete="off"
                  />
                </div>

                {isSearching && barcodeInput.trim().length >= 1 && (
                  <div className={`mt-3 p-3 ${tk.surface} rounded-xl flex items-center gap-2 text-[11px] ${tk.textMuted} border ${tk.border}`}>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border border-[#E8192C] border-t-transparent" />
                    Searching…
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length > 0 && (
                  <div className={`mt-3 space-y-0 max-h-56 overflow-y-auto divide-y ${tk.divide} rounded-xl border ${tk.border}`}>
                    {searchResults.map((result, idx) => (
                      <button key={idx} onClick={() => selectDocument(result)} type="button"
                        className={`w-full text-left px-3 py-3 transition-colors group ${tk.surfaceHover}`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className={`text-[10px] ${tk.textMuted} flex-shrink-0`}>{String(idx + 1).padStart(2, '0')}</span>
                            <span className={`font-black ${tk.textPrimary} text-sm group-hover:text-[#E8192C] transition-colors truncate`}>{result.documentNumber}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#E8192C] flex-shrink-0">×{result.quantity}</span>
                        </div>
                        <p className={`text-[11px] ${tk.textMuted} mt-0.5 pl-6 truncate`}>{result.shipToName}</p>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length === 0 && (
                  <div className={`mt-3 p-4 ${tk.surface} border ${tk.border} rounded-xl flex items-start gap-3`}>
                    <AlertCircle className="w-4 h-4 text-[#E8192C] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`font-black ${tk.textPrimary} text-xs uppercase tracking-widest`}>Not Found</p>
                      <p className={`text-[11px] ${tk.textMuted} mt-1`}>
                        Press Enter to add <span className={`${tk.textPrimary} font-bold`}>"{barcodeInput}"</span> manually
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold ${tk.textMuted}`}>
                    <Package className="w-3.5 h-3.5 text-[#E8192C]" />
                    Scanned ({totalDocuments})
                  </p>
                  {totalQuantity > 0 && (
                    <span className={`text-[10px] ${tk.textMuted}`}>
                      Total: <span className={`font-black ${tk.textPrimary} tabular-nums`}>{totalQuantity}</span>
                    </span>
                  )}
                </div>

                {manifest.items.length === 0 ? (
                  <div className={`py-10 text-center border border-dashed ${tk.border} rounded-xl`}>
                    <Package className={`w-7 h-7 ${tk.textGhost} mx-auto mb-2.5`} />
                    <p className={`${tk.textMuted} font-black text-xs uppercase tracking-widest`}>No documents yet</p>
                    <p className={`text-[11px] ${tk.textGhost} mt-1`}>Scan or type a DN/TRA above</p>
                  </div>
                ) : (
                  <div className={`divide-y ${tk.divide}`}>
                    {manifest.items.map((item, idx) => (
                      <div key={idx} className="group flex items-center gap-3 py-3.5 transition-all duration-200">
                        <span className={`text-[11px] font-bold ${tk.textGhost} w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors`}>
                          {String(item.item_number).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm truncate ${isDark ? 'text-[#D0D0D0] group-hover:text-white' : 'text-[#78716c] group-hover:text-[#111110]'} transition-colors`}>
                            {item.ship_to_name}
                          </p>
                          <p className={`text-[11px] ${tk.textMuted} mt-0.5 truncate`}>{item.document_number}</p>
                        </div>
                        <span className="text-sm font-black text-[#E8192C] tabular-nums flex-shrink-0">×{item.total_quantity}</span>
                        <button onClick={() => removeItem(idx)}
                          className={`p-1.5 ${tk.textGhost} hover:text-[#E8192C] transition-colors flex-shrink-0 touch-manipulation`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Trip info */}
              <div className={`border ${tk.border} rounded-xl p-4 sm:p-6`}>
                <p className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold ${tk.textMuted} mb-4`}>
                  <Truck className="w-3.5 h-3.5 text-[#E8192C]" /> Trip Information
                </p>

                {/* 2-col grid on mobile, 3-col on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-y-5">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Manifest No.</p>
                    <p className={`font-black ${tk.textPrimary} text-sm tabular-nums truncate`}>{manifest.manifest_number}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Date</p>
                    <p className={`font-black ${tk.textPrimary} text-sm tabular-nums`}>{manifest.manifest_date}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Trucker</p>
                    <p className={`font-black ${tk.textPrimary} text-sm truncate`}>{manifest.trucker || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Driver</p>
                    <p className={`font-black ${tk.textPrimary} text-sm truncate`}>{manifest.driver_name || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Plate No.</p>
                    <p className={`font-black ${tk.textPrimary} text-sm`}>{manifest.plate_no || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Truck Type</p>
                    <p className={`font-black ${tk.textPrimary} text-sm`}>{manifest.truck_type || '—'}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Time Start</p>
                    <p className={`font-black ${tk.textPrimary} text-sm tabular-nums`}>{formatTime12hr(manifest.time_start)}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Time End</p>
                    <p className={`font-black ${tk.textPrimary} text-sm tabular-nums`}>{formatTime12hr(manifest.time_end)}</p>
                  </div>
                  {manifest.time_start && manifest.time_end && (
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.2em] ${tk.textMuted} mb-0.5`}>Duration</p>
                      <p className="font-black text-[#F5A623] text-sm tabular-nums">{getDuration()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents list */}
              <div className={`border ${tk.border} rounded-xl p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold ${tk.textMuted}`}>
                    <Package className="w-3.5 h-3.5 text-[#E8192C]" /> Documents ({totalDocuments})
                  </p>
                  <span className={`text-[10px] ${tk.textMuted}`}>
                    Total Qty: <span className={`font-black ${tk.textPrimary} tabular-nums`}>{totalQuantity}</span>
                  </span>
                </div>

                <div className={`divide-y ${tk.divide}`}>
                  {/* Header row — 3 cols on mobile (no DN/TRA), 4 cols on sm+ */}
                  <div className={`grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 pb-2.5 text-[10px] uppercase tracking-[0.15em] ${tk.textGhost}`}>
                    <span>#</span>
                    <span>Ship To</span>
                    <span className="hidden sm:block">DN / TRA</span>
                    <span className="text-right">Qty</span>
                  </div>

                  {manifest.items.map((item) => (
                    <div key={item.item_number}
                      className="grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 py-3 group transition-all duration-200 items-center">
                      <span className={`text-[11px] font-bold ${tk.textGhost} group-hover:text-[#E8192C] transition-colors`}>
                        {String(item.item_number).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-black text-sm truncate ${isDark ? 'text-[#D0D0D0] group-hover:text-white' : 'text-[#78716c] group-hover:text-[#111110]'} transition-colors`}>
                          {item.ship_to_name}
                        </p>
                        {/* Show DN on mobile below ship-to name */}
                        <p className={`sm:hidden text-[11px] ${tk.textMuted} mt-0.5 truncate`}>{item.document_number}</p>
                      </div>
                      <span className={`text-[11px] ${tk.textMuted} hidden sm:block`}>{item.document_number}</span>
                      <span className="text-sm font-black text-[#E8192C] tabular-nums text-right">×{item.total_quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <div className={`flex justify-between gap-3 mt-6 sm:mt-8 pt-5 sm:pt-7 border-t ${tk.border}`}>
            <button
              onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
              disabled={currentStep === 1}
              className={`flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-150 border ${tk.border} ${
                currentStep === 1
                  ? `${tk.textGhost} cursor-not-allowed`
                  : `${tk.textSub} hover:${isDark ? 'border-[#3E3E3E] text-white' : 'border-[#c4bfba] text-[#111110]'}`
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Back</span>
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !canProceedToStep2()) return
                  if (currentStep === 2 && !canProceedToStep3()) return
                  setCurrentStep((currentStep + 1) as 1 | 2 | 3)
                }}
                disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
                className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full bg-[#E8192C] text-white font-black text-xs uppercase tracking-widest hover:bg-[#FF1F30] transition-all duration-150 shadow-lg shadow-[#E8192C]/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <button onClick={resetForm}
                  className={`flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 border ${tk.border} ${tk.textSub} rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-150`}>
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button onClick={saveManifest} disabled={isLoading}
                  className={`flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-150 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed ${
                    isEditMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                      : 'bg-[#E8192C] hover:bg-[#FF1F30] text-white shadow-[#E8192C]/20'
                  }`}>
                  <Save className="w-3.5 h-3.5" />
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