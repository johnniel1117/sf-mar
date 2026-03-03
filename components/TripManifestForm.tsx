'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Download, Barcode, Plus, X, AlertCircle, Save, FileText,
  CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck,
  ClipboardList, Eye, Info, Clock, FileSpreadsheet, Home, Menu, TrendingUp,
  BarChart2, ArrowUpRight, Package
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

// Design tokens (match SavedManifestTab)
const C = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceHover: '#21262D',
  border:       '#30363D',
  borderHover:  '#8B949E',
  divider:      '#21262D',

  accent:       '#E8192C',
  accentHover:  '#FF1F30',

  amber:        '#F5A623',

  textPrimary:  '#C9D1D9',
  textSilver:   '#B1BAC4',
  textSub:      '#8B949E',
  textMuted:    '#6E7681',
  textGhost:    '#484F58',

  inputBg:      '#0D1117',
  inputBorder:  '#30363D',
  inputText:    '#C9D1D9',
  inputFocus:   '#F5A623',
}

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
  const [pendingDocument, setPendingDocument] = useState<{ documentNumber: string; quantity: number; cbm?: number } | null>(null)
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

  // Helper function to get CBM from material code (you may need to import this mapping)
  const getCBMFromMatcode = (code: string): number | null => {
    if (!code) return null
    // This should be imported from your category-mapping or defined here
    // For now, returning null as placeholder - you'll need to add your actual mapping
    return null
  }

  // Add this useEffect to check CBM data on mount
// useEffect(() => {
//   const checkCBMData = async () => {
//     try {
//       const response = await fetch('/api/debug/cbm-check')
//       const data = await response.json()
//       console.log('CBM Data Check:', data)
      
//       if (data.recordsWithCBM === 0) {
//         console.warn('No records with CBM found in database!')
//       } else {
//         console.log(`Found ${data.recordsWithCBM} records with CBM`)
//         console.log('Sample with CBM:', data.samples.find((s: any) => s.total_cbm > 0))
//       }
//     } catch (error) {
//       console.error('Failed to check CBM data:', error)
//     }
//   }
  
//   checkCBMData()
// }, [])

  const searchDocument = async (documentNumber: string): Promise<Array<{ documentNumber: string; shipToName: string; quantity: number; cbm?: number }> | null> => {
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
      total_cbm: pendingDocument.cbm || 0,
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
            setPendingDocument({ 
              documentNumber: doc.document_number, 
              quantity: doc.total_quantity || 0,
              cbm: doc.total_cbm || 0 
            })
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
                total_cbm: doc.total_cbm || 0,
              }],
            })
            showToast(`Document ${doc.document_number} added (CBM: ${(doc.total_cbm || 0).toFixed(4)})`, 'success')
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

  // Calculate grand total CBM for current manifest
  const grandTotalCBM = manifest.items.reduce((sum, item) => sum + (item.total_cbm || 0), 0)

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{backgroundColor: C.bg}}>

      {/* ── Top Navigation Bar — landing page style ── */}
      <nav className="relative flex-shrink-0 h-[73px] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-4" style={{background: C.bg, borderBottom: `1px solid ${C.divider}`}}>

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-full transition-colors flex-shrink-0"
          style={{color: C.textSub}}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceHover }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Home */}
        <Link
          href="/"
          className="p-2 rounded-full transition-colors flex-shrink-0"
          style={{color: C.textSub}}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceHover; (e.currentTarget.querySelector('svg') as SVGElement).style.color = 'white' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; (e.currentTarget.querySelector('svg') as SVGElement).style.color = C.textSub }}
          title="Home"
        >
          <Home className="w-4 h-4 transition-colors" />
        </Link>

        <div className="w-px h-4 flex-shrink-0 hidden sm:block" style={{backgroundColor: C.divider}} />

        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 hidden sm:block" style={{backgroundColor: C.divider}} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold hidden sm:block" style={{color: C.textSub}}>
              Trip Manifest
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold sm:hidden" style={{color: C.textSub}}>
              Manifest
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Right side chips */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* CBM Total Pill - NEW */}
          {activeTab === 'create' && manifest.items.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0"
                 style={{ border: `1px solid ${C.inputFocus}40`, background: `${C.inputFocus}05` }}>
              <Package className="w-3.5 h-3.5" style={{color: C.inputFocus}} />
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{color: C.inputFocus}}>Total CBM</span>
              <span className="text-[11px] text-white tabular-nums" style={{color: C.textPrimary}}>{grandTotalCBM.toFixed(4)}</span>
            </div>
          )}

          {/* Manifest number pill */}
          {activeTab === 'create' && manifest.manifest_number && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0" style={{border: `1px solid ${C.border}`}}>
              <span className="text-[10px] uppercase tracking-[0.15em]" style={{color: C.textSub}}>No.</span>
              <span className="text-[11px] text-white tabular-nums" style={{color: C.textPrimary}}>{manifest.manifest_number}</span>
            </div>
          )}

          {/* Edit mode badge */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0" >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: C.accent}} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{color: C.accent}}>Editing</span>
            </div>
          )}

          {/* Analytics button — amber accent, matches landing */}
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-150"
            style={{
              borderColor: activeTab === 'analytics' ? C.inputFocus : C.border,
              color: activeTab === 'analytics' ? C.inputFocus : C.textSub,
              backgroundColor: activeTab === 'analytics' ? `${C.inputFocus}05` : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'analytics') {
                e.currentTarget.style.borderColor = C.borderHover
                e.currentTarget.style.color = C.textPrimary
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'analytics') {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.color = C.textSub
              }
            }}
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

        <main className="flex-1 overflow-y-auto min-h-0 min-w-0" style={{backgroundColor: C.bg}}>
          {/* Subtle red ambient glow — same as landing */}
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] z-0"  />

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
                grandTotalCBM={grandTotalCBM} 
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
                      <TrendingUp className="w-10 h-10 mx-auto mb-5" style={{color: C.textMuted}} />
                      <p className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{color: C.inputFocus}}>No data yet</p>
                      <h4 className="text-2xl sm:text-3xl text-white mb-3 tracking-tight" style={{color: C.textPrimary}}>
                        Nothing to analyze
                      </h4>
                      <p className="text-sm max-w-sm mb-8 leading-relaxed" style={{color: C.textSub}}>
                        Save trip manifests to see trends, top destinations, trucker performance, and more.
                      </p>
                      {!isViewer && (
                        <button
                          onClick={() => setActiveTab('create')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all"
                          style={{
                            borderColor: C.border,
                            color: C.textSub
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.textPrimary }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub }}
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
        <div className="fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border" style={{
          backgroundColor: C.bg,
          borderColor: toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? C.inputFocus : C.inputFocus,
          borderStyle: 'solid'
        }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
            backgroundColor: toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? C.inputFocus : C.inputFocus
          }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{color: C.textPrimary}}>{toast.message}</span>
          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-1 p-0.5 rounded-full transition-colors"
            style={{color: C.textSub}}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceHover }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}