import { getProfile } from '@/lib/actions/auth'
import DamageReportForm from '@/components/damage-report'

export default async function DamageReportPage() {
  const profile = await getProfile()
  console.log('SERVER ROLE:', profile?.role)
  return <DamageReportForm role={profile?.role} />
}