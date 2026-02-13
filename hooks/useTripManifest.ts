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
      // Use maybeSingle() instead of single() to avoid errors when no record is found
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('*') // Select all columns first to debug
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

      // Log the data structure to see actual column names
      console.log('Document found - Column structure:', Object.keys(data))
      console.log('Document data:', data)

      // Map the actual column names from your database
      // Adjust these based on the console.log output
      return {
        document_number: data.document_number || data.doc_number || data.barcode || documentNumber,
        ship_to_name: data.ship_to_name || data.ship_to || data.customer_name || data.customer || 'N/A',
        total_quantity: data.total_quantity || data.quantity || data.qty || 0
      }
    } catch (error) {
      console.error('Error looking up document:', error)
      return null
    }
  }, [])

  // Add this debug function to check your table structure
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
    checkTableStructure, // Export this for debugging
  }
}