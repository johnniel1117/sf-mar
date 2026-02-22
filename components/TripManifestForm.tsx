'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Download, Barcode, Plus, X, AlertCircle, Save, FileText,
  CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck,
  ClipboardList, Eye, Info, Clock, FileSpreadsheet, Home, Menu
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useTripManifest } from '@/hooks/useTripManifest'
import { TripManifestPDFGenerator } from '@/lib/utils/tripManifestPdfGenerator'
import { TripManifestExcelGenerator } from '@/lib/utils/tripManifestExcelGenerator'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { ManifestTabs } from '@/components/ManifestTabs'
import { CreateManifestTab } from '@/components/tabs/CreateManifestTab'
import { SavedManifestsTab } from '@/components/tabs/SavedManifestTab'
import { ViewManifestModal } from '@/components/modals/ViewManifestModal'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { DownloadModal } from '@/components/modals/DownloadManifestModal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const icons = {
  Truck, Barcode, ClipboardList, Download, Plus, X, AlertCircle, Save,
  FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Eye, Info,
  Clock, FileSpreadsheet, Home,
} as const

type Step = 1 | 2 | 3

function buildNextManifestNumber(existingNumbers: string[]): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const datePrefix = `TM-${year}${month}${day}`
  const todaySequences = existingNumbers
    .filter(num => num.startsWith(datePrefix + '-'))
    .map(num => {
      const parsed = parseInt(num.slice(datePrefix.length + 1), 10)
      return isNaN(parsed) ? 0 : parsed
    })
  const next = todaySequences.length > 0 ? Math.max(...todaySequences) + 1 : 1
  return `${datePrefix}-${String(next).padStart(3, '0')}`
}

async function fetchNextManifestNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('trip_manifests')
      .select('manifest_number')
    if (error) throw error
    const numbers = (data || []).map((row: { manifest_number: string }) => row.manifest_number)
    return buildNextManifestNumber(numbers)
  } catch (err) {
    console.error('Error fetching manifest numbers:', err)
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `TM-${y}${m}${d}-001`
  }
}

const EMPTY_MANIFEST = (): TripManifest => ({
  manifest_number: '',
  manifest_date: new Date().toISOString().split('T')[0],
  driver_name: '',
  plate_no: '',
  trucker: '',
  truck_type: '',
  time_start: '',
  time_end: '',
  remarks: '',
  status: 'draft',
  items: [],
})

export default function TripManifestForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [manifest, setManifest] = useState<TripManifest>(EMPTY_MANIFEST())
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanningDocument, setScanningDocument] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingManifest, setViewingManifest] = useState<TripManifest | null>(null)
  const [editingManifestId, setEditingManifestId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [pendingDocument, setPendingDocument] = useState<{ documentNumber: string; quantity: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean }>({
    message: '', type: 'info', show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast({ message: '', type: 'info', show: false }), 3000)
  }

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean; title: string; message: string
    onConfirm: () => void; onCancel: () => void
  }>({ show: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} })

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true, title, message, onConfirm,
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    })
  }

  const {
    isLoading, savedManifests, loadManifests,
    saveManifest: saveManifestService, deleteManifest, lookupDocument,
  } = useTripManifest()

  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedDownloadType, setSelectedDownloadType] = useState<'pdf' | 'excel' | 'both' | null>(null)
  const [pendingManifestForDownload, setPendingManifestForDownload] = useState<TripManifest | null>(null)

  const openDownloadModal = (m: TripManifest) => {
    setPendingManifestForDownload(m)
    setSelectedDownloadType('both')
    setShowDownloadModal(true)
  }

  const handleConfirmDownload = () => {
    if (!pendingManifestForDownload || !selectedDownloadType) return
    if (selectedDownloadType === 'pdf' || selectedDownloadType === 'both')
      TripManifestPDFGenerator.generatePDF(pendingManifestForDownload)
    if (selectedDownloadType === 'excel' || selectedDownloadType === 'both')
      TripManifestExcelGenerator.generateExcel(pendingManifestForDownload)
    setShowDownloadModal(false)
    setPendingManifestForDownload(null)
    setSelectedDownloadType(null)
    showToast('Download started!', 'success')
  }

  useEffect(() => {
    loadManifests()
    fetchNextManifestNumber().then(nextNumber => {
      setManifest(prev => ({ ...prev, manifest_number: prev.manifest_number || nextNumber }))
    })
  }, [])

  useEffect(() => {
    if (currentStep === 2 && barcodeInputRef.current) barcodeInputRef.current.focus()
  }, [currentStep])

  const searchDocument = async (documentNumber: string): Promise<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null> => {
    if (!documentNumber || documentNumber.length < 1) return null
    try {
      const response = await fetch(`/api/documents/search?query=${encodeURIComponent(documentNumber)}`)
      if (!response.ok) throw new Error('Search request failed')
      const { results } = await response.json()
      return results?.length ? results : []
    } catch {
      return []
    }
  }

  const addDocumentWithManualShipTo = (shipToName: string) => {
    if (!pendingDocument) return
    const newItem: ManifestItem = {
      item_number: manifest.items.length + 1,
      document_number: pendingDocument.documentNumber,
      ship_to_name: shipToName,
      total_quantity: pendingDocument.quantity,
    }
    setManifest({ ...manifest, items: [...manifest.items, newItem] })
    showToast(`Document ${pendingDocument.documentNumber} added`, 'success')
    setPendingDocument(null)
  }

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const barcode = barcodeInput.trim()
    if (!barcode) return
    setScanningDocument(true)
    try {
      const doc = await lookupDocument(barcode)
      if (doc) {
        const exists = manifest.items.some(item => item.document_number === doc.document_number)
        if (exists) {
          showToast(`Document ${doc.document_number} already added`, 'error')
          setBarcodeInput('')
        } else {
          const normalizedShipTo = (doc.ship_to_name || '').trim().toLowerCase()
          if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
            setPendingDocument({ documentNumber: doc.document_number, quantity: doc.total_quantity || 0 })
            setShowManualEntryModal(true)
            setBarcodeInput('')
          } else {
            setManifest({
              ...manifest,
              items: [...manifest.items, {
                item_number: manifest.items.length + 1,
                document_number: doc.document_number,
                ship_to_name: doc.ship_to_name || 'N/A',
                total_quantity: doc.total_quantity || 0,
              }],
            })
            showToast(`Document ${doc.document_number} added`, 'success')
            setBarcodeInput('')
          }
        }
      } else {
        showToast(`No data found for: ${barcode}`, 'error')
        setBarcodeInput('')
      }
    } catch {
      showToast('Error scanning document', 'error')
      setBarcodeInput('')
    } finally {
      setScanningDocument(false)
      setTimeout(() => barcodeInputRef.current?.focus(), 100)
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = manifest.items.filter((_, i) => i !== index)
    updatedItems.forEach((item, i) => { item.item_number = i + 1 })
    setManifest({ ...manifest, items: updatedItems })
  }

  const resetForm = async () => {
    const nextNumber = await fetchNextManifestNumber()
    setManifest({ ...EMPTY_MANIFEST(), manifest_number: nextNumber })
    setBarcodeInput('')
    setCurrentStep(1)
    setEditingManifestId(null)
    setIsEditMode(false)
    loadManifests()
  }

  const handleEditManifest = async (manifestToEdit: TripManifest) => {
    try {
      setManifest({
        ...manifestToEdit,
        items: manifestToEdit.items || [],
        time_start: manifestToEdit.time_start || '',
        time_end: manifestToEdit.time_end || '',
      })
      setEditingManifestId(manifestToEdit.id || null)
      setIsEditMode(true)
      setCurrentStep(1)
      setActiveTab('create')
      showToast('Manifest loaded for editing', 'info')
    } catch {
      showToast('Failed to load manifest for editing', 'error')
    }
  }

  const saveManifest = async () => {
    try {
      if (isEditMode && editingManifestId) {
        const response = await fetch(`/api/trip-manifest/${editingManifestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manifest),
        })
        if (!response.ok) throw new Error('Failed to update manifest')
        showToast('Manifest updated!', 'success')
      } else {
        await saveManifestService(manifest)
        showToast('Manifest saved!', 'success')
      }
      openDownloadModal(manifest)
      await resetForm()
      setActiveTab('saved')
    } catch {
      showToast('Error saving manifest', 'error')
    }
  }

  const canProceedToStep2 = () => !!(manifest.driver_name && manifest.plate_no && manifest.trucker && manifest.time_start)
  const canProceedToStep3 = () => manifest.items.length > 0

  const handleDeleteManifest = async (manifestId: string) => {
    if (!manifestId) { showToast('Invalid manifest ID', 'error'); return }
    showConfirmation(
      'Delete Manifest',
      'Are you sure you want to delete this manifest? This cannot be undone.',
      async () => {
        try {
          await deleteManifest(manifestId)
          showToast('Manifest deleted!', 'success')
          await loadManifests()
          if (!isEditMode) {
            const nextNumber = await fetchNextManifestNumber()
            setManifest(prev => ({ ...prev, manifest_number: nextNumber }))
          }
        } catch {
          showToast('Error deleting manifest.', 'error')
        }
      }
    )
  }

  return (
    /*
     * LAYOUT STRATEGY — fixes the scrolling navbar/sidebar issue:
     *
     * The page is split into a fixed-height viewport container:
     *   [fixed navbar 73px] + [below-nav row that fills remaining vh]
     *
     * The below-nav row is flex row:
     *   [sidebar — fixed height, no overflow] + [main — overflow-y-auto]
     *
     * This means ONLY the main content area scrolls.
     * The navbar and sidebar are always visible and never move.
     */
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">

      {/* ── Top Navigation Bar — fixed height, never scrolls ── */}
      <nav
        className="flex-shrink-0 h-[73px] border-b border-[#282828] z-50 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 "
        // style={{ background: 'linear-gradient(90deg, #0a0a0a 0%, #121212 100%)' }}
      >
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-[#282828] rounded-full transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-[#B3B3B3]" />
        </button>

        {/* Home link */}
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-[#282828] transition-colors flex-shrink-0"
          title="Home"
        >
          <Home className="w-4 h-4 text-[#6A6A6A] hover:text-[#B3B3B3] transition-colors" />
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-[#282828] flex-shrink-0 hidden sm:block" />

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
          >
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
          </div>
          <div className="hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#6A6A6A] leading-none mb-0.5">SF Express</p>
            <h1 className="text-white text-sm font-black leading-none">Trip Manifest</h1>
          </div>
          <div className="sm:hidden">
            <h1 className="text-white text-sm font-black">Trip Manifest</h1>
          </div>
        </div>

        {/* Active tab pill — shows which tab is active */}
        {/* <div className="hidden md:flex items-center gap-1 ml-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'create'
              ? 'bg-[#E8192C]/15 text-[#E8192C] border border-[#E8192C]/30'
              : 'text-[#6A6A6A]'
          }`}>
            Create
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-[#E8192C]/15 text-[#E8192C] border border-[#E8192C]/30'
              : 'text-[#6A6A6A]'
          }`}>
            Saved
          </span>
        </div> */}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side — manifest number badge when creating */}
        {activeTab === 'create' && manifest.manifest_number && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border border-[#3E3E3E] rounded-full">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A]">No.</span>
            <span className="text-xs font-black text-white tabular-nums">{manifest.manifest_number}</span>
          </div>
        )}

        {/* Edit mode badge */}
        {isEditMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 border border-blue-500/30 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-400">Editing</span>
          </div>
        )}
      </nav>

      {/* ── Below-nav row — fills remaining height exactly ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-black/35">

        {/* Sidebar — ManifestTabs handles its own fixed positioning */}
        <ManifestTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* ── Main content — ONLY this scrolls ── */}
        <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
          {/* Subtle red ambient glow */}
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-[#E8192C]/3 rounded-full blur-[120px] z-0" />

          <div className="relative z-10 p-4 sm:p-6 lg:p-8">
            {activeTab === 'create' && (
              <CreateManifestTab
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                manifest={manifest}
                setManifest={setManifest}
                barcodeInput={barcodeInput}
                setBarcodeInput={setBarcodeInput}
                scanningDocument={scanningDocument}
                barcodeInputRef={barcodeInputRef}
                isLoading={isLoading}
                isEditMode={isEditMode}
                handleBarcodeInput={handleBarcodeInput}
                removeItem={removeItem}
                canProceedToStep2={canProceedToStep2}
                canProceedToStep3={canProceedToStep3}
                resetForm={resetForm}
                saveManifest={saveManifest}
                showManualEntryModal={showManualEntryModal}
                setShowManualEntryModal={setShowManualEntryModal}
                pendingDocument={pendingDocument}
                setPendingDocument={setPendingDocument}
                addDocumentWithManualShipTo={addDocumentWithManualShipTo}
                searchDocument={searchDocument}
                showToast={showToast}
              />
            )}

            {activeTab === 'saved' && (
              /* SavedManifestsTab is itself a fixed-height flex column — give it the full remaining height */
              <div className="h-[calc(100vh-73px-3rem)] sm:h-[calc(100vh-73px-4rem)]">
                <SavedManifestsTab
                  savedManifests={savedManifests}
                  handleViewManifest={(m) => { setViewingManifest(m); setShowViewModal(true) }}
                  handleEditManifest={handleEditManifest}
                  handleDownloadManifest={openDownloadModal}
                  handleDeleteManifest={handleDeleteManifest}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      <ViewManifestModal
        isOpen={showViewModal}
        manifest={viewingManifest}
        onClose={() => { setShowViewModal(false); setViewingManifest(null) }}
        onEdit={handleEditManifest}
        onDownloadPDF={openDownloadModal}
      />

      <ConfirmationModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm()
          setConfirmModal(prev => ({ ...prev, show: false }))
        }}
        onCancel={confirmModal.onCancel}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        downloadType={selectedDownloadType || 'both'}
        onDownloadTypeChange={(type) => setSelectedDownloadType(type)}
        onConfirm={handleConfirmDownload}
        onClose={() => {
          setShowDownloadModal(false)
          setPendingManifestForDownload(null)
          setSelectedDownloadType(null)
        }}
      />

      {/* ── Toast — always on top, never affected by scroll ── */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-white z-[100] border ${
          toast.type === 'success'
            ? 'bg-[#1E1E1E] border-green-500/40 shadow-green-500/10'
            : toast.type === 'error'
            ? 'bg-[#1E1E1E] border-[#E8192C]/40 shadow-[#E8192C]/10'
            : 'bg-[#1E1E1E] border-blue-500/40 shadow-blue-500/10'
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-[#E8192C]' : 'bg-blue-500'
          }`} />
          <span className="text-sm font-semibold text-white">{toast.message}</span>
          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-1 p-0.5 rounded-full hover:bg-[#3E3E3E] transition-colors"
          >
            <X className="w-3 h-3 text-[#6A6A6A]" />
          </button>
        </div>
      )}
    </div>
  )
}