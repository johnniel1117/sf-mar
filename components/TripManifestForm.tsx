'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { Download, Barcode, Plus, X, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Eye, Info, Clock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useTripManifest } from '@/hooks/useTripManifest'
import { TripManifestPDFGenerator } from '@/lib/utils/tripManifestPdfGenerator'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { ManifestTabs } from '@/components/ManifestTabs'
import { CreateManifestTab } from '@/components/tabs/CreateManifestTab'
import { SavedManifestsTab } from '@/components/tabs/SavedManifestTab'
import { ViewManifestModal } from '@/components/modals/ViewManifestModal'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'

// Import icons from lucide-react
const icons = {
  Truck: Truck,
  Barcode: Barcode,
  ClipboardList: ClipboardList,
  Download: Download,
  Plus: Plus,
  X: X,
  AlertCircle: AlertCircle,
  Save: Save,
  FileText: FileText,
  CheckCircle2: CheckCircle2,
  Trash2: Trash2,
  ChevronRight: ChevronRight,
  ChevronLeft: ChevronLeft,
  Eye: Eye,
  Info: Info,
  Clock: Clock,
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
    // departure_time: '',
    // arrival_time: '',
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
          // Check if document already exists in items
          const exists = manifest.items.some(item => item.document_number === document.document_number)
          
          if (exists) {
            showToast(`Document ${document.document_number} already added`, 'error')
            setBarcodeInput('')
          } else {
            const normalizedShipTo = (document.ship_to_name || '').trim().toLowerCase()
            
            // Check if ship-to name is N/A or empty
            if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
              // Set pending document and show modal
              setPendingDocument({
                documentNumber: document.document_number,
                quantity: document.total_quantity || 0,
              })
              setShowManualEntryModal(true)
              setBarcodeInput('')
            } else {
              // Ship-to name is valid, add item directly
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
    // Renumber items
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
    //   departure_time: '',
    //   arrival_time: '',
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
        items: manifestToEdit.items || []
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
        const response = await fetch(`/api/trip-manifests/${editingManifestId}`, {
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

      resetForm()
      loadManifests()
      setActiveTab('saved')
    } catch (error) {
      showToast('Error saving manifest', 'error')
      console.error('Error:', error)
    }
  }

  const canProceedToStep2 = () => {
    return !!(manifest.driver_name && manifest.plate_no)
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

  const handleDownloadManifest = (manifest: TripManifest) => {
    TripManifestPDFGenerator.generatePDF(manifest)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 sm:py-8 px-3 sm:px-4">
      <Navbar 
        showBackButton 
        backHref="/" 
        animate={mounted}
        fixed={true}
      />
      <div className="w-full max-w-6xl mx-auto pt-16">
        {/* Tabs */}
        <ManifestTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Create Manifest Tab */}
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
          />
        )}

        {/* Saved Manifests Tab */}
        {activeTab === 'saved' && (
          <SavedManifestsTab
            savedManifests={savedManifests}
            handleViewManifest={handleViewManifest}
            handleEditManifest={handleEditManifest}
            handleDownloadManifest={handleDownloadManifest}
            handleDeleteManifest={handleDeleteManifest}
          />
        )}
      </div>

      {/* View Manifest Modal */}
      <ViewManifestModal
        isOpen={showViewModal}
        manifest={viewingManifest}
        onClose={handleCloseViewModal}
        onEdit={handleEditManifest}
        onDownload={handleDownloadManifest}
      />

      {/* Confirmation Modal */}
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

      {/* Toast Notification */}
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