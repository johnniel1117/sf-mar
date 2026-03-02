import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { TripManifest, DocumentLookupResult } from '@/lib/services/tripManifestService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export function useTripManifest() {
  const [isLoading, setIsLoading] = useState(false)
  const [savedManifests, setSavedManifests] = useState<TripManifest[]>([])

  const loadManifests = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('trip_manifests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedManifests(data || [])
    } catch (error) {
      console.error('Error loading manifests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveManifest = useCallback(async (manifest: TripManifest) => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('trip_manifests')
        .insert([{
          ...manifest,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()

      if (error) throw error

      await loadManifests()
      return data[0]
    } catch (error) {
      console.error('Error saving manifest:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [loadManifests])

  const deleteManifest = useCallback(async (manifestId: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('trip_manifests')
        .delete()
        .eq('id', manifestId)

      if (error) throw error

      await loadManifests()
    } catch (error) {
      console.error('Error deleting manifest:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [loadManifests])

  const lookupDocument = useCallback(async (documentNumber: string): Promise<DocumentLookupResult | null> => {
  try {
    console.log('Looking up document:', documentNumber)
    
    // First, try exact match
    const { data, error } = await supabase
      .from('excel_uploads')
      .select('document_number, ship_to_name, total_quantity, total_cbm, serial_data')
      .eq('document_number', documentNumber.trim())
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return null
    }

    if (!data) {
      console.log('Document not found:', documentNumber)
      return null
    }

    console.log('Document found - Raw data:', data)

    // Calculate total CBM
    let totalCbm = data.total_cbm || 0
    
    // If total_cbm is not set but serial_data exists, calculate it
    if (!totalCbm && data.serial_data && Array.isArray(data.serial_data)) {
      totalCbm = data.serial_data.reduce((sum: number, item: any) => {
        const itemCbm = item.cbm || 0
        const itemQty = item.quantity || 1
        return sum + (itemCbm * itemQty)
      }, 0)
      console.log('Calculated CBM from serial_data:', totalCbm)
    }

    const result = {
      document_number: data.document_number,
      ship_to_name: data.ship_to_name || 'N/A',
      total_quantity: data.total_quantity || 1,
      total_cbm: totalCbm,
    }
    
    console.log('Returning lookup result:', result)
    return result
  } catch (error) {
    console.error('Error looking up document:', error)
    return null
  }
}, [])

  // Debug function to check table structure
  const checkTableStructure = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*')
        .limit(1)

      if (error) {
        console.error('Error checking table structure:', error)
        return
      }

      if (data && data.length > 0) {
        console.log('Excel uploads table columns:', Object.keys(data[0]))
        console.log('Sample row:', data[0])
        
        // Check if there's a document with CBM data
        const { data: cbmData } = await supabase
          .from('excel_uploads')
          .select('document_number, total_cbm, serial_data')
          .not('total_cbm', 'is', null)
          .limit(5)
        
        console.log('Documents with CBM:', cbmData)
      } else {
        console.log('Excel uploads table is empty')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  return {
    isLoading,
    savedManifests,
    loadManifests,
    saveManifest,
    deleteManifest,
    lookupDocument,
    checkTableStructure,
  }
}