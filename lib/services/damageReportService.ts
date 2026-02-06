import { createClient } from '@supabase/supabase-js'
import { getMaterialInfoFromMatcode } from '@/lib/category-mapping'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export interface DamageItem {
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

export interface DamageReport {
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

export class DamageReportService {
  // Load all reports
  static async loadReports(): Promise<DamageReport[]> {
    try {
      const { data, error } = await supabase
        .from('damage_reports')
        .select('*, damage_items(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    } catch (error) {
      console.error('Error loading reports:', error)
      throw error
    }
  }

  // Lookup barcode
  static async lookupBarcode(barcode: string): Promise<any> {
    try {
      const cleanBarcode = barcode.trim()
      
      // Exact match
      const { data: exactData } = await supabase
        .from('barcode_material_mapping')
        .select('*')
        .eq('barcode', cleanBarcode)
        .single()

      if (exactData) return exactData

      // Extract material code
      let materialCode = cleanBarcode
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/)
      
      if (materialCodeMatch) {
        materialCode = materialCodeMatch[1]
        const { data: partialData } = await supabase
          .from('barcode_material_mapping')
          .select('*')
          .eq('barcode', materialCode)
          .single()

        if (partialData) return partialData
      }

      // Use material mapping
      const materialInfo = getMaterialInfoFromMatcode(materialCode)
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category,
        }
      }

      // Try original barcode
      const originalMaterialInfo = getMaterialInfoFromMatcode(cleanBarcode)
      if (originalMaterialInfo.model !== cleanBarcode) {
        return {
          barcode: cleanBarcode,
          material_code: cleanBarcode,
          material_description: originalMaterialInfo.model,
          category: originalMaterialInfo.category,
        }
      }

      return null
    } catch (error) {
      console.error('Error looking up barcode:', error)
      
      // Fallback
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
      
      return null
    }
  }

  // Check serial number
  static async checkSerialNumber(serialNumber: string): Promise<any> {
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

  // Save report
  static async saveReport(report: DamageReport): Promise<void> {
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
    } catch (error) {
      console.error('Error saving report:', error)
      throw error
    }
  }

  // Delete report
  static async deleteReport(reportId: string): Promise<void> {
    try {
      const { error: itemsError } = await supabase
        .from('damage_items')
        .delete()
        .eq('damage_report_id', reportId)
      
      if (itemsError) throw itemsError

      const { error: reportError } = await supabase
        .from('damage_reports')
        .delete()
        .eq('id', reportId)
      
      if (reportError) throw reportError
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }

  // Upload photo
  static async uploadPhoto(file: File, reportId: string): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('reportId', reportId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const { url } = await response.json()
      return url
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    }
  }
}