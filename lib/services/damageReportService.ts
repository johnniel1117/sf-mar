import { createClient } from '@supabase/supabase-js'
import { getMaterialInfoFromMatcode } from '@/lib/category-mapping'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export interface DamageItem {
  id?: string
  item_number: number
  barcode: string
  material_code: string
  material_description: string
  category?: string
  damage_type: string
  damage_description: string
  photo_url?: string
  mapping_id?: string
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

  // Lookup barcode with category support
  static async lookupBarcode(barcode: string): Promise<any> {
    try {
      const cleanBarcode = barcode.trim()
      
      // 1. Check serial_material_mapping first (user-defined mappings)
      const { data: serialMappingData } = await supabase
        .from('serial_material_mapping')
        .select('*')
        .eq('serial_number', cleanBarcode)
        .single()

      if (serialMappingData) {
        // Update usage count
        await supabase
          .from('serial_material_mapping')
          .update({
            usage_count: (serialMappingData.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', serialMappingData.id)

        return {
          barcode: cleanBarcode,
          material_code: serialMappingData.material_code || cleanBarcode,
          material_description: serialMappingData.material_description,
          category: serialMappingData.category || 'Manual Entry',
          mapping_id: serialMappingData.id,
          source: 'serial_mapping',
        }
      }
      
      // 2. Check barcode_material_mapping (system mappings)
      const { data: barcodeData } = await supabase
        .from('barcode_material_mapping')
        .select('*')
        .eq('barcode', cleanBarcode)
        .single()

      if (barcodeData) return barcodeData

      // 3. Extract material code and try partial match
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

      // 4. Use material mapping from category-mapping
      const materialInfo = getMaterialInfoFromMatcode(materialCode)
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category || 'Unknown',
          source: 'category_mapping',
        }
      }

      // 5. Try original barcode with category-mapping
      const originalMaterialInfo = getMaterialInfoFromMatcode(cleanBarcode)
      if (originalMaterialInfo.model !== cleanBarcode) {
        return {
          barcode: cleanBarcode,
          material_code: cleanBarcode,
          material_description: originalMaterialInfo.model,
          category: originalMaterialInfo.category || 'Unknown',
          source: 'category_mapping',
        }
      }

      return null
    } catch (error) {
      console.error('Error looking up barcode:', error)
      
      // Fallback: try category-mapping
      const cleanBarcode = barcode.trim()
      const materialCodeMatch = cleanBarcode.match(/^([A-Z0-9]{8,12})/)
      const materialCode = materialCodeMatch ? materialCodeMatch[1] : cleanBarcode
      
      const materialInfo = getMaterialInfoFromMatcode(materialCode)
      if (materialInfo.model !== materialCode) {
        return {
          barcode: cleanBarcode,
          material_code: materialCode,
          material_description: materialInfo.model,
          category: materialInfo.category || 'Unknown',
          source: 'fallback',
        }
      }
      
      return null
    }
  }

  // Save new material mapping
  static async saveMaterialMapping(
    serialNumber: string, 
    materialDescription: string, 
    category: string = 'Manual Entry'
  ) {
    try {
      const { data, error } = await supabase
        .from('serial_material_mapping')
        .upsert({
          serial_number: serialNumber.trim(),
          material_code: serialNumber.trim(),
          material_description: materialDescription.trim(),
          category: category.trim(),
          usage_count: 1,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'serial_number',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving material mapping:', error)
      throw error
    }
  }

  // Update material mapping
  static async updateMaterialMapping(id: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('serial_material_mapping')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating material mapping:', error)
      throw error
    }
  }

  // Delete material mapping
  static async deleteMaterialMapping(id: string) {
    try {
      const { error } = await supabase
        .from('serial_material_mapping')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting material mapping:', error)
      throw error
    }
  }

  // Get material mappings
  static async getMaterialMappings(searchTerm?: string) {
    try {
      let query = supabase
        .from('serial_material_mapping')
        .select('*')
        .order('last_used_at', { ascending: false })

      if (searchTerm && searchTerm.trim()) {
        query = query.or(`serial_number.ilike.%${searchTerm.trim()}%,material_description.ilike.%${searchTerm.trim()}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching material mappings:', error)
      throw error
    }
  }

  // Check serial number
  static async checkSerialNumber(serialNumber: string): Promise<any> {
    if (!serialNumber.trim()) return null
    
    try {
      const { data, error } = await supabase
        .from('damage_items')
        .select('*')
        .eq('barcode', serialNumber.trim())
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

  // Save report with category support
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
          material_code: item.material_code,
          material_description: item.material_description,
          category: item.category || null,
          damage_type: item.damage_type,
          damage_description: item.damage_description,
          mapping_id: item.mapping_id || null,
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