'use client'

import { useEffect, useState } from 'react'
import { AccrualReportTab } from '@/components/tabs/AccrualReportTab'
import type { TripManifest } from '@/lib/services/tripManifestService'

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
    <div className="min-h-screen bg-[#0D1117] p-6 sm:p-8">
      <AccrualReportTab manifests={manifests} />
    </div>
  )
}
