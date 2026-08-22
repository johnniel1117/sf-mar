import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchSerialData, type SerialEntry } from '@/lib/utils/tripManifestPdfGenerator'
import type { TripManifest } from '@/lib/services/tripManifestService'
import DealerCopyView, { type DNGroup } from './DealerCopyView'

// NOTE: reached by scanning the QR code on a printed manifest, i.e. by an
// unauthenticated visitor. Make sure Supabase RLS grants SELECT on
// `trip_manifests` and `excel_uploads` to the anon role, or this will 404
// for everyone outside the app.

interface PageProps {
  params: Promise<{ manifestNumber: string }>
  searchParams: Promise<{ access?: string }>
}

export default async function ManifestSerialsPage({ params, searchParams }: PageProps) {
  const { access } = await searchParams
  if (access !== 'qr') {
    notFound()
  }

  const { manifestNumber } = await params
  const decoded = decodeURIComponent(manifestNumber)

  const { data, error } = await supabase
    .from('trip_manifests')
    .select('*')
    .eq('manifest_number', decoded)
    .single()

  if (error || !data) {
    notFound()
  }

  const manifest = data as TripManifest

  const dns = (manifest.items ?? [])
    .map(i => i.document_number)
    .filter((d): d is string => !!d)

  const serialsMap = await fetchSerialData(dns)

  const groups: DNGroup[] = (manifest.items ?? []).map(item => {
    const dn = item.document_number ?? ''
    const serials: SerialEntry[] =
      serialsMap.get(dn) ?? serialsMap.get(dn.replace(/^0+/, '')) ?? []

    return {
      dnNo:          dn,
      shipToName:    serials[0]?.shipToName    || item.ship_to_name || '',
      shipToAddress: serials[0]?.shipToAddress || '',
      rows:          serials,
      totalQuantity: item.actual_qty_dispatch ?? item.total_quantity,
    }
  })

  return <DealerCopyView manifestNumber={manifest.manifest_number} groups={groups} />
}