'use client'

import {
  Truck, Barcode, Save, ChevronRight, ChevronLeft, Trash2, X,
  Package, CheckCircle2, AlertCircle, Search, Clock,
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { useEffect, useState, useRef } from 'react'
import React from 'react'

// ── Design tokens (matching OutboundAnalytics / SavedManifest) ─────────────────
const C = {
  bg:           '#080808',
  surface:      '#0f0f0f',
  surfaceHover: '#131313',
  border:       '#1a1a1a',
  borderHover:  '#2a2a2a',
  divider:      '#111111',
  accent:       '#E8192C',
  accentHover:  '#FF1F30',
  accentGlow:   'rgba(232,25,44,0.2)',
  amber:        '#F5A623',
  textPrimary:  '#FFFFFF',
  textSilver:   '#C0C0C0',
  textSub:      '#888888',
  textMuted:    '#666666',
  textGhost:    '#444444',
  inputBg:      '#0f0f0f',
  inputBorder:  '#2a2a2a',
  inputText:    '#C0C0C0',
  inputFocus:   '#E8192C',
}

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
  const [shipToName, setShipToName] = useState('')
  useEffect(() => { if (isOpen) setShipToName('') }, [isOpen])

  const handleSave = () => { if (shipToName.trim()) { onSave(shipToName.trim()); onClose() } }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    else if (e.key === 'Escape') { onClose() }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,25,44,0.1)', border: '1px solid rgba(232,25,44,0.2)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: C.accent }} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight" style={{ color: C.textPrimary }}>Ship-To Name Required</h3>
              <p className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color: C.textMuted }}>Document not found in system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full transition-colors" style={{ color: C.textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Doc info */}
        <div className="rounded-xl p-4 mb-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textMuted }}>Document No.</p>
              <p className="text-sm font-black tabular-nums" style={{ color: C.textSilver }}>{documentNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textMuted }}>Quantity</p>
              <p className="text-sm font-black tabular-nums" style={{ color: C.accent }}>{quantity}</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="mb-5">
          <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textSub }}>
            Ship-To Name <span style={{ color: C.accent }}>*</span>
          </label>
          <input
            type="text" value={shipToName}
            onChange={(e) => setShipToName(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter customer or delivery location..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.inputText }}
            onFocus={e => e.currentTarget.style.borderColor = C.accent}
            onBlur={e => e.currentTarget.style.borderColor = C.inputBorder}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all" style={{ border: `1px solid ${C.border}`, color: C.textMuted }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!shipToName.trim()}
            className="flex-1 px-4 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all"
            style={{ background: shipToName.trim() ? C.accent : C.textGhost, color: '#fff', boxShadow: shipToName.trim() ? `0 8px 24px ${C.accentGlow}` : 'none', cursor: shipToName.trim() ? 'pointer' : 'not-allowed' }}>
            Save & Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime12hr = (time: string | undefined): string => {
  if (!time) return '—'
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minuteStr} ${ampm}`
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string; color?: string }>; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textMuted }}>
      {Icon && <Icon className="w-3.5 h-3.5" color={C.accent} />}
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: C.textMuted }}>{label}</p>
      {children}
    </div>
  )
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="font-black text-sm truncate" style={{ color: C.textSilver }}>{children}</p>
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
  const [searchResults, setSearchResults] = useState<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
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

  // Shared input style helpers
  const inputStyle = (id: string): React.CSSProperties => ({
    background: C.inputBg,
    border: `1px solid ${focusedInput === id ? C.accent : C.inputBorder}`,
    color: C.inputText,
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const inputProps = (id: string) => ({
    onFocus: () => setFocusedInput(id),
    onBlur: () => setFocusedInput(null),
    style: inputStyle(id),
    className: 'w-full px-4 py-3 rounded-xl text-sm',
  })

  const steps = [
    { number: 1, title: 'Trip Info',  shortTitle: 'Info',   icon: Truck   },
    { number: 2, title: 'Scan Docs',  shortTitle: 'Scan',   icon: Barcode },
    { number: 3, title: 'Review',     shortTitle: 'Review', icon: Save    },
  ]

  return (
    <div>
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => { setShowManualEntryModal(false); setPendingDocument(null) }}
        onSave={addDocumentWithManualShipTo}
        documentNumber={pendingDocument?.documentNumber || ''}
        quantity={pendingDocument?.quantity || 0}
      />

      {/* Outer card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}` }}>

        {/* ── Header ── */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-7" style={{ borderBottom: `1px solid ${C.border}` }}>

          {/* Title row */}
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.accent }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.accent }} />
                </span>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: C.amber }}>
                  {isEditMode ? 'Editing manifest' : 'New manifest'}
                </p>
              </div>
              <h2 className="text-2xl sm:text-[clamp(1.6rem,4vw,2.4rem)] font-black leading-[0.93] tracking-tight" style={{ color: C.textPrimary }}>
                {isEditMode ? 'Edit Manifest' : 'Create Manifest'}
              </h2>
              <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: C.textMuted }}>
                SF Express · Cebu Warehouse
              </p>
            </div>
            {/* Step counter */}
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <p className="text-3xl sm:text-4xl font-black tabular-nums leading-none" style={{ color: C.textPrimary }}>
                {String(currentStep).padStart(2, '0')}
              </p>
              <span className="text-lg font-black leading-none" style={{ color: C.textGhost }}>/03</span>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isActive    = currentStep === step.number
              const isCompleted = currentStep > step.number
              const Icon        = step.icon
              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 min-w-0">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background:  isActive ? C.accent : isCompleted ? 'rgba(232,25,44,0.1)' : 'transparent',
                        border:      isActive ? 'none' : isCompleted ? `1px solid rgba(232,25,44,0.3)` : `1px solid ${C.border}`,
                        boxShadow:   isActive ? `0 0 20px ${C.accentGlow}` : 'none',
                        color:       isActive ? '#fff' : isCompleted ? C.accent : C.textGhost,
                      }}
                    >
                      {isCompleted
                        ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        : <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      }
                    </div>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                      style={{ color: isActive ? C.textPrimary : isCompleted ? C.accent : C.textMuted }}>
                      <span className="sm:hidden">{step.shortTitle}</span>
                      <span className="hidden sm:inline">{step.title}</span>
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="flex-1 mx-2 sm:mx-4">
                      <div className="h-px transition-all duration-500"
                        style={{ background: isCompleted ? 'rgba(232,25,44,0.35)' : C.divider }} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Step content ── */}
        <div className="p-4 sm:p-8">

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">

                {/* Manifest number — read-only display */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Manifest Number</label>
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-0.5 h-9 rounded-full flex-shrink-0" style={{ background: 'rgba(232,25,44,0.6)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: C.textMuted }}>Auto-generated</p>
                      <p className="text-lg sm:text-2xl font-black tracking-wider tabular-nums truncate leading-none" style={{ color: C.textPrimary }}>
                        {manifest.manifest_number || '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>System</span>
                    </div>
                  </div>
                </div>

                {[
                  { id: 'date',   label: 'Manifest Date', type: 'date',   key: 'manifest_date', required: true,  placeholder: '' },
                  { id: 'truck',  label: 'Trucker',        type: 'text',   key: 'trucker',        required: true,  placeholder: 'ACCLI, SF EXPRESS, SUYLI' },
                  { id: 'driver', label: 'Driver Name',    type: 'text',   key: 'driver_name',    required: true,  placeholder: "Driver's full name" },
                  { id: 'plate',  label: 'Plate No.',      type: 'text',   key: 'plate_no',       required: true,  placeholder: 'e.g., ABC-1234' },
                ].map(({ id, label, type, key, required, placeholder }) => (
                  <div key={id}>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>
                      {label} {required && <span style={{ color: C.accent }}>*</span>}
                    </label>
                    <input
                      type={type}
                      value={(manifest as any)[key] || ''}
                      onChange={(e) => setManifest({ ...manifest, [key]: type === 'text' ? e.target.value.toUpperCase() : e.target.value })}
                      placeholder={placeholder}
                      required={required}
                      {...inputProps(id)}
                    />
                  </div>
                ))}

                {/* Time start */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>
                    Time Start <span style={{ color: C.accent }}>*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                    <input type="time" value={manifest.time_start || ''}
                      onChange={(e) => setManifest({ ...manifest, time_start: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      style={inputStyle('time_start')}
                      onFocus={() => setFocusedInput('time_start')} onBlur={() => setFocusedInput(null)}
                      required
                    />
                  </div>
                </div>

                {/* Time end */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Time End</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                    <input type="time" value={manifest.time_end || ''}
                      onChange={(e) => setManifest({ ...manifest, time_end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                      style={inputStyle('time_end')}
                      onFocus={() => setFocusedInput('time_end')} onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                {/* Truck type */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Truck Type</label>
                  <input type="text" value={manifest.truck_type || ''}
                    onChange={(e) => setManifest({ ...manifest, truck_type: e.target.value.toUpperCase() })}
                    placeholder="E.G., 10W - 6W"
                    {...inputProps('truck_type')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Search box */}
              <div className="rounded-xl p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <SectionLabel icon={Search}>Document Search</SectionLabel>
                <div className="relative mt-3 sm:mt-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="DN / TRA number…"
                    disabled={scanningDocument}
                    inputMode="search" autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    style={inputStyle('search')}
                    onFocus={() => setFocusedInput('search')} onBlur={() => setFocusedInput(null)}
                  />
                </div>

                {/* Searching spinner */}
                {isSearching && barcodeInput.trim().length >= 1 && (
                  <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-[11px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }}>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border border-t-transparent" style={{ borderColor: C.accent, borderTopColor: 'transparent' }} />
                    Searching…
                  </div>
                )}

                {/* Results */}
                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                    {searchResults.map((result, idx) => (
                      <button key={idx} onClick={() => selectDocument(result)} type="button"
                        className="w-full text-left px-3 py-3 transition-colors group"
                        style={{ borderTop: idx > 0 ? `1px solid ${C.divider}` : 'none', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className="text-[10px]" style={{ color: C.textMuted }}>{String(idx + 1).padStart(2, '0')}</span>
                            <span className="font-black text-sm truncate transition-colors" style={{ color: C.textSilver }}>{result.documentNumber}</span>
                          </div>
                          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: C.accent }}>×{result.quantity}</span>
                        </div>
                        <p className="text-[11px] mt-0.5 pl-6 truncate" style={{ color: C.textMuted }}>{result.shipToName}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Not found */}
                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length === 0 && (
                  <div className="mt-3 p-4 rounded-xl flex items-start gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.accent }} />
                    <div>
                      <p className="font-black text-xs uppercase tracking-widest" style={{ color: C.textSilver }}>Not Found</p>
                      <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                        Press Enter to add <span className="font-bold" style={{ color: C.textSilver }}>"{barcodeInput}"</span> manually
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel icon={Package}>Scanned ({totalDocuments})</SectionLabel>
                  {totalQuantity > 0 && (
                    <span className="text-[10px]" style={{ color: C.textMuted }}>
                      Total: <span className="font-black tabular-nums" style={{ color: C.textSilver }}>{totalQuantity}</span>
                    </span>
                  )}
                </div>

                {manifest.items.length === 0 ? (
                  <div className="py-12 text-center rounded-xl" style={{ border: `1px dashed ${C.border}` }}>
                    <Package className="w-7 h-7 mx-auto mb-2.5" style={{ color: C.textGhost }} />
                    <p className="font-black text-xs uppercase tracking-widest" style={{ color: C.textMuted }}>No documents yet</p>
                    <p className="text-[11px] mt-1" style={{ color: C.textGhost }}>Scan or type a DN/TRA above</p>
                  </div>
                ) : (
                  <div style={{ borderTop: `1px solid ${C.divider}` }}>
                    {manifest.items.map((item, idx) => (
                      <div key={idx} className="group flex items-center gap-3 py-3.5 transition-all duration-200"
                        style={{ borderBottom: `1px solid ${C.divider}` }}>
                        <span className="text-[11px] font-bold w-5 flex-shrink-0 transition-colors" style={{ color: C.textGhost }}>
                          {String(item.item_number).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm truncate transition-colors" style={{ color: C.textSilver }}>{item.ship_to_name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: C.textMuted }}>{item.document_number}</p>
                        </div>
                        <span className="text-sm font-black tabular-nums flex-shrink-0" style={{ color: C.accent }}>×{item.total_quantity}</span>
                        <button onClick={() => removeItem(idx)} className="p-1.5 flex-shrink-0 touch-manipulation transition-colors" style={{ color: C.textGhost }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.textGhost)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Trip info */}
              <div className="rounded-xl p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <SectionLabel icon={Truck}>Trip Information</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-y-5 mt-4">
                  <Field label="Manifest No."><FieldValue>{manifest.manifest_number}</FieldValue></Field>
                  <Field label="Date"><FieldValue>{manifest.manifest_date}</FieldValue></Field>
                  <Field label="Trucker"><FieldValue>{manifest.trucker || '—'}</FieldValue></Field>
                  <Field label="Driver"><FieldValue>{manifest.driver_name || '—'}</FieldValue></Field>
                  <Field label="Plate No."><FieldValue>{manifest.plate_no || '—'}</FieldValue></Field>
                  <Field label="Truck Type"><FieldValue>{manifest.truck_type || '—'}</FieldValue></Field>
                  <Field label="Time Start"><FieldValue>{formatTime12hr(manifest.time_start)}</FieldValue></Field>
                  <Field label="Time End"><FieldValue>{formatTime12hr(manifest.time_end)}</FieldValue></Field>
                  {manifest.time_start && manifest.time_end && (
                    <Field label="Duration">
                      <p className="font-black text-sm tabular-nums" style={{ color: C.amber }}>{getDuration()}</p>
                    </Field>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="rounded-xl p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={Package}>Documents ({totalDocuments})</SectionLabel>
                  <span className="text-[10px]" style={{ color: C.textMuted }}>
                    Total Qty: <span className="font-black tabular-nums" style={{ color: C.textSilver }}>{totalQuantity}</span>
                  </span>
                </div>

                {/* Header row */}
                <div className="grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 pb-2.5 text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: C.textGhost, borderBottom: `1px solid ${C.border}` }}>
                  <span>#</span>
                  <span>Ship To</span>
                  <span className="hidden sm:block">DN / TRA</span>
                  <span className="text-right">Qty</span>
                </div>

                {manifest.items.map((item) => (
                  <div key={item.item_number}
                    className="grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_auto_auto] gap-x-3 py-3 transition-all duration-200 items-center"
                    style={{ borderBottom: `1px solid ${C.divider}` }}>
                    <span className="text-[11px] font-bold" style={{ color: C.textGhost }}>
                      {String(item.item_number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: C.textSilver }}>{item.ship_to_name}</p>
                      <p className="sm:hidden text-[11px] mt-0.5 truncate" style={{ color: C.textMuted }}>{item.document_number}</p>
                    </div>
                    <span className="text-[11px] hidden sm:block" style={{ color: C.textMuted }}>{item.document_number}</span>
                    <span className="text-sm font-black tabular-nums text-right" style={{ color: C.accent }}>×{item.total_quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex justify-between gap-3 mt-6 sm:mt-8 pt-5 sm:pt-7" style={{ borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
              disabled={currentStep === 1}
              className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-150"
              style={{
                border: `1px solid ${C.border}`,
                color: currentStep === 1 ? C.textGhost : C.textSub,
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              }}
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
                className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-150"
                style={{
                  background: C.accent,
                  color: '#fff',
                  boxShadow: `0 8px 24px ${C.accentGlow}`,
                  opacity: (currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3()) ? 0.3 : 1,
                  cursor: (currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3()) ? 'not-allowed' : 'pointer',
                }}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <button onClick={resetForm}
                  className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-150"
                  style={{ border: `1px solid ${C.border}`, color: C.textSub }}>
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button onClick={saveManifest} disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-150"
                  style={{
                    background: isEditMode ? '#2563eb' : C.accent,
                    color: '#fff',
                    boxShadow: isEditMode ? '0 8px 24px rgba(37,99,235,0.25)' : `0 8px 24px ${C.accentGlow}`,
                    opacity: isLoading ? 0.3 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}>
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