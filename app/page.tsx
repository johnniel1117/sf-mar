import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle, Truck, LogOut, ChevronRight } from 'lucide-react'
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient overlays matching login */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/3 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-800/3 rounded-full blur-[80px]" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Bar */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
              <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
            </div>
            <span className="text-white text-base sm:text-xl font-bold">SF EXPRESS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#0d0d0d] border border-[#282828] hover:border-[#3e3e3e] transition-colors">
              <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                {displayName?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{displayName}</p>
                {profile?.role && (
                  <p className="text-xs text-[#a7a7a7] capitalize">{profile.role}</p>
                )}
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 sm:p-2.5 rounded-full bg-[#0d0d0d] border border-[#282828] hover:border-white hover:scale-105 transition-all text-[#a7a7a7] hover:text-white"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Main Section */}
        <div className="px-4 sm:px-8 py-8 sm:py-12 max-w-[1400px] mx-auto">
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12">
            Good day
          </h1>

          {/* Services Grid - Spotify style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Serial List Card */}
            <Link href="/excel-uploader">
              <div className="group relative bg-[#181818] rounded-lg p-4 sm:p-6 hover:bg-[#282828] transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-white text-sm sm:text-base font-bold mb-1 sm:mb-2">Serial List</h3>
                    <p className="text-[#a7a7a7] text-xs sm:text-sm line-clamp-2">
                      Upload and process product barcode data
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl shadow-red-600/50">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Trip Manifest Card */}
            <Link href="/trip-manifest">
              <div className="group relative bg-[#181818] rounded-lg p-4 sm:p-6 hover:bg-[#282828] transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl flex items-center justify-center flex-shrink-0">
                    <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-white text-sm sm:text-base font-bold mb-1 sm:mb-2">Trip Manifest</h3>
                    <p className="text-[#a7a7a7] text-xs sm:text-sm line-clamp-2">
                      Manage shipment details and delivery logistics
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl shadow-red-600/50">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Damage Report Card */}
            <Link href="/damage-report">
              <div className="group relative bg-[#181818] rounded-lg p-4 sm:p-6 hover:bg-[#282828] transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-gradient-to-br from-orange-500 to-orange-700 shadow-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-white text-sm sm:text-base font-bold mb-1 sm:mb-2">Damage Report</h3>
                    <p className="text-[#a7a7a7] text-xs sm:text-sm line-clamp-2">
                      Document and track damaged products
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-2xl shadow-red-600/50">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Section */}
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-white text-xl sm:text-2xl font-bold">Quick Access</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Link href="/excel-uploader">
                <div className="group bg-[#181818] rounded-lg p-3 sm:p-4 hover:bg-[#282828] transition-all cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                    <FileSpreadsheet className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Upload Files</h3>
                  <p className="text-[#a7a7a7] text-[10px] sm:text-xs">Process data</p>
                </div>
              </Link>

              <Link href="/trip-manifest">
                <div className="group bg-[#181818] rounded-lg p-3 sm:p-4 hover:bg-[#282828] transition-all cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                    <Truck className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">New Trip</h3>
                  <p className="text-[#a7a7a7] text-[10px] sm:text-xs">Create manifest</p>
                </div>
              </Link>

              <Link href="/damage-report">
                <div className="group bg-[#181818] rounded-lg p-3 sm:p-4 hover:bg-[#282828] transition-all cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-orange-700/20 rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Report Issue</h3>
                  <p className="text-[#a7a7a7] text-[10px] sm:text-xs">Log damage</p>
                </div>
              </Link>

              <div className="group bg-[#181818] rounded-lg p-3 sm:p-4 hover:bg-[#282828] transition-all cursor-pointer opacity-60">
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 flex items-center justify-center text-xl sm:text-2xl font-bold">+</div>
                </div>
                <h3 className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">More</h3>
                <p className="text-[#a7a7a7] text-[10px] sm:text-xs">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-6 sm:py-8 mt-12 sm:mt-16 text-center">
          <p className="text-[#6a6a6a] text-xs">
            © 2026 SF Express Logistics Dashboard · Developed by MAR
          </p>
        </div>
      </div>
    </div>
  )
}