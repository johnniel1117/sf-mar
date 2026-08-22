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

/**
 * Returns the quantity that should be treated as "actually dispatched" for
 * an item — falls back to total_quantity for older items that predate this
 * field, so short-shipment math never silently breaks on legacy manifests.
 */
export function getDispatchedQty(item: ManifestItem): number {
  return item.actual_qty_dispatch ?? item.total_quantity
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