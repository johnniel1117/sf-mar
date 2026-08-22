import { TripManifest } from '@/lib/services/tripManifestService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Serial entry shape (from excel_uploads.serial_data) ───────────────────────

export interface SerialEntry {
  dnNo:          string
  orderItem:     string
  factoryCode:   string
  location:      string
  binCode:       string
  materialCode:  string
  materialDesc:  string
  barcode:       string
  materialType:  string
  productStatus: string
  shipTo:        string
  shipToName:    string
  shipToAddress: string
  soldTo:        string
  soldToName:    string
  scanBy:        string
  scanTime:      string | number
}

// ── Grouped material line (one row per matCode per DN) ────────────────────────

export interface MaterialLine {
  materialCode: string
  materialDesc: string
  location:     string
  qty:          number
  actualQty:    number
}

export interface DetailedDNRow {
  documentNumber: string
  shipToName:     string
  lines:          MaterialLine[]
  totalQty:       number
  actualQty:      number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDN(dn: string): string {
  return dn.replace(/^0+/, '')
}

function isBracketSerial(serial: SerialEntry): boolean {
  const values = Object.values(serial).map(value =>
    String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  )
  return values.some(value => value.startsWith('TD0042653'))
    || values.some(value => value.includes('BRACKET') || value.includes('BRKT'))
}

export async function fetchSerialData(
  dns: string[]
): Promise<Map<string, SerialEntry[]>> {
  const map = new Map<string, SerialEntry[]>()
  if (!dns.length) return map

  const unique   = [...new Set(dns)]
  const stripped = unique.map(d => d.replace(/^0+/, '')).filter(s => s && !unique.includes(s))
  const variants = [...unique, ...stripped]

  // Batch in chunks of 20
  const chunks: string[][] = []
  for (let i = 0; i < variants.length; i += 20) {
    chunks.push(variants.slice(i, i + 20))
  }

  const results = await Promise.all(
    chunks.map(chunk =>
      supabase
        .from('excel_uploads')
        .select('document_number, serial_data')
        .in('document_number', chunk)
    )
  )

  for (const { data, error } of results) {
    if (error || !data) continue
    for (const row of data) {
      let serials: SerialEntry[] = []
      try {
        if (row.serial_data) {
          const parsed = JSON.parse(row.serial_data)
          serials = Array.isArray(parsed) ? parsed : []
        }
      } catch { continue }
      if (!serials.length) continue

      map.set(row.document_number, serials)
      const stripped = row.document_number.replace(/^0+/, '')
      if (stripped !== row.document_number) map.set(stripped, serials)
    }
  }

  return map
}

export function buildDetailedRows(
  manifest: TripManifest,
  serialsMap: Map<string, SerialEntry[]>
): DetailedDNRow[] {
  const rows: DetailedDNRow[] = []

  for (const item of manifest.items ?? []) {
    const dn      = item.document_number ?? ''
    const serials = serialsMap.get(dn) ?? serialsMap.get(normalizeDN(dn))

    if (serials && serials.length > 0) {
      // Group serials by materialCode — count barcodes per group
      const matMap = new Map<string, { desc: string; location: string; qty: number; isBracket: boolean }>()
      for (const s of serials) {
        const key = s.materialCode
        if (!matMap.has(key)) {
          matMap.set(key, {
            desc:     s.materialDesc || '—',
            location: s.location     || '—',
            qty:      0,
            isBracket: false,
          })
        }
        const material = matMap.get(key)!
        material.qty++
        material.isBracket ||= isBracketSerial(s)
      }

      const lines: MaterialLine[] = Array.from(matMap.entries()).map(([code, v], lineIndex) => ({
        materialCode: code,
        materialDesc: v.desc,
        location:     v.location,
        qty:          v.isBracket ? item.total_quantity ?? v.qty : v.qty,
        actualQty:    v.isBracket ? item.actual_qty_dispatch ?? item.total_quantity ?? v.qty : item.actual_qty_by_material?.[code] ?? (
          item.actual_qty_by_material ? 0 : lineIndex === 0 ? item.actual_qty_dispatch ?? item.total_quantity ?? 0 : 0
        ),
      }))

      rows.push({
        documentNumber: dn,
        shipToName:     serials[0]?.shipToName || item.ship_to_name || '—',
        lines,
        totalQty:       lines.reduce((s, l) => s + l.qty, 0),
        actualQty:      item.actual_qty_dispatch ?? item.total_quantity ?? 0,
      })
    } else {
      // Fallback: no serial data — show basic row
      rows.push({
        documentNumber: dn,
        shipToName:     item.ship_to_name || '—',
        lines: [{
          materialCode: '—',
          materialDesc: '(No serial data found)',
          location:     '—',
          qty:          item.total_quantity ?? 0,
          actualQty:    item.actual_qty_dispatch ?? item.total_quantity ?? 0,
        }],
        totalQty: item.total_quantity ?? 0,
        actualQty: item.actual_qty_dispatch ?? item.total_quantity ?? 0,
      })
    }
  }

  return rows
}

// ── QR code ───────────────────────────────────────────────────────────────────
//
// Encodes a link to a page that shows the full serial list for this manifest,
// served from app/trip-manifest/[manifestNumber]/serials/page.tsx.
// NOTE: that page reads from `trip_manifests` and `excel_uploads` as the
// anonymous (unauthenticated) Supabase role, since it's reached by scanning a
// QR code — make sure RLS SELECT policies allow anon reads on both tables.

const ROUTE_BASE = '/trip-manifest'

function buildSerialListUrl(manifest: TripManifest): string {
  // Prefer the explicit env var (your real domain) so QR codes generated
  // during local dev don't end up pointing at localhost, which a phone
  // scanning the code can never reach. Only fall back to the browser's
  // own origin if NEXT_PUBLIC_APP_URL isn't set.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && window.location?.origin) ||
    ''
  return `${origin}${ROUTE_BASE}/${encodeURIComponent(manifest.manifest_number)}/serials?access=qr`
}

function buildQrCodeImgUrl(manifest: TripManifest): string {
  const target = buildSerialListUrl(manifest)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(target)}`
}

function waitForQrCode(printWindow: Window): Promise<void> {
  const qrImage = printWindow.document.querySelector<HTMLImageElement>(
    'img[alt="Scan for serial list"]'
  )
  if (!qrImage) return Promise.reject(new Error('QR code image was not rendered'))
  if (qrImage.complete && qrImage.naturalWidth > 0) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      qrImage.removeEventListener('load', handleLoad)
      qrImage.removeEventListener('error', handleError)
    }
    const handleLoad = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('QR code image failed to load'))
    }

    qrImage.addEventListener('load', handleLoad, { once: true })
    qrImage.addEventListener('error', handleError, { once: true })
  })
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
  })
}

function formatTime12hr(time?: string): string {
  if (!time) return '—'
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minuteStr} ${ampm}`
}

// ── HTML builders ─────────────────────────────────────────────────────────────
//
const DETAILED_STYLES = `
  @page { size: A4 portrait; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 10px;
    line-height: 1.4;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { max-width: 100%; }

  /* ── Header ── */
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8px;
  }
  .logo-section img { height: 50px; width: auto; }
  .warehouse-info { font-size: 9px; line-height: 1.4; margin-top: 6px; }
  .warehouse-info strong { font-size: 11px; }
  .manifest-number {
    font-size: 14px; font-weight: bold; color: #000;
    border: 2px solid #000; padding: 5px 12px;
    display: inline-block; border-radius: 3px;
    min-width: 130px; text-align: center;
  }

  /* ── Doc title ── */
  .doc-title-row {
    display: flex; align-items: center; gap: 12px; margin: 8px 0;
  }
  .doc-title-line { flex: 1; border-top: 1px solid #000; }
  .doc-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.25em; white-space: nowrap; }

  /* ── Info grid ── */
  .info-section { margin-bottom: 12px; }
  .truck-details-layout { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
  .truck-details-layout .info-section { flex: 1; margin-bottom: 0; }
  .truck-details-qr { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
  .truck-details-qr img { width: 72px; height: 72px; }
  .truck-details-qr .qr-caption { font-size: 5.5px; letter-spacing: 0.04em; color: #666; text-transform: uppercase; white-space: nowrap; }
  .info-row {
    display: grid;
    grid-template-columns: 100px 1fr 100px 1fr;
    gap: 6px 16px;
    align-items: start;
    margin-bottom: 4px;
  }
  .info-label { font-weight: bold; font-size: 9px; padding-top: 2px; }  
  .info-value { font-size: 9px; padding: 2px 5px; min-height: 18px; }

  /* ── Remarks box ── */
  .remarks-section {
    margin-bottom: 12px;
    padding: 8px;
    border: 1px solid #000;
    background: #f9f9f9;
  }
  .remarks-label { font-weight: bold; font-size: 9px; margin-bottom: 4px; }
  .remarks-text { font-size: 9px; white-space: pre-wrap; word-wrap: break-word; }

  /* ── Detail badge ── */
  .detail-badge {
    display: inline-block;
    font-size: 8px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: #000;
    border: 1px solid #000; padding: 2px 7px;
    margin-bottom: 8px;
  }

  /* ── Main table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .data-table thead tr { color: #fff; }
  .data-table th {
    padding: 6px 7px; font-size: 8.5px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    text-align: center; border: 1px solid #000; white-space: nowrap; color: #000;
  }
  .data-table td { border: 1px solid #000; padding: 5px 7px; vertical-align: middle; }

  /* ── DN group header row ── */
  .dn-no   { font-family: monospace; font-weight: 700; font-size: 10px; }
  .ship-to { margin-left: 10px; color: #000; }

  /* ── Material rows ── */
  .mat-row-even td { background: #fff; }
  .mat-row-odd  td { background: #fff; }
  .col-no   { text-align: center; width: 28px; color: #000; font-size: 8px; }
  .col-dn   { text-align: center; width: 80px; font-family: monospace; font-weight: 700; font-size: 9px; }
  .col-ship { text-align: center; width: 100px; font-size: 9px; }
  .col-code { text-align: center; font-family: monospace; font-size: 8.5px; color: #000; width: 90px; }
  .col-desc { text-align: center; font-size: 9px; width: 100px; }
  .col-loc  { text-align: center; width: 55px; font-family: monospace; font-size: 8.5px; }
  .col-qty  { text-align: center; width: 45px; font-weight: 700; font-size: 10px; }
  .col-actual { text-align: center; width: 60px; font-weight: 700; font-size: 10px; }
  .col-rem  { text-align: center; width: 150px; }

  /* ── Grand total ── */
  .grand-total td {
    background: #000; color: #fff;
    padding: 7px 7px; font-weight: 700; font-size: 10px;
    border: 1px solid #000;
  }
  .grand-total .gt-label { text-align: right; letter-spacing: 0.12em; text-transform: uppercase; }
  .grand-total .gt-val   { text-align: center; font-family: monospace; font-size: 13px; }

  /* ── Footer summary ── */
  .footer-summary { margin-top: 10px; font-size: 10px; font-weight: bold; text-align: right; }

  /* ── Signatures ── */
  .signature-section {
    margin-top: 28px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 28px 30px;
  }
  .signature-box { font-size: 9px; }
  .signature-label { font-weight: bold; font-size: 9px; margin-bottom: 4px; }
  .signature-line-container { position: relative; margin-top: 24px; height: 44px; }
  .signature-line { border-top: 1px solid #000; position: absolute; top: 26px; left: 0; right: 0; }
  .signature-name { position: absolute; top: 2px; left: 0; right: 0; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; }
  .signature-position { position: absolute; top: 30px; left: 0; right: 0; font-size: 8.5px; text-align: center; }

  /* ── Footer ── */
  .footer-haier-section {
    margin-top: 50px;
    padding-top: 20px;
  }
  .footer-text {
    font-size: 8px;
    font-style: italic;
    color: #666;
    letter-spacing: 0.08em;
    text-align: center;
  }

  /* ── QR code ── */
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .qr-section img { width: 80px; height: 80px; }
  .qr-caption { font-size: 5.5px; letter-spacing: 0.04em; color: #666; text-transform: uppercase; white-space: nowrap; }

  @media print { body { padding: 10; } }
`

function buildDetailedHtml(manifest: TripManifest, rows: DetailedDNRow[]): string {
  const grandQty   = rows.reduce((s, r) => s + r.totalQty, 0)
  const actualQty  = rows.reduce((s, r) => s + r.actualQty, 0)
  const totalDocs  = rows.length
  const qrCodeUrl  = buildQrCodeImgUrl(manifest)

  let rowCounter = 0

  const bodyHtml = rows.map(dn => {
    const dnLines = dn.lines.map((line, li) => {
      rowCounter++
      const isEven = li % 2 === 0
      return `
        <tr class="${isEven ? 'mat-row-even' : 'mat-row-odd'}">
          <td class="col-no">${rowCounter}</td>
          <td class="col-dn">${dn.documentNumber.replace(/^0+/, '')}</td>
          <td class="col-ship">${dn.shipToName}</td>
          <td class="col-code">${line.materialCode}</td>
          <td class="col-desc">${line.materialDesc}</td>
          <td class="col-loc">${line.location}</td>
          <td class="col-qty">${line.qty}</td>
          <td class="col-actual">${line.actualQty}</td>
          <td class="col-rem"></td>
        </tr>`
    }).join('')

    return dnLines
  }).join('')

  const remarksHtml = manifest.remarks ? `
    <div class="remarks-section">
      <div class="remarks-label">NOTE:</div>
      <div class="remarks-text">${manifest.remarks}</div>
    </div>
  ` : ''

  // Container Van No. / Seal No. — only rendered when at least one is present
  const vanSealHtml = (manifest.container_van_no || manifest.seal_no) ? `
    <div class="info-row">
      <div class="info-label">Container Van No.</div>
      <div class="info-value">${manifest.container_van_no || '—'}</div>
      <div class="info-label">Seal No.</div>
      <div class="info-value">${manifest.seal_no || '—'}</div>
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <title>Detailed Manifest - ${manifest.manifest_number}</title>
  <style>${DETAILED_STYLES}</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header-section">
    <div class="logo-section">
      <img src="SFEXPRESS.png" alt="SF Express" />
      <div class="warehouse-info">
        <strong>SF EXPRESS WAREHOUSE</strong><br/>
        UPPER TINGUB, MANDAUE, CEBU
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:8px;font-weight:bold;margin-bottom:3px;letter-spacing:0.05em;">MANIFEST NO.</div>
      <div class="manifest-number">${manifest.manifest_number}</div>
    </div>
  </div>

  <!-- Title -->
  <div class="doc-title-row">
    <div class="doc-title-line"></div>
    <div class="doc-title">Trip Manifest</div>
    <div class="doc-title-line"></div>
  </div>

  <!-- Trip info -->
  <div class="truck-details-layout">
    <div class="info-section">
    <div class="info-row">
      <div class="info-label">Client</div>
      <div class="info-value">HAIER PHILIPPINES INC.</div>
      <div class="info-label">Dispatch Date</div>
      <div class="info-value">${formatDateShort(manifest.manifest_date)}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Trucker</div>
      <div class="info-value">${manifest.trucker || 'N/A'}</div>
      <div class="info-label">Driver</div>
      <div class="info-value">${manifest.driver_name || '—'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Plate No.</div>
      <div class="info-value">${manifest.plate_no || '—'}</div>
      <div class="info-label">Truck Type</div>
      <div class="info-value">${manifest.truck_type || 'N/A'}</div>
    </div>
    ${vanSealHtml}
    <div class="info-row">
      <div class="info-label">Time Start</div>
      <div class="info-value">${formatTime12hr(manifest.time_start)}</div>
      <div class="info-label">Time End</div>
      <div class="info-value">${formatTime12hr(manifest.time_end)}</div>
    </div>
    </div>
    <div class="truck-details-qr">
      <img src="${qrCodeUrl}" alt="Scan for serial list" />
      <div class="qr-caption">Scan to view serial list</div>
    </div>
  </div>

  ${remarksHtml}

  <!-- Table -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:28px">No.</th>
        <th style="width:80px">DN No.</th>
        <th style="width:100px">Ship To Name</th>
        <th style="width:90px">Mat Code</th>
        <th style="width:100px">Mat Desc</th>
        <th style="width:55px">Location</th>
        <th style="width:45px">Qty</th>
        <th style="width:60px">Dsptch Qty</th>
        <th style="width:150px">Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${bodyHtml}
      
    </tbody>
  </table>

  <!-- Summary line -->
  <div class="footer-summary">
    TOTAL DOCUMENTS: ${totalDocs}&nbsp;&nbsp;|&nbsp;&nbsp;TOTAL QUANTITY: ${grandQty}&nbsp;&nbsp;|&nbsp;&nbsp;TOTAL DISPATCH QUANTITY: ${actualQty}
  </div>

  <!-- Signatures -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">Prepared by (Signature Over Printed Name):</div>
      <div class="signature-line-container">
        <div class="signature-name">JOHNNIEL MAR</div>
        <div class="signature-line"></div>
        <div class="signature-position">Admin Staff</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Approved by (Signature Over Printed Name):</div>
      <div class="signature-line-container">
        <div class="signature-name">ANTHONYLOU CHAN</div>
        <div class="signature-line"></div>
        <div class="signature-position">Warehouse Supervisor</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Received by (Signature Over Printed Name):</div>
      <div class="signature-line-container">
        <div class="signature-line"></div>
        <div class="signature-position">Customer / Trucker Representative</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Witnessed by (Signature Over Printed Name):</div>
      <div class="signature-line-container">
      <div class="signature-name">SG MELANIO / SG FORMENTERA / SG ABOSO</div>
        <div class="signature-line"></div>
        <div class="signature-position">Security Guard</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-haier-section">
    <div class="footer-text">FOR DOCUMENTATION PURPOSES</div>
  </div>

</div>
</body>
</html>`
}

// ── Original simple PDF (with remarks) ──────────────────────────────────────────

export class TripManifestPDFGenerator {
  static async generatePDF(manifestData: TripManifest): Promise<void> {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    const items    = manifestData.items || []
    const totalQty = items.reduce((sum, item) => sum + item.total_quantity, 0)
    const totalDispatchedQty = items.reduce((sum, item) => sum + (item.actual_qty_dispatch ?? item.total_quantity), 0)
    const totalCbm = items.reduce((sum, item) => sum + (item.total_cbm ?? 0), 0)
    const hasCbm   = items.some(item => item.total_cbm != null && item.total_cbm > 0)
    const qrCodeUrl = buildQrCodeImgUrl(manifestData)

    const formatDateShortLocal = (dateStr?: string) => {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
      })
    }

    const formatTime12hrLocal = (time?: string) => {
      if (!time) return '—'
      const [hourStr, minuteStr] = time.split(':')
      const hour = parseInt(hourStr, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 === 0 ? 12 : hour % 12
      return `${hour12}:${minuteStr} ${ampm}`
    }

    const cbmCol = (val?: number | null) =>
      val != null && val > 0 ? val.toFixed(2) : '—'

    const itemsHtml = items.map((item, idx) => {
      const dispatchedQty = item.actual_qty_dispatch ?? item.total_quantity
      const isShort = dispatchedQty < item.total_quantity
      return `
      <tr>
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;">${idx + 1}</td>
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;">${item.ship_to_name}</td>
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;font-weight:bold;">${item.document_number}</td>
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;">${item.total_quantity}</td>
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;font-weight:bold;${isShort ? 'color:#B45309;' : ''}">${dispatchedQty}</td>
        ${hasCbm ? `<td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;">${cbmCol(item.total_cbm)}</td>` : ''}
        <td style="text-align:center;padding:8px;border:1px solid #000;font-size:10px;"></td>
      </tr>`
    }).join('')

    const remarksHtml = manifestData.remarks ? `
      <div style="margin:20px 0;padding:10px;border:1px solid #000;background:#f9f9f9;">
        <div style="font-weight:bold;font-size:10px;margin-bottom:5px;">NOTE:</div>
        <div style="font-size:10px;white-space:pre-wrap;word-wrap:break-word;">${manifestData.remarks}</div>
      </div>
    ` : ''

    // Container Van No. / Seal No. — only rendered when at least one is present
    const vanSealHtml = (manifestData.container_van_no || manifestData.seal_no) ? `
      <div class="info-row">
        <div class="info-label">Container Van No.</div><div class="info-value">${manifestData.container_van_no || '—'}</div>
        <div class="info-label">Seal No.</div><div class="info-value">${manifestData.seal_no || '—'}</div>
      </div>
    ` : ''

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Trip Manifest - ${manifestData.manifest_number}</title>
  <style>
    @page { size: portrait; margin: 10mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; padding:20px; font-size:11px; line-height:1.4; color:#000; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page-container { max-width:900px; margin:0 auto; }
    .header-section { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:10px; }
    .logo-section { display:flex; flex-direction:column; align-items:center; gap:15px; }
    .logo-section img { height:60px; width:auto; }
    .warehouse-info { font-size:10px; line-height:1.3; }
    .warehouse-info strong { font-size:12px; }
    .title-section { text-align:right; }
    .doc-title-row { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .doc-title-line { flex:1; border-top:1px solid #000; align-self:center; }
    .doc-title { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.3em; }
    .manifest-number { font-size:15px; font-weight:bold; color:#FF0000; border:2px solid #FF0000; padding:6px 14px; display:inline-block; border-radius:3px; min-width:140px; text-align:center; }
    .info-section { margin-bottom:20px; }
    .truck-details-layout { display:flex; gap:18px; align-items:flex-start; margin-bottom:20px; }
    .truck-details-layout .info-section { flex:1; margin-bottom:0; }
    .truck-details-qr { display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0; }
    .truck-details-qr img { width:120px; height:120px; }
    .truck-details-qr .qr-caption { font-size:8px; letter-spacing:0.05em; color:#666; text-transform:uppercase; white-space:nowrap; }
    .info-row { display:grid; grid-template-columns:110px 1fr 110px 1fr; gap:12px 20px; align-items:start; }
    .info-label { font-weight:bold; font-size:10px; padding-top:2px; }
    .info-value { font-size:10px; padding:3px 6px; min-height:22px; }
    .data-table { width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #000; }
    .data-table th { border:1px solid #000; padding:8px 6px; text-align:center; font-weight:bold; font-size:10px; }
    .data-table td { border:1px solid #000; padding:7px 6px; font-size:9.5px; vertical-align:middle; }
    .footer-summary { margin-top:18px; font-size:11px; font-weight:bold; text-align:right; padding:8px 12px; }
    .signature-section { margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:40px 30px; }
    .signature-box { text-align:center; font-size:10px; }
    .signature-label { font-weight:bold; font-size:10px; text-align:left; margin-bottom:6px; }
    .signature-line-container { position:relative; margin-top:28px; height:50px; }
    .signature-line { border-top:1px solid #000; position:absolute; top:28px; left:0; right:0; }
    .signature-name { position:absolute; top:4px; left:0; right:0; font-weight:bold; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; }
    .signature-position { position:absolute; top:34px; left:0; right:0; font-size:9px; }
    .footer-haier-section { margin-top:60px; padding-top:15px; }
    .footer-text { font-size:8.5px; font-style:italic; color:#666; letter-spacing:0.08em; text-align:center; margin-bottom:14px; }
    .qr-row { display:flex; justify-content:flex-end; }
    .qr-section { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .qr-section img { width:175px; height:175px; }
    .qr-caption { font-size:8px; letter-spacing:0.05em; color:#666; text-transform:uppercase; }
    @media print { body { padding:0; } .page-container { max-width:100%; } }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header-section">
      <div class="logo-section">
        <img src="SFEXPRESS.png" alt="SF Express Logo" />
        <div class="warehouse-info"><strong>SF EXPRESS WAREHOUSE</strong><br/>UPPER TINGUB, MANDAUE, CEBU</div>
      </div>
      <div class="title-section">
        <div style="font-size:9px;font-weight:bold;text-align:center;margin-bottom:4px;letter-spacing:0.05em;">MANIFEST NO.</div>
        <div class="manifest-number">${manifestData.manifest_number}</div>
      </div>
    </div>
    <div class="doc-title-row">
      <div class="doc-title-line"></div>
      <div class="doc-title">Trip Manifest</div>
      <div class="doc-title-line"></div>
    </div>
    <div class="truck-details-layout">
      <div class="info-section">
      <div class="info-row">
        <div class="info-label">Client</div><div class="info-value">HAIER PHILIPPINES INC.</div>
        <div class="info-label">Dispatch Date</div><div class="info-value">${formatDateShortLocal(manifestData.manifest_date)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Trucker</div><div class="info-value">${manifestData.trucker || 'N/A'}</div>
        <div class="info-label">Driver</div><div class="info-value">${manifestData.driver_name || '—'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Plate No.</div><div class="info-value">${manifestData.plate_no || '—'}</div>
        <div class="info-label">Truck Type</div><div class="info-value">${manifestData.truck_type || 'N/A'}</div>
      </div>
      ${vanSealHtml}
      <div class="info-row">
        <div class="info-label">Time Start</div><div class="info-value">${formatTime12hrLocal(manifestData.time_start)}</div>
        <div class="info-label">Time End</div><div class="info-value">${formatTime12hrLocal(manifestData.time_end)}</div>
      </div>
      </div>
      <div class="truck-details-qr">
        <img src="${qrCodeUrl}" alt="Scan for serial list" />
        <div class="qr-caption">Scan to view serial list</div>
      </div>
    </div>
    ${remarksHtml}
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:40px">NO.</th>
          <th style="width:${hasCbm ? '190px' : '220px'}">SHIP TO NAME</th>
          <th style="width:130px">DN/TRA NO.</th>
          <th style="width:55px">ORDERED</th>
          <th style="width:65px">DISPATCHED</th>
          ${hasCbm ? '<th style="width:80px">CBM</th>' : ''}
          <th style="width:90px">REMARKS</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight:bold;">
          <td colspan="3" style="text-align:right;padding:8px;border:1px solid #000;">TOTAL</td>
          <td style="text-align:center;padding:8px;border:1px solid #000;">${totalQty}</td>
          <td style="text-align:center;padding:8px;border:1px solid #000;">${totalDispatchedQty}</td>
          ${hasCbm ? `<td style="text-align:center;padding:8px;border:1px solid #000;">${totalCbm.toFixed(2)}</td>` : ''}
          <td style="border:1px solid #000;"></td>
        </tr>
      </tbody>
    </table>
    <div class="footer-summary">
      TOTAL DOCUMENTS: ${items.length}&nbsp;&nbsp;|&nbsp;&nbsp;TOTAL ORDERED: ${totalQty}&nbsp;&nbsp;|&nbsp;&nbsp;TOTAL DISPATCHED: ${totalDispatchedQty}${hasCbm ? `&nbsp;&nbsp;|&nbsp;&nbsp;TOTAL CBM: ${totalCbm.toFixed(2)}` : ''}
    </div>
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">Prepared by (Signature Over Printed Name):</div>
        <div class="signature-line-container">
          <div class="signature-name">JOHNNIEL MAR</div>
          <div class="signature-line"></div>
          <div class="signature-position">Admin Staff</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Approved by (Signature Over Printed Name):</div>
        <div class="signature-line-container">
          <div class="signature-name">KENNETH IRVIN BELICARIO / ANTHONYLOU CHAN</div>
          <div class="signature-line"></div>
          <div class="signature-position">Warehouse Supervisor</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Received by (Signature Over Printed Name):</div>
        <div class="signature-line-container">
          <div class="signature-line"></div>
          <div class="signature-position">Customer / Trucker Representative</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Witnessed by (Signature Over Printed Name):</div>
        <div class="signature-line-container">
          <div class="signature-line"></div>
          <div class="signature-position">Security Guard</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-haier-section">
      <div class="footer-text">FOR DOCUMENT PURPOSES</div>
    </div>

  </div>
</body>
</html>`

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    await waitForQrCode(printWindow)
    printWindow.print()
  }

  // ── Detailed PDF (with material code, desc, location from serial data) ──────
  //
  // The caller MUST open the window synchronously (before any await) and pass
  // it in here — avoids browser popup-blocking after an async gap.
  //
  //   const win = window.open('', '', 'width=1200,height=800')
  //   TripManifestPDFGenerator.generateDetailedPDF(manifest, win)

  static async generateDetailedPDF(
    manifestData: TripManifest,
    printWindow: Window,
  ): Promise<void> {
    const dns = (manifestData.items ?? [])
      .map(i => i.document_number ?? '')
      .filter(Boolean)

    const serialsMap = await fetchSerialData(dns)
    const rows       = buildDetailedRows(manifestData, serialsMap)

    // Replace the loading screen with the real content
    printWindow.document.open()
    printWindow.document.write(buildDetailedHtml(manifestData, rows))
    printWindow.document.close()
    await waitForQrCode(printWindow)
    printWindow.print()
  }
}