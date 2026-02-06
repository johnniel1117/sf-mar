'use client'

import React from "react"
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Download, Camera, Plus, X, Barcode, AlertCircle, Save, FileText, CheckCircle2, Trash2, ChevronRight, ChevronLeft, Truck, ClipboardList, Users, Search, RefreshCw } from 'lucide-react'
import { MATCODE_CATEGORY_MAP, getMaterialInfoFromMatcode } from '@/lib/category-mapping'
import Navbar from '@/components/Navbar'

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

interface SerialMapping {
  id: string
  serial_number: string
  material_code: string
  material_description: string
  category: string
  usage_count: number
  last_used_at: string
  created_at: string
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
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'mappings'>('create')
  const [serialWarnings, setSerialWarnings] = useState<Record<number, boolean>>({})
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [serialMappings, setSerialMappings] = useState<SerialMapping[]>([])
  const [mappingsLoading, setMappingsLoading] = useState(true)
  const [searchMappings, setSearchMappings] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
    if (activeTab === 'mappings') {
      loadSerialMappings()
    }
  }, [activeTab])

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

  const loadSerialMappings = async () => {
    try {
      setMappingsLoading(true)
      const { data, error } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .order('last_used_at', { ascending: false })

      if (error) throw error
      setSerialMappings(data || [])
    } catch (error) {
      console.error('Error loading serial mappings:', error)
    } finally {
      setMappingsLoading(false)
    }
  }

  const saveSerialMaterialMapping = async (
    serialNumber: string, 
    materialDescription: string, 
    materialCode: string
  ) => {
    try {
      const cleanSerial = serialNumber.trim();
      const cleanDescription = materialDescription.trim();
      
      // Check if mapping already exists
      const { data: existingMapping, error: checkError } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .eq('serial_number', cleanSerial)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking serial mapping:', checkError);
      }

      if (existingMapping) {
        // Update existing mapping
        const { error: updateError } = await supabase
          .from('serial_material_mapping')
          .update({
            material_description: cleanDescription,
            material_code: materialCode || existingMapping.material_code,
            usage_count: existingMapping.usage_count + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('serial_number', cleanSerial);

        if (updateError) throw updateError;
      } else {
        // Create new mapping
        const { error: insertError } = await supabase
          .from('serial_material_mapping')
          .insert([
            {
              serial_number: cleanSerial,
              material_code: materialCode || cleanSerial,
              material_description: cleanDescription,
              category: 'Manual Entry',
              usage_count: 1,
              last_used_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error saving serial material mapping:', error);
      return false;
    }
  };

  const updateMaterialFromSerialMapping = async (serialNumber: string) => {
    if (!serialNumber.trim()) return null;
    
    try {
      const { data, error } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .eq('serial_number', serialNumber.trim())
        .single();

      if (error) {
        return null;
      }

      if (data) {
        // Update usage count
        await supabase
          .from('serial_material_mapping')
          .update({
            usage_count: data.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('serial_number', serialNumber.trim());

        return {
          material_code: data.material_code || serialNumber,
          material_description: data.material_description,
          category: data.category || 'Manual Entry',
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching serial mapping:', error);
      return null;
    }
  };

  const deleteSerialMapping = async (id: string) => {
    try {
      const { error } = await supabase
        .from('serial_material_mapping')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSerialMappings();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping');
    }
  };

  const lookupBarcode = async (barcode: string) => {
    try {
      const cleanBarcode = barcode.trim();
      
      // FIRST: Check if this is a serial number with saved material mapping
      const { data: serialMapping, error: serialError } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .eq('serial_number', cleanBarcode)
        .single();

      if (serialMapping && !serialError) {
        console.log('Found saved serial mapping:', serialMapping);
        return {
          barcode: cleanBarcode,
          material_code: serialMapping.material_code || cleanBarcode,
          material_description: serialMapping.material_description,
          category: serialMapping.category || 'Manual Entry',
          fromSerialMapping: true,
        };
      }

      // If not found in serial mapping, proceed with original lookup logic
      const { data: exactData, error: exactError } = await supabase
        .from('barcode_material_mapping')
        .select('*')
        .eq('barcode', cleanBarcode)
        .single()

      if (exactData) return exactData;

      let materialCode = cleanBarcode;
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/);
      if (materialCodeMatch) {
        materialCode = materialCodeMatch[1];
        
        const { data: partialData, error: partialError } = await supabase
          .from('barcode_material_mapping')
          .select('*')
          .eq('barcode', materialCode)
          .single()

        if (partialData) return partialData;
      }

      const materialInfo = getMaterialInfoFromMatcode(materialCode);
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category,
        }
      }

      const originalMaterialInfo = getMaterialInfoFromMatcode(cleanBarcode);
      if (originalMaterialInfo.model !== cleanBarcode) {
        return {
          barcode: cleanBarcode,
          material_code: cleanBarcode,
          material_description: originalMaterialInfo.model,
          category: originalMaterialInfo.category,
        }
      }

      return null;
    } catch (error) {
      console.error('Error looking up barcode:', error);
      const cleanBarcode = barcode.trim();
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/);
      const materialCode = materialCodeMatch ? materialCodeMatch[1] : cleanBarcode;
      
      const materialInfo = getMaterialInfoFromMatcode(materialCode);
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category,
        }
      }
      
      const originalMaterialInfo = getMaterialInfoFromMatcode(cleanBarcode);
      if (originalMaterialInfo.model !== cleanBarcode) {
        return {
          barcode: cleanBarcode,
          material_code: cleanBarcode,
          material_description: originalMaterialInfo.model,
          category: originalMaterialInfo.category,
        }
      }
      
      return null;
    }
  }

  const checkSerialNumber = async (serialNumber: string) => {
    if (!serialNumber.trim()) return null
    
    try {
      const { data, error } = await supabase
        .from('damage_items')
        .select('*')
        .eq('serial_number', serialNumber.trim())
        .not('damage_report_id', 'is', null)

      if (error) throw error
      
      if (data && data.length > 0) {
        return {
          exists: true,
          reports: data.map(item => ({
            reportId: item.damage_report_id,
            itemNumber: item.item_number,
          }))
        }
      }
      
      return { exists: false }
    } catch (error) {
      console.error('Error checking serial number:', error)
      return { exists: false }
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
        const description = prompt('Material not found in database. Please enter material description:')
        if (description) {
          await saveSerialMaterialMapping(barcode, description, barcode)
          
          const manualMaterial = {
            barcode: barcode,
            material_code: barcode,
            material_description: description,
            category: 'Manual Entry',
            fromSerialMapping: true,
          }
          setMaterialLookup(manualMaterial)
          addItem(manualMaterial)
          setBarcodeInput('')
        }
      }
    }
  }

  const addItem = (material?: any) => {
    const serialNumber = material?.barcode ? extractSerialNumber(material.barcode) : '';
    
    const newItem: DamageItem = {
      item_number: report.items.length + 1,
      barcode: material?.barcode || '',
      serial_number: serialNumber,
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

  const updateItem = async (index: number, field: string, value: any) => {
    const updatedItems = [...report.items]
    
    if (field === 'serial_number' && value.trim()) {
      const mapping = await updateMaterialFromSerialMapping(value);
      if (mapping) {
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
          material_description: mapping.material_description,
          material_code: mapping.material_code,
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
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

  const extractSerialNumber = (barcode: string): string => {
    const cleanBarcode = barcode.trim();
    if (cleanBarcode.length >= 10 && /[A-Za-z]/.test(cleanBarcode) && /\d/.test(cleanBarcode)) {
      return cleanBarcode;
    }
    return cleanBarcode;
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

    const items = reportData.items || ((reportData as any).damage_items || [])

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${item.item_number}</td>
        <td style="text-align: center; padding: 8px;">${item.material_description || 'Unknown'}</td>
        <td style="text-align: center; padding: 8px; font-weight: bold;">${item.serial_number || item.barcode}</td>
        <td style="text-align: center; padding: 8px;">${item.damage_type || ''}</td>
        <td style="text-align: center; padding: 8px;">${item.damage_description || ''}</td>
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
          }
          
          .dealer-copy {
            font-size: 14px;
            font-weight: bold;
            align-items: center;
            color: #d32f2f;
            border: 2px solid #d32f2f;
            padding: 4px 8px;
            display: inline-block;
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
            
            text-align: right;
            font-size: 11px;
            font-weight: bold;
          }
          
          .signature-section {
            margin-top: 25px;
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
            
            
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;>${reportData.prepared_by || ''}</div>
              <div style="margin-top: 5px; ">Prepared By</div>
            </div>
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;>${reportData.noted_by || ''}</div>
              <div style="margin-top: 5px;">Noted By (Guard)</div>
            </div>
            <div class="signature-box">
              <div style="min-height: 50px; margin-bottom: 10px;"></div>
              <div class="signature-line" style="font-weight: bold;>${reportData.acknowledged_by || ''}</div>
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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredMappings = serialMappings.filter(mapping =>
    mapping.serial_number.toLowerCase().includes(searchMappings.toLowerCase()) ||
    mapping.material_description.toLowerCase().includes(searchMappings.toLowerCase()) ||
    mapping.material_code.toLowerCase().includes(searchMappings.toLowerCase())
  )

  const SerialMappingManager = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Serial Number Mappings</h3>
          <p className="text-gray-600">Manually entered material descriptions saved for future scans</p>
        </div>
        <button
          onClick={loadSerialMappings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchMappings}
            onChange={(e) => setSearchMappings(e.target.value)}
            placeholder="Search by serial number or material description..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {mappingsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mappings...</p>
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No serial number mappings found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchMappings ? 'Try a different search term' : 'Manual entries will appear here after saving'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Serial Number</th>
                <th className="text-left p-3 font-semibold text-gray-700">Material Description</th>
                <th className="text-left p-3 font-semibold text-gray-700">Material Code</th>
                <th className="text-left p-3 font-semibold text-gray-700">Usage Count</th>
                <th className="text-left p-3 font-semibold text-gray-700">Last Used</th>
                <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm font-bold">{mapping.serial_number}</td>
                  <td className="p-3 font-medium">{mapping.material_description}</td>
                  <td className="p-3 font-mono text-sm">{mapping.material_code}</td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {mapping.usage_count}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(mapping.last_used_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {deleteConfirm === mapping.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteSerialMapping(mapping.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(mapping.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

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
            <FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
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
            <Download className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Saved Reports</span>
            <span className="sm:hidden">Saved</span>
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
              activeTab === 'mappings'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Serial Mappings</span>
            <span className="sm:hidden">Mappings</span>
          </button>
        </div>

        {/* Create Report Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-6 sm:mb-8">
                {steps.map((step, index) => (
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
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                        ) : (
                          <step.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
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
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 sm:h-1 flex-1 transition-all duration-300 self-start mt-5 sm:mt-6 lg:mt-7 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step Content */}
              <div className="mt-8">
                {/* Step 1: Truck Info */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
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
                        <Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Scan Damaged Items</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Scan barcodes to add items to the report</p>
                      </div>
                    </div>

                    {/* Barcode Scanner */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 sm:p-6 text-white">
                      <label className="block text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300"
                        autoFocus
                      />
                      {materialLookup.material_description && (
                        <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="font-medium text-sm break-words">
                            Found: {materialLookup.material_description} ({materialLookup.category})
                            {materialLookup.fromSerialMapping && ' (From saved mapping)'}
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
                        <button
                          onClick={() => addItem()}
                          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Manually
                        </button>
                      </div>

                      {report.items.length === 0 ? (
                        <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium text-sm sm:text-base">No items scanned yet</p>
                          <p className="text-gray-500 text-xs sm:text-sm mt-1">Scan a barcode or click "Add Manually"</p>
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
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
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
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                Serial Number
                              </label>
                              <input
                                type="text"
                                value={item.serial_number}
                                onChange={async (e) => {
                                  const newSerialNumber = e.target.value
                                  await updateItem(idx, 'serial_number', newSerialNumber)
                                  
                                  if (newSerialNumber.trim()) {
                                    const result = await checkSerialNumber(newSerialNumber)
                                    if (result?.exists) {
                                      setSerialWarnings(prev => ({
                                        ...prev,
                                        [idx]: true
                                      }))
                                    } else {
                                      setSerialWarnings(prev => ({
                                        ...prev,
                                        [idx]: false
                                      }))
                                    }
                                  } else {
                                    setSerialWarnings(prev => ({
                                      ...prev,
                                      [idx]: false
                                    }))
                                  }
                                }}
                                placeholder="Enter serial number..."
                                className={`w-full px-2 sm:px-3 py-2 border-2 rounded-lg text-xs sm:text-sm focus:ring-2 focus:border-transparent transition-all ${
                                  serialWarnings[idx] 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-orange-500'
                                }`}
                              />
                              {serialWarnings[idx] && (
                                <div className="mt-2 p-2 sm:p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <p className="font-medium text-xs sm:text-sm text-red-700 break-words">
                                    ⚠️ Warning: This serial number already exists in another damage report!
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                Material Description
                              </label>
                              <input
                                type="text"
                                value={item.material_description}
                                onChange={(e) => updateItem(idx, 'material_description', e.target.value)}
                                placeholder="Enter material description..."
                                className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
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
                                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
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

                            {/* Save Mapping Button */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (item.serial_number && item.material_description) {
                                    const confirmSave = window.confirm(
                                      `Save this material description for serial number ${item.serial_number}?\n\n` +
                                      `Material: ${item.material_description}\n` +
                                      `Serial: ${item.serial_number}\n\n` +
                                      `This will be used for future scans of this serial number.`
                                    );
                                    
                                    if (confirmSave) {
                                      const saved = await saveSerialMaterialMapping(
                                        item.serial_number,
                                        item.material_description,
                                        item.material_code
                                      );
                                      
                                      if (saved) {
                                        alert('Material description saved for future use!');
                                      } else {
                                        alert('Failed to save mapping. Please try again.');
                                      }
                                    }
                                  } else {
                                    alert('Please enter both serial number and material description.');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <Save className="w-3 h-3" />
                                Save this material description for future scans
                              </button>
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
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
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

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Actions Required
                        </label>
                        <textarea
                          value={report.actions_required}
                          onChange={(e) => setReport({ ...report, actions_required: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          placeholder="Specify what actions need to be taken..."
                          rows={2}
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
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={resetForm}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      Clear
                    </button>
                    <button
                      onClick={saveReport}
                      disabled={isLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg disabled:bg-gray-400"
                    >
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <Download className="w-5 h-5" />
              Saved Reports
            </h3>

            {savedReports.length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
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
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                          onClick={() => generatePDF(savedReport)}
                          className="w-full sm:w-auto px-3 sm:px-5 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">PDF</span>
                          <span className="sm:hidden">Download</span>
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
                          className="w-full sm:w-auto px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* Serial Mappings Tab */}
        {activeTab === 'mappings' && (
          <SerialMappingManager />
        )}
      </div>
    </div>
  )
}