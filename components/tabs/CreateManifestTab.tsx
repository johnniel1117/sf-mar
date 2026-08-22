'use client'

import {
  Truck, Barcode, Save, ChevronRight, ChevronLeft, Trash2, X,
  Package, CheckCircle2, AlertCircle, Search, Clock, MessageSquare,
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { useEffect, useState, useRef } from 'react'
import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import forkliftAnimation from './forklift-animation-smooth.json'

// ── Design tokens (matching SavedManifestsTab exactly) ────────────────────────
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#9d7bf8',
  accentHover:  '#5e2ee4f5',
  accentGlow:   'rgba(104, 25, 232, 0.25)',

  amber:        '#C1F85C',

  textPrimary:  '#C9D1D9',
  textSilver:   '#B1BAC4',
  textSub:      '#8B949E',
  textMuted:    '#6E7681',
  textGhost:    '#484F58',

  inputBg:      '#0D1117',
  inputBorder:  '#30363D',
  inputText:    '#C9D1D9',
  inputFocus:   '#C9D1D9',
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
  pendingDocument: { documentNumber: string; quantity: number; cbm?: number; materialCounts?: Record<string, number> } | null
  setPendingDocument: (doc: { documentNumber: string; quantity: number; cbm?: number; materialCounts?: Record<string, number> } | null) => void
  addDocumentWithManualShipTo: (shipToName: string) => void
  searchDocument: (documentNumber: string) => Promise<Array<{ documentNumber: string; shipToName: string; quantity: number; cbm?: number; materialCounts?: Record<string, number> }> | null>
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
  grandTotalCBM?: number // Added this prop
}

// ── Manual entry modal ────────────────────────────────────────────────────────

interface ManualEntryModalProps {
  isOpen: boolean; onClose: () => void; onSave: (shipToName: string) => void
  documentNumber: string; quantity: number; cbm?: number
}

function ManualEntryModal({ isOpen, onClose, onSave, documentNumber, quantity, cbm }: ManualEntryModalProps) {
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
      <div className="w-full max-w-md p-6 sm:p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,25,44,0.1)', border: '1px solid rgba(232,25,44,0.2)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: C.accent }} />
            </div>
            <div>
              <h3 className="text-sm font-[#0D1117] tracking-tight" style={{ color: C.textPrimary }}>Ship-To Name Required</h3>
              <p className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color: C.textPrimary }}>Document not found in system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 transition-colors" style={{ color: C.textPrimary }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Doc info */}
        <div className="p-4 mb-5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textPrimary }}>Document No.</p>
              <p className="text-sm font-[#0D1117] tabular-nums" style={{ color: C.textSilver }}>{documentNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textPrimary }}>Quantity</p>
              <p className="text-sm font-[#0D1117] tabular-nums" style={{ color: C.accent }}>{quantity}</p>
            </div>
          </div>
          {cbm != null && cbm > 0 && (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
              <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.textPrimary }}>CBM</p>
              <p className="text-sm font-[#0D1117] tabular-nums" style={{ color: C.amber }}>{cbm.toFixed(4)}</p>
            </div>
          )}
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
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.inputText }}
            onFocus={e => e.currentTarget.style.borderColor = C.inputFocus}
            onBlur={e => e.currentTarget.style.borderColor = C.inputBorder}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!shipToName.trim()}
            className="flex-1 px-4 py-3 font-[#0D1117] text-xs uppercase tracking-widest transition-all"
            style={{ background: shipToName.trim() ? C.accent : C.textGhost, color: '#fff', cursor: shipToName.trim() ? 'pointer' : 'not-allowed' }}>
            Save & Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Adding-documents loading overlay (Lottie + blurred backdrop) ──────────────

function AddingDocumentsOverlay({ label }: { label: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        background: 'rgba(13,17,23,0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease-out',
      }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        }}
      >
        <div style={{ width: 320, height: 320 }}>
          <DotLottieReact
            data={forkliftAnimation}
            loop
            autoplay
          />
        </div>
        <p className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textPrimary }}>
          {label}
        </p>
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
    <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: C.textPrimary }}>
      {Icon && <Icon className="w-3.5 h-3.5" color={C.accent} />}
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: C.textPrimary }}>{label}</p>
      {children}
    </div>
  )
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="font-[#0D1117] text-sm truncate" style={{ color: C.textSilver }}>{children}</p>
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreateManifestTab({
  currentStep, setCurrentStep, manifest, setManifest,
  barcodeInput, setBarcodeInput, scanningDocument, barcodeInputRef,
  isLoading, isEditMode, handleBarcodeInput, removeItem,
  canProceedToStep2, canProceedToStep3, resetForm, saveManifest,
  showManualEntryModal, setShowManualEntryModal, pendingDocument,
  setPendingDocument, addDocumentWithManualShipTo, searchDocument, showToast,
  grandTotalCBM = 0, // Default to 0 if not provided
}: CreateManifestTabProps) {
  const [searchResults, setSearchResults] = useState<Array<{ documentNumber: string; shipToName: string; quantity: number; cbm?: number; materialCounts?: Record<string, number> }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'single' | 'mass'>('single') // Toggle between single and mass input
  const [massInput, setMassInput] = useState<string>('') // Mass input textarea value
  const [isProcessingMass, setIsProcessingMass] = useState(false) // Processing state for mass input
  const [truckerDropdownOpen, setTruckerDropdownOpen] = useState(false)
  const [truckerSearchInput, setTruckerSearchInput] = useState('')
  const truckerDropdownRef = useRef<HTMLDivElement>(null)
  const [truckTypeDropdownOpen, setTruckTypeDropdownOpen] = useState(false)
  const [truckTypeSearchInput, setTruckTypeSearchInput] = useState('')
  const truckTypeDropdownRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  const TRUCKER_OPTIONS = ['SF EXPRESS', 'ACCLI', 'AFFI', 'INTELUCK', 'SUYLI']
  const TRUCK_TYPE_OPTIONS = ['10W', '6WF', '6W', '4W']

  const filteredTruckers = TRUCKER_OPTIONS.filter(option =>
    option.includes((truckerSearchInput || (manifest.trucker || '')).toUpperCase())
  )

  const filteredTruckTypes = TRUCK_TYPE_OPTIONS.filter(option =>
    option.includes((truckTypeSearchInput || (manifest.truck_type || '')).toUpperCase())
  )

  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)
  const getActualCount = (item: ManifestItem) => item.actual_qty_by_material
    ? Object.values(item.actual_qty_by_material).reduce((sum, count) => sum + count, 0)
    : (item.actual_qty_dispatch ?? item.total_quantity)
  const totalDispatchedQuantity = manifest.items.reduce((sum, item) => sum + getActualCount(item), 0)
  const totalCbm = manifest.items.reduce((sum, item) => sum + (item.total_cbm ?? 0), 0)
  const hasCbm = manifest.items.some(item => item.total_cbm != null && item.total_cbm > 0)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Close trucker dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (truckerDropdownRef.current && !truckerDropdownRef.current.contains(e.target as Node)) {
        setTruckerDropdownOpen(false)
      }
    }
    if (truckerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [truckerDropdownOpen])

  // Close truck type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (truckTypeDropdownRef.current && !truckTypeDropdownRef.current.contains(e.target as Node)) {
        setTruckTypeDropdownOpen(false)
      }
    }
    if (truckTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [truckTypeDropdownOpen])

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

    const trimmed = barcodeInput.trim()
    if (trimmed && manifest.items.some(item => item.document_number === trimmed)) {
      if (showToast) showToast(`Document ${trimmed} already added`, 'error')
      setSearchResults(null); setBarcodeInput('')
      requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
      return
    }

    handleBarcodeInput(e)
    setSearchResults(null); setBarcodeInput('')
    requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
  } else if (e.key === 'Escape') {
    setSearchResults(null); setBarcodeInput('')
    if (barcodeInputRef.current) barcodeInputRef.current.focus()
  }
}

  const selectDocument = async (doc: { documentNumber: string; shipToName: string; quantity: number; cbm?: number; materialCounts?: Record<string, number> }) => {
    const exists = manifest.items.some(item => item.document_number === doc.documentNumber)
    if (exists) {
      if (showToast) showToast(`Document ${doc.documentNumber} already added`, 'error')
      setSearchResults(null); setBarcodeInput(''); return
    }
    const normalizedShipTo = (doc.shipToName || '').trim().toLowerCase()
    if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
      setPendingDocument({
        documentNumber: doc.documentNumber,
        quantity: doc.quantity,
        cbm: doc.cbm
      })
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
      actual_qty_dispatch: doc.quantity,
      actual_qty_by_material: doc.materialCounts,
      total_cbm: doc.cbm ?? 0,
    }
    setManifest({ ...manifest, items: [...manifest.items, newItem] })
    if (showToast) showToast(`Document ${doc.documentNumber} added (CBM: ${(doc.cbm || 0).toFixed(4)})`, 'success')
    setSearchResults(null); setBarcodeInput('')
    requestAnimationFrame(() => { if (barcodeInputRef.current) barcodeInputRef.current.focus() })
  }

  const handleAddDocumentWithManualShipTo = (shipToName: string) => {
  if (!pendingDocument) return

  const exists = manifest.items.some(item => item.document_number === pendingDocument.documentNumber)
  if (exists) {
    if (showToast) showToast(`Document ${pendingDocument.documentNumber} already added`, 'error')
    setPendingDocument(null)
    return
  }

  const newItem: ManifestItem = {
    item_number: manifest.items.length + 1,
    document_number: pendingDocument.documentNumber,
    ship_to_name: shipToName,
    total_quantity: pendingDocument.quantity,
    actual_qty_dispatch: pendingDocument.quantity,
    actual_qty_by_material: pendingDocument.materialCounts,
    total_cbm: pendingDocument.cbm ?? 0,
  }
  setManifest({ ...manifest, items: [...manifest.items, newItem] })
  if (showToast) showToast(`Document ${pendingDocument.documentNumber} added manually`, 'success')
  setPendingDocument(null)
}

  const updateMaterialActualCount = (idx: number, materialCode: string, value: number) => {
    const updatedItems = manifest.items.map((item, itemIndex) => {
      if (itemIndex !== idx || !item.actual_qty_by_material) return item
      const otherMaterialCount = Object.entries(item.actual_qty_by_material)
        .filter(([code]) => code !== materialCode)
        .reduce((sum, [, count]) => sum + count, 0)
      const requestedCount = Number.isFinite(value) ? Math.max(0, value) : 0
      const clamped = Math.min(requestedCount, Math.max(0, item.total_quantity - otherMaterialCount))
      const actualQtyByMaterial = { ...item.actual_qty_by_material, [materialCode]: clamped }
      return {
        ...item,
        actual_qty_by_material: actualQtyByMaterial,
        actual_qty_dispatch: Object.values(actualQtyByMaterial).reduce((sum, count) => sum + count, 0),
      }
    })
    setManifest({ ...manifest, items: updatedItems })
  }

  const handleProcessMassInput = async () => {
    if (!massInput.trim() || isProcessingMass) return
    setIsProcessingMass(true)

    // Parse input - split by comma or newline and trim
    const documentNumbers = massInput
      .split(/[,\n]/)
      .map((num) => num.trim().toUpperCase())
      .filter((num) => num.length > 0)

    if (documentNumbers.length === 0) {
      setIsProcessingMass(false)
      if (showToast) showToast('No valid document numbers found', 'error')
      return
    }

    let successCount = 0
    let skipCount = 0
    const failedDocuments: string[] = []
    const newItems: ManifestItem[] = [...manifest.items]

    try {
      for (const docNumber of documentNumbers) {
        // Check if document already exists
        if (newItems.some((item) => item.document_number === docNumber)) {
          skipCount++
          continue
        }

        // Search for document
        try {
          const results = await searchDocument(docNumber)
          if (results && results.length > 0) {
            const doc = results[0]
            const normalizedShipTo = (doc.shipToName || '').trim().toLowerCase()

            // If ship-to is N/A, we can't add it automatically (would need manual entry)
            if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
              failedDocuments.push(docNumber)
              continue
            }

            // Add to manifest
            const newItem: ManifestItem = {
              item_number: newItems.length + 1,
              document_number: doc.documentNumber,
              ship_to_name: doc.shipToName,
              total_quantity: doc.quantity,
              actual_qty_dispatch: doc.quantity,
              actual_qty_by_material: doc.materialCounts,
              total_cbm: doc.cbm ?? 0,
            }
            newItems.push(newItem)
            successCount++
          } else {
            failedDocuments.push(docNumber)
          }
        } catch {
          failedDocuments.push(docNumber)
        }

        // Small delay between requests to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Update manifest with all new items at once
      if (successCount > 0) {
        setManifest({ ...manifest, items: newItems })
      }
    } finally {
      setIsProcessingMass(false)
      setMassInput('')

      // Show summary toast
      let message = `Added ${successCount} document${successCount !== 1 ? 's' : ''}`
      if (skipCount > 0) message += `, ${skipCount} already in list`
      if (failedDocuments.length > 0) message += `, ${failedDocuments.length} not found`

      if (showToast) {
        showToast(message, successCount > 0 ? 'success' : 'error')
      }
    }
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
    border: `1px solid ${focusedInput === id ? C.inputFocus : C.inputBorder}`,
    color: C.inputText,
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const inputProps = (id: string) => ({
    onFocus: () => setFocusedInput(id),
    onBlur: () => setFocusedInput(null),
    style: inputStyle(id),
    className: 'w-full px-4 py-3 text-sm',
  })

  const steps = [
    { number: 1, title: 'Trip Info',  shortTitle: 'Info',   icon: Truck   },
    { number: 2, title: 'Scan Docs',  shortTitle: 'Scan',   icon: Barcode },
    { number: 3, title: 'Review',     shortTitle: 'Review', icon: Save    },
  ]

  return (
    <div className="h-full flex flex-col">
      {isProcessingMass && <AddingDocumentsOverlay label="Adding documents…" />}

      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => { setShowManualEntryModal(false); setPendingDocument(null) }}
        onSave={handleAddDocumentWithManualShipTo}
        documentNumber={pendingDocument?.documentNumber || ''}
        quantity={pendingDocument?.quantity || 0}
        cbm={pendingDocument?.cbm}
      />

      {/* Outer card — fills parent height, header/nav pinned, body scrolls */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>

        {/* ── Header (fixed) ── */}
        <div className="flex-shrink-0 px-5 sm:px-8 pt-8 pb-7" style={{ borderBottom: `1px solid ${C.border}` }}>

          {/* Title row with CBM pill */}
          <div className="flex items-start justify-between mb-7 sm:mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.accent }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: C.accent }} />
                </span>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold" >
                  {isEditMode ? 'Editing manifest' : 'New manifest'}
                </p>
              </div>
              <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-[#0D1117] leading-[0.93] tracking-tight" style={{ color: C.amber, fontFamily: 'var(--font-bricolage)' }}>
                {isEditMode ? 'Edit Manifest' : 'Create Manifest'}
              </h2>
              <p className="text-[12px] mt-2" style={{ color: C.textSub }}>
                SF Express · Cebu Warehouse
              </p>
            </div>

            {/* CBM Total Pill - NEW */}
            {grandTotalCBM > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
                   style={{ border: '1px solid rgba(245,166,35,0.2)', background: 'rgba(245,166,35,0.05)' }}>
                <Package className="w-3.5 h-3.5 text-[#F5A623]" />
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#F5A623]">Total CBM</span>
                <span className="text-[12px] font-[#0D1117] text-white tabular-nums">{grandTotalCBM.toFixed(4)}</span>
              </div>
            )}
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
                    <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background:  isActive ? C.accent : isCompleted ? C.amber : 'transparent',
                        border:      isActive ? 'none' : isCompleted ? `1px solid ${C.amber}` : `1px solid ${C.border}`,
                        color:       isActive ? '#fff' : isCompleted ? C.bg : C.textGhost,
                      }}
                    >
                      {isCompleted
                        ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        : <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      }
                    </div>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors"
                      style={{ color: isActive ? C.textPrimary : isCompleted ? C.accent : C.textPrimary }}>
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

        {/* ── Step content (scrollable) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8">

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">

                {/* Manifest number — read-only display */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>Manifest Number</label>
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-0.5 h-9 flex-shrink-0" style={{ background: 'rgba(232,25,44,0.6)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] mb-0.5" style={{ color: C.textPrimary }}>Auto-generated</p>
                      <p className="text-lg sm:text-2xl font-[#0D1117] tracking-wider tabular-nums truncate leading-none" style={{ color: C.textPrimary }}>
                        {manifest.manifest_number || '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>System</span>
                    </div>
                  </div>
                </div>

                {/* Manifest Date */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Manifest Date <span style={{ color: C.accent }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={manifest.manifest_date || ''}
                    onChange={(e) => setManifest({ ...manifest, manifest_date: e.target.value })}
                    required
                    {...inputProps('date')}
                  />
                </div>

                {/* Trucker Dropdown with Manual Input */}
                <div ref={truckerDropdownRef}>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Trucker <span style={{ color: C.accent }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={truckerSearchInput || manifest.trucker || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase()
                        setTruckerSearchInput(val)
                        setManifest({ ...manifest, trucker: val })
                        setTruckerDropdownOpen(true)
                      }}
                      onFocus={() => setTruckerDropdownOpen(true)}
                      placeholder="Type or select trucker..."
                      required
                      className="w-full px-4 py-3 text-sm"
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${truckerDropdownOpen ? C.inputFocus : C.inputBorder}`,
                        color: C.inputText,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                    />
                    {truckerDropdownOpen && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded shadow-lg z-10"
                        style={{ background: C.surface, border: `1px solid ${C.border}` }}
                      >
                        {filteredTruckers.length > 0 ? (
                          filteredTruckers.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setManifest({ ...manifest, trucker: option })
                                setTruckerSearchInput('')
                                setTruckerDropdownOpen(false)
                              }}
                              className="w-full text-left px-4 py-3 transition-colors text-sm"
                              style={{
                                background: manifest.trucker === option ? C.accent : 'transparent',
                                color: manifest.trucker === option ? '#fff' : C.textSilver,
                              }}
                              onMouseEnter={(e) => {
                                if (manifest.trucker !== option) {
                                  e.currentTarget.style.background = C.surfaceHover
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (manifest.trucker !== option) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              {option}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-[12px]" style={{ color: C.textPrimary }}>
                            No matches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Name */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Driver Name <span style={{ color: C.accent }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.driver_name || ''}
                    onChange={(e) => setManifest({ ...manifest, driver_name: e.target.value.toUpperCase() })}
                    placeholder="Driver's full name"
                    required
                    {...inputProps('driver')}
                  />
                </div>

                {/* Plate No */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Plate No. <span style={{ color: C.accent }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.plate_no || ''}
                    onChange={(e) => setManifest({ ...manifest, plate_no: e.target.value.toUpperCase() })}
                    placeholder="e.g., ABC-1234"
                    required
                    {...inputProps('plate')}
                  />
                </div>

                {/* Truck Type Dropdown with Manual Input */}
                <div className="sm:col-span-2" ref={truckTypeDropdownRef}>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Truck Type <span style={{ color: C.accent }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={truckTypeSearchInput || manifest.truck_type || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase()
                        setTruckTypeSearchInput(val)
                        setManifest({ ...manifest, truck_type: val })
                        setTruckTypeDropdownOpen(true)
                      }}
                      onFocus={() => setTruckTypeDropdownOpen(true)}
                      placeholder="Type or select truck type..."
                      required
                      className="w-full px-4 py-3 text-sm"
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${truckTypeDropdownOpen ? C.inputFocus : C.inputBorder}`,
                        color: C.inputText,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                    />
                    {truckTypeDropdownOpen && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded shadow-lg z-10"
                        style={{ background: C.surface, border: `1px solid ${C.border}` }}
                      >
                        {filteredTruckTypes.length > 0 ? (
                          filteredTruckTypes.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setManifest({ ...manifest, truck_type: option })
                                setTruckTypeSearchInput('')
                                setTruckTypeDropdownOpen(false)
                              }}
                              className="w-full text-left px-4 py-3 transition-colors text-sm"
                              style={{
                                background: manifest.truck_type === option ? C.accent : 'transparent',
                                color: manifest.truck_type === option ? '#fff' : C.textSilver,
                              }}
                              onMouseEnter={(e) => {
                                if (manifest.truck_type !== option) {
                                  e.currentTarget.style.background = C.surfaceHover
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (manifest.truck_type !== option) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              {option}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-[12px]" style={{ color: C.textPrimary }}>
                            No matches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Container Van No. */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Container Van No. <span style={{ color: C.textSub }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.container_van_no || ''}
                    onChange={(e) => setManifest({ ...manifest, container_van_no: e.target.value.toUpperCase() })}
                    placeholder="e.g., CVAN-1234"
                    {...inputProps('container_van_no')}
                  />
                </div>

                {/* Seal No. */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Seal No. <span style={{ color: C.textSub }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.seal_no || ''}
                    onChange={(e) => setManifest({ ...manifest, seal_no: e.target.value.toUpperCase() })}
                    placeholder="e.g., SL-98765"
                    {...inputProps('seal_no')}
                  />
                </div>

                {/* Time start */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Time Start <span style={{ color: C.accent }}>*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                    <input type="time" value={manifest.time_start || ''}
                      onChange={(e) => setManifest({ ...manifest, time_start: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm"
                      style={inputStyle('time_start')}
                      onFocus={() => setFocusedInput('time_start')} onBlur={() => setFocusedInput(null)}
                      required
                    />
                  </div>
                </div>

                {/* Time end */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>Time End</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                    <input type="time" value={manifest.time_end || ''}
                      onChange={(e) => setManifest({ ...manifest, time_end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm"
                      style={inputStyle('time_end')}
                      onFocus={() => setFocusedInput('time_end')} onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textPrimary }}>
                    Note <span style={{ color: C.textSub }}>(Optional)</span>
                  </label>
                  <textarea
                    value={manifest.remarks || ''}
                    onChange={(e) => setManifest({ ...manifest, remarks: e.target.value })}
                    placeholder="Add any notes about this trip..."
                    className="w-full px-4 py-3 text-sm font-sans resize-none rounded"
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${focusedInput === 'remarks' ? C.inputFocus : C.inputBorder}`,
                      color: C.inputText,
                      outline: 'none',
                      transition: 'border-color 0.15s',
                      minHeight: '100px',
                      maxHeight: '150px',
                    }}
                    onFocus={() => setFocusedInput('remarks')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <p className="text-[10px] mt-2 max-w-xs" style={{ color: C.textMuted }}>
                    Add delivery instructions, special handling notes, or any other remarks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Search box with toggle */}
              <div className="p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={Search}>Document Search</SectionLabel>
                  {/* Toggle between single and mass input */}
                  <div className="flex gap-2 bg-opacity-30 rounded-lg p-1" style={{ background: 'rgba(232,25,44,0.08)' }}>
                    <button
                      onClick={() => { setInputMode('single'); setMassInput('') }}
                      className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 rounded"
                      style={{
                        background: inputMode === 'single' ? C.accent : 'transparent',
                        color: inputMode === 'single' ? '#fff' : C.textPrimary,
                      }}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => { setInputMode('mass'); setBarcodeInput(''); setSearchResults(null) }}
                      className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-200 rounded"
                      style={{
                        background: inputMode === 'mass' ? C.accent : 'transparent',
                        color: inputMode === 'mass' ? '#fff' : C.textPrimary,
                      }}
                    >
                      Mass Input
                    </button>
                  </div>
                </div>

                {/* Single input mode */}
                {inputMode === 'single' && (
                  <>
                    <div className="relative mt-3 sm:mt-4">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textGhost }} />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                        onKeyDown={handleSearchInputKeyDown}
                        placeholder="DN / TRA number…"
                        disabled={scanningDocument || isProcessingMass}
                        inputMode="search" autoComplete="off"
                        className="w-full pl-10 pr-4 py-3 text-sm"
                        style={inputStyle('search')}
                        onFocus={() => setFocusedInput('search')} onBlur={() => setFocusedInput(null)}
                      />
                    </div>

                    {/* Searching spinner */}
                    {isSearching && barcodeInput.trim().length >= 1 && (
                      <div className="mt-3 p-3 flex items-center gap-2 text-[11px]" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textPrimary }}>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border border-t-transparent" style={{ borderColor: C.accent, borderTopColor: 'transparent' }} />
                        Searching…
                      </div>
                    )}

                    {/* Results */}
                    {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length > 0 && (
                      <div className="mt-3 overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                        {searchResults.map((result, idx) => (
                          <button key={idx} onClick={() => selectDocument(result)} type="button"
                            className="w-full text-left px-3 py-3 transition-colors group"
                            style={{ borderTop: idx > 0 ? `1px solid ${C.divider}` : 'none', background: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span className="text-[10px]" style={{ color: C.textPrimary }}>{String(idx + 1).padStart(2, '0')}</span>
                                <span className="font-[#0D1117] text-sm truncate transition-colors" style={{ color: C.textSilver }}>{result.documentNumber}</span>
                              </div>
                              <div className="flex items-baseline gap-3 flex-shrink-0">
                                {result.cbm != null && result.cbm > 0 && (
                                  <span className="text-[10px] font-bold tabular-nums" style={{ color: C.amber }}>{result.cbm.toFixed(4)} CBM</span>
                                )}
                                <span className="text-[10px] font-bold" style={{ color: C.accent }}>×{result.quantity}</span>
                              </div>
                            </div>
                            <p className="text-[11px] mt-0.5 pl-6 truncate" style={{ color: C.textPrimary }}>{result.shipToName}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Not found */}
                    {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length === 0 && (
                      <div className="mt-3 p-4 flex items-start gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.accent }} />
                        <div>
                          <p className="font-[#0D1117] text-xs uppercase tracking-widest" style={{ color: C.textSilver }}>Not Found</p>
                          <p className="text-[11px] mt-1" style={{ color: C.textPrimary }}>
                            Press Enter to add <span className="font-bold" style={{ color: C.textSilver }}>"{barcodeInput}"</span> manually
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Mass input mode */}
                {inputMode === 'mass' && (
                  <>
                    <div className="mt-3 sm:mt-4">
                      <textarea
                        value={massInput}
                        onChange={(e) => setMassInput(e.target.value.toUpperCase())}
                        placeholder="Enter DN/TRA numbers - one per line or comma-separated"
                        disabled={isProcessingMass}
                        className="w-full px-4 py-3 text-sm font-mono resize-none"
                        style={{
                          background: C.inputBg,
                          border: `1px solid ${focusedInput === 'mass' ? C.inputFocus : C.inputBorder}`,
                          color: C.inputText,
                          outline: 'none',
                          transition: 'border-color 0.15s',
                          minHeight: '120px',
                          maxHeight: '200px',
                        }}
                        onFocus={() => setFocusedInput('mass')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleProcessMassInput}
                        disabled={!massInput.trim() || isProcessingMass}
                        className="flex-1 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all"
                        style={{
                          background: !massInput.trim() || isProcessingMass ? C.textGhost : C.accent,
                          color: '#fff',
                          cursor: !massInput.trim() || isProcessingMass ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isProcessingMass ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border border-t-transparent border-white" />
                            Processing…
                          </span>
                        ) : (
                          'Add All'
                        )}
                      </button>
                      <button
                        onClick={() => setMassInput('')}
                        disabled={isProcessingMass}
                        className="px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all"
                        style={{
                          border: `1px solid ${C.border}`,
                          color: isProcessingMass ? C.textGhost : C.textPrimary,
                          cursor: isProcessingMass ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    </div>

                    {/* Info text */}
                    <div className="mt-3 p-3 flex items-start gap-2 text-[11px]" style={{ border: `1px solid`, borderRadius: '6px', color: C.textPrimary }}>
                      <span style={{ color: C.amber, fontWeight: 'bold', marginTop: '2px' }}>i</span>
                      <div>
                        <p>Separate document numbers with commas or new lines</p>
                        <p className="mt-1">Documents with missing ship-to names will be skipped</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3.5" style={{ background: totalDocuments > 0 ? 'rgba(34,197,94,0.045)' : C.surface, border: `1px solid ${totalDocuments > 0 ? 'rgba(34,197,94,0.2)' : C.border}` }}>
                <div className="flex items-start gap-2.5">
                  {totalDocuments > 0
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.textMuted }} />}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: totalDocuments > 0 ? '#86efac' : C.textSilver }}>
                      {totalDocuments > 0 ? 'Orders added' : 'Waiting for orders'}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                      {totalDocuments > 0 ? 'The order list below is ready to check before review.' : 'Add a DN or TRA number above to build the order list.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pl-6 sm:pl-0">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: C.textMuted }}>Orders</p>
                    <p className="text-base font-bold tabular-nums" style={{ color: C.textPrimary }}>{totalDocuments}</p>
                  </div>
                  <div className="h-7 w-px" style={{ background: C.divider }} />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest" style={{ color: C.textMuted }}>Units</p>
                    <p className="text-base font-bold tabular-nums" style={{ color: '#fff' }}>{totalQuantity}</p>
                  </div>
                </div>
              </div>

              {/* Scanned list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <SectionLabel icon={Package}>Orders ({totalDocuments})</SectionLabel>
                    <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>Expected is the order quantity. Dispatched is what will be recorded.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasCbm && (
                      <span className="text-[10px]" style={{ color: C.textPrimary }}>
                        CBM: <span className="font-[#0D1117] tabular-nums" style={{ color: C.amber }}>{totalCbm.toFixed(4)}</span>
                      </span>
                    )}
                    {totalQuantity > 0 && (
                      <span className="text-[10px]" style={{ color: C.textPrimary }}>
                        Total: <span className="font-[#0D1117] tabular-nums" style={{ color: C.textSilver }}>{totalQuantity}</span>
                      </span>
                    )}
                    {totalQuantity > 0 && (
                      <span className="text-[10px]" style={{ color: C.textPrimary }}>
                        Dispatched: <span className="font-[#0D1117] tabular-nums" style={{ color: totalDispatchedQuantity < totalQuantity ? C.amber : C.textSilver }}>{totalDispatchedQuantity}</span>
                      </span>
                    )}
                  </div>
                </div>

                {manifest.items.length === 0 ? (
                  <div className="py-12 text-center" style={{ border: `1px dashed ${C.border}` }}>
                    <Package className="w-7 h-7 mx-auto mb-2.5" style={{ color: C.textGhost }} />
                    <p className="font-[#0D1117] text-xs uppercase tracking-widest" style={{ color: C.textPrimary }}>No documents yet</p>
                    <p className="text-[11px] mt-1" style={{ color: C.textGhost }}>Scan or type a DN/TRA above</p>
                  </div>
                ) : (
                  <div style={{ borderTop: `1px solid ${C.divider}` }}>
                    {manifest.items.map((item, idx) => {
                      const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity
                      const isShort = dispatchedQty < item.total_quantity
                      return (
                      <React.Fragment key={idx}>
                      <div className="group flex items-center gap-3 py-3.5 transition-all duration-150"
                        style={{ borderBottom: `1px solid ${C.divider}` }}>
                        <span className="text-[11px] font-bold w-5 flex-shrink-0" style={{ color: C.textGhost }}>
                          {String(item.item_number).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-[#0D1117] text-sm truncate transition-colors group-hover:text-white" style={{ color: C.textSilver }}>{item.ship_to_name}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: C.textPrimary }}>{item.document_number}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          {item.total_cbm != null && item.total_cbm > 0 && (
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: C.amber }}>{item.total_cbm.toFixed(4)}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline text-[9px] uppercase tracking-widest" style={{ color: C.textGhost }}>Expected</span>
                            <span className="sm:hidden text-[9px] uppercase tracking-widest" style={{ color: C.textGhost }}>Ord.</span>
                            <span className="w-9 sm:w-14 text-right text-sm font-[#0D1117] tabular-nums" style={{ color: '#fff' }}>
                              {item.total_quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline text-[9px] uppercase tracking-widest" style={{ color: C.textGhost }}>Disp</span>
                            <span className="sm:hidden text-[9px] uppercase tracking-widest" style={{ color: C.textGhost }}>Disp.</span>
                            <span className="w-9 sm:w-14 text-right text-sm font-[#0D1117] tabular-nums" style={{ color: '#fff' }}>
                              {dispatchedQty}
                            </span>
                          </div>
                          <span className="hidden md:inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-2 py-1" style={{ color: isShort ? C.amber : '#86efac', background: isShort ? 'rgba(193,248,92,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${isShort ? 'rgba(193,248,92,0.18)' : 'rgba(34,197,94,0.18)'}` }}>
                            {isShort ? 'Check qty' : 'Ready'}
                          </span>
                        </div>
                        <button onClick={() => removeItem(idx)} className="p-1.5 flex-shrink-0 touch-manipulation transition-colors" style={{ color: C.textGhost }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.textGhost)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.actual_qty_by_material && Object.keys(item.actual_qty_by_material).length > 0 && (
                        <div className="ml-8 py-2 space-y-2" style={{ borderBottom: `1px solid ${C.divider}` }}>
                          {Object.entries(item.actual_qty_by_material).map(([materialCode, actualCount]) => (
                            <div key={materialCode} className="flex items-center justify-between gap-3">
                              <span className="text-[10px] uppercase tracking-widest truncate" style={{ color: C.textPrimary }}>{materialCode}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[9px] uppercase tracking-widest" style={{ color: C.textGhost }}>Actual Count</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={Math.max(0, item.total_quantity - Object.entries(item.actual_qty_by_material ?? {})
                                    .filter(([code]) => code !== materialCode)
                                    .reduce((sum, [, count]) => sum + count, 0))}
                                  value={Math.min(actualCount, item.total_quantity)}
                                  onChange={(e) => updateMaterialActualCount(idx, materialCode, e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-14 px-1.5 py-1 text-xs text-right tabular-nums rounded"
                                  style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.inputText, outline: 'none' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      </React.Fragment>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Trip info */}
              <div className="p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <SectionLabel icon={Truck}>Trip Information</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-y-5 mt-4">
                  <Field label="Manifest No."><FieldValue>{manifest.manifest_number}</FieldValue></Field>
                  <Field label="Date"><FieldValue>{manifest.manifest_date}</FieldValue></Field>
                  <Field label="Trucker"><FieldValue>{manifest.trucker || '—'}</FieldValue></Field>
                  <Field label="Driver"><FieldValue>{manifest.driver_name || '—'}</FieldValue></Field>
                  <Field label="Plate No."><FieldValue>{manifest.plate_no || '—'}</FieldValue></Field>
                  <Field label="Truck Type"><FieldValue>{manifest.truck_type || '—'}</FieldValue></Field>
                  {manifest.container_van_no && (
                    <Field label="Container Van No."><FieldValue>{manifest.container_van_no}</FieldValue></Field>
                  )}
                  {manifest.seal_no && (
                    <Field label="Seal No."><FieldValue>{manifest.seal_no}</FieldValue></Field>
                  )}
                  <Field label="Time Start"><FieldValue>{formatTime12hr(manifest.time_start)}</FieldValue></Field>
                  <Field label="Time End"><FieldValue>{formatTime12hr(manifest.time_end)}</FieldValue></Field>
                  {manifest.time_start && manifest.time_end && (
                    <Field label="Duration">
                      <p className="font-[#0D1117] text-sm tabular-nums" style={{ color: C.amber }}>{getDuration()}</p>
                    </Field>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              {manifest.remarks && (
                <div className="p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                  <SectionLabel icon={MessageSquare}>Note</SectionLabel>
                  <div className="mt-4 p-4 rounded" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.textSilver }}>
                      {manifest.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="p-4 sm:p-6" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={Package}>Documents ({totalDocuments})</SectionLabel>
                  <div className="flex items-center gap-4">
                    {hasCbm && (
                      <span className="text-[10px]" style={{ color: C.textPrimary }}>
                        Total CBM: <span className="font-[#0D1117] tabular-nums" style={{ color: C.amber }}>{totalCbm.toFixed(4)}</span>
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: C.textPrimary }}>
                      Total Qty: <span className="font-[#0D1117] tabular-nums" style={{ color: C.textSilver }}>{totalQuantity}</span>
                    </span>
                    <span className="text-[10px]" style={{ color: C.textPrimary }}>
                      Dispatched: <span className="font-[#0D1117] tabular-nums" style={{ color: totalDispatchedQuantity < totalQuantity ? C.amber : C.textSilver }}>{totalDispatchedQuantity}</span>
                    </span>
                  </div>
                </div>

                {/* Header row */}
                <div className={`grid gap-x-3 pb-2.5 text-[10px] uppercase tracking-widest font-bold ${hasCbm ? 'grid-cols-[1.5rem_1fr_auto_auto_auto_auto]' : 'grid-cols-[1.5rem_1fr_auto_auto_auto]'}`}
                  style={{ color: C.textGhost, borderBottom: `1px solid ${C.border}` }}>
                  <span>#</span>
                  <span>Ship To</span>
                  <span className="hidden sm:block">DN / TRA</span>
                  {hasCbm && <span className="text-right" style={{ color: C.amber }}>CBM</span>}
                  <span className="text-right">Qty</span>
                  <span className="text-right">Disp.</span>
                </div>

                {manifest.items.map((item) => {
                  const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity
                  const isShort = dispatchedQty < item.total_quantity
                  return (
                  <div key={item.item_number}
                    className={`grid gap-x-3 py-3.5 items-center group/row hover:pl-1 transition-all duration-150 ${hasCbm ? 'grid-cols-[1.5rem_1fr_auto_auto_auto_auto]' : 'grid-cols-[1.5rem_1fr_auto_auto_auto]'}`}
                    style={{ borderBottom: `1px solid ${C.divider}` }}>
                    <span className="text-[11px] font-bold group-hover/row:text-[#E8192C] transition-colors" style={{ color: C.textGhost }}>
                      {String(item.item_number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-[#0D1117] text-sm truncate group-hover/row:text-white transition-colors" style={{ color: C.textSilver }}>{item.ship_to_name}</p>
                      <p className="sm:hidden text-[11px] mt-0.5 truncate" style={{ color: C.textPrimary }}>{item.document_number}</p>
                    </div>
                    <span className="text-[11px] hidden sm:block" style={{ color: C.textPrimary }}>{item.document_number}</span>
                    {hasCbm && (
                      <span className="text-[11px] font-bold tabular-nums text-right" style={{ color: item.total_cbm != null && item.total_cbm > 0 ? C.amber : C.textGhost }}>
                        {item.total_cbm != null && item.total_cbm > 0 ? item.total_cbm.toFixed(4) : '—'}
                      </span>
                    )}
                    <span className="text-sm font-[#0D1117] tabular-nums text-right" style={{ color: '#fff' }}>×{item.total_quantity}</span>
                    <span className="text-sm font-[#0D1117] tabular-nums text-right" style={{ color: '#fff' }}>×{dispatchedQty}</span>
                  </div>
                  )
                })}

                {/* Grand total footer */}
                {manifest.items.length > 0 && (
                  <div className={`grid gap-x-3 py-3 items-center ${hasCbm ? 'grid-cols-[1.5rem_1fr_auto_auto_auto_auto]' : 'grid-cols-[1.5rem_1fr_auto_auto_auto]'}`}
                    style={{ borderTop: `1px solid ${C.border}`, background: '#0a0a0a' }}>
                    <span />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-right col-span-2 hidden sm:block" style={{ color: C.textGhost }}>Grand Total</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest col-span-1 sm:hidden" style={{ color: C.textGhost }}>Total</span>
                    {hasCbm && (
                      <span className="text-[12px] font-[#0D1117] tabular-nums text-right" style={{ color: C.amber }}>{totalCbm.toFixed(4)}</span>
                    )}
                    <span className="text-sm font-[#0D1117] tabular-nums text-right" style={{ color: C.accent }}>×{totalQuantity}</span>
                    <span className="text-sm font-[#0D1117] tabular-nums text-right" style={{ color: '#fff' }}>×{totalDispatchedQuantity}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Navigation (fixed footer) ── */}
        <div className="flex-shrink-0 flex justify-between gap-3 px-5 sm:px-8 py-5 sm:py-7" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
            disabled={currentStep === 1}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-150"
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
              className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 font-[#0D1117] text-xs uppercase tracking-widest transition-all duration-150"
              style={{
                background: C.amber,
                opacity: (currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3()) ? 0.3 : 1,
                cursor: (currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3()) ? 'not-allowed' : 'pointer',
              }}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex gap-2 sm:gap-3">
              <button onClick={resetForm}
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 font-bold text-xs uppercase tracking-widest transition-all duration-150"
                style={{ border: `1px solid ${C.border}`, color: C.textSub }}>
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <button onClick={saveManifest} disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 font-[#0D1117] text-xs uppercase tracking-widest transition-all duration-150"
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
  )
}