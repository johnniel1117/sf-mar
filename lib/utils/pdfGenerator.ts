import { DamageReport } from '@/lib/services/damageReportService'

export class PDFGenerator {
  static generatePDF(reportData: DamageReport): void {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    const items = reportData.items || ((reportData as any).damage_items || [])

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${item.item_number}</td>
        <td style="text-align: center; padding: 8px;">${item.material_description || 'Unknown'}</td>
        <td style="text-align: center; padding: 8px; font-weight: bold;">${item.barcode}</td>
        <td style="text-align: center; padding: 8px;">${item.damage_type || ''}</td>
        <td style="text-align: center; padding: 8px;">${item.damage_description || ''}</td>
      </tr>
    `
      )
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Damage and Deviation Report</title>
        <style>
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
          }
          
          .page-container {
            max-width: 900px;
            margin: 0 auto;
          }
          
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
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
          
          .dealer-copy {
            font-size: 14px;
            font-weight: bold;
            align-items: center;
            color: #d32f2f;
            border: 2px solid #d32f2f;
            padding: 4px 8px;
            display: inline-block;
          }
          
          .report-number-box {
            border: 2px solid #d32f2f;
            padding: 8px 12px;
            margin-top: 5px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            color: #000;
          }
          
          .document-header {
            text-align: center;
            margin: 15px 0;
            padding: 10px 0;
          }
          
          .doc-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .doc-number {
            font-size: 13px;
            font-weight: bold;
          }
          
          .info-section {
            margin-bottom: 15px;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 100px 1fr 100px 1fr;
            gap: 10px;
            margin-bottom: 8px;
            align-items: start;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 10px;
          }
          
          .info-value {
            font-size: 10px;
            padding: 2px 4px;
            min-height: 18px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border: 1px solid #000;
          }
          
          .data-table thead {
            background-color: #f0f0f0;
            border: 1px solid #000;
          }
          
          .data-table th {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
          }
          
          .data-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 9px;
          }
          
          .footer-info {
            margin-top: 15px;
            padding: 10px;
            text-align: right;
            font-size: 11px;
            font-weight: bold;
          }
          
          .signature-section {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
          }
          
          .signature-box {
            text-align: center;
            font-size: 10px;
          }
          
          .signature-label {
            font-weight: bold;
            font-size: 10px;
            text-align: left;
            margin-bottom: 5px;
          }
          
          .signature-line-container {
            position: relative;
            margin-top: 20px;
            height: 40px;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            width: 100%;
          }
          
          .signature-name {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
          }
          
          .signature-position {
            position: absolute;
            top: 25px;
            left: 0;
            right: 0;
            font-size: 9px;
            text-align: center;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .page-container {
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Header Section -->
          <div class="header-section">
            <div class="logo-section">
              <img src="https://brandlogos.net/wp-content/uploads/2025/06/sf_express-logo_brandlogos.net_shwfy-512x512.png" alt="SF Express Logo" />
              <div class="warehouse-info">
                <strong>SF EXPRESS WAREHOUSE</strong><br/>
                UPPER TINGUB, MANDAUE, CEBU<br/>
              </div>
            </div>
            <div class="title-section">
              <div class="dealer-copy">${reportData.report_number}</div>
            </div>
          </div>

          <!-- Document Header -->
          <div class="document-header">
            <div class="doc-title">DAMAGE AND DEVIATION REPORT</div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Report Date</div>
              <div class="info-value">${reportData.report_date}</div>
              <div class="info-label">Driver Name</div>
              <div class="info-value">${reportData.driver_name}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Plate No.</div>
              <div class="info-value">${reportData.plate_no}</div>
              <div class="info-label">Seal No.</div>
              <div class="info-value">${reportData.seal_no}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Container No.</div>
              <div class="info-value">${reportData.container_no}</div>
            </div>
          </div>

          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px;">NO.</th>
                <th style="width: 250px;">MATERIAL DESCRIPTION</th>
                <th style="width: 150px;">SERIAL NO.</th>
                <th style="width: 120px;">DAMAGE TYPE</th>
                <th style="width: 200px;">DAMAGE DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Footer Info -->
          <div class="footer-info">
            <div>TOTAL ITEMS: ${items.length}</div>
          </div>

          <!-- Narrative & Actions -->
          <div class="info-section" style="margin-top: 15px;">
            <div class="info-row" style="grid-template-columns: 1fr;">
              <div><strong>Narrative Findings:</strong></div>
            </div>
            <div style="padding: 8px; border: 1px solid #000; min-height: 50px; margin-bottom: 10px;">
              ${reportData.narrative_findings || 'N/A'}
            </div>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Prepared By:</div>
              <div class="signature-line-container">
                <div class="signature-name">${reportData.prepared_by || ''}</div>
                <div class="signature-line"></div>
                <div class="signature-position">Admin Staff</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Noted By:</div>
              <div class="signature-line-container">
                <div class="signature-name">${reportData.noted_by || ''}</div>
                <div class="signature-line"></div>
                <div class="signature-position">Security Guard</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Acknowledged By:</div>
              <div class="signature-line-container">
                <div class="signature-name">${reportData.acknowledged_by || ''}</div>
                <div class="signature-line"></div>
                <div class="signature-position">Supervisor</div>
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
    }, 250)
  }
}