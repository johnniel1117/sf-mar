'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()

        // Get the currently logged-in user from Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        // Fetch their profile row from your profiles table
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setError(profileError.message)
        } else {
          setProfile(data as UserProfile)
        }
      } catch (err) {
        setError('Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return { profile, loading, error }
}