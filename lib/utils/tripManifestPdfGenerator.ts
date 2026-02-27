import { TripManifest } from '@/lib/services/tripManifestService'

export class TripManifestPDFGenerator {
  static generatePDF(manifestData: TripManifest): void {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    const items = manifestData.items || []
    const totalQty = items.reduce((sum, item) => sum + item.total_quantity, 0)

    const formatDateShort = (dateStr?: string) => {
      if (!dateStr) return '—'
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    }

    // ✅ 12hr time formatter
    const formatTime12hr = (time?: string) => {
      if (!time) return '—'
      const [hourStr, minuteStr] = time.split(':')
      const hour = parseInt(hourStr, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 === 0 ? 12 : hour % 12
      return `${hour12}:${minuteStr} ${ampm}`
    }

    const formatDuration = () => {
      if (!manifestData.time_start || !manifestData.time_end) return '—'
      try {
        const [h1, m1] = manifestData.time_start.split(':').map(Number)
        const [h2, m2] = manifestData.time_end.split(':').map(Number)
        let minutes = h2 * 60 + m2 - (h1 * 60 + m1)
        if (minutes < 0) minutes += 1440
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins.toString().padStart(2, '0')}m`
      } catch {
        return '—'
      }
    }

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px;">${idx + 1}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px;">${item.ship_to_name}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px; font-weight: bold;">${item.document_number}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px;">${item.total_quantity}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px;"></td>
      </tr>
    `
      )
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trip Manifest - ${manifestData.manifest_number}</title>
        <style>
          @page {
            size: portrait;
            margin: 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }
          
          .page-container {
            max-width: 900px;
            margin: 0 auto;
          }
          
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .logo-section img {
            height: 60px;
            width: auto;
          }
          
          .warehouse-info {
            font-size: 10px;
            line-height: 1.3;
          }
          
          .warehouse-info strong {
            font-size: 12px;
          }
          
          .title-section {
            text-align: right;
          }
          
          .manifest-number {
            font-size: 15px;
            font-weight: bold;
            color: #FF0000;
            border: 2px solid #FF0000;
            padding: 6px 14px;
            display: inline-block;
            border-radius: 3px; 
            min-width: 140px;
            text-align: center;
          }
          
          .document-header {
            text-align: center;
            margin: 15px 0;
            padding: 10px 0;
          }
          
          .doc-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .info-section {
            margin-bottom: 20px;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 110px 1fr 110px 1fr;
            gap: 12px 20px;
            align-items: start;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 10px;
            padding-top: 2px;
          }
          
          .info-value {
            font-size: 10px;
            padding: 3px 6px;
            min-height: 22px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #000;
          }
          
          .data-table thead {
            background-color: #e8e8e8;
            border: 1px solid #000;
          }
          
          .data-table th {
            border: 1px solid #000;
            padding: 8px 6px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
          }
          
          .data-table td {
            border: 1px solid #000;
            padding: 7px 6px;
            font-size: 9.5px;
            vertical-align: middle;
          }
          
          .footer-summary {
            margin-top: 18px;
            font-size: 11px;
            font-weight: bold;
            text-align: right;
            padding: 8px 12px;
          }
          
          .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px 30px;
          }
          
          .signature-box {
            text-align: center;
            font-size: 10px;
          }
          
          .signature-label {
            font-weight: bold;
            font-size: 10px;
            text-align: left;
            margin-bottom: 6px;
          }
          
          .signature-line-container {
            position: relative;
            margin-top: 28px;
            height: 50px;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            position: absolute;
            top: 28px;
            left: 0;
            right: 0;
          }
          
          .signature-name {
            position: absolute;
            top: 4px;
            left: 0;
            right: 0;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }
          
          .signature-position {
            position: absolute;
            top: 34px;
            left: 0;
            right: 0;
            font-size: 9px;
          }

          @media print {
            body { padding: 0; }
            .page-container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">

          <!-- Header -->
          <div class="header-section">
            <div class="logo-section">
              <img src="https://brandlogos.net/wp-content/uploads/2025/06/sf_express-logo_brandlogos.net_shwfy-512x512.png" alt="SF Express Logo" />
              <div class="warehouse-info">
                <strong>SF EXPRESS WAREHOUSE</strong><br/>
                UPPER TINGUB, MANDAUE, CEBU
              </div>
            </div>
            <div class="title-section">
              <div class="manifest-number">${manifestData.manifest_number}</div>
            </div>
          </div>

          <!-- Title -->
          <div class="document-header">
            <div class="doc-title">TRIP MANIFEST</div>
          </div>

          <!-- Trip Information -->
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Client</div>
              <div class="info-value">HAIER PHILIPPINES INC.</div>
              <div class="info-label">Dispatch Date</div>
              <div class="info-value">${formatDateShort(manifestData.manifest_date)}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Trucker</div>
              <div class="info-value">${manifestData.trucker || 'N/A'}</div>
              <div class="info-label">Driver</div>
              <div class="info-value">${manifestData.driver_name || '—'}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Plate No.</div>
              <div class="info-value">${manifestData.plate_no || '—'}</div>
              <div class="info-label">Truck Type</div>
              <div class="info-value">${manifestData.truck_type || 'N/A'}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Time Start</div>
              <div class="info-value">${formatTime12hr(manifestData.time_start)}</div>
              <div class="info-label">Time End</div>
              <div class="info-value">${formatTime12hr(manifestData.time_end)}</div>
            </div>

           
          </div>

          <!-- Items Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">NO.</th>
                <th style="width: 280px;">SHIP TO NAME</th>
                <th style="width: 150px;">DN/TRA NO.</th>
                <th style="width: 80px;">QTY</th>
                <th style="width: 100px;">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold; background: #f8f8f8;">
                <td colspan="3" style="text-align: right; padding: 8px;">TOTAL</td>
                <td style="text-align: center; padding: 8px;">${totalQty}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <!-- Summary line -->
          <div class="footer-summary">
            TOTAL DOCUMENTS: ${items.length}  |  TOTAL QUANTITY: ${totalQty}
          </div>

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Checked by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name">IRIC RANILI</div>
                <div class="signature-line"></div>
                <div class="signature-position">Warehouse Checker</div>
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
                <div class="signature-name"></div>
                <div class="signature-line"></div>
                <div class="signature-position">Customer / Trucker Representative</div>
              </div>
            </div>

            <div class="signature-box">
              <div class="signature-label">Witnessed by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name">JUNRY FORMENTERA</div>
                <div class="signature-line"></div>
                <div class="signature-position">Security Guard</div>
              </div>
            </div>
          </div>

        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 400)
  }
}