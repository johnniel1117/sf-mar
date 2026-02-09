'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users, Edit, Search, Star, Clock, Info } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useDamageReport } from '@/hooks/useDamageReport'
import { PDFGenerator } from '@/lib/utils/pdfGenerator'
import { DAMAGE_TYPES, STEPS, Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'

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
} as const

export default function DamageReportForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [report, setReport] = useState<DamageReport>({
    report_number: '',
    // rcv_control_no: '',
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

  useEffect(() => {
    setMounted(true)
    loadReports()
    if (activeTab === 'materials') {
      loadMaterialMappings()
    }
  }, [loadReports, activeTab])

  const loadMaterialMappings = async () => {
    try {
      const mappings = await getMaterialMappings(searchTerm)
      setMaterialMappings(mappings || [])
    } catch (error) {
      console.error('Error loading material mappings:', error)
    }
  }

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
        // Set up modal state and show modal instead of prompt
        setPendingBarcode(barcode)
        setNewMaterialDescription('')
        setNewMaterialCategory('Manual Entry')
        setShowMaterialModal(true)
        
        // Keep focus on barcode input
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
      // Save the new mapping to database
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
      addItem(manualMaterial)
      setBarcodeInput('')
      setShowMaterialModal(false)
      setPendingBarcode('')
      setNewMaterialDescription('')
      setNewMaterialCategory('Manual Entry')
      
      console.log('Material saved successfully!')
      
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
    setNewMaterialCategory('Manual Entry')
    
    // Return focus to barcode input
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

  const saveReport = async () => {
    try {
      await saveReportService(report)
      alert('Report saved successfully!')
      resetForm()
      loadReports()
      setActiveTab('saved')
    } catch (error) {
      alert('Error saving report')
    }
  }

  const resetForm = () => {
    setReport({
      report_number: '',
      // rcv_control_no: '',
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
    setBarcodeInput('')
    setMaterialLookup({})
    setCurrentStep(1)
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

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await deleteReport(reportId)
        alert('Report deleted successfully!')
        loadReports()
      } catch (error) {
        alert('Error deleting report')
      }
    }
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
      alert('Material saved successfully!')
    } catch (error) {
      console.error('Error saving material:', error)
      alert('Failed to save material. Please try again.')
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Are you sure you want to delete this material mapping?')) {
      try {
        await deleteMaterialMapping(id)
        loadMaterialMappings()
        alert('Material deleted successfully!')
      } catch (error) {
        console.error('Error deleting material:', error)
        alert('Failed to delete material. Please try again.')
      }
    }
  }

  const handleMaterialSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setTimeout(() => {
      loadMaterialMappings()
    }, 300)
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
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg justify-center w-full">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <icons.FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
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
            <icons.Download className="w-4 h-4 inline mr-1 sm:mr-2" />
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
            <icons.Star className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Material Mappings</span>
            <span className="sm:hidden">Materials</span>
          </button>
        </div>

        {/* Create Report Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-6 sm:mb-8">
                {STEPS.map((step, index) => {
                  const StepIcon = icons[step.icon as keyof typeof icons]
                  return (
                    <React.Fragment key={step.number}>
                      {/* Step Item */}
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 flex-shrink-0 ${
                            currentStep === step.number
                              ? 'bg-orange-600 text-white shadow-lg scale-110'
                              : currentStep > step.number
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {currentStep > step.number ? (
                            <icons.CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                          ) : (
                            <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                          )}
                        </div>
                        <p className={`text-[10px] sm:text-xs lg:text-sm font-semibold mt-1 sm:mt-2 text-center line-clamp-2 ${
                          currentStep === step.number ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden lg:block text-center max-w-[70px]">{step.description}</p>
                      </div>

                      {/* Connector Line */}
                      {index < STEPS.length - 1 && (
                        <div className={`h-0.5 sm:h-1 flex-1 transition-all duration-300 self-start mt-5 sm:mt-6 lg:mt-7 ${
                          currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

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

                {/* Step 2: Scan Items */}
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

                    {/* Items List */}
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
                            <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                                  {item.item_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{item.material_description || 'Unknown Item'}</p>
                                  <p className="text-xs text-gray-500 truncate">Code: {item.material_code || 'N/A'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(idx)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
                              >
                                <icons.Trash2 className="w-4 h-4" />
                              </button>
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
                            {/* Display Serial Number from scanned barcode */}
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

                {/* Step 4: Review & Save */}
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
                            <span className="text-gray-600 font-medium">Total Items:</span>
                            <span className="font-semibold text-gray-900">{report.items.length}</span>
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
                        alert('Please fill in all required fields (Driver Name, Plate No.)')
                        return
                      }
                      if (currentStep === 2 && !canProceedToStep3()) {
                        alert('Please add at least one item')
                        return
                      }
                      if (currentStep === 3 && !canProceedToStep4()) {
                        alert('Please fill in Damage Type for all items')
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
                      disabled={isLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400"
                    >
                      <icons.Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {isLoading ? 'Saving...' : 'Save Report'}
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
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <icons.Download className="w-5 h-5" />
              Saved Reports
            </h3>

            {savedReports.length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <icons.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 font-medium text-base sm:text-lg">No reports saved yet</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">Create your first damage report to see it here</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {savedReports.map((savedReport) => (
                  <div
                    key={savedReport.id}
                    className="p-3 sm:p-5 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <icons.FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-lg truncate">
                              {savedReport.report_number || savedReport.id}
                            </h4>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{((savedReport as any).damage_items || []).length}</span> items
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Date(savedReport.report_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => PDFGenerator.generatePDF(savedReport)}
                          className="w-full sm:w-auto px-3 sm:px-5 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <icons.Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">Download</span>
                        </button>
                        <button
                          onClick={() => handleDeleteReport(savedReport.id!)}
                          className="w-full sm:w-auto px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <icons.Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Material Mappings Tab */}
        {activeTab === 'materials' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <icons.Star className="w-5 h-5" />
                  Material Mappings
                </h3>
                <p className="text-sm text-gray-600">Manage saved material descriptions for barcodes</p>
              </div>
              
              <div className="w-full sm:w-auto flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by serial or description..."
                    value={searchTerm}
                    onChange={handleMaterialSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingMaterial({
                      serial_number: '',
                      material_description: '',
                      category: 'Manual Entry'
                    })
                    setIsEditing(true)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <icons.Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New</span>
                </button>
              </div>
            </div>

            {/* Edit Material Modal */}
            {isEditing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    {editingMaterial?.id ? 'Edit Material' : 'Add New Material'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Serial Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingMaterial?.serial_number || ''}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          serial_number: e.target.value
                        })}
                        disabled={!!editingMaterial?.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editingMaterial?.material_description || ''}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          material_description: e.target.value
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editingMaterial?.category || ''}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          category: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="e.g., Electronics, Furniture, etc."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditingMaterial(null)
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMaterial}
                      disabled={!editingMaterial?.serial_number || !editingMaterial?.material_description}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Material
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Material Mappings List */}
            {materialMappings.length === 0 ? (
              <div className="py-12 text-center">
                <icons.Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No material mappings found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchTerm ? 'Try a different search term' : 'Scan barcodes or add materials manually to see them here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {materialMappings.map((material) => (
                  <div key={material.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all bg-white">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <icons.Barcode className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <p className="font-mono text-sm font-bold text-gray-900 truncate">
                            {material.serial_number}
                          </p>
                        </div>
                        
                        <p className="text-base font-semibold text-gray-800 mb-2">
                          {material.material_description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {material.category && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                              {material.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <icons.Clock className="w-3 h-3" />
                            Last used: {new Date(material.last_used_at).toLocaleDateString()}
                          </span>
                          {material.usage_count && (
                            <span className="flex items-center gap-1">
                              <icons.Star className="w-3 h-3" />
                              Used {material.usage_count} times
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <icons.Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <icons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  )
}