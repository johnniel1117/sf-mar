import { supabase } from '@/lib/supabase'

export interface ManifestItem {
  item_number: number
  document_number: string
  ship_to_name: string
  total_quantity: number       // the true/full order quantity
  actual_qty_dispatch?: number // what was actually loaded/dispatched (may be less than total_quantity)
  actual_qty_by_material?: Record<string, number>
  total_cbm: number
}

export interface TripManifest {
  id?: string
  manifest_number: string
  manifest_date: string
  driver_name: string
  plate_no: string
  trucker?: string
  truck_type?: string
  time_start?: string
  time_end?: string
  remarks?: string
  container_van_no?: string
  seal_no?: string
  status: 'draft' | 'completed'
  items: ManifestItem[]
  created_at?: string
  updated_at?: string
}

export interface DocumentLookupResult {
  document_number: string
  ship_to_name: string
  total_quantity: number
  total_cbm: number
  material_counts?: Record<string, number>
}

function isBracketMaterialCode(code: string): boolean {
  const compact = String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return compact.startsWith('TD0042653') || compact.includes('BRACKET') || compact.includes('BRKT')
}

/**
 * Returns the quantity that should be treated as "actually dispatched" for
 * an item — falls back to total_quantity for older items that predate this
 * field, so short-shipment math never silently breaks on legacy manifests.
 *
 * For bracket items, a single scanned barcode can represent multiple units, so
 * the saved material breakdown is authoritative and should override stale raw
 * row counts like 1.
 */
export function getDispatchedQty(item: ManifestItem): number {
  if (item.actual_qty_dispatch != null && Number.isFinite(item.actual_qty_dispatch)) {
    return item.actual_qty_dispatch
  }

  const bracketMaterialTotal = item.actual_qty_by_material
    ? Object.entries(item.actual_qty_by_material).reduce((sum, [code, qty]) => {
        return isBracketMaterialCode(code) ? sum + (Number(qty) || 0) : sum
      }, 0)
    : 0

  if (bracketMaterialTotal > 0) return bracketMaterialTotal
  return item.total_quantity
}

export async function updateTripManifest(id: string, data: Partial<TripManifest>) {
  const { data: updated, error } = await supabase
    .from('trip_manifests')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated
}