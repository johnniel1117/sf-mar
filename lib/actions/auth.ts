'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getProfile() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('getProfile - user:', user?.id, 'error:', userError?.message)

  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  console.log('getProfile - profile:', profile, 'error:', profileError?.message)

  return profile ? { ...profile, role: profile.role?.toLowerCase() } : null
}

export async function requireNonViewer() {
  const profile = await getProfile()

  if (!profile || profile.role === 'viewer') {
    redirect('/admin/manifests') 
  }

  return profile
}