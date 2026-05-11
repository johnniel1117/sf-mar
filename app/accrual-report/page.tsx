'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, BarChart3 } from 'lucide-react'
import { AccrualReportTab } from '@/components/tabs/AccrualReportTab'
import type { TripManifest } from '@/lib/services/tripManifestService'

const C = {
  bg: '#0D1117',
  divider: '#21262D',
  border: '#30363D',
  textSub: '#8B949E',
  textSilver: '#B1BAC4',
  surfaceHover: '#1C2128',
  blue: '#3B82F6',
  blueBorder: 'rgba(59,130,246,0.25)',
}

export default function AccrualReportPage() {
  const [manifests, setManifests] = useState<TripManifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchManifests = async () => {
      try {
        const response = await fetch('/api/trip-manifest')
        if (!response.ok) throw new Error('Failed to fetch manifests')
        const data = await response.json()
        setManifests(data || [])
      } catch (err) {
        console.error('Error fetching manifests:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchManifests()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#C9D1D9] text-lg font-semibold">Loading Accrual Report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-[#E8192C] text-lg font-semibold mb-2">Error Loading Report</p>
          <p className="text-[#B1BAC4]">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{backgroundColor: C.bg}}>
      {/* ── Navigation Bar ── */}
      <nav className="flex-shrink-0 h-[72px] z-[60] flex items-center px-5 sm:px-8 gap-3 sm:gap-5" 
        style={{background: C.bg, borderBottom: `1px solid ${C.divider}`}}>
        
        {/* Home Button */}
        <Link
          href="/"
          className="p-2.5 rounded-lg transition-all flex-shrink-0"
          style={{color: C.textSub}}
          onMouseEnter={(e) => { 
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = C.surfaceHover;
            (el.querySelector('svg') as SVGElement).style.color = 'white' 
          }}
          onMouseLeave={(e) => { 
            const el = e.currentTarget as HTMLElement
            el.style.backgroundColor = 'transparent'
            ;(el.querySelector('svg') as SVGElement).style.color = C.textSub 
          }}
          title="Back to home"
        >
          <Home className="w-4 h-4 transition-colors" />
        </Link>

        <div className="w-px h-6 flex-shrink-0 hidden sm:block" style={{backgroundColor: C.divider}} />

        {/* Report Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{background: `${C.blue}20`, border: `1px solid ${C.blueBorder}`}}>
            <BarChart3 className="w-4 h-4" style={{color: C.blue}} />
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-bold truncate" style={{color: C.textSilver}}>
              Accrual Report
            </p>
            <p className="text-xs hidden sm:block truncate" style={{color: C.textSub}}>
              Monitor monthly dispatch analytics
            </p>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AccrualReportTab manifests={manifests} />
      </div>
    </div>
  )
}
