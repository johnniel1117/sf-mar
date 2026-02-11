'use client'

import React, { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useDamageReportForm } from './hooks/useDamageReportForm'
import { PDFGenerator } from '@/lib/utils/pdfGenerator'
import { ExcelGenerator } from '@/lib/utils/excelGenerator'
import { DAMAGE_TYPES, STEPS, Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'
import { ICONS } from './utils/constants'
import ConfirmationModal from './components/modals/ConfirmationModal'
import ToastNotification from './components/modals/ToastNotification'
import MaterialModal from './components/modals/MaterialModal'

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

  // Use custom hook
  const {
    isLoading,
    savedReports,
    loadReports,
    saveReportService,
    deleteReportService,
    uploadPhoto,
    lookupBarcodeService,
    saveMaterialMappingService,
    updateMaterialMappingService,
    deleteMaterialMappingService,
    getMaterialMappings,
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showToast,
    showConfirmation,
  } = useDamageReportForm()

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
    const material = await lookupBarcodeService(newBarcode);
    
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

      const material = await lookupBarcodeService(barcode)
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
      const savedMaterial = await saveMaterialMappingService(
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
        await updateMaterialMappingService(editingMaterial.id, {
          material_description: editingMaterial.material_description,
          category: editingMaterial.category,
        })
      } else {
        await saveMaterialMappingService(
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
          await deleteMaterialMappingService(id)
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

  // Render logic (same as original, just extract modals at the bottom)
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
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg justify-center w-full">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Create Report</span>
            <span className="sm:hidden">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'saved'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.Download className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Saved Reports</span>
            <span className="sm:hidden">Saved</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('materials')
              loadMaterialMappings()
            }}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ICONS.Star className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Material Mappings</span>
            <span className="sm:hidden">Materials</span>
          </button>
        </div>

        {/* Main content (same as original) */}
        {/* ... rest of your JSX code remains exactly the same ... */}
        
      </div>

      {/* Modals extracted */}
      {showMaterialModal && (
        <MaterialModal
          pendingBarcode={pendingBarcode}
          materialDescription={newMaterialDescription}
          onDescriptionChange={setNewMaterialDescription}
          materialCategory={newMaterialCategory}
          onCategoryChange={setNewMaterialCategory}
          isSaving={isSavingMaterial}
          materialLookup={materialLookup}
          onClose={handleCancelMaterial}
          onSave={handleSaveNewMaterial}
          onCancel={handleCancelMaterial}
        />
      )}

      {confirmModal.show && (
        <ConfirmationModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(prev => ({ ...prev, show: false }));
          }}
          onCancel={confirmModal.onCancel}
        />
      )}

      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => showToast('', 'info')}
        />
      )}
    </div>
  )
}