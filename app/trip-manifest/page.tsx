import { getProfile } from '@/lib/actions/auth'
import TripManifestForm from '@/components/TripManifestForm'

export default async function TripManifestPage() {
  const profile = await getProfile()
  return <TripManifestForm role={profile?.role} />
}