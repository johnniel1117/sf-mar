'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users } from 'lucide-react'
import { MATCODE_CATEGORY_MAP } from '@/lib/category-mapping'

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
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadReports()
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

  const lookupBarcode = async (barcode: string) => {
    try {
      const { data, error } = await supabase
        .from('barcode_material_mapping')
        .select('*')
        .eq('barcode', barcode)
        .single()

      if (data) return data

      const materialCode = barcode
      if (MATCODE_CATEGORY_MAP[materialCode]) {
        return {
          barcode: materialCode,
          material_code: materialCode,
          material_description: materialCode,
          category: MATCODE_CATEGORY_MAP[materialCode],
        }
      }

      return null
    } catch (error) {
      console.error('Error looking up barcode:', error)
      
      if (MATCODE_CATEGORY_MAP[barcode]) {
        return {
          barcode: barcode,
          material_code: barcode,
          material_description: barcode,
          category: MATCODE_CATEGORY_MAP[barcode],
        }
      }
      return null
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
        // If barcode not found, prompt user to enter material description manually
        const description = prompt('Material not found in database. Please enter material description:')
        if (description) {
          const manualMaterial = {
            barcode: barcode,
            material_code: barcode,
            material_description: description,
            category: 'Manual Entry',
          }
          setMaterialLookup(manualMaterial)
          addItem(manualMaterial)
          setBarcodeInput('')
        }
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

  const handlePhotoUpload = async (index: number, file: File) => {
    try {
      setUploadingItemIndex(index)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reportId', report.report_number || 'temp')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const { url } = await response.json()
      updateItem(index, 'photo_url', url)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingItemIndex(null)
    }
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

  const canProceedToStep2 = () => {
    return report.driver_name && report.plate_no
  }

  const canProceedToStep3 = () => {
    return report.items.length > 0
  }

  const canProceedToStep4 = () => {
    return report.items.every(item => item.damage_type)
  }

  const generatePDF = (reportData: DamageReport) => {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    // Normalize items - handle both 'items' and 'damage_items' properties
    const items = reportData.items || ((reportData as any).damage_items || [])

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${item.item_number}</td>
        <td style="text-align: left; padding: 8px;">${item.material_description || 'Unknown'}</td>
        <td style="text-align: center; padding: 8px; font-weight: bold;">${item.serial_number || item.barcode}</td>
        <td style="text-align: left; padding: 8px;">${item.damage_type || ''}</td>
        <td style="text-align: left; padding: 8px;">${item.damage_description || ''}</td>
      </tr>
    `
      )
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Damage and Deviation Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
          }
          
          .page-container {
            max-width: 900px;
            margin: 0 auto;
          }
          
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .logo-section img {
            height: 60px;
            width: auto;
          }
          
          .warehouse-info {
            font-size: 10px;
            line-height: 1.3;
          }
          
          .warehouse-info strong {
            font-size: 12px;
          }
          
          .title-section {
            text-align: right;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .dealer-copy {
            font-size: 14px;
            font-weight: bold;
            color: #d32f2f;
            border: 2px solid #d32f2f;
            padding: 4px 8px;
            display: inline-block;
            align-self: flex-end;
          }
          
          .report-number-box {
            border: 2px solid #d32f2f;
            padding: 8px 12px;
            margin-top: 5px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            color: #000;
          }
          
          .document-header {
            text-align: center;
            margin: 15px 0;
           
            padding: 10px 0;
          }
          
          .doc-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .doc-number {
            font-size: 13px;
            font-weight: bold;
          }
          
          .info-section {
            margin-bottom: 15px;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 100px 1fr 100px 1fr;
            gap: 10px;
            margin-bottom: 8px;
            align-items: start;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 10px;
          }
          
          .info-value {
            font-size: 10px;
            border-bottom: 1px solid #000;
            padding: 2px 4px;
            min-height: 18px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border: 1px solid #000;
          }
          
          .data-table thead {
            background-color: #f0f0f0;
            border: 1px solid #000;
          }
          
          .data-table th {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
          }
          
          .data-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 9px;
          }
          
          .footer-info {
            margin-top: 15px;
            padding: 10px;
            border: 1px solid #000;
            text-align: right;
            font-size: 11px;
            font-weight: bold;
          }
          
          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
          }
          
          .signature-box {
            text-align: center;
            font-size: 10px;
          }
          
          .signature-line {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .page-container {
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Header Section -->
          <div class="header-section">
            <div class="logo-section">
              <img src="https://brandlogos.net/wp-content/uploads/2025/06/sf_express-logo_brandlogos.net_shwfy-512x512.png" alt="SF Express Logo" />
              <div class="warehouse-info">
                <strong>SF EXPRESS WAREHOUSE</strong><br/>
                UPPER TINGUB, MANDAUE, CEBU<br/>
                Damage Report Section
              </div>
            </div>
            <div class="title-section">
              <div class="dealer-copy">${reportData.report_number}</div>
            </div>
          </div>

          <!-- Document Header -->
          <div class="document-header">
            <div class="doc-title">DAMAGE AND DEVIATION REPORT</div>
           
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Report Date</div>
              <div class="info-value">${reportData.report_date}</div>
              <div class="info-label">Driver Name</div>
              <div class="info-value">${reportData.driver_name}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Plate No.</div>
              <div class="info-value">${reportData.plate_no}</div>
              <div class="info-label">Seal No.</div>
              <div class="info-value">${reportData.seal_no}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Container No.</div>
              <div class="info-value">${reportData.container_no}</div>
            </div>
          </div>

          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">NO.</th>
                <th style="width: 250px;">MATERIAL DESCRIPTION</th>
                <th style="width: 150px;">SERIAL NO.</th>
                <th style="width: 120px;">DAMAGE TYPE</th>
                <th style="width: 200px;">DAMAGE DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Footer Info -->
          <div class="footer-info">
            <div>TOTAL ITEMS: ${items.length}</div>
          </div>

          <!-- Narrative & Actions -->
          <div class="info-section" style="margin-top: 15px;">
            <div class="info-row" style="grid-template-columns: 1fr;">
              <div><strong>Narrative Findings:</strong></div>
            </div>
            <div style="padding: 8px; border: 1px solid #000; min-height: 50px; margin-bottom: 10px;">
              ${reportData.narrative_findings || 'N/A'}
            </div>
            
            <div class="info-row" style="grid-template-columns: 1fr;">
              <div><strong>Actions Required:</strong></div>
            </div>
            <div style="padding: 8px; border: 1px solid #000; min-height: 40px;">
              ${reportData.actions_required || 'N/A'}
            </div>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;">${reportData.prepared_by || '_________________'}</div>
              <div style="margin-top: 5px; ">Prepared By</div>
            </div>
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;>${reportData.noted_by || '_________________'}</div>
              <div style="margin-top: 5px;">Noted By (Guard)</div>
            </div>
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;>${reportData.acknowledged_by || '_________________'}</div>
              <div style="margin-top: 5px;">Acknowledged By</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const steps = [
    { number: 1, title: 'Truck Info', icon: Truck, description: 'Vehicle & shipment details' },
    { number: 2, title: 'Scan Items', icon: Barcode, description: 'Scan damaged items' },
    { number: 3, title: 'Details', icon: ClipboardList, description: 'Damage information' },
    { number: 4, title: 'Review', icon: Users, description: 'Finalize & save' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SF</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SF EXPRESS</h1>
          </div>
          <p className="text-gray-600">Damage & Deviation Report System</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Create Report
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-orange-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Saved Reports
          </button>
        </div>

        {/* Create Report Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                          currentStep === step.number
                            ? 'bg-orange-600 text-white shadow-lg scale-110'
                            : currentStep > step.number
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.number ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <step.icon className="w-6 h-6" />
                        )}
                      </div>
                      <p className={`text-xs font-semibold mt-2 ${
                        currentStep === step.number ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step Content */}
              <div className="mt-8">
                {/* Step 1: Truck Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Vehicle & Shipment Information</h2>
                        <p className="text-sm text-gray-500">Enter the truck and delivery details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Report Date
                        </label>
                        <input
                          type="date"
                          value={report.report_date}
                          onChange={(e) => setReport({ ...report, report_date: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Driver Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={report.driver_name}
                          onChange={(e) => setReport({ ...report, driver_name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Driver's name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plate No. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={report.plate_no}
                          onChange={(e) => setReport({ ...report, plate_no: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Plate number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seal No.
                        </label>
                        <input
                          type="text"
                          value={report.seal_no}
                          onChange={(e) => setReport({ ...report, seal_no: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Seal number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Container No.
                        </label>
                        <input
                          type="text"
                          value={report.container_no}
                          onChange={(e) => setReport({ ...report, container_no: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Container number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Scan Items */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Barcode className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Scan Damaged Items</h2>
                        <p className="text-sm text-gray-500">Scan barcodes to add items to the report</p>
                      </div>
                    </div>

                    {/* Barcode Scanner */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
                      <label className="block text-lg font-semibold mb-3 flex items-center gap-2">
                        <Barcode className="w-5 h-5" />
                        Scan Barcode
                      </label>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeInput}
                        placeholder="Scan or type barcode and press Enter..."
                        className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                        autoFocus
                      />
                      {materialLookup.material_description && (
                        <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <p className="font-medium">
                            Found: {materialLookup.material_description} ({materialLookup.category})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Items List */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          Scanned Items ({report.items.length})
                        </h3>
                        <button
                          onClick={() => addItem()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Manually
                        </button>
                      </div>

                      {report.items.length === 0 ? (
                        <div className="py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">No items scanned yet</p>
                          <p className="text-gray-500 text-sm mt-1">Scan a barcode or click "Add Manually"</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {report.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                  {item.item_number}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{item.material_description || 'Unknown Item'}</p>
                                  <p className="text-xs text-gray-500">Code: {item.material_code || 'N/A'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(idx)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Damage Details</h2>
                        <p className="text-sm text-gray-500">Provide information for each damaged item</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {report.items.map((item, idx) => (
                        <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {item.item_number}
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {item.material_description || 'Item Details'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Damage Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={item.damage_type}
                                onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              >
                                <option value="">Select type</option>
                                {DAMAGE_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Damage Description
                              </label>
                              <textarea
                                value={item.damage_description}
                                onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                                placeholder="Describe the damage..."
                                rows={2}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <Camera className="w-4 h-4" />
                                Photo Evidence
                              </label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handlePhotoUpload(idx, e.target.files[0])
                                    }
                                  }}
                                  disabled={uploadingItemIndex === idx}
                                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                />
                                {item.photo_url && (
                                  <a
                                    href={item.photo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
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
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Review & Finalize</h2>
                        <p className="text-sm text-gray-500">Add final notes and signatures</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Narrative Findings
                        </label>
                        <textarea
                          value={report.narrative_findings}
                          onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Describe what happened and what was found..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Actions Required
                        </label>
                        <textarea
                          value={report.actions_required}
                          onChange={(e) => setReport({ ...report, actions_required: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Specify what actions need to be taken..."
                          rows={2}
                        />
                      </div>



                      {/* Summary */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
                        <h3 className="font-bold text-gray-900 mb-3">Report Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Driver:</span>
                            <span className="ml-2 font-semibold text-gray-900">{report.driver_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Plate No:</span>
                            <span className="ml-2 font-semibold text-gray-900">{report.plate_no}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Items:</span>
                            <span className="ml-2 font-semibold text-gray-900">{report.items.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as Step)}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
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
                        alert('Please fill in Serial Number and Damage Type for all items')
                        return
                      }
                      setCurrentStep((currentStep + 1) as Step)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={resetForm}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      <X className="w-5 h-5" />
                      Clear
                    </button>
                    <button
                      onClick={saveReport}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400"
                    >
                      <Save className="w-5 h-5" />
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
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Saved Reports
            </h3>

            {savedReports.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">No reports saved yet</p>
                <p className="text-gray-500 text-sm mt-2">Create your first damage report to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {savedReports.map((savedReport) => (
                  <div
                    key={savedReport.id}
                    className="p-5 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {savedReport.report_number || savedReport.id}
                            </h4>
                            {/* <p className="text-sm text-gray-600">
                              RCV: {savedReport.rcv_control_no}
                            </p> */}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mt-3">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{((savedReport as any).damage_items || []).length}</span> items
                          </span>
                          <span>•</span>
                          <span>{new Date(savedReport.report_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePDF(savedReport)}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                              try {
                                const { error: itemsError } = await supabase
                                  .from('damage_items')
                                  .delete()
                                  .eq('damage_report_id', savedReport.id)
                                
                                if (itemsError) throw itemsError

                                const { error: reportError } = await supabase
                                  .from('damage_reports')
                                  .delete()
                                  .eq('id', savedReport.id)
                                
                                if (reportError) throw reportError

                                alert('Report deleted successfully!')
                                loadReports()
                              } catch (error) {
                                console.error('Error deleting report:', error)
                                alert('Error deleting report')
                              }
                            }
                          }}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
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
    </div>
  )
}