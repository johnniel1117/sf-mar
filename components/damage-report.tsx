'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users, Edit, Search, Star, Clock, Info, FileSpreadsheet, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useDamageReport } from '@/hooks/useDamageReport'
import { PDFGenerator } from '@/lib/utils/pdfGenerator'
import { ExcelGenerator } from '@/lib/utils/excelGenerator'
import { DAMAGE_TYPES, STEPS, Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'
import { ReportTabs } from '@/components/ReportTabs'
import { StepsIndicator } from '@/components/StepsIndicator'
import { MaterialModal } from '@/components/modals/MaterialModal'
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
  const [newMaterialCategory, setNewMaterialCategory] = useState('Manual Entry')
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
      setNewMaterialCategory('Manual Entry');
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
        setNewMaterialCategory('Manual Entry')
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
      setNewMaterialCategory('Manual Entry')
      
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
    setNewMaterialCategory('Manual Entry');
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
    return report.driver_name && report.plate_no
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
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <StepsIndicator currentStep={currentStep} isEditMode={isEditMode} />

              {/* Step Content */}
              <div className="mt-8">
                {/* Step 1: Truck Info */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <icons.Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vehicle & Shipment Information</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Enter the truck and delivery details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Report Date
                        </label>
                        <input
                          type="date"
                          value={report.report_date}
                          onChange={(e) => setReport({ ...report, report_date: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Driver Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={report.driver_name}
                          onChange={(e) => setReport({ ...report, driver_name: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          placeholder="Driver's name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Plate No. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={report.plate_no}
                          onChange={(e) => setReport({ ...report, plate_no: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          placeholder="Plate number"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Seal No.
                        </label>
                        <input
                          type="text"
                          value={report.seal_no}
                          onChange={(e) => setReport({ ...report, seal_no: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          placeholder="Seal number"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Container No.
                        </label>
                        <input
                          type="text"
                          value={report.container_no}
                          onChange={(e) => setReport({ ...report, container_no: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          placeholder="Container number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Scan Items with Barcode Editing */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <icons.Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Scan Damaged Items</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Scan barcodes to add items to the report</p>
                      </div>
                    </div>

                    {/* Barcode Scanner */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 sm:p-6 text-white">
                      <label className="block text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                        <icons.Barcode className="w-5 h-5" />
                        Scan Barcode
                      </label>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeInput}
                        placeholder="Scan or type barcode and press Enter..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300"
                        autoFocus
                      />
                      {materialLookup.material_description && (
                        <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-start gap-2">
                          <icons.CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="font-medium text-sm break-words">
                            Found: {materialLookup.material_description} ({materialLookup.category})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Items List with Barcode Editing */}
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">
                          Scanned Items ({report.items.length})
                        </h3>
                      </div>

                      {report.items.length === 0 ? (
                        <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <icons.AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium text-sm sm:text-base">No items scanned yet</p>
                          <p className="text-gray-500 text-xs sm:text-sm mt-1">Scan a barcode to add items</p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {report.items.map((item, idx) => (
                            <div key={idx} className="p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                                  {item.item_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{item.material_description || 'Unknown Item'}</p>
                                  <p className="text-xs text-gray-500 truncate">Code: {item.material_code || 'N/A'}</p>
                                  
                                  {/* Barcode Display/Edit */}
                                  {editingItemIndex === idx ? (
                                    <div className="mt-2 space-y-2">
                                      <input
                                        type="text"
                                        value={editingItemBarcode}
                                        onChange={(e) => setEditingItemBarcode(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg text-sm font-mono"
                                        placeholder="Enter new barcode..."
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSaveEditedBarcode(idx)}
                                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                                        >
                                          <icons.Save className="w-3 h-3 inline mr-1" />
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEditBarcode}
                                          className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500 transition-colors"
                                        >
                                          <icons.X className="w-3 h-3 inline mr-1" />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-600">Barcode:</span>
                                      <span className="font-mono text-xs font-semibold break-all">{item.barcode}</span>
                                      <button
                                        onClick={() => handleEditItemBarcode(idx)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit barcode"
                                      >
                                        <icons.Edit className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <icons.Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Item Details */}
                {currentStep === 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <icons.ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Damage Details</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Provide information for each damaged item</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                      {report.items.map((item, idx) => (
                        <div key={idx} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                              {item.item_number}
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {item.material_description || 'Item Details'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Scanned Serial Number</p>
                                  <p className="text-sm font-bold text-gray-900 break-all">
                                    {item.barcode || 'No barcode scanned'}
                                  </p>
                                </div>
                                <icons.Barcode className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                Damage Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={item.damage_type}
                                onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                                className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="">Select type</option>
                                {DAMAGE_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                Damage Description
                              </label>
                              <textarea
                                value={item.damage_description}
                                onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                                placeholder="Describe the damage..."
                                rows={2}
                                className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <icons.Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                                Photo Evidence
                              </label>
                              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handlePhotoUpload(idx, e.target.files[0])
                                    }
                                  }}
                                  disabled={uploadingItemIndex === idx}
                                  className="flex-1 px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-2 sm:file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                                {item.photo_url && (
                                  <a
                                    href={item.photo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto px-3 py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-700 transition-colors text-center"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                              {uploadingItemIndex === idx && (
                                <p className="text-xs text-orange-600 mt-2 font-medium">Uploading...</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Save with Personnel Dropdowns */}
                {currentStep === 4 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <icons.Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Review & Finalize</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Add final notes and signatures</p>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Personnel Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {/* Admin Dropdown */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Prepared By (Admin) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedPersonnel.admin}
                            onChange={(e) => handlePersonnelChange('admin', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          >
                            <option value="">Select Admin</option>
                            {personnelData.admins.map((admin) => (
                              <option key={admin.id} value={admin.id}>
                                {admin.name}
                              </option>
                            ))}
                          </select>
                          {selectedPersonnel.admin && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Selected: {personnelData.admins.find(a => a.id === selectedPersonnel.admin)?.name}
                            </p>
                          )}
                        </div>

                        {/* Guard Dropdown */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Noted By (Guard) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedPersonnel.guard}
                            onChange={(e) => handlePersonnelChange('guard', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          >
                            <option value="">Select Guard</option>
                            {personnelData.guards.map((guard) => (
                              <option key={guard.id} value={guard.id}>
                                {guard.name}
                              </option>
                            ))}
                          </select>
                          {selectedPersonnel.guard && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Selected: {personnelData.guards.find(g => g.id === selectedPersonnel.guard)?.name}
                            </p>
                          )}
                        </div>

                        {/* Supervisor Dropdown */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Acknowledged By (Supervisor) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedPersonnel.supervisor}
                            onChange={(e) => handlePersonnelChange('supervisor', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                          >
                            <option value="">Select Supervisor</option>
                            {personnelData.supervisors.map((supervisor) => (
                              <option key={supervisor.id} value={supervisor.id}>
                                {supervisor.name}
                              </option>
                            ))}
                          </select>
                          {selectedPersonnel.supervisor && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Selected: {personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor)?.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Narrative Findings
                        </label>
                        <textarea
                          value={report.narrative_findings}
                          onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          placeholder="Describe what happened and what was found..."
                          rows={3}
                        />
                      </div>

                      {/* Summary */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
                        <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Report Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex justify-between sm:flex-col sm:gap-1">
                            <span className="text-gray-600 font-medium">Driver:</span>
                            <span className="font-semibold text-gray-900">{report.driver_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between sm:flex-col sm:gap-1">
                            <span className="text-gray-600 font-medium">Plate No:</span>
                            <span className="font-semibold text-gray-900">{report.plate_no || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between sm:flex-col sm:gap-1">
                            <span className="text-gray-600 font-medium">Prepared By:</span>
                            <span className="font-semibold text-gray-900">
                              {report.prepared_by || 'Not selected'}
                            </span>
                          </div>
                          <div className="flex justify-between sm:flex-col sm:gap-1">
                            <span className="text-gray-600 font-medium">Total Items:</span>
                            <span className="font-semibold text-gray-900">{report.items?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as Step)}
                  disabled={currentStep === 1}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <icons.ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  Previous
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={() => {
                      if (currentStep === 1 && !canProceedToStep2()) {
                        showToast('Please fill in all required fields (Driver Name, Plate No.)', 'error')
                        return
                      }
                      if (currentStep === 2 && !canProceedToStep3()) {
                        showToast('Please add at least one item', 'error')
                        return
                      }
                      if (currentStep === 3 && !canProceedToStep4()) {
                        showToast('Please fill in Damage Type for all items', 'error')
                        return
                      }
                      setCurrentStep((currentStep + 1) as Step)
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg"
                  >
                    Next
                    <icons.ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={resetForm}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      <icons.X className="w-4 h-4 sm:w-5 sm:h-5" />
                      Clear
                    </button>
                    <button
                      onClick={saveReport}
                      disabled={isLoading || !selectedPersonnel.admin || !selectedPersonnel.guard || !selectedPersonnel.supervisor}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg font-semibold transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                        isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <icons.Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {isLoading ? 'Saving...' : isEditMode ? 'Update Report' : 'Save Report'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports Tab */}
        {activeTab === 'saved' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <icons.Download className="w-5 h-5" />
                  Saved Reports
                </h3>
                <p className="text-sm text-gray-600">View and download your saved damage reports</p>
              </div>
            </div>

            {savedReports.length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <icons.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 font-medium text-base sm:text-lg">No reports saved yet</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">Create your first damage report to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedReports.map((savedReport) => {
                  const reportItems = savedReport.items || ((savedReport as any).damage_items || [])
                  const totalItems = reportItems.length
                  const reportDate = savedReport.report_date ? new Date(savedReport.report_date).toLocaleDateString() : 'No date'
                  const reportId = savedReport.report_number || savedReport.id || 'Unknown Report'
                  
                  return (
                    <div
                      key={savedReport.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <icons.FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                            {reportId}
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {reportDate}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                        {savedReport.driver_name && (
                          <div>
                            <span className="text-gray-500">Driver:</span>
                            <p className="font-medium text-gray-900 truncate">{savedReport.driver_name}</p>
                          </div>
                        )}
                        {savedReport.plate_no && (
                          <div>
                            <span className="text-gray-500">Plate:</span>
                            <p className="font-medium text-gray-900 truncate">{savedReport.plate_no}</p>
                          </div>
                        )}
                        {savedReport.prepared_by && (
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-gray-500">Prepared by:</span>
                            <p className="font-medium text-gray-900 truncate">{savedReport.prepared_by}</p>
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleViewReport(savedReport)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <icons.Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditReport(savedReport)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <icons.Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDownloadModal(savedReport)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 border border-gray-300 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <icons.Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteReport(savedReport.report_number || savedReport.id || '')}
                          className="px-4 py-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <icons.Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Material Mappings Tab */}
        <MaterialModal
          isOpen={showMaterialModal}
          pendingBarcode={pendingBarcode}
          materialDescription={newMaterialDescription}
          materialCategory={newMaterialCategory}
          isSaving={isSavingMaterial}
          onDescriptionChange={setNewMaterialDescription}
          onCategoryChange={setNewMaterialCategory}
          onSave={handleSaveNewMaterial}
          onCancel={handleCancelMaterial}
        />
      </div>

      {/* View Report Modal */}
      <ViewReportModal
        isOpen={showViewModal}
        report={viewingReport}
        onClose={handleCloseViewModal}
        onEdit={handleEditReport}
        onDownload={handleOpenDownloadModal}
      />
      
      {/* Material Input Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
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
                    <p className="text-sm font-bold text-gray-900 break-all font-mono">
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
                  placeholder="e.g., Electronics, Furniture, etc."
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
