'use client';

import { useState, useRef, useEffect } from 'react'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'
import { useDamageReport } from '@/hooks/useDamageReport'

export const useDamageReportForm = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
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

  const [selectedPersonnel, setSelectedPersonnel] = useState({
    admin: '',
    guard: '',
    supervisor: '',
  })

  const [barcodeInput, setBarcodeInput] = useState('')
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'materials'>('create')
  const [materialMappings, setMaterialMappings] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [pendingBarcode, setPendingBarcode] = useState('')
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [newMaterialCategory, setNewMaterialCategory] = useState('Manual Entry')
  const [isSavingMaterial, setIsSavingMaterial] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState<'pdf' | 'excel'>('pdf')
  const [selectedDownloadReport, setSelectedDownloadReport] = useState<DamageReport | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingReport, setViewingReport] = useState<DamageReport | null>(null)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingItemBarcode, setEditingItemBarcode] = useState('')
  const [mounted, setMounted] = useState(false)
  const [personnelData, setPersonnelData] = useState({
    admins: [] as any[],
    guards: [] as any[],
    supervisors: [] as any[],
  })

  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({
    message: '',
    type: 'info',
    show: false,
  })

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

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true })
    setTimeout(() => {
      setToast({ message: '', type: 'info', show: false })
    }, 3000)
  }

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmModal((prev) => ({ ...prev, show: false })),
    })
  }

  const {
    isLoading,
    savedReports,
    loadReports,
    saveReport: saveReportService,
    uploadPhoto,
    lookupBarcode,
    saveMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping,
    getMaterialMappings,
  } = useDamageReport()

  useEffect(() => {
    setMounted(true)
    loadReports()
    fetchPersonnelData()
  }, [loadReports])

  useEffect(() => {
    if (activeTab === 'materials') {
      loadMaterialMappings()
    }
  }, [activeTab])

  const fetchPersonnelData = async () => {
    try {
      const response = await fetch('/api/personnel')
      if (response.ok) {
        const data = await response.json()
        setPersonnelData(data)
      }
    } catch (error) {
      console.error('Error fetching personnel:', error)
      showToast('Error loading personnel data', 'error')
    }
  }

  const loadMaterialMappings = async () => {
    try {
      const mappings = await getMaterialMappings(searchTerm)
      setMaterialMappings(mappings || [])
    } catch (error) {
      console.error('Error loading material mappings:', error)
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
      supervisor: '',
    })
    setBarcodeInput('')
    setCurrentStep(1)
    setEditingReportId(null)
    setIsEditMode(false)
  }

  return {
    currentStep,
    setCurrentStep,
    report,
    setReport,
    selectedPersonnel,
    setSelectedPersonnel,
    barcodeInput,
    setBarcodeInput,
    uploadingItemIndex,
    setUploadingItemIndex,
    activeTab,
    setActiveTab,
    materialMappings,
    setMaterialMappings,
    isEditing,
    setIsEditing,
    searchTerm,
    setSearchTerm,
    showMaterialModal,
    setShowMaterialModal,
    pendingBarcode,
    setPendingBarcode,
    newMaterialDescription,
    setNewMaterialDescription,
    newMaterialCategory,
    setNewMaterialCategory,
    isSavingMaterial,
    setIsSavingMaterial,
    showDownloadModal,
    setShowDownloadModal,
    downloadType,
    setDownloadType,
    selectedDownloadReport,
    setSelectedDownloadReport,
    showViewModal,
    setShowViewModal,
    viewingReport,
    setViewingReport,
    editingReportId,
    setEditingReportId,
    isEditMode,
    setIsEditMode,
    editingMaterial,
    setEditingMaterial,
    editingItemIndex,
    setEditingItemIndex,
    editingItemBarcode,
    setEditingItemBarcode,
    mounted,
    personnelData,
    toast,
    confirmModal,
    barcodeInputRef,
    showToast,
    showConfirmation,
    isLoading,
    savedReports,
    loadReports,
    saveReportService,
    uploadPhoto,
    lookupBarcode,
    saveMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping,
    getMaterialMappings,
    fetchPersonnelData,
    loadMaterialMappings,
    resetForm,
  }
}
