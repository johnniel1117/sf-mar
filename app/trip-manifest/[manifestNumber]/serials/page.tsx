import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  fetchSerialData,
  buildDetailedRows,
  type DetailedDNRow,
} from '@/lib/utils/tripManifestPdfGenerator'
import type { TripManifest } from '@/lib/services/tripManifestService'
import PrintButton from './PrintButton'

// ── Design tokens (kept consistent with the rest of the app) ─────────────────
const C = {
  bg:          '#0D1117',
  surface:     '#161B22',
  border:      '#30363D',
  divider:     '#21262D',
  textPrimary: '#C9D1D9',
  textSub:     '#8B949E',
  textMuted:   '#6E7681',
  accent:      '#E8192C',
}

interface PageProps {
  params: Promise<{ manifestNumber: string }>
}

export default async function ManifestSerialsPage({ params }: PageProps) {
  const { manifestNumber } = await params

  const { data, error } = await supabase
    .from('trip_manifests')
    .select('*')
    .eq('manifest_number', decodeURIComponent(manifestNumber))
    .single()

  if (error || !data) {
    notFound()
  }

  const manifest = data as TripManifest

  const dns = (manifest.items ?? [])
    .map(i => i.document_number)
    .filter((d): d is string => !!d)

  const serialsMap = await fetchSerialData(dns)
  const rows: DetailedDNRow[] = buildDetailedRows(manifest, serialsMap)

  const grandQty = rows.reduce((s, r) => s + r.totalQty, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 print:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: C.accent }}>
              Serial List
            </p>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.textPrimary }}>
              {manifest.manifest_number}
            </h1>
            <p className="text-[12px] mt-1" style={{ color: C.textSub }}>
              {manifest.driver_name || '—'} · {manifest.plate_no || '—'}
            </p>
          </div>
          <PrintButton />
        </div>

        {/* Summary */}
        <div className="flex items-center gap-5 px-4 py-3 mb-6 rounded-lg"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: C.textMuted }}>Documents</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: C.textPrimary }}>{rows.length}</p>
          </div>
          <div className="w-px h-8" style={{ background: C.divider }} />
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: C.textMuted }}>Total Qty</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: C.textPrimary }}>{grandQty}</p>
          </div>
        </div>

        {/* DN groups */}
        <div className="space-y-4">
          {rows.map(dn => (
            <div key={dn.documentNumber} className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${C.border}` }}>

              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                <span className="font-mono font-bold text-sm" style={{ color: C.textPrimary }}>
                  {dn.documentNumber.replace(/^0+/, '')}
                </span>
                <span className="text-[12px]" style={{ color: C.textSub }}>{dn.shipToName}</span>
              </div>

              <table className="w-full text-[12px]" style={{ color: C.textPrimary }}>
                <thead>
                  <tr style={{ color: C.textMuted }}>
                    <th className="text-left font-semibold uppercase tracking-wider text-[10px] px-4 py-2">Mat Code</th>
                    <th className="text-left font-semibold uppercase tracking-wider text-[10px] px-4 py-2">Description</th>
                    <th className="text-left font-semibold uppercase tracking-wider text-[10px] px-4 py-2">Location</th>
                    <th className="text-right font-semibold uppercase tracking-wider text-[10px] px-4 py-2">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {dn.lines.map((line, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.divider}` }}>
                      <td className="px-4 py-2 font-mono">{line.materialCode}</td>
                      <td className="px-4 py-2">{line.materialDesc}</td>
                      <td className="px-4 py-2 font-mono">{line.location}</td>
                      <td className="px-4 py-2 text-right font-bold">{line.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-2 text-right text-[11px] font-bold"
                style={{ background: C.surface, borderTop: `1px solid ${C.border}`, color: C.textSub }}>
                Subtotal: {dn.totalQty}
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16" style={{ color: C.textMuted }}>
            No documents found on this manifest.
          </div>
        )}
      </div>
    </div>
  )
}