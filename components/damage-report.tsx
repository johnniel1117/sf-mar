'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useDamageReport } from '@/hooks/useDamageReport'
import { PDFGenerator } from '@/lib/utils/pdfGenerator'
import { ExcelGenerator } from '@/lib/utils/excelGenerator'
import { Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'
import { ReportTabs } from '@/components/ReportTabs'
import { CreateReportTab } from '@/components/tabs/CreateReportTab'
import { SavedReportsTab } from '@/components/tabs/SavedReportsTab'
import { MaterialMappingsTab } from '@/components/tabs/MaterialMappingsTab'
import { DownloadModal } from '@/components/modals/DownloadModal'
import { ViewReportModal } from '@/components/modals/ViewReportModal'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'

// Import icons from lucide-react
const icons = {
  Truck: Truck,
  Barcode: Barcode,
  ClipboardList: ClipboardList,
  Users: Users,
  Download: Download,
  Camera: Camera,
  Plus: Plus,
  X: X,
  AlertCircle: AlertCircle,
  Save: Save,
  FileText: FileText,
  CheckCircle2: CheckCircle2,
  Trash2: Trash2,
  ChevronRight: ChevronRight,
  ChevronLeft: ChevronLeft,
  Edit: Edit,
  Search: Search,
  Star: Star,
  Clock: Clock,
  Info: Info,
  FileSpreadsheet: FileSpreadsheet,
  Eye: Eye,
} as const

export default function DamageReportForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [report, setReport] = useState<DamageReport>({
    report_number: '',
    report_date: new Date().toISOString().split('T')[0],
    seal_no: '',
    driver_name: '',
    plate_no: '',
    container_no: '',
    prepared_by: '',
    noted_by: '',
    acknowledged_by: '',
    narrative_findings: '',
    actions_required: '',
    status: 'draft',
    items: [],
  })

  // Personnel dropdowns state
  const [personnelData, setPersonnelData] = useState({
    admins: [] as any[],
    guards: [] as any[],
    supervisors: [] as any[]
  });
  const [selectedPersonnel, setSelectedPersonnel] = useState({
    admin: '',
    guard: '',
    supervisor: ''
  });

  // Barcode editing state
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemBarcode, setEditingItemBarcode] = useState('');

  const [barcodeInput, setBarcodeInput] = useState('')
  const [materialLookup, setMaterialLookup] = useState<Record<string, any>>({})
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'materials'>('create')
  const [serialWarnings, setSerialWarnings] = useState<Record<number, boolean>>({})
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Material management states
  const [materialMappings, setMaterialMappings] = useState<any[]>([])
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // New material modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [pendingBarcode, setPendingBarcode] = useState('')
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [newMaterialCategory, setNewMaterialCategory] = useState('')
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)

  // Download modal states
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState<'pdf' | 'excel'>('pdf')
  const [selectedDownloadReport, setSelectedDownloadReport] = useState<DamageReport | null>(null)

  // View report modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingReport, setViewingReport] = useState<DamageReport | null>(null)

  // Edit report states
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

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
    savedReports,
    loadReports,
    saveReport: saveReportService,
    deleteReport,
    uploadPhoto,
    lookupBarcode,
    saveMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping,
    getMaterialMappings,
    checkSerialNumber: checkSerialNumberService,
  } = useDamageReport()

  const [mounted, setMounted] = useState(false)

  // Fetch personnel data on component mount
  useEffect(() => {
    setMounted(true)
    loadReports()
    fetchPersonnelData()
    if (activeTab === 'materials') {
      loadMaterialMappings()
    }
  }, [loadReports, activeTab])

  // Function to fetch personnel data from Supabase
  const fetchPersonnelData = async () => {
    try {
      const response = await fetch('/api/personnel');
      if (response.ok) {
        const data = await response.json();
        setPersonnelData(data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error)
      showToast('Error loading personnel data', 'error')
    }
  };

  const loadMaterialMappings = async () => {
    try {
      const mappings = await getMaterialMappings(searchTerm)
      setMaterialMappings(mappings || [])
    } catch (error) {
      console.error('Error loading material mappings:', error)
    }
  }

  // Update report fields when personnel selections change
  useEffect(() => {
    const selectedAdmin = personnelData.admins.find(a => a.id === selectedPersonnel.admin);
    const selectedGuard = personnelData.guards.find(g => g.id === selectedPersonnel.guard);
    const selectedSupervisor = personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor);

    setReport(prev => ({
      ...prev,
      prepared_by: selectedAdmin?.name || '',
      noted_by: selectedGuard?.name || '',
      acknowledged_by: selectedSupervisor?.name || ''
    }));
  }, [selectedPersonnel, personnelData]);

  // Handle editing an item's barcode
  const handleEditItemBarcode = async (index: number) => {
    setEditingItemIndex(index);
    setEditingItemBarcode(report.items[index].barcode);
  };

  // Save edited barcode
  const handleSaveEditedBarcode = async (index: number) => {
    const newBarcode = editingItemBarcode.trim();
    
    if (!newBarcode) {
      showToast('Barcode cannot be empty', 'error');
      return;
    }

    // Lookup the new barcode
    const material = await lookupBarcode(newBarcode);
    
    if (material) {
      // Update the item with new material info
      updateItem(index, 'barcode', newBarcode);
      updateItem(index, 'material_code', material.material_code || newBarcode);
      updateItem(index, 'material_description', material.material_description || '');
      updateItem(index, 'mapping_id', material.mapping_id || null);
      
      showToast('Item barcode updated successfully', 'success');
      setEditingItemIndex(null);
      setEditingItemBarcode('');
    } else {
      // If material not found, ask user to add description
      setPendingBarcode(newBarcode);
      setNewMaterialDescription('');
      setNewMaterialCategory('');
      setShowMaterialModal(true);
      
      // Store the index for later update
      (window as any).editingItemIndexForBarcode = index;
    }
  };

  // Cancel barcode editing
  const handleCancelEditBarcode = () => {
    setEditingItemIndex(null);
    setEditingItemBarcode('');
  };

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = barcodeInput.trim()
      if (!barcode) return

      const material = await lookupBarcode(barcode)
      if (material) {
        setMaterialLookup(material)
        addItem(material)
        setBarcodeInput('')
      } else {
        setPendingBarcode(barcode)
        setNewMaterialDescription('')
        setNewMaterialCategory('')
        setShowMaterialModal(true)
        
        setTimeout(() => {
          barcodeInputRef.current?.focus()
        }, 100)
      }
    }
  }

  const handleSaveNewMaterial = async () => {
    if (!newMaterialDescription.trim()) {
      alert('Please enter a material description')
      return
    }

    setIsSavingMaterial(true)
    try {
      const savedMaterial = await saveMaterialMapping(
        pendingBarcode,
        newMaterialDescription,
        newMaterialCategory
      )
      
      const manualMaterial = {
        barcode: pendingBarcode,
        material_code: pendingBarcode,
        material_description: newMaterialDescription,
        category: newMaterialCategory,
        mapping_id: savedMaterial?.id,
      }
      
      setMaterialLookup(manualMaterial)
      
      // Check if we're editing an existing item's barcode
      const editingIndex = (window as any).editingItemIndexForBarcode;
      if (editingIndex !== undefined && editingIndex !== null) {
        updateItem(editingIndex, 'barcode', pendingBarcode);
        updateItem(editingIndex, 'material_code', pendingBarcode);
        updateItem(editingIndex, 'material_description', newMaterialDescription);
        updateItem(editingIndex, 'mapping_id', savedMaterial?.id);
        
        setEditingItemIndex(null);
        setEditingItemBarcode('');
        (window as any).editingItemIndexForBarcode = undefined;
        showToast('Item barcode updated successfully', 'success');
      } else {
        addItem(manualMaterial)
        showToast('Material saved successfully!', 'success');
      }
      
      setBarcodeInput('')
      setShowMaterialModal(false)
      setPendingBarcode('')
      setNewMaterialDescription('')
      setNewMaterialCategory('')
      
    } catch (error) {
      console.error('Error saving material mapping:', error)
      alert('Failed to save material. Please try again.')
    } finally {
      setIsSavingMaterial(false)
    }
  }

  const handleCancelMaterial = () => {
    setShowMaterialModal(false)
    setPendingBarcode('')
    setNewMaterialDescription('')
    setNewMaterialCategory('');
    (window as any).editingItemIndexForBarcode = undefined;
    
    setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 100)
  }

  const addItem = (material?: any) => {
    const newItem: DamageItem & { mapping_id?: string } = {
      item_number: report.items.length + 1,
      barcode: material?.barcode || '',
      material_code: material?.material_code || '',
      material_description: material?.material_description || '',
      damage_type: '',
      damage_description: '',
      mapping_id: material?.mapping_id || null,
    }
    setReport({
      ...report,
      items: [...report.items, newItem],
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...report.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }
    setReport({
      ...report,
      items: updatedItems,
    })
  }

  const removeItem = (index: number) => {
    const updatedItems = report.items.filter((_, i) => i !== index)
    updatedItems.forEach((item, i) => {
      item.item_number = i + 1
    })
    setReport({
      ...report,
      items: updatedItems,
    })
  }

  const handlePhotoUpload = async (index: number, file: File) => {
    try {
      setUploadingItemIndex(index)
      const url = await uploadPhoto(file, report.report_number || 'temp')
      updateItem(index, 'photo_url', url)
    } catch (error) {
      alert('Failed to upload photo')
    } finally {
      setUploadingItemIndex(null)
    }
  }

  const resetForm = () => {
    setReport({
      report_number: '',
      report_date: new Date().toISOString().split('T')[0],
      seal_no: '',
      driver_name: '',
      plate_no: '',
      container_no: '',
      prepared_by: '',
      noted_by: '',
      acknowledged_by: '',
      narrative_findings: '',
      actions_required: '',
      status: 'draft',
      items: [],
    })
    setSelectedPersonnel({
      admin: '',
      guard: '',
      supervisor: ''
    })
    setBarcodeInput('')
    setMaterialLookup({})
    setCurrentStep(1)
    setEditingReportId(null)
    setIsEditMode(false)
  }

  const handleEditReport = async (reportToEdit: DamageReport) => {
    try {
      const reportToSet = {
        ...reportToEdit,
        items: reportToEdit.items || []
      }
      setReport(reportToSet)
      
      setSelectedPersonnel({
        admin: reportToEdit.admin_id || '',
        guard: reportToEdit.guard_id || '',
        supervisor: reportToEdit.supervisor_id || ''
      })
      
      setEditingReportId(reportToEdit.id || null)
      setIsEditMode(true)
      setCurrentStep(1)
      setActiveTab('create')
      showToast('Report loaded for editing', 'info')
    } catch (error) {
      console.error('Error loading report for editing:', error)
      showToast('Failed to load report for editing', 'error')
    }
  }

  const saveReport = async () => {
    try {
      const reportWithPersonnel = {
        ...report,
        admin_id: selectedPersonnel.admin,
        guard_id: selectedPersonnel.guard,
        supervisor_id: selectedPersonnel.supervisor
      };
      
      if (isEditMode && editingReportId) {
        const response = await fetch(`/api/damage-reports/${editingReportId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportWithPersonnel),
        })

        if (!response.ok) {
          throw new Error('Failed to update report')
        }

        showToast('Report updated successfully!', 'success')
      } else {
        await saveReportService(reportWithPersonnel)
        showToast('Report saved successfully!', 'success')
      }

      resetForm()
      loadReports()
      setActiveTab('saved')
    } catch (error) {
      showToast('Error saving report', 'error')
      console.error('Error:', error)
    }
  }

        const canProceedToStep2 = () => {
        return !!(report.driver_name && report.plate_no)
        }

        const canProceedToStep3 = () => {
          return report.items.length > 0
        }

        const canProceedToStep4 = () => {
          return report.items.every(item => item.damage_type)
        }

  const handleDeleteReport = async (reportNumber: string) => {
    if (!reportNumber) {
      showToast('Invalid report number', 'error')
      return
    }

    showConfirmation(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      async () => {
        try {
          const trimmedReportNumber = reportNumber.trim()
          
          const response = await fetch(`/api/damage-reports/${encodeURIComponent(trimmedReportNumber)}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete report')
          }

          const result = await response.json()
          showToast(result.message || 'Report deleted successfully!', 'success')
          await loadReports()
          
        } catch (error) {
          console.error('Error deleting report:', error)
          showToast(error instanceof Error ? error.message : 'Error deleting report. Please try again.', 'error')
        }
      }
    )
  }

  const handleDownloadReport = (report: DamageReport, type: 'pdf' | 'excel') => {
    if (type === 'pdf') {
      PDFGenerator.generatePDF(report)
    } else {
      ExcelGenerator.generateExcel(report)
    }
  }

  const handleOpenDownloadModal = (report: DamageReport) => {
    setSelectedDownloadReport(report)
    setShowDownloadModal(true)
  }

  const handleDownloadConfirm = () => {
    if (selectedDownloadReport) {
      handleDownloadReport(selectedDownloadReport, downloadType)
    }
    setShowDownloadModal(false)
    setSelectedDownloadReport(null)
  }

  const handleViewReport = (report: DamageReport) => {
    setViewingReport(report)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingReport(null)
  }

  const handleEditMaterial = async (material: any) => {
    setEditingMaterial(material)
    setIsEditing(true)
  }

  const handleSaveMaterial = async () => {
    if (!editingMaterial) return

    try {
      if (editingMaterial.id) {
        await updateMaterialMapping(editingMaterial.id, {
          material_description: editingMaterial.material_description,
          category: editingMaterial.category,
        })
      } else {
        await saveMaterialMapping(
          editingMaterial.serial_number,
          editingMaterial.material_description,
          editingMaterial.category
        )
      }
      
      setIsEditing(false)
      setEditingMaterial(null)
      loadMaterialMappings()
      showToast('Material saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving material:', error)
      showToast('Failed to save material', 'error')
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    showConfirmation(
      'Delete Material Mapping',
      'Are you sure you want to delete this material mapping?',
      async () => {
        try {
          await deleteMaterialMapping(id)
          loadMaterialMappings()
          showToast('Material deleted successfully!', 'success')
        } catch (error) {
          console.error('Error deleting material:', error)
          showToast('Failed to delete material', 'error')
        }
      }
    )
  }

  const handleMaterialSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setTimeout(() => {
      loadMaterialMappings()
    }, 300)
  }

  const handlePersonnelChange = (role: 'admin' | 'guard' | 'supervisor', value: string) => {
    setSelectedPersonnel(prev => ({
      ...prev,
      [role]: value
    }));
  };

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
        <ReportTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMaterialsTab={loadMaterialMappings}
        />


{/* Create Report Tab */}
{activeTab === 'create' && (
  <CreateReportTab
    currentStep={currentStep}
    setCurrentStep={setCurrentStep}
    report={report}
    setReport={setReport}
    barcodeInput={barcodeInput}
    setBarcodeInput={setBarcodeInput}
    materialLookup={materialLookup}
    uploadingItemIndex={uploadingItemIndex}
    editingItemIndex={editingItemIndex}
    setEditingItemIndex={setEditingItemIndex}
    editingItemBarcode={editingItemBarcode}
    setEditingItemBarcode={setEditingItemBarcode}
    personnelData={personnelData}
    selectedPersonnel={selectedPersonnel}
    isLoading={isLoading}
    isEditMode={isEditMode}
    showToast={showToast}
    handleBarcodeInput={handleBarcodeInput}
    handleEditItemBarcode={handleEditItemBarcode}
    handleSaveEditedBarcode={handleSaveEditedBarcode}
    handleCancelEditBarcode={handleCancelEditBarcode}
    updateItem={updateItem}
    removeItem={removeItem}
    handlePhotoUpload={handlePhotoUpload}
    handlePersonnelChange={handlePersonnelChange}
    canProceedToStep2={canProceedToStep2}
    canProceedToStep3={canProceedToStep3}
    canProceedToStep4={canProceedToStep4}
    resetForm={resetForm}
    saveReport={saveReport}
  />
)}

{/* Saved Reports Tab */}
{activeTab === 'saved' && (
  <SavedReportsTab
    savedReports={savedReports}
    handleViewReport={handleViewReport}
    handleEditReport={handleEditReport}
    handleOpenDownloadModal={handleOpenDownloadModal}
    handleDeleteReport={handleDeleteReport}
  />
)}

{/* Material Mappings Tab */}
{activeTab === 'materials' && (
  <MaterialMappingsTab
    materialMappings={materialMappings}
    editingMaterial={editingMaterial}
    isEditing={isEditing}
    searchTerm={searchTerm}
    handleEditMaterial={handleEditMaterial}
    handleSaveMaterial={handleSaveMaterial}
    handleDeleteMaterial={handleDeleteMaterial}
    handleMaterialSearch={handleMaterialSearch}
    setEditingMaterial={setEditingMaterial}
    setIsEditing={setIsEditing}
    setSearchTerm={setSearchTerm}
    loadMaterialMappings={loadMaterialMappings}
  />
)}
      </div>

      {/* View Report Modal */}
      <ViewReportModal
        isOpen={showViewModal}
        report={viewingReport}
        onClose={handleCloseViewModal}
        onEdit={handleEditReport}
        onDownload={handleOpenDownloadModal}
      />
      
      {showMaterialModal && (
  <div 
    className="
      fixed inset-0 z-50 
      flex items-center justify-center p-4
      bg-black/40               /* semi-transparent overlay */
      
    "
    onTouchMove={(e) => e.preventDefault()}
  >
    <div 
      className="
        bg-white rounded-xl shadow-2xl 
        max-w-md w-full p-6 
        max-h-[90vh] overflow-y-auto   // ← allows scrolling inside modal if needed
        animate-fadeIn
      "
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <icons.AlertCircle className="w-5 h-5 text-orange-600" />
            Material Not Found
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Please enter material description for the scanned barcode
          </p>
        </div>
        <button
          onClick={handleCancelMaterial}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <icons.X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Barcode Display */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Scanned Barcode</p>
              <p className="text-sm font-bold text-gray-900 break-all ">
                {pendingBarcode}
              </p>
            </div>
            <icons.Barcode className="w-5 h-5 text-gray-600 flex-shrink-0" />
          </div>
        </div>
        
        {/* Material Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={newMaterialDescription}
            onChange={(e) => setNewMaterialDescription(e.target.value)}
            placeholder="Enter material description..."
            rows={3}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
            autoFocus
          />
        </div>
        
        {/* Category Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={newMaterialCategory}
            onChange={(e) => setNewMaterialCategory(e.target.value)}
            placeholder="E.G.,TV, WASHING MACHINE"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        </div>
        
        {/* Tips */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 flex items-start gap-2">
            <icons.Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This material will be saved to your database and automatically retrieved 
              next time you scan this barcode.
            </span>
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          onClick={handleCancelMaterial}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          disabled={isSavingMaterial}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveNewMaterial}
          disabled={!newMaterialDescription.trim() || isSavingMaterial}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSavingMaterial ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <icons.Save className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        downloadType={downloadType}
        onDownloadTypeChange={setDownloadType}
        onConfirm={handleDownloadConfirm}
        onClose={() => setShowDownloadModal(false)}
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
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 text-white z-50 animate-slide-in ${
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
