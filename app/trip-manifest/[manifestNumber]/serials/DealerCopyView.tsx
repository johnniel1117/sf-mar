'use client'

import { getCategoryFromBinCode } from '@/components/CategoryMapping'
import { MATCODE_CBM_MAP } from '@/lib/category-mapping'

import type { SerialEntry } from '@/lib/utils/tripManifestPdfGenerator'
import BarcodeSVG from './BarcodeSvg' 
import PrintButton from './PrintButton'


export interface DNGroup {
  dnNo:          string
  shipToName:    string
  shipToAddress: string
  rows:          SerialEntry[]
}

const getCBMFromMatcode = (code: string): number | null => {
  if (!code) return null
  return MATCODE_CBM_MAP[code] ?? MATCODE_CBM_MAP[code.toUpperCase()] ?? null
}

function formatDateShort(): string {
  return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

export default function DealerCopyView({
  manifestNumber,
  groups,
}: {
  manifestNumber: string
  groups: DNGroup[]
}) {
  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .dn-page { page-break-after: always; }
          .dn-page:last-child { page-break-after: auto; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Screen-only header */}
      <div className="no-print flex items-center justify-between max-w-[820px] mx-auto px-4 py-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1" style={{ color: '#E8192C' }}>
            Serial List
          </p>
          <h1 className="text-xl font-bold" style={{ color: '#C9D1D9' }}>{manifestNumber}</h1>
          <p className="text-[12px] mt-1" style={{ color: '#8B949E' }}>
            {groups.length} document{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <PrintButton />
      </div>

      {groups.length === 0 && (
        <p className="no-print text-center py-16" style={{ color: '#6E7681' }}>
          No serial data found for this manifest.
        </p>
      )}

      {/* Printable Dealer's Copy pages — one per DN */}
      <div className="max-w-[820px] mx-auto space-y-6 px-4 pb-10">
        {groups.map(group => {
          const rows = group.rows.filter(r => r.materialCode && r.barcode)
          const totalQuantity = rows.length
          const totalCbm = rows.reduce((s, r) => {
            const c = getCBMFromMatcode(r.materialCode)
            return c != null ? s + c : s
          }, 0)

          return (
            <div
              key={group.dnNo}
              className="dn-page bg-white text-black p-6 rounded-sm"
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 11 }}
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-2.5 mb-4" style={{ borderBottom: '2px solid #000' }}>
                <div>
                  <img src="/sf.png" alt="SF Express Logo" style={{ height: 60, width: 'auto' }} />
                  <div className="text-[9px] leading-tight mt-1.5">
                    <strong>SF Express Warehouse</strong><br />TINGUB, MANDAUE, CEBU
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tracking-wide" style={{ color: '#FF2C2C' }}>DEALER&apos;S COPY</div>
                  <div className="mt-2 flex justify-end">
                    <BarcodeSVG value={group.dnNo} height={60} width={2} />
                  </div>
                </div>
              </div>

              <div className="text-center my-4">
                <div className="text-xl font-bold">ORDER NO : {group.dnNo}</div>
              </div>

              <div className="flex gap-2 mb-1 text-[10px]"><div className="font-bold" style={{ width: 80 }}>Client</div><div>HAIER PHILIPPINES INC.</div></div>
              <div className="flex gap-2 mb-1 text-[10px]"><div className="font-bold" style={{ width: 80 }}>Date</div><div>{formatDateShort()}</div></div>
              <div className="flex gap-2 mb-1 text-[10px]"><div className="font-bold" style={{ width: 80 }}>Customer</div><div>{group.shipToName || 'N/A'}</div></div>
              <div className="flex gap-2 mb-1 text-[10px]"><div className="font-bold" style={{ width: 80 }}>Address</div><div>{group.shipToAddress || ''}</div></div>

              <table className="w-full border-collapse my-4" style={{ fontSize: 10 }}>
                <thead>
                  <tr>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 35 }}>NO.</th>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 110 }}>CATEGORY</th>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 240 }}>MATERIAL DESCRIPTION</th>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 180 }}>SERIAL NUMBER</th>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 60 }}>CBM</th>
                    <th className="p-1.5 text-center font-bold" style={{ border: '1px solid #000', width: 80 }}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const cbm = getCBMFromMatcode(r.materialCode)
                    return (
                      <tr key={idx}>
                        <td className="p-1.5 text-center" style={{ border: '1px solid #000' }}>{idx + 1}</td>
                        <td className="p-1.5 text-center" style={{ border: '1px solid #000' }}>{getCategoryFromBinCode(r.barcode).toUpperCase()}</td>
                        <td className="p-1.5 text-center" style={{ border: '1px solid #000' }}>{r.materialDesc || r.materialCode}</td>
                        <td className="p-1.5 text-center font-bold" style={{ border: '1px solid #000' }}>{r.barcode}</td>
                        <td className="p-1.5 text-center" style={{ border: '1px solid #000' }}>{cbm != null ? cbm : '—'}</td>
                        <td className="p-1.5" style={{ border: '1px solid #000' }}></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="flex gap-6 mt-2.5 text-[11px]">
                <div className="font-bold">TOTAL QTY: {totalQuantity}</div>
                <div className="font-bold">TOTAL CBM: {totalCbm.toFixed(2)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}