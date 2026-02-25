import { getProfile } from '@/lib/actions/auth'
import { LandingClient } from '@/components/LandingPage'

export default async function page() {
  const profile = await getProfile()
  return (
    <LandingClient
      displayName={profile?.full_name || profile?.email || 'User'}
      role={profile?.role}
    />
  )
}