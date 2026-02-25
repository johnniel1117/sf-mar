import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'admin' | 'user' | 'viewer'

export function usePermissions() {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role ?? 'viewer')
      setLoading(false)
    }

    fetchRole()
  }, [])

  return {
    role,
    loading,
    canAdd: role !== 'viewer',
    canEdit: role !== 'viewer',
    canDelete: role !== 'viewer',
    isViewer: role === 'viewer',
    isAdmin: role === 'admin',
  }
}