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
  helper_name?: string
  truck_type?: string
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