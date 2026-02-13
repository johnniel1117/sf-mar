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
      // Look up in excel_uploads table by document_number
      const { data, error } = await supabase
        .from('excel_uploads')
        .select('document_number, ship_to_name, total_quantity')
        .eq('document_number', documentNumber.trim())
        .single()

      if (error) {
        console.log('Document not found:', documentNumber)
        return null
      }

      return data
    } catch (error) {
      console.error('Error looking up document:', error)
      return null
    }
  }, [])

  return {
    isLoading,
    savedManifests,
    loadManifests,
    saveManifest,
    deleteManifest,
    lookupDocument,
  }
}