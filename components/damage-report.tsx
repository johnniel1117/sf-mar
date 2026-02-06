'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users, Search, Upload, Database, RefreshCw, Sparkles } from 'lucide-react'
import { MATCODE_CATEGORY_MAP, getMaterialInfoFromMatcode } from '@/lib/category-mapping'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'

interface DamageItem {
  id?: string
  item_number: number
  barcode: string
  serial_number: string
  material_code: string
  material_description: string
  damage_type: string
  damage_description: string
  photo_url?: string
}

interface DamageReport {
  id?: string
  report_number: string
  rcv_control_no: string
  report_date: string
  seal_no: string
  driver_name: string
  plate_no: string
  container_no: string
  prepared_by: string
  noted_by: string
  acknowledged_by: string
  narrative_findings: string
  actions_required: string
  status: string
  items: DamageItem[]
}

interface BarcodeMapping {
  id?: string
  barcode: string
  material_code: string
  material_description: string
  category: string
  created_at?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const DAMAGE_TYPES = [
  'Damage Box',
  'Broken Item',
  'Dent',
  'Crack',
  'Water Damage',
  'Missing Parts',
  'Other',
]

type Step = 1 | 2 | 3 | 4

export default function DamageReportForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [report, setReport] = useState<DamageReport>({
    report_number: '',
    rcv_control_no: '',
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

  const [savedReports, setSavedReports] = useState<DamageReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [materialLookup, setMaterialLookup] = useState<Record<string, any>>({})
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [serialWarnings, setSerialWarnings] = useState<Record<number, boolean>>({})
  const [showSaveBarcodeModal, setShowSaveBarcodeModal] = useState(false)
  const [unknownBarcodeData, setUnknownBarcodeData] = useState<BarcodeMapping | null>(null)
  const [saveBarcodeLoading, setSaveBarcodeLoading] = useState(false)
  const [scanAnimation, setScanAnimation] = useState(false)
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('')
  const [barcodeHistory, setBarcodeHistory] = useState<BarcodeMapping[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadReports()
    loadBarcodeHistory()
  }, [])

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('damage_reports')
        .select('*, damage_items(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedReports((data as any[]) || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const loadBarcodeHistory = async (search?: string) => {
    setIsLoadingHistory(true)
    try {
      let query = supabase
        .from('barcode_material_mapping')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (search) {
        query = query.or(`barcode.ilike.%${search}%,material_code.ilike.%${search}%,material_description.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setBarcodeHistory(data || [])
    } catch (error) {
      console.error('Error loading barcode history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const lookupBarcode = async (barcode: string) => {
    try {
      setScanAnimation(true)
      await new Promise(resolve => setTimeout(resolve, 300)) // Animation delay
      
      const cleanBarcode = barcode.trim()
      
      // First, try database lookup
      const { data: exactData, error: exactError } = await supabase
        .from('barcode_material_mapping')
        .select('*')
        .eq('barcode', cleanBarcode)
        .single()

      if (exactData) {
        setScanAnimation(false)
        return exactData
      }

      // Try patterns
      let materialCode = cleanBarcode
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/)
      if (materialCodeMatch) {
        materialCode = materialCodeMatch[1]
        
        const { data: partialData } = await supabase
          .from('barcode_material_mapping')
          .select('*')
          .eq('barcode', materialCode)
          .single()

        if (partialData) {
          setScanAnimation(false)
          return partialData
        }
      }

      // Use material mapping
      const materialInfo = getMaterialInfoFromMatcode(materialCode)
      
      if (materialInfo.model !== materialCode) {
        setScanAnimation(false)
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category,
        }
      }

      // Not found - prompt user to save
      setUnknownBarcodeData({
        barcode: cleanBarcode,
        material_code: materialCode,
        material_description: '',
        category: '',
      })
      setShowSaveBarcodeModal(true)
      setScanAnimation(false)
      return null

    } catch (error) {
      console.error('Error looking up barcode:', error)
      setScanAnimation(false)
      
      const cleanBarcode = barcode.trim()
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/)
      const materialCode = materialCodeMatch ? materialCodeMatch[1] : cleanBarcode
      
      const materialInfo = getMaterialInfoFromMatcode(materialCode)
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category,
        }
      }
      
      setUnknownBarcodeData({
        barcode: cleanBarcode,
        material_code: materialCode,
        material_description: '',
        category: '',
      })
      setShowSaveBarcodeModal(true)
      return null
    }
  }

  const saveBarcodeMapping = async () => {
    if (!unknownBarcodeData || !unknownBarcodeData.material_description.trim()) {
      alert('Please enter material description')
      return
    }

    setSaveBarcodeLoading(true)
    try {
      const { data, error } = await supabase
        .from('barcode_material_mapping')
        .insert([
          {
            barcode: unknownBarcodeData.barcode,
            material_code: unknownBarcodeData.material_code,
            material_description: unknownBarcodeData.material_description,
            category: unknownBarcodeData.category || 'Unknown',
          }
        ])
        .select()

      if (error) throw error

      alert('Barcode saved successfully!')
      setShowSaveBarcodeModal(false)
      setUnknownBarcodeData(null)
      loadBarcodeHistory()
      
      // Use the saved mapping
      if (data && data[0]) {
        setMaterialLookup(data[0])
        addItem(data[0])
        setBarcodeInput('')
      }
    } catch (error) {
      console.error('Error saving barcode:', error)
      alert('Error saving barcode')
    } finally {
      setSaveBarcodeLoading(false)
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
      }
    }
  }

  const addItem = (material?: any) => {
    const newItem: DamageItem = {
      item_number: report.items.length + 1,
      barcode: material?.barcode || '',
      serial_number: '',
      material_code: material?.material_code || '',
      material_description: material?.material_description || '',
      damage_type: '',
      damage_description: '',
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

  const saveReport = async () => {
    setIsLoading(true)
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('damage_reports')
        .insert([
          {
            report_number: report.report_number || `DMG-${Date.now()}`,
            rcv_control_no: report.rcv_control_no,
            report_date: report.report_date,
            seal_no: report.seal_no,
            driver_name: report.driver_name,
            plate_no: report.plate_no,
            container_no: report.container_no,
            prepared_by: report.prepared_by,
            noted_by: report.noted_by,
            acknowledged_by: report.acknowledged_by,
            narrative_findings: report.narrative_findings,
            actions_required: report.actions_required,
            status: report.status,
          },
        ])
        .select()

      if (reportError) throw reportError

      const reportId = reportData[0].id

      if (report.items.length > 0) {
        const itemsToInsert = report.items.map((item) => ({
          damage_report_id: reportId,
          item_number: item.item_number,
          barcode: item.barcode,
          serial_number: item.serial_number,
          material_code: item.material_code,
          material_description: item.material_description,
          damage_type: item.damage_type,
          damage_description: item.damage_description,
        }))

        const { error: itemsError } = await supabase
          .from('damage_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      alert('Report saved successfully!')
      resetForm()
      loadReports()
      setActiveTab('saved')
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Error saving report')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setReport({
      report_number: '',
      rcv_control_no: '',
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

  const steps = [
    { number: 1, title: 'Truck Info', icon: Truck, description: 'Vehicle & shipment details' },
    { number: 2, title: 'Scan Items', icon: Barcode, description: 'Scan damaged items' },
    { number: 3, title: 'Details', icon: ClipboardList, description: 'Damage information' },
    { number: 4, title: 'Review', icon: Users, description: 'Finalize & save' },
  ]

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 sm:py-8 px-3 sm:px-4">
      <Navbar 
        showBackButton 
        backHref="/" 
        animate={mounted}
        fixed={true}
      />
      <div className="w-full max-w-6xl mx-auto pt-16">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <span className="text-white font-bold text-xl">SF</span>
            </motion.div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                SF EXPRESS
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Damage & Deviation Report System</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs with animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-lg border border-gray-200 max-w-md mx-auto"
        >
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'create' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg"
                transition={{ type: "spring", bounce: 0.2 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">Create Report</span>
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('saved')
              loadBarcodeHistory()
            }}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'saved' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg"
                transition={{ type: "spring", bounce: 0.2 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Database className="w-5 h-5" />
              <span className="hidden sm:inline">Database</span>
            </span>
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Progress Steps */}
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
                <div className="flex items-start justify-between gap-1 sm:gap-2 mb-8 sm:mb-10">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col items-center flex-1 cursor-pointer"
                        onClick={() => {
                          if (step.number < currentStep) setCurrentStep(step.number as Step)
                        }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-500 flex-shrink-0 shadow-lg ${
                            currentStep === step.number
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white ring-4 ring-orange-200'
                              : currentStep > step.number
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400'
                          }`}
                        >
                          {currentStep > step.number ? (
                            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                          ) : (
                            <step.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                          )}
                          {currentStep === step.number && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              {step.number}
                            </motion.div>
                          )}
                        </motion.div>
                        <motion.p
                          className={`text-xs sm:text-sm lg:text-base font-semibold mt-2 sm:mt-3 text-center ${
                            currentStep === step.number ? 'text-orange-600' : 'text-gray-600'
                          }`}
                          animate={currentStep === step.number ? { color: "#ea580c" } : {}}
                        >
                          {step.title}
                        </motion.p>
                      </motion.div>

                      {index < steps.length - 1 && (
                        <div className="relative h-1 flex-1 self-start mt-7 sm:mt-8 lg:mt-10">
                          <div className="absolute inset-0 bg-gray-300 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                              initial={{ width: currentStep > step.number ? "100%" : "0%" }}
                              animate={{ width: currentStep > step.number ? "100%" : "0%" }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8"
                >
                  {/* Step 1: Truck Info */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-lg">
                          <Truck className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Vehicle & Shipment Information
                          </h2>
                          <p className="text-sm text-gray-500">Enter the truck and delivery details</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {[
                          { label: 'Report Date', key: 'report_date', type: 'date' },
                          { label: 'Driver Name *', key: 'driver_name', type: 'text', required: true },
                          { label: 'Plate No. *', key: 'plate_no', type: 'text', required: true },
                          { label: 'Seal No.', key: 'seal_no', type: 'text' },
                          { label: 'Container No.', key: 'container_no', type: 'text', span: 2 },
                        ].map((field) => (
                          <motion.div
                            key={field.key}
                            className={field.span ? 'sm:col-span-2' : ''}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              {field.label}
                            </label>
                            <input
                              type={field.type as any}
                              value={report[field.key as keyof DamageReport] as string}
                              onChange={(e) => setReport({ ...report, [field.key]: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 text-sm bg-white shadow-sm hover:shadow-md"
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Scan Items */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-lg">
                          <Barcode className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Scan Damaged Items
                          </h2>
                          <p className="text-sm text-gray-500">Scan barcodes to add items to the report</p>
                        </div>
                      </div>

                      {/* Barcode Scanner with Animation */}
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                        <label className="block text-lg font-bold mb-4 flex items-center gap-3">
                          <div className={`p-2 bg-white/20 rounded-lg ${scanAnimation ? 'animate-pulse' : ''}`}>
                            <Barcode className="w-6 h-6" />
                          </div>
                          Scan Barcode
                        </label>
                        <div className="relative">
                          <input
                            ref={barcodeInputRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={handleBarcodeInput}
                            placeholder="Scan or type barcode and press Enter..."
                            className="w-full px-5 py-4 bg-white text-gray-900 rounded-xl text-base focus:outline-none focus:ring-3 focus:ring-orange-300 shadow-lg"
                            autoFocus
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => barcodeInput && handleBarcodeInput({ key: 'Enter' } as any)}
                            className="absolute right-2 top-2 px-4 py-2 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800 transition-colors"
                          >
                            Enter
                          </motion.button>
                        </div>
                        {materialLookup.material_description && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0" />
                              <div>
                                <p className="font-bold text-white">
                                  {materialLookup.material_description}
                                </p>
                                <p className="text-white/80 text-sm mt-1">
                                  {materialLookup.material_code} • {materialLookup.category}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Items List */}
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Scanned Items
                            </h3>
                            <p className="text-sm text-gray-500">
                              Total: <span className="font-bold text-orange-600">{report.items.length}</span> items
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addItem()}
                            className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-md flex items-center gap-3"
                          >
                            <Plus className="w-5 h-5" />
                            Add Manually
                          </motion.button>
                        </div>

                        {report.items.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-3 border-dashed border-gray-300"
                          >
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium text-lg">No items scanned yet</p>
                            <p className="text-gray-500 text-sm mt-2">Start scanning barcodes to add items</p>
                          </motion.div>
                        ) : (
                          <div className="space-y-3">
                            <AnimatePresence>
                              {report.items.map((item, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  layout
                                  className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all group"
                                >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                                      {item.item_number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 truncate">
                                        {item.material_description || 'Unknown Item'}
                                      </p>
                                      <p className="text-sm text-gray-500 truncate">
                                        Code: {item.material_code || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeItem(idx)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Item Details */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-lg">
                          <ClipboardList className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Damage Details
                          </h2>
                          <p className="text-sm text-gray-500">Provide information for each damaged item</p>
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        <AnimatePresence>
                          {report.items.map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border-2 border-gray-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-lg transition-shadow"
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                                  {item.item_number}
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg truncate">
                                  {item.material_description || 'Item Details'}
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Damage Type <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={item.damage_type}
                                    onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                  >
                                    <option value="">Select damage type</option>
                                    {DAMAGE_TYPES.map((type) => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Damage Description
                                  </label>
                                  <textarea
                                    value={item.damage_description}
                                    onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                                    placeholder="Describe the damage..."
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review & Save */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Review & Finalize
                          </h2>
                          <p className="text-sm text-gray-500">Add final notes and signatures</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Narrative Findings
                          </label>
                          <textarea
                            value={report.narrative_findings}
                            onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-sm"
                            placeholder="Describe what happened and what was found..."
                            rows={4}
                          />
                        </div>

                        {/* Summary Card */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg"
                        >
                          <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Report Summary
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { label: 'Driver', value: report.driver_name || 'N/A' },
                              { label: 'Plate No.', value: report.plate_no || 'N/A' },
                              { label: 'Total Items', value: report.items.length },
                            ].map((item, idx) => (
                              <div key={idx} className="bg-white/70 p-4 rounded-xl backdrop-blur-sm">
                                <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as Step)}
                    disabled={currentStep === 1}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all ${
                      currentStep === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:shadow-lg'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </motion.button>

                  {currentStep < 4 ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentStep((currentStep + 1) as Step)}
                      className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all shadow-lg"
                    >
                      Next Step
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetForm}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        <X className="w-5 h-5" />
                        Clear All
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveReport}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all shadow-lg disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Report
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
            >
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                    <Database className="w-6 h-6 text-orange-600" />
                  </div>
                  Barcode Database
                </h3>
                
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={barcodeSearchTerm}
                    onChange={(e) => {
                      setBarcodeSearchTerm(e.target.value)
                      loadBarcodeHistory(e.target.value)
                    }}
                    placeholder="Search barcodes, material codes, or descriptions..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Barcode History */}
                <div className="space-y-4">
                  {isLoadingHistory ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                      <p className="text-gray-600">Loading barcode history...</p>
                    </div>
                  ) : barcodeHistory.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                      <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium text-lg">No barcodes saved yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start scanning unknown barcodes to build your database</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {barcodeHistory.map((item, idx) => (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all bg-gradient-to-r from-gray-50 to-white"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                  <Barcode className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm truncate">
                                    {item.barcode}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(item.created_at || '').toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 mb-1">
                                {item.material_description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  {item.material_code}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 rounded">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Barcode Modal */}
      <AnimatePresence>
        {showSaveBarcodeModal && unknownBarcodeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSaveBarcodeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e: { stopPropagation: () => any }) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">New Barcode Detected</h3>
                  <p className="text-sm text-gray-600">Save this barcode for future use</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Barcode
                  </label>
                  <div className="px-4 py-3 bg-gray-100 rounded-xl font-mono text-lg">
                    {unknownBarcodeData.barcode}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Material Description *
                  </label>
                  <input
                    type="text"
                    value={unknownBarcodeData.material_description}
                    onChange={(e) => setUnknownBarcodeData({
                      ...unknownBarcodeData,
                      material_description: e.target.value
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500"
                    placeholder="Enter material description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={unknownBarcodeData.category}
                    onChange={(e) => setUnknownBarcodeData({
                      ...unknownBarcodeData,
                      category: e.target.value
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-orange-500/30 focus:border-orange-500"
                    placeholder="Optional: Enter category"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSaveBarcodeModal(false)
                    setUnknownBarcodeData(null)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Skip
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveBarcodeMapping}
                  disabled={saveBarcodeLoading || !unknownBarcodeData.material_description.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saveBarcodeLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}