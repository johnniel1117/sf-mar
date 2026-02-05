'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, Trash2, Check } from 'lucide-react'
import { MATCODE_CATEGORY_MAP } from '@/lib/category-mapping'

interface DamageItem {
  id?: string
  item_number: number
  barcode: string
  serial_number: string
  material_code: string
  material_description: string
  category: string
  damage_type: string
  damage_description: string
  photo_url?: string
  remarks: string
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

export default function DamageReportForm() {
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
        alert('Barcode not found. Please add material details manually.')
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
      category: material?.category || '',
      damage_type: '',
      damage_description: '',
      remarks: '',
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
          category: item.category,
          damage_type: item.damage_type,
          damage_description: item.damage_description,
          remarks: item.remarks,
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
  }

  const generatePDF = (reportData: DamageReport) => {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    const itemsHtml = reportData.items
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${item.item_number}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.serial_number}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.material_description}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.damage_type}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.remarks}</td>
      </tr>
    `
      )
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Damage and Deviation Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .report-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          .info-section { margin-bottom: 20px; }
          .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f0f0f0; padding: 8px; border: 1px solid #ccc; text-align: left; }
          td { padding: 8px; border: 1px solid #ccc; }
          .signature-line { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; }
          .signature { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SF EXPRESS</div>
          <div class="report-title">Inventory Damage and Deviation Report</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div><div class="info-label">RCV Control No.:</div><div>${reportData.rcv_control_no}</div></div>
            <div><div class="info-label">Report Date:</div><div>${reportData.report_date}</div></div>
          </div>
          <div class="info-row">
            <div><div class="info-label">Seal No.:</div><div>${reportData.seal_no}</div></div>
            <div><div class="info-label">Driver Name:</div><div>${reportData.driver_name}</div></div>
          </div>
          <div class="info-row">
            <div><div class="info-label">Plate No.:</div><div>${reportData.plate_no}</div></div>
            <div><div class="info-label">Container No.:</div><div>${reportData.container_no}</div></div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">Narrative Findings:</div>
          <div>${reportData.narrative_findings}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Serial Number</th>
              <th>Material Description</th>
              <th>Damage Type</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="info-section">
          <div class="info-label">Actions Required:</div>
          <div>${reportData.actions_required}</div>
        </div>

        <div class="signature-line">
          <div class="signature">
            <div>${reportData.prepared_by}</div>
            <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 10px;">Prepared By</div>
          </div>
          <div class="signature">
            <div>${reportData.noted_by}</div>
            <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 10px;">Noted By (Guard)</div>
          </div>
          <div class="signature">
            <div>${reportData.acknowledged_by}</div>
            <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 10px;">Acknowledged By</div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
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
                ? 'bg-blue-600 text-white shadow'
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
                ? 'bg-blue-600 text-white shadow'
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
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                Report Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RCV Control No. *
                  </label>
                  <input
                    type="text"
                    value={report.rcv_control_no}
                    onChange={(e) => setReport({ ...report, rcv_control_no: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter control number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={report.report_date}
                    onChange={(e) => setReport({ ...report, report_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={report.driver_name}
                    onChange={(e) => setReport({ ...report, driver_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Driver's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seal No.
                  </label>
                  <input
                    type="text"
                    value={report.seal_no}
                    onChange={(e) => setReport({ ...report, seal_no: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seal number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plate No.
                  </label>
                  <input
                    type="text"
                    value={report.plate_no}
                    onChange={(e) => setReport({ ...report, plate_no: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Plate number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Container No.
                  </label>
                  <input
                    type="text"
                    value={report.container_no}
                    onChange={(e) => setReport({ ...report, container_no: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Container number"
                  />
                </div>
              </div>
            </div>

            {/* Barcode Scanner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <label className="block text-lg font-semibold mb-3 flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                Scan Barcode to Add Item
              </label>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeInput}
                placeholder="Scan or type barcode and press Enter..."
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              {materialLookup.material_description && (
                <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <p className="font-medium">
                    Found: {materialLookup.material_description} ({materialLookup.category})
                  </p>
                </div>
              )}
            </div>

            {/* Damage Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  Damaged Items ({report.items.length})
                </h3>
                <button
                  onClick={() => addItem()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {report.items.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No items added yet</p>
                  <p className="text-gray-500 text-sm mt-1">Scan a barcode or click "Add Item" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.items.map((item, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {item.item_number}
                          </div>
                          <h4 className="font-semibold text-gray-900">Item #{item.item_number}</h4>
                        </div>
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Serial Number *
                          </label>
                          <input
                            type="text"
                            value={item.serial_number}
                            onChange={(e) => updateItem(idx, 'serial_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Material Description
                          </label>
                          <input
                            type="text"
                            value={item.material_description}
                            onChange={(e) => updateItem(idx, 'material_description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Description"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Damage Type *
                          </label>
                          <select
                            value={item.damage_type}
                            onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateItem(idx, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Category"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Damage Description
                          </label>
                          <textarea
                            value={item.damage_description}
                            onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                            placeholder="Describe the damage in detail..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {item.photo_url && (
                              <a
                                href={item.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                              >
                                View Photo
                              </a>
                            )}
                          </div>
                          {uploadingItemIndex === idx && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">Uploading photo...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Findings & Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Narrative Findings
                  </label>
                  <textarea
                    value={report.narrative_findings}
                    onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Specify what actions need to be taken..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prepared By
                    </label>
                    <input
                      type="text"
                      value={report.prepared_by}
                      onChange={(e) => setReport({ ...report, prepared_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Noted By (Guard)
                    </label>
                    <input
                      type="text"
                      value={report.noted_by}
                      onChange={(e) => setReport({ ...report, noted_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Guard name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acknowledged By
                    </label>
                    <input
                      type="text"
                      value={report.acknowledged_by}
                      onChange={(e) => setReport({ ...report, acknowledged_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Supervisor name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Form
              </button>
              <button
                onClick={saveReport}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Report'}
              </button>
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
                    className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {savedReport.report_number || savedReport.id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              RCV: {savedReport.rcv_control_no}
                            </p>
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
                      <button
                        onClick={() => generatePDF(savedReport)}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
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