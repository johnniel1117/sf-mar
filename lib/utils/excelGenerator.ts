import { DamageReport } from '@/lib/services/damageReportService'
import * as XLSX from 'xlsx'

export class ExcelGenerator {
  static generateExcel(reportData: DamageReport): void {
    const items = reportData.items || ((reportData as any).damage_items || [])
    
    // Create the exact layout from the image
    const data = [
      // Line 1: Company name (centered)
      ["SF EXPRESS WAREHOUSE"],
      // Line 2: Address (centered)
      ["LIPPER TINGUB, MANDAUE, CEBU"],
      // Empty line
      [""],
      // Line 4: Report number (centered)
      [reportData.report_number],
      // Empty line
      [""],
      // Line 6: Title (centered)
      ["DAMAGE AND DEVIATION REPORT"],
      // Empty line
      [""],
      // Line 8: Report details - formatted as two columns
      ["Report Date", reportData.report_date, "", "Driver Name", reportData.driver_name],
      // Line 9: More details
      ["Plate No.", reportData.plate_no, "", "Seal No.", reportData.seal_no || ""],
      // Line 10: Container No.
      ["Container No.", reportData.container_no || "", "", "", ""],
      // Empty line
      [""],
      // Table header
      ["NO.", "MATERIAL DESCRIPTION", "SERIAL NO.", "DAMAGE TYPE", "DAMAGE DESCRIPTION"],
      // Table data
      ...items.map(item => [
        item.item_number,
        item.material_description || 'Unknown',
        item.barcode,
        item.damage_type || '',
        item.damage_description || ''
      ]),
      // Empty line after table
      [""],
      // Total items
      [`TOTAL ITEMS: ${items.length}`],
      // Empty line
      [""],
      // Narrative Findings
      ["Narrative Findings:"],
      [reportData.narrative_findings || 'N/A'],
      // Empty line
      [""],
      // Signature labels
      ["Prepared By:", "Noted By:", "Acknowledged By:"],
      // Names in uppercase
      [
        (reportData.prepared_by || '').toUpperCase(),
        (reportData.noted_by || '').toUpperCase(),
        (reportData.acknowledged_by || '').toUpperCase()
      ],
      // Positions
      ["Admin Staff", "Security Guard", "Supervisor"]
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths to match the image layout
    const colWidths = [
      { wch: 12 },  // A: NO. / Labels (Report Date, Plate No., etc.)
      { wch: 25 },  // B: MATERIAL DESCRIPTION / Values
      { wch: 15 },  // C: SERIAL NO. / Empty spacer
      { wch: 15 },  // D: DAMAGE TYPE / Driver Name, Seal No.
      { wch: 25 }   // E: DAMAGE DESCRIPTION / Values
    ]
    ws['!cols'] = colWidths

    // Merge cells for centered headers and content
    const merges = []
    
    // Merge cells for centered content (rows 0-6)
    for (let i = 0; i <= 6; i++) {
      merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } })
    }
    
    // Merge Container No. row (span all 5 columns)
    merges.push({ s: { r: 10, c: 0 }, e: { r: 10, c: 4 } })
    
    // Calculate Total Items row position
    const totalItemsRow = 13 + items.length  // 13 = rows before table data
    merges.push({ s: { r: totalItemsRow, c: 0 }, e: { r: totalItemsRow, c: 4 } })
    
    // Calculate Narrative Findings rows position
    const narrativeLabelRow = totalItemsRow + 2
    const narrativeContentRow = narrativeLabelRow + 1
    merges.push({ s: { r: narrativeLabelRow, c: 0 }, e: { r: narrativeLabelRow, c: 4 } })
    merges.push({ s: { r: narrativeContentRow, c: 0 }, e: { r: narrativeContentRow, c: 4 } })

    ws['!merges'] = merges

    XLSX.utils.book_append_sheet(wb, ws, "Damage Report")
    
    // Generate filename
    const filename = `Damage_Report_${reportData.report_number || reportData.id || 'unknown'}.xlsx`
    
    // Write and download
    XLSX.writeFile(wb, filename)
  }

  // Batch export method
  static generateBatchExcel(reports: DamageReport[]): void {
    if (reports.length === 0) {
      alert('No reports to export')
      return
    }

    const wb = XLSX.utils.book_new()
    
    // Create a summary sheet
    const summaryData = [
      ["DAMAGE REPORTS SUMMARY - SF EXPRESS WAREHOUSE"],
      ["Export Date:", new Date().toISOString().split('T')[0]],
      [""],
      ["Report No.", "Report Date", "Driver Name", "Plate No.", "Total Items", "Prepared By"],
      ...reports.map(report => {
        const items = report.items || ((report as any).damage_items || [])
        return [
          report.report_number || report.id,
          report.report_date,
          report.driver_name,
          report.plate_no,
          items.length,
          report.prepared_by
        ]
      })
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 20 }
    ]
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
    ]
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

    // Create individual sheets for each report
    reports.forEach((report, index) => {
      const items = report.items || ((report as any).damage_items || [])
      
      const data = [
        ["SF EXPRESS WAREHOUSE"],
        ["LIPPER TINGUB, MANDAUE, CEBU"],
        [""],
        [report.report_number || report.id],
        [""],
        ["DAMAGE AND DEVIATION REPORT"],
        [""],
        ["Report Date", report.report_date, "", "Driver Name", report.driver_name],
        ["Plate No.", report.plate_no, "", "Seal No.", report.seal_no || ""],
        ["Container No.", report.container_no || ""],
        [""],
        ["NO.", "MATERIAL DESCRIPTION", "SERIAL NO.", "DAMAGE TYPE", "DAMAGE DESCRIPTION"],
        ...items.map(item => [
          item.item_number,
          item.material_description || 'Unknown',
          item.barcode,
          item.damage_type || '',
          item.damage_description || ''
        ]),
        [""],
        [`TOTAL ITEMS: ${items.length}`],
        [""],
        ["Narrative Findings:"],
        [report.narrative_findings || 'N/A'],
        [""],
        ["Prepared By:", "Noted By:", "Acknowledged By:"],
        [
          (report.prepared_by || '').toUpperCase(),
          (report.noted_by || '').toUpperCase(),
          (report.acknowledged_by || '').toUpperCase()
        ],
        ["Admin Staff", "Security Guard", "Supervisor"]
      ]

      const ws = XLSX.utils.aoa_to_sheet(data)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 25 }
      ]

      // Merge cells
      const merges = []
      // Merge header rows (0-6)
      for (let i = 0; i <= 6; i++) {
        merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } })
      }
      // Merge Container No.
      merges.push({ s: { r: 9, c: 0 }, e: { r: 9, c: 4 } })
      // Calculate positions
      const totalItemsRow = 13 + items.length
      const narrativeLabelRow = totalItemsRow + 2
      const narrativeContentRow = narrativeLabelRow + 1
      
      merges.push({ s: { r: totalItemsRow, c: 0 }, e: { r: totalItemsRow, c: 4 } })
      merges.push({ s: { r: narrativeLabelRow, c: 0 }, e: { r: narrativeLabelRow, c: 4 } })
      merges.push({ s: { r: narrativeContentRow, c: 0 }, e: { r: narrativeContentRow, c: 4 } })

      ws['!merges'] = merges

      // Create sheet name (Excel limits to 31 characters)
      const sheetName = `Report_${index + 1}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    const filename = `Damage_Reports_Export_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  // Helper method to generate Excel from blob (for web workers or service workers)
  static generateExcelAsBlob(reportData: DamageReport): Blob {
    const wb = XLSX.utils.book_new()
    const items = reportData.items || ((reportData as any).damage_items || [])
    
    const data = [
      ["SF EXPRESS WAREHOUSE"],
      ["LIPPER TINGUB, MANDAUE, CEBU"],
      [""],
      [reportData.report_number],
      [""],
      ["DAMAGE AND DEVIATION REPORT"],
      [""],
      ["Report Date", reportData.report_date, "", "Driver Name", reportData.driver_name],
      ["Plate No.", reportData.plate_no, "", "Seal No.", reportData.seal_no || ""],
      ["Container No.", reportData.container_no || ""],
      [""],
      ["NO.", "MATERIAL DESCRIPTION", "SERIAL NO.", "DAMAGE TYPE", "DAMAGE DESCRIPTION"],
      ...items.map(item => [
        item.item_number,
        item.material_description || 'Unknown',
        item.barcode,
        item.damage_type || '',
        item.damage_description || ''
      ]),
      [""],
      [`TOTAL ITEMS: ${items.length}`],
      [""],
      ["Narrative Findings:"],
      [reportData.narrative_findings || 'N/A'],
      [""],
      ["Prepared By:", "Noted By:", "Acknowledged By:"],
      [
        (reportData.prepared_by || '').toUpperCase(),
        (reportData.noted_by || '').toUpperCase(),
        (reportData.acknowledged_by || '').toUpperCase()
      ],
      ["Admin Staff", "Security Guard", "Supervisor"]
    ]

    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 25 }
    ]

    // Merge cells
    const merges = []
    for (let i = 0; i <= 6; i++) {
      merges.push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } })
    }
    
    merges.push({ s: { r: 9, c: 0 }, e: { r: 9, c: 4 } })
    
    const totalItemsRow = 13 + items.length
    const narrativeLabelRow = totalItemsRow + 2
    const narrativeContentRow = narrativeLabelRow + 1
    
    merges.push({ s: { r: totalItemsRow, c: 0 }, e: { r: totalItemsRow, c: 4 } })
    merges.push({ s: { r: narrativeLabelRow, c: 0 }, e: { r: narrativeLabelRow, c: 4 } })
    merges.push({ s: { r: narrativeContentRow, c: 0 }, e: { r: narrativeContentRow, c: 4 } })

    ws['!merges'] = merges

    XLSX.utils.book_append_sheet(wb, ws, "Damage Report")
    
    // Convert to blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
}