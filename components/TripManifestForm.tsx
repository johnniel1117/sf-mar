'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Download, Barcode, Plus, X, AlertCircle, Save, FileText, 
  CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, 
  ClipboardList, Eye, Info, Clock, FileSpreadsheet 
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useTripManifest } from '@/hooks/useTripManifest'
import { TripManifestPDFGenerator } from '@/lib/utils/tripManifestPdfGenerator'
import { TripManifestExcelGenerator } from '@/lib/utils/tripManifestExcelGenerator'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { ManifestTabs } from '@/components/ManifestTabs'
import { CreateManifestTab } from '@/components/tabs/CreateManifestTab'
import { SavedManifestsTab } from '@/components/tabs/SavedManifestTab'
import { ViewManifestModal } from '@/components/modals/ViewManifestModal'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'
import { DownloadModal } from '@/components/modals/DownloadManifestModal'  // ← NEW import

// Import icons from lucide-react
const icons = {
  Truck,
  Barcode,
  ClipboardList,
  Download,
  Plus,
  X,
  AlertCircle,
  Save,
  FileText,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Info,
  Clock,
  FileSpreadsheet,
} as const

type Step = 1 | 2 | 3

export default function TripManifestForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [manifest, setManifest] = useState<TripManifest>({
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

  // Barcode scanning state
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanningDocument, setScanningDocument] = useState(false)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // UI states
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingManifest, setViewingManifest] = useState<TripManifest | null>(null)
  const [editingManifestId, setEditingManifestId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Manual entry modal state
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [pendingDocument, setPendingDocument] = useState<{
    documentNumber: string
    quantity: number
  } | null>(null)

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({
    message: '',
    type: 'info',
    show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true })
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false })
    }, 3000)
  }

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  })

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    })
  }

  const {
    isLoading,
    savedManifests,
    loadManifests,
    saveManifest: saveManifestService,
    deleteManifest,
    lookupDocument,
  } = useTripManifest()

  const [mounted, setMounted] = useState(false)

  // ────────────────────────────────────────────────
  // NEW: Download modal states
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedDownloadType, setSelectedDownloadType] = useState<'pdf' | 'excel' | 'both' | null>(null)
  const [pendingManifestForDownload, setPendingManifestForDownload] = useState<TripManifest | null>(null)

  const openDownloadModal = (manifestToDownload: TripManifest) => {
    setPendingManifestForDownload(manifestToDownload)
    setSelectedDownloadType('both') // default to both
    setShowDownloadModal(true)
  }

  const handleConfirmDownload = () => {
    if (!pendingManifestForDownload || !selectedDownloadType) return

    if (selectedDownloadType === 'pdf' || selectedDownloadType === 'both') {
      TripManifestPDFGenerator.generatePDF(pendingManifestForDownload)
    }
    if (selectedDownloadType === 'excel' || selectedDownloadType === 'both') {
      TripManifestExcelGenerator.generateExcel(pendingManifestForDownload)
    }

    setShowDownloadModal(false)
    setPendingManifestForDownload(null)
    setSelectedDownloadType(null)
    showToast('Download started successfully!', 'success')
  }
  // ────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true)
    loadManifests()
  }, [loadManifests])

  // Focus barcode input when in step 2
  useEffect(() => {
    if (currentStep === 2 && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [currentStep])

  // Document search function - returns array of matching documents for dropdown
  const searchDocument = async (documentNumber: string): Promise<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null> => {
    if (!documentNumber || documentNumber.length < 1) return null
    
    try {
      // Call the search API endpoint
      const response = await fetch(`/api/documents/search?query=${encodeURIComponent(documentNumber)}`)
      
      if (!response.ok) {
        throw new Error('Search request failed')
      }
      
      const { results } = await response.json()
      
      if (!results || results.length === 0) {
        return [] // Return empty array when no results found
      }
      
      return results
    } catch (error) {
      console.error('Error searching document:', error)
      return [] // Return empty array on error
    }
  }

  // Function to add document with manually entered ship-to name
  const addDocumentWithManualShipTo = (shipToName: string) => {
    if (!pendingDocument) return

    const newItem: ManifestItem = {
      item_number: manifest.items.length + 1,
      document_number: pendingDocument.documentNumber,
      ship_to_name: shipToName,
      total_quantity: pendingDocument.quantity,
    }

    setManifest({
      ...manifest,
      items: [...manifest.items, newItem],
    })

    showToast(`Document ${pendingDocument.documentNumber} added with custom ship-to name`, 'success')
    setPendingDocument(null)
  }

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = barcodeInput.trim()
      if (!barcode) return

      setScanningDocument(true)
      try {
        const document = await lookupDocument(barcode)
        
        if (document) {
          const exists = manifest.items.some(item => item.document_number === document.document_number)
          
          if (exists) {
            showToast(`Document ${document.document_number} already added`, 'error')
            setBarcodeInput('')
          } else {
            const normalizedShipTo = (document.ship_to_name || '').trim().toLowerCase()
            
            if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
              setPendingDocument({
                documentNumber: document.document_number,
                quantity: document.total_quantity || 0,
              })
              setShowManualEntryModal(true)
              setBarcodeInput('')
            } else {
              const newItem: ManifestItem = {
                item_number: manifest.items.length + 1,
                document_number: document.document_number,
                ship_to_name: document.ship_to_name || 'N/A',
                total_quantity: document.total_quantity || 0,
              }
              
              setManifest({
                ...manifest,
                items: [...manifest.items, newItem],
              })
              
              showToast(`Document ${document.document_number} added successfully`, 'success')
              setBarcodeInput('')
            }
          }
        } else {
          showToast(`No data found for barcode: ${barcode}`, 'error')
          setBarcodeInput('')
        }
      } catch (error) {
        console.error('Error looking up document:', error)
        showToast('Error scanning document', 'error')
        setBarcodeInput('')
      } finally {
        setScanningDocument(false)
        setTimeout(() => barcodeInputRef.current?.focus(), 100)
      }
    }
  }

  const removeItem = (index: number) => {
    const updatedItems = manifest.items.filter((_, i) => i !== index)
    updatedItems.forEach((item, i) => {
      item.item_number = i + 1
    })
    setManifest({
      ...manifest,
      items: updatedItems,
    })
  }

  const resetForm = () => {
    setManifest({
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
    setBarcodeInput('')
    setCurrentStep(1)
    setEditingManifestId(null)
    setIsEditMode(false)
  }

  const handleEditManifest = async (manifestToEdit: TripManifest) => {
    try {
      const manifestToSet = {
        ...manifestToEdit,
        items: manifestToEdit.items || [],
        time_start: manifestToEdit.time_start || '',
        time_end: manifestToEdit.time_end || '',
      }
      setManifest(manifestToSet)
      
      setEditingManifestId(manifestToEdit.id || null)
      setIsEditMode(true)
      setCurrentStep(1)
      setActiveTab('create')
      showToast('Manifest loaded for editing', 'info')
    } catch (error) {
      console.error('Error loading manifest for editing:', error)
      showToast('Failed to load manifest for editing', 'error')
    }
  }

  const saveManifest = async () => {
    try {
      if (isEditMode && editingManifestId) {
        const response = await fetch(`/api/trip-manifest/${editingManifestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(manifest),
        })

        if (!response.ok) {
          throw new Error('Failed to update manifest')
        }

        showToast('Manifest updated successfully!', 'success')
      } else {
        await saveManifestService(manifest)
        showToast('Manifest saved successfully!', 'success')
      }

      // Show nice download modal instead of confirm
      openDownloadModal(manifest)

      resetForm()
      loadManifests()
      setActiveTab('saved')
    } catch (error) {
      showToast('Error saving manifest', 'error')
      console.error('Error:', error)
    }
  }

  const canProceedToStep2 = () => {
    return !!(
      manifest.driver_name &&
      manifest.plate_no &&
      manifest.trucker &&
      manifest.time_start
    )
  }

  const canProceedToStep3 = () => {
    return manifest.items.length > 0
  }

  const handleDeleteManifest = async (manifestId: string) => {
    if (!manifestId) {
      showToast('Invalid manifest ID', 'error')
      return
    }

    showConfirmation(
      'Delete Manifest',
      'Are you sure you want to delete this trip manifest? This action cannot be undone.',
      async () => {
        try {
          await deleteManifest(manifestId)
          showToast('Manifest deleted successfully!', 'success')
          await loadManifests()
        } catch (error) {
          console.error('Error deleting manifest:', error)
          showToast('Error deleting manifest. Please try again.', 'error')
        }
      }
    )
  }

  // Updated handlers – now open modal instead of direct download
  const handleDownloadRequest = (manifest: TripManifest) => {
    openDownloadModal(manifest)
  }

  const handleViewManifest = (manifest: TripManifest) => {
    setViewingManifest(manifest)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingManifest(null)
  }

  return (
    <div className=" rounded-xl h-full p-4 sm:p-6 overflow-y-hidden">

      <Navbar 
        showBackButton 
        backHref="/" 
        animate={mounted}
        fixed={true}
      />
      <div className="w-full max-w-6xl mx-auto pt-16">
        <ManifestTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

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
          <SavedManifestsTab
            savedManifests={savedManifests}
            handleViewManifest={handleViewManifest}
            handleEditManifest={handleEditManifest}
            handleDownloadManifest={handleDownloadRequest}        
            handleDeleteManifest={handleDeleteManifest}
          />
        )}
      </div>

      <ViewManifestModal
        isOpen={showViewModal}
        manifest={viewingManifest}
        onClose={handleCloseViewModal}
        onEdit={handleEditManifest}
        onDownloadPDF={handleDownloadRequest}
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

      {/* NEW Download Modal */}
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

      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 text-white z-50 animate-slide-in ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {toast.type === 'success' && <icons.CheckCircle2 className="w-5 h-5" />}
          {toast.type === 'error' && <icons.AlertCircle className="w-5 h-5" />}
          {toast.type === 'info' && <icons.Info className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  )
}