import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const [admins, guards, supervisors] = await Promise.all([
      supabase
        .from('personnel')
        .select('*')
        .eq('role', 'admin'),
      supabase
        .from('personnel')
        .select('*')
        .eq('role', 'guard'),
      supabase
        .from('personnel')
        .select('*')
        .eq('role', 'supervisor')
    ])

    return NextResponse.json({
      admins: admins.data || [],
      guards: guards.data || [],
      supervisors: supervisors.data || []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching personnel' },
      { status: 500 }
    )
  }
}