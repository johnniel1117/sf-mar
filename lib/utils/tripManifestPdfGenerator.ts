import { TripManifest } from '@/lib/services/tripManifestService'

export class TripManifestPDFGenerator {
  static generatePDF(manifestData: TripManifest): void {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (!printWindow) return

    const items = manifestData.items || []
    const totalQty = items.reduce((sum, item) => sum + item.total_quantity, 0)
    
    const formatDateShort = () => {
      const now = new Date()
      return now.toLocaleDateString("en-US", { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      })
    }

    const itemsHtml = items
      .map(
        (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; font-size: 10px;">${idx + 1}</td>
        <td style="text-align: left; padding: 8px; border: 1px solid #000; font-size: 10px;">${item.ship_to_name}</td>
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
          
          /* Header Section - Matching Damage Report */
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
            color: #000;
            border: 2px solid #000;
            padding: 4px 8px;
            display: inline-block;
          }
          
          /* Document Header - Matching Damage Report */
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
          
          /* Info Section - Matching Damage Report */
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
          
          /* Data Table - Matching Damage Report */
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
          
          /* Footer Info - Matching Damage Report */
          .footer-info {
            margin-top: 15px;
            padding: 10px;
            text-align: right;
            font-size: 11px;
            font-weight: bold;
          }
          
          /* Signature Section - 2x2 Grid Layout */
          .signature-section {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
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
          <!-- Header Section - Matching Damage Report -->
          <div class="header-section">
            <div class="logo-section">
              <img src="https://brandlogos.net/wp-content/uploads/2025/06/sf_express-logo_brandlogos.net_shwfy-512x512.png" alt="SF Express Logo" />
              <div class="warehouse-info">
                <strong>SF EXPRESS WAREHOUSE</strong><br/>
                UPPER TINGUB, MANDAUE, CEBU<br/>
              </div>
            </div>
            <div class="title-section">
              <div class="dealer-copy">${manifestData.manifest_number}</div>
            </div>
          </div>

          <!-- Document Header -->
          <div class="document-header">
            <div class="doc-title">TRIP MANIFEST</div>
          </div>

          <!-- Info Section - 4-Column Layout Matching Damage Report -->
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Client</div>
              <div class="info-value">HAIER PHILIPPINES INC.</div>
              <div class="info-label">Date</div>
              <div class="info-value">${formatDateShort()}</div>
            </div>
            
            <div class="info-row">
            <div class="info-label">Trucker</div>
              <div class="info-value">${manifestData.trucker || 'N/A'}</div>
              <div class="info-label">Driver</div>
              <div class="info-value">${manifestData.driver_name}</div>
              
            </div>
            
            <div class="info-row">
              <div class="info-label">Plate No.</div>
              <div class="info-value">${manifestData.plate_no}</div>
              <div class="info-label">Truck Type</div>
              <div class="info-value">${manifestData.truck_type || 'N/A'}</div>
            </div>
          </div>

          <!-- Data Table - Matching Damage Report Style -->
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
            </tbody>
          </table>

          <!-- Footer Info - Matching Damage Report -->
          <div class="footer-info">
            <div>TOTAL DOCUMENTS: ${items.length} | TOTAL QUANTITY: ${totalQty}</div>
          </div>

          <!-- Signature Section - 2x2 Grid -->
          <div class="signature-section">
            <!-- Checked by -->
            <div class="signature-box">
              <div class="signature-label">Checked by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name">JAYMIE TAGALOG JR./IRIC RANILI</div>
                <div class="signature-line"></div>
                <div class="signature-position">Warehouse Checker</div>
              </div>
            </div>
            
            <!-- Approved by -->
            <div class="signature-box">
              <div class="signature-label">Approved by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name">KENNETH IRVIN BELICARIO/ANTHONYLOU CHAN</div>
                <div class="signature-line"></div>
                <div class="signature-position">Warehouse Supervisor</div>
              </div>
            </div>
            
            <!-- Received by -->
            <div class="signature-box">
              <div class="signature-label">Received by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name"></div>
                <div class="signature-line"></div>
                <div class="signature-position">Customer/Trucker Representative</div>
              </div>
            </div>
            
            <!-- Witnessed by -->
            <div class="signature-box">
              <div class="signature-label">Witnessed by (Signature Over Printed Name):</div>
              <div class="signature-line-container">
                <div class="signature-name"></div>
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
    }, 250)
  }
}