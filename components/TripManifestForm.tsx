'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Download, Barcode, Plus, X, AlertCircle, Save, FileText,
  CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck,
  ClipboardList, Eye, Info, Clock, FileSpreadsheet, Home, Menu, TrendingUp,
  BarChart2, ArrowUpRight
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
import { OutboundAnalyticsPanel } from '@/components/OutboundAnalytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  status: 'draft',
  items: [],
})

export default function TripManifestForm({ role }: { role?: string }) {
  const isViewer = role?.toLowerCase() === 'viewer'

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [manifest, setManifest] = useState<TripManifest>(EMPTY_MANIFEST())
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanningDocument, setScanningDocument] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'analytics'>(isViewer ? 'saved' : 'create')
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingManifest, setViewingManifest] = useState<TripManifest | null>(null)
  const [editingManifestId, setEditingManifestId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [pendingDocument, setPendingDocument] = useState<{ documentNumber: string; quantity: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

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
    <div className="h-screen flex flex-col bg-black overflow-hidden">

      {/* ── Top Navigation Bar — landing page style ── */}
      <nav className="relative flex-shrink-0 h-[73px] border-b border-[#1a1a1a] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-4 bg-black">

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-[#0a0a0a] rounded-full transition-colors flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-gray-500" />
        </button>

        {/* Home */}
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-[#0a0a0a] transition-colors flex-shrink-0"
          title="Home"
        >
          <Home className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
        </Link>

        <div className="w-px h-4 bg-[#1a1a1a] flex-shrink-0 hidden sm:block" />

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 bg-[#1a1a1a] hidden sm:block" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#6A6A6A]  hidden sm:block">
              Trip Manifest
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#6A6A6A]  sm:hidden">
              Manifest
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Right side chips */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Manifest number pill */}
          {activeTab === 'create' && manifest.manifest_number && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] rounded-full flex-shrink-0">
              <span className="text-[10px]  uppercase tracking-[0.15em] text-gray-500">No.</span>
              <span className="text-[11px] font-black text-white tabular-nums ">{manifest.manifest_number}</span>
            </div>
          )}

          {/* Edit mode badge */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500/20 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px]  font-bold uppercase tracking-widest text-blue-400">Editing</span>
            </div>
          )}

          {/* Analytics button — amber accent, matches landing */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px]  font-bold uppercase tracking-widest transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'border-[#F5A623]/30 text-[#F5A623] bg-[#F5A623]/5'
                : 'border-[#1a1a1a] text-gray-500 hover:border-gray-500 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ManifestTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (isViewer && tab === 'create') return
            setActiveTab(tab as 'create' | 'saved' | 'analytics')
            setSidebarCollapsed(true)
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto min-h-0 min-w-0 bg-black">
          {/* Subtle red ambient glow — same as landing */}
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-[#E8192C]/3 rounded-full blur-[120px] z-0" />

          <div className="relative z-10 p-5 sm:p-8 lg:p-10 h-full">
            {activeTab === 'create' && !isViewer && (
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
              <div className="h-full">
                <SavedManifestsTab
                  savedManifests={savedManifests}
                  handleViewManifest={(m) => { setViewingManifest(m); setShowViewModal(true) }}
                  handleEditManifest={handleEditManifest}
                  handleDownloadManifest={openDownloadModal}
                  handleDeleteManifest={handleDeleteManifest}
                  isViewer={isViewer}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="h-full w-full">
                <div className="h-full w-full overflow-y-auto">
                  {savedManifests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16">
                      <TrendingUp className="w-10 h-10 text-[#1a1a1a] mx-auto mb-5" />
                      <p className="text-[10px]  uppercase tracking-[0.25em] text-[#F5A623] mb-3">No data yet</p>
                      <h4 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                        Nothing to analyze
                      </h4>
                      <p className="text-sm  text-gray-500 max-w-sm mb-8 leading-relaxed">
                        Save trip manifests to see trends, top destinations, trucker performance, and more.
                      </p>
                      {!isViewer && (
                        <button
                          onClick={() => setActiveTab('create')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1a1a1a] text-[10px]  font-bold uppercase tracking-widest text-gray-500 hover:border-gray-500 hover:text-white transition-all"
                        >
                          Create First Manifest
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <OutboundAnalyticsPanel manifests={savedManifests} />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
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

      {/* ── Toast — landing-style ── */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border bg-black ${
          toast.type === 'success' ? 'border-green-500/20'
          : toast.type === 'error'  ? 'border-[#E8192C]/20'
          : 'border-blue-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            toast.type === 'success' ? 'bg-green-500'
            : toast.type === 'error'  ? 'bg-[#E8192C]'
            : 'bg-blue-500'
          }`} />
          <span className="text-[11px]  font-bold uppercase tracking-widest text-white">{toast.message}</span>
          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-1 p-0.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  )
}