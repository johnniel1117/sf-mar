import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Keep your existing types here
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