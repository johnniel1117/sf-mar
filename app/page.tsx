import { getProfile } from '@/lib/actions/auth'
import { LandingClient } from '@/components/LandingPage'
import { supabase } from '@/lib/supabase'
import type { TripManifest } from '@/lib/services/tripManifestService'

async function fetchManifests(): Promise<TripManifest[]> {
  try {
    const { data, error } = await supabase
      .from('trip_manifests')
      .select('*')
      .order('manifest_date', { ascending: false })

    if (error) throw error
    return (data ?? []) as TripManifest[]
  } catch (err) {
    console.error('Failed to fetch manifests for analytics:', err)
    return []
  }
}

export default async function page() {
  const [profile, manifests] = await Promise.all([
    getProfile(),
    fetchManifests(),
  ])

  return (
    <LandingClient
      displayName={profile?.full_name || profile?.email || 'User'}
      role={profile?.role}
      manifests={manifests}
    />
  )
}