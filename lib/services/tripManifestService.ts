import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ManifestItem {
  item_number: number
  document_number: string
  ship_to_name: string
  total_quantity: number
}

export interface TripManifest {
  id?: string
  manifest_number: string
  manifest_date: string
  driver_name: string
  plate_no: string
  trucker?: string
  truck_type?: string
  time_start?: string       // HH:mm format
  time_end?: string         // HH:mm format
  // departure_time?: string
  // arrival_time?: string
  remarks?: string
  status: 'draft' | 'completed'
  items: ManifestItem[]
  created_at?: string
  updated_at?: string
}

export interface DocumentLookupResult {
  document_number: string
  ship_to_name: string
  total_quantity: number
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