import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle, Truck, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()

  // Verify session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile details from your profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || profile?.email || user.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <img src="/sf-express.png" alt="SF Express Logo" className="h-8 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SF EXPRESS</h1>
        </div>
        <p className="text-gray-600 text-lg">Choose a service to get started</p>
      </div>

      {/* User bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-semibold">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{displayName}</p>
            {profile?.role && (
              <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>

      {/* Cards Grid */}
      <div className="grid items-center justify-center max-w-4xl w-full">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Serial List */}
            <Link href="/excel-uploader">
              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                <div className="mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Serial List</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Upload and process product barcode data
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">.xlsx</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">.xls</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
                </div>
              </div>
            </Link>

            {/* Trip Manifest */}
            <Link href="/trip-manifest">
              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                <div className="mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Trip Manifest</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Document and manage shipment details and delivery logistics
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">Documentation</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Details</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Tracking</span>
                </div>
              </div>
            </Link>

            {/* Damage Report */}
            <Link href="/damage-report">
              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                <div className="mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Damage Report</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Document and track damaged products and shipment incidents
                </p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">Documentation</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Details</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">Tracking</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        Developed by <span className="font-semibold">MAR</span> · All Rights Reserved © 2026
      </div>
    </div>
  )
}