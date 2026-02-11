import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'

export const addItem = (report: DamageReport, material?: any): DamageReport => {
  const newItem: DamageItem & { mapping_id?: string } = {
    item_number: report.items.length + 1,
    barcode: material?.barcode || '',
    material_code: material?.material_code || '',
    material_description: material?.material_description || '',
    damage_type: '',
    damage_description: '',
    mapping_id: material?.mapping_id || null,
  }
  return {
    ...report,
    items: [...report.items, newItem],
  }
}

export const updateItem = (report: DamageReport, index: number, field: string, value: any): DamageReport => {
  const updatedItems = [...report.items]
  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value,
  }
  return {
    ...report,
    items: updatedItems,
  }
}

export const removeItem = (report: DamageReport, index: number): DamageReport => {
  const updatedItems = report.items.filter((_, i) => i !== index)
  updatedItems.forEach((item, i) => {
    item.item_number = i + 1
  })
  return {
    ...report,
    items: updatedItems,
  }
}

export const canProceedToStep2 = (report: DamageReport): boolean => {
  return !!(report.driver_name && report.plate_no)
}

export const canProceedToStep3 = (report: DamageReport): boolean => {
  return report.items.length > 0
}

export const canProceedToStep4 = (report: DamageReport): boolean => {
  return report.items.every((item) => item.damage_type)
}
