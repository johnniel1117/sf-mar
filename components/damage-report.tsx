'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import {
  Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText,
  CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck,
  ClipboardList, Users, Edit, Search, Star, Clock, Info,
  FileSpreadsheet, Eye, Home, Menu
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useDamageReport } from '@/hooks/useDamageReport'
import { PDFGenerator } from '@/lib/utils/pdfGenerator'
import { ExcelGenerator } from '@/lib/utils/excelGenerator'
import { Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'
import { CreateReportTab } from '@/components/tabs/CreateReportTab'
import { SavedReportsTab } from '@/components/tabs/SavedReportsTab'
import { MaterialMappingsTab } from '@/components/tabs/MaterialMappingsTab'
import { DownloadModal } from '@/components/modals/DownloadModal'
import { ViewReportModal } from '@/components/modals/ViewReportModal'
import { ConfirmationModal } from '@/components/modals/ConfirmationModal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function buildNextReportNumber(existingNumbers: string[]): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const datePrefix = `DMG-${year}${month}${day}`
  const todaySequences = existingNumbers
    .filter(num => num.startsWith(datePrefix + '-'))
    .map(num => {
      const parsed = parseInt(num.slice(datePrefix.length + 1), 10)
      return isNaN(parsed) ? 0 : parsed
    })
  const next = todaySequences.length > 0 ? Math.max(...todaySequences) + 1 : 1
  return `${datePrefix}-${String(next).padStart(3, '0')}`
}

async function fetchNextReportNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.from('damage_reports').select('report_number')
    if (error) throw error
    const numbers = (data || []).map((row: { report_number: string }) => row.report_number)
    return buildNextReportNumber(numbers)
  } catch (err) {
    console.error('Error fetching report numbers:', err)
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `DMG-${y}${m}${d}-001`
  }
}

const EMPTY_REPORT = (): DamageReport => ({
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

type ActiveTab = 'create' | 'saved' | 'materials'

interface ReportSidebarProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMaterialsTab?: () => void
  isViewer?: boolean
}

function ReportSidebar({
  activeTab, onTabChange, isOpen = true, onClose,
  isCollapsed = false, onToggleCollapse, onMaterialsTab, isViewer,
}: ReportSidebarProps) {
  const handleTabChange = (tab: ActiveTab) => {
    onTabChange(tab)
    if (tab === 'materials') onMaterialsTab?.()
    onClose?.()
  }

  const allNavItems: { tab: ActiveTab; label: string; icon: React.ElementType; viewerVisible: boolean }[] = [
    { tab: 'create',    label: 'Create Report',    icon: ClipboardList, viewerVisible: false },
    { tab: 'saved',     label: 'Saved Reports',    icon: FileText,      viewerVisible: true  },
    { tab: 'materials', label: 'Material Mappings', icon: Barcode,      viewerVisible: false },
  ]

  const navItems = allNavItems.filter(item => !isViewer || item.viewerVisible)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40" onClick={onClose} />
      )}
      <aside
        className={`
          fixed left-0 top-[73px] bg-[#121212] border-r border-[#282828] flex flex-col z-50
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-[73px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
        `}
        style={{ height: 'calc(100vh - 73px)' }}
      >
        <nav className="flex-1 py-3 overflow-hidden">
          <div className="space-y-0.5 px-2">
            {navItems.map(({ tab, label, icon: Icon }) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg font-semibold text-sm
                    transition-all duration-150 relative group
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive ? 'bg-red-600/15 text-white' : 'text-[#B3B3B3] hover:bg-[#282828] hover:text-white'}
                  `}
                  title={isCollapsed ? label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-500' : ''}`} />
                  {!isCollapsed && <span>{label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#282828] border border-[#3E3E3E] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs text-white z-50 shadow-xl">
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
        <div className="flex-shrink-0 border-t border-[#282828] p-2">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2.5 rounded-lg hover:bg-[#282828] transition-colors text-[#6A6A6A] hover:text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {!isCollapsed && (
            <p className="text-[10px] text-[#6A6A6A] text-center pb-1 pt-0.5">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DamageReportForm({ role }: { role?: string }) {
  const isViewer = role?.toLowerCase() === 'viewer'
  const [currentStep, setCurrentStep]           = useState<Step>(1)
  const [activeTab, setActiveTab]               = useState<ActiveTab>(isViewer ? 'saved' : 'create')
  const [sidebarOpen, setSidebarOpen]           = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted]                   = useState(false)

  const [report, setReport] = useState<DamageReport>(EMPTY_REPORT())

  const [personnelData, setPersonnelData]       = useState({ admins: [] as any[], guards: [] as any[], supervisors: [] as any[] })
  const [selectedPersonnel, setSelectedPersonnel] = useState({ admin: '', guard: '', supervisor: '' })

  const [editingItemIndex, setEditingItemIndex]     = useState<number | null>(null)
  const [editingItemBarcode, setEditingItemBarcode] = useState('')
  const [barcodeInput, setBarcodeInput]             = useState('')
  const [materialLookup, setMaterialLookup]         = useState<Record<string, any>>({})
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const [materialMappings, setMaterialMappings] = useState<any[]>([])
  const [editingMaterial, setEditingMaterial]   = useState<any>(null)
  const [isEditing, setIsEditing]               = useState(false)
  const [searchTerm, setSearchTerm]             = useState('')

  const [showMaterialModal, setShowMaterialModal]           = useState(false)
  const [pendingBarcode, setPendingBarcode]                 = useState('')
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [newMaterialCategory, setNewMaterialCategory]       = useState('')
  const [isSavingMaterial, setIsSavingMaterial]             = useState(false)

  const [showDownloadModal, setShowDownloadModal]           = useState(false)
  const [downloadType, setDownloadType]                     = useState<'pdf' | 'excel'>('pdf')
  const [selectedDownloadReport, setSelectedDownloadReport] = useState<DamageReport | null>(null)

  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingReport, setViewingReport] = useState<DamageReport | null>(null)

  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode]           = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean }>({
    message: '', type: 'info', show: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast({ message: '', type: 'info', show: false }), 3000)
  }

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
  }>({ show: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} })

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true, title, message, onConfirm,
      onCancel: () => setConfirmModal(prev => ({ ...prev, show: false })),
    })
  }

  const {
    isLoading, savedReports, loadReports,
    saveReport: saveReportService, deleteReport, uploadPhoto,
    lookupBarcode, saveMaterialMapping, updateMaterialMapping,
    deleteMaterialMapping, getMaterialMappings,
  } = useDamageReport()

  useEffect(() => {
    setMounted(true)
    loadReports()
    fetchPersonnelData()
    fetchNextReportNumber().then(nextNumber => {
      setReport(prev => ({ ...prev, report_number: prev.report_number || nextNumber }))
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'materials') loadMaterialMappings()
  }, [activeTab])

  const fetchPersonnelData = async () => {
    try {
      const response = await fetch('/api/personnel')
      if (response.ok) setPersonnelData(await response.json())
    } catch { showToast('Error loading personnel data', 'error') }
  }

  const loadMaterialMappings = async () => {
    try {
      const mappings = await getMaterialMappings(searchTerm)
      setMaterialMappings(mappings || [])
    } catch { console.error('Error loading material mappings') }
  }

  useEffect(() => {
    const selectedAdmin      = personnelData.admins.find(a => a.id === selectedPersonnel.admin)
    const selectedGuard      = personnelData.guards.find(g => g.id === selectedPersonnel.guard)
    const selectedSupervisor = personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor)
    setReport(prev => ({
      ...prev,
      prepared_by:     selectedAdmin?.name || '',
      noted_by:        selectedGuard?.name || '',
      acknowledged_by: selectedSupervisor?.name || '',
    }))
  }, [selectedPersonnel, personnelData])

  const resetForm = async () => {
    const nextNumber = await fetchNextReportNumber()
    setReport({ ...EMPTY_REPORT(), report_number: nextNumber })
    setSelectedPersonnel({ admin: '', guard: '', supervisor: '' })
    setBarcodeInput(''); setMaterialLookup({}); setCurrentStep(1)
    setEditingReportId(null); setIsEditMode(false)
    loadReports()
  }

  const handleEditItemBarcode = async (index: number) => {
    setEditingItemIndex(index)
    setEditingItemBarcode(report.items[index].barcode)
  }

  const handleSaveEditedBarcode = async (index: number) => {
    const newBarcode = editingItemBarcode.trim()
    if (!newBarcode) { showToast('Barcode cannot be empty', 'error'); return }
    const material = await lookupBarcode(newBarcode)
    if (material) {
      updateItem(index, 'barcode', newBarcode)
      updateItem(index, 'material_code', material.material_code || newBarcode)
      updateItem(index, 'material_description', material.material_description || '')
      updateItem(index, 'mapping_id', material.mapping_id || null)
      showToast('Item barcode updated successfully', 'success')
      setEditingItemIndex(null); setEditingItemBarcode('')
    } else {
      setPendingBarcode(newBarcode); setNewMaterialDescription(''); setNewMaterialCategory('')
      setShowMaterialModal(true);
      (window as any).editingItemIndexForBarcode = index
    }
  }

  const handleCancelEditBarcode = () => { setEditingItemIndex(null); setEditingItemBarcode('') }

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const barcode = barcodeInput.trim()
    if (!barcode) return
    const material = await lookupBarcode(barcode)
    if (material) {
      setMaterialLookup(material); addItem(material); setBarcodeInput('')
    } else {
      setPendingBarcode(barcode); setNewMaterialDescription(''); setNewMaterialCategory('')
      setShowMaterialModal(true)
      setTimeout(() => barcodeInputRef.current?.focus(), 100)
    }
  }

  const handleSaveNewMaterial = async () => {
    if (!newMaterialDescription.trim()) { alert('Please enter a material description'); return }
    setIsSavingMaterial(true)
    try {
      const savedMaterial = await saveMaterialMapping(pendingBarcode, newMaterialDescription, newMaterialCategory)
      const manualMaterial = {
        barcode: pendingBarcode, material_code: pendingBarcode,
        material_description: newMaterialDescription, category: newMaterialCategory,
        mapping_id: savedMaterial?.id,
      }
      setMaterialLookup(manualMaterial)
      const editingIndex = (window as any).editingItemIndexForBarcode
      if (editingIndex !== undefined && editingIndex !== null) {
        updateItem(editingIndex, 'barcode', pendingBarcode)
        updateItem(editingIndex, 'material_code', pendingBarcode)
        updateItem(editingIndex, 'material_description', newMaterialDescription)
        updateItem(editingIndex, 'mapping_id', savedMaterial?.id)
        setEditingItemIndex(null); setEditingItemBarcode('');
        (window as any).editingItemIndexForBarcode = undefined
        showToast('Item barcode updated successfully', 'success')
      } else {
        addItem(manualMaterial)
        showToast('Material saved successfully!', 'success')
      }
      setBarcodeInput(''); setShowMaterialModal(false); setPendingBarcode('')
      setNewMaterialDescription(''); setNewMaterialCategory('')
    } catch { alert('Failed to save material. Please try again.') }
    finally { setIsSavingMaterial(false) }
  }

  const handleCancelMaterial = () => {
    setShowMaterialModal(false); setPendingBarcode('')
    setNewMaterialDescription(''); setNewMaterialCategory('');
    (window as any).editingItemIndexForBarcode = undefined
    setTimeout(() => barcodeInputRef.current?.focus(), 100)
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
    setReport({ ...report, items: [...report.items, newItem] })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...report.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setReport({ ...report, items: updatedItems })
  }

  const removeItem = (index: number) => {
    const updatedItems = report.items.filter((_, i) => i !== index)
    updatedItems.forEach((item, i) => { item.item_number = i + 1 })
    setReport({ ...report, items: updatedItems })
  }

  const handlePhotoUpload = async (index: number, file: File) => {
    try {
      setUploadingItemIndex(index)
      const url = await uploadPhoto(file, report.report_number || 'temp')
      updateItem(index, 'photo_url', url)
    } catch { alert('Failed to upload photo') }
    finally { setUploadingItemIndex(null) }
  }

  const handleEditReport = async (reportToEdit: DamageReport) => {
    try {
      setReport({ ...reportToEdit, items: reportToEdit.items || [] })
      setSelectedPersonnel({
        admin:      (reportToEdit as any).admin_id || '',
        guard:      (reportToEdit as any).guard_id || '',
        supervisor: (reportToEdit as any).supervisor_id || '',
      })
      setEditingReportId(reportToEdit.id || null)
      setIsEditMode(true); setCurrentStep(1); setActiveTab('create')
      showToast('Report loaded for editing', 'info')
    } catch { showToast('Failed to load report for editing', 'error') }
  }

  const saveReport = async () => {
    try {
      const reportWithPersonnel = {
        ...report,
        admin_id:      selectedPersonnel.admin,
        guard_id:      selectedPersonnel.guard,
        supervisor_id: selectedPersonnel.supervisor,
      }
      if (isEditMode && editingReportId) {
        const response = await fetch(`/api/damage-reports/${editingReportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportWithPersonnel),
        })
        if (!response.ok) throw new Error('Failed to update report')
        showToast('Report updated successfully!', 'success')
      } else {
        await saveReportService(reportWithPersonnel)
        showToast('Report saved successfully!', 'success')
      }
      await resetForm()
      setActiveTab('saved')
    } catch { showToast('Error saving report', 'error') }
  }

  const canProceedToStep2 = () => !!(report.driver_name && report.plate_no)
  const canProceedToStep3 = () => report.items.length > 0
  const canProceedToStep4 = () => report.items.every(item => item.damage_type)

  const handleDeleteReport = async (reportNumber: string) => {
    if (!reportNumber) { showToast('Invalid report number', 'error'); return }
    showConfirmation('Delete Report', 'Are you sure you want to delete this report? This action cannot be undone.', async () => {
      try {
        const response = await fetch(`/api/damage-reports/${encodeURIComponent(reportNumber.trim())}`, { method: 'DELETE' })
        if (!response.ok) { const d = await response.json(); throw new Error(d.error || 'Failed') }
        const result = await response.json()
        showToast(result.message || 'Report deleted successfully!', 'success')
        await loadReports()
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error deleting report.', 'error')
      }
    })
  }

  const handleDownloadReport    = (r: DamageReport, type: 'pdf' | 'excel') => {
    if (type === 'pdf') PDFGenerator.generatePDF(r)
    else ExcelGenerator.generateExcel(r)
  }
  const handleOpenDownloadModal = (r: DamageReport) => { setSelectedDownloadReport(r); setShowDownloadModal(true) }
  const handleDownloadConfirm   = () => {
    if (selectedDownloadReport) handleDownloadReport(selectedDownloadReport, downloadType)
    setShowDownloadModal(false); setSelectedDownloadReport(null)
  }
  const handleViewReport        = (r: DamageReport) => { setViewingReport(r); setShowViewModal(true) }
  const handleCloseViewModal    = () => { setShowViewModal(false); setViewingReport(null) }
  const handleEditMaterial      = (material: any) => { setEditingMaterial(material); setIsEditing(true) }
  const handleSaveMaterial      = async () => {
    if (!editingMaterial) return
    try {
      if (editingMaterial.id) {
        await updateMaterialMapping(editingMaterial.id, {
          material_description: editingMaterial.material_description,
          category: editingMaterial.category,
        })
      } else {
        await saveMaterialMapping(editingMaterial.serial_number, editingMaterial.material_description, editingMaterial.category)
      }
      setIsEditing(false); setEditingMaterial(null); loadMaterialMappings()
      showToast('Material saved successfully!', 'success')
    } catch { showToast('Failed to save material', 'error') }
  }
  const handleDeleteMaterial = async (id: string) => {
    showConfirmation('Delete Material Mapping', 'Are you sure you want to delete this material mapping?', async () => {
      try {
        await deleteMaterialMapping(id); loadMaterialMappings()
        showToast('Material deleted successfully!', 'success')
      } catch { showToast('Failed to delete material', 'error') }
    })
  }
  const handleMaterialSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setTimeout(() => loadMaterialMappings(), 300)
  }
  const handlePersonnelChange = (role: 'admin' | 'guard' | 'supervisor', value: string) => {
    setSelectedPersonnel(prev => ({ ...prev, [role]: value }))
  }

  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="flex-shrink-0 h-[73px] border-b border-[#282828] z-50 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-[#282828] rounded-full transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-[#B3B3B3]" />
        </button>

        <Link href="/" className="p-2 rounded-full hover:bg-[#282828] transition-colors flex-shrink-0" title="Home">
          <Home className="w-4 h-4 text-[#6A6A6A] hover:text-[#B3B3B3] transition-colors" />
        </Link>

        <div className="w-px h-5 bg-[#282828] flex-shrink-0 hidden sm:block" />

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
            <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest font-bold text-white leading-none mb-0.5">SF Express</p>
            <h1 className="text-white text-sm font-black leading-none">Damage Report</h1>
          </div>
          <div className="sm:hidden">
            <h1 className="text-white text-sm font-black">Damage Report</h1>
          </div>
        </div>

        <div className="flex-1" />

        {activeTab === 'create' && report.report_number && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border border-[#3E3E3E] rounded-full">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A]">No.</span>
            <span className="text-xs font-black text-white tabular-nums">{report.report_number}</span>
          </div>
        )}

        {isEditMode && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 border border-blue-500/30 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-400">Editing</span>
          </div>
        )}
      </nav>

      {/* ── Below-nav row ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-black/35">
        <ReportSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (isViewer && (tab === 'create' || tab === 'materials')) return
            setActiveTab(tab)
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMaterialsTab={loadMaterialMappings}
          isViewer={isViewer}
        />

        <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-red-600/3 rounded-full blur-[120px] z-0" />

          <div className="relative z-10 p-4 sm:p-6 lg:p-8">
            {activeTab === 'create' && !isViewer && (
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

            {activeTab === 'saved' && (
              <div className="h-[calc(100vh-73px-3rem)] sm:h-[calc(100vh-73px-4rem)]">
                <SavedReportsTab
                  savedReports={savedReports}
                  handleViewReport={handleViewReport}
                  handleEditReport={handleEditReport}
                  handleOpenDownloadModal={handleOpenDownloadModal}
                  handleDeleteReport={handleDeleteReport}
                  isViewer={isViewer}
                />
              </div>
            )}

            {activeTab === 'materials' && !isViewer && (
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
        </main>
      </div>

      {/* ── Material Not Found Modal ── */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onTouchMove={(e) => e.preventDefault()}>
          <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Material Not Found
                </h3>
                <p className="text-sm text-[#B3B3B3] mt-1">
                  Please enter material description for the scanned barcode
                </p>
              </div>
              <button onClick={handleCancelMaterial} className="p-1 hover:bg-[#282828] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[#6A6A6A]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#282828] p-3 rounded-lg border border-[#3E3E3E]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#6A6A6A] mb-1">Scanned Barcode</p>
                    <p className="text-sm font-bold text-white break-all">{pendingBarcode}</p>
                  </div>
                  <Barcode className="w-5 h-5 text-[#6A6A6A] flex-shrink-0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B3B3B3] mb-2">
                  Material Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newMaterialDescription}
                  onChange={(e) => setNewMaterialDescription(e.target.value)}
                  placeholder="Enter material description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#282828] border border-[#3E3E3E] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none text-white placeholder-[#6A6A6A]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Category</label>
                <input
                  type="text"
                  value={newMaterialCategory}
                  onChange={(e) => setNewMaterialCategory(e.target.value)}
                  placeholder="E.G., TV, WASHING MACHINE"
                  className="w-full px-3 py-2 bg-[#282828] border border-[#3E3E3E] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-[#6A6A6A]"
                />
              </div>

              <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-400 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>This material will be saved to your database and automatically retrieved next time you scan this barcode.</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#282828]">
              <button onClick={handleCancelMaterial}
                className="px-4 py-2 text-[#B3B3B3] hover:bg-[#282828] rounded-lg font-medium transition-colors"
                disabled={isSavingMaterial}>
                Cancel
              </button>
              <button onClick={handleSaveNewMaterial}
                disabled={!newMaterialDescription.trim() || isSavingMaterial}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSavingMaterial ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <><Save className="w-4 h-4" /> Save & Continue</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewReportModal
        isOpen={showViewModal}
        report={viewingReport}
        onClose={handleCloseViewModal}
        onEdit={handleEditReport}
        onDownload={handleOpenDownloadModal}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        downloadType={downloadType}
        onDownloadTypeChange={setDownloadType}
        onConfirm={handleDownloadConfirm}
        onClose={() => setShowDownloadModal(false)}
      />

      <ConfirmationModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => { confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, show: false })) }}
        onCancel={confirmModal.onCancel}
      />

      {/* ── Toast ── */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-white z-[100] border ${
          toast.type === 'success' ? 'bg-[#1E1E1E] border-green-500/40' :
          toast.type === 'error'   ? 'bg-[#1E1E1E] border-red-600/40' :
                                     'bg-[#1E1E1E] border-blue-500/40'
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-500'
          }`} />
          <span className="text-sm font-semibold text-white">{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="ml-1 p-0.5 rounded-full hover:bg-[#3E3E3E] transition-colors">
            <X className="w-3 h-3 text-[#6A6A6A]" />
          </button>
        </div>
      )}
    </div>
  )
}