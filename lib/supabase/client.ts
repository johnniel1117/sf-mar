import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Type for your damage reports (adjust based on your table structure)
export interface DamageReport {
  id: string
  title: string
  description: string
  location: string
  severity: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'resolved'
  reported_by: string
  reported_at: string
  updated_at: string
  images?: string[]
}