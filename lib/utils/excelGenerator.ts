// lib/utils/excelGenerator.ts
import { DamageReport } from '@/lib/services/damageReportService'
import * as XLSX from 'xlsx'

export class ExcelGenerator {
  static generateExcel(reportData: DamageReport): void {
    // Create workbook
    const wb = XLSX.utils.book_new()
    wb.Props = {
      Title: `Damage Report ${reportData.report_number}`,
      Subject: "Damage and Deviation Report",
      Author: "SF Express Warehouse",
      CreatedDate: new Date()
    }

    // Create main report sheet
    const mainData = [
      ["SF EXPRESS WAREHOUSE", "", "", "", "", ""],
      ["DAMAGE AND DEVIATION REPORT", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["Report Number:", reportData.report_number, "", "Report Date:", reportData.report_date, ""],
      ["Driver Name:", reportData.driver_name, "", "Plate No:", reportData.plate_no, ""],
      ["Seal No:", reportData.seal_no, "", "Container No:", reportData.container_no, ""],
      ["", "", "", "", "", ""],
      ["Prepared By:", reportData.prepared_by, "", "Position:", "Admin Staff", ""],
      ["Noted By:", reportData.noted_by, "", "Position:", "Security Guard", ""],
      ["Acknowledged By:", reportData.acknowledged_by, "", "Position:", "Supervisor", ""],
      ["", "", "", "", "", ""],
      ["Narrative Findings:", "", "", "", "", ""],
      [reportData.narrative_findings || 'N/A', "", "", "", "", ""],
      ["", "", "", "", "", ""],
    ]

    const ws_main = XLSX.utils.aoa_to_sheet(mainData)
    
    // Set column widths for main sheet
    const colWidths = [
      { wch: 15 }, // A
      { wch: 25 }, // B
      { wch: 10 }, // C
      { wch: 15 }, // D
      { wch: 25 }, // E
      { wch: 10 }, // F
    ]
    ws_main['!cols'] = colWidths

    // Merge cells for headers
    ws_main['!merges'] = [
      // SF EXPRESS WAREHOUSE header
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      // DAMAGE AND DEVIATION REPORT header
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      // Narrative Findings header
      { s: { r: 11, c: 0 }, e: { r: 11, c: 5 } },
      // Narrative Findings content
      { s: { r: 12, c: 0 }, e: { r: 12, c: 5 } }
    ]

    XLSX.utils.book_append_sheet(wb, ws_main, "Report Summary")

    // Create items sheet if there are items
    const items = reportData.items || ((reportData as any).damage_items || [])
    if (items.length > 0) {
      const itemsData = [
        ["DAMAGED ITEMS LIST"],
        ["", "", "", "", ""],
        ["No.", "Material Description", "Serial No.", "Damage Type", "Damage Description"],
        ...items.map(item => [
          item.item_number,
          item.material_description || 'Unknown',
          item.barcode,
          item.damage_type || '',
          item.damage_description || ''
        ]),
        ["", "", "", "", ""],
        ["Total Items:", items.length, "", "", ""]
      ]

      const ws_items = XLSX.utils.aoa_to_sheet(itemsData)
      
      // Set column widths for items sheet
      ws_items['!cols'] = [
        { wch: 5 },   // A: No.
        { wch: 40 },  // B: Material Description
        { wch: 20 },  // C: Serial No.
        { wch: 15 },  // D: Damage Type
        { wch: 50 },  // E: Damage Description
      ]

      // Merge header cell
      ws_items['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
      ]

      XLSX.utils.book_append_sheet(wb, ws_items, "Damaged Items")
    }

    // Generate filename
    const filename = `Damage_Report_${reportData.report_number || reportData.id || 'unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Write and download
    XLSX.writeFile(wb, filename)
  }

  // Alternative method that returns Blob for downloading
  static generateExcelAsBlob(reportData: DamageReport): Blob {
    const wb = XLSX.utils.book_new()
    wb.Props = {
      Title: `Damage Report ${reportData.report_number}`,
      Subject: "Damage and Deviation Report",
      Author: "SF Express Warehouse",
      CreatedDate: new Date()
    }

    // Create main report sheet
    const mainData = [
      ["SF EXPRESS WAREHOUSE", "", "", "", "", ""],
      ["DAMAGE AND DEVIATION REPORT", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["Report Number:", reportData.report_number, "", "Report Date:", reportData.report_date, ""],
      ["Driver Name:", reportData.driver_name, "", "Plate No:", reportData.plate_no, ""],
      ["Seal No:", reportData.seal_no, "", "Container No:", reportData.container_no, ""],
      ["", "", "", "", "", ""],
      ["Prepared By:", reportData.prepared_by.toUpperCase(), "", "Position:", "Admin Staff", ""],
      ["Noted By:", reportData.noted_by.toUpperCase(), "", "Position:", "Security Guard", ""],
      ["Acknowledged By:", reportData.acknowledged_by.toUpperCase(), "", "Position:", "Supervisor", ""],
      ["", "", "", "", "", ""],
      ["Narrative Findings:", "", "", "", "", ""],
      [reportData.narrative_findings || 'N/A', "", "", "", "", ""],
      ["", "", "", "", "", ""],
    ]

    const ws_main = XLSX.utils.aoa_to_sheet(mainData)
    
    // Set column widths
    ws_main['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 10 },
      { wch: 15 }, { wch: 25 }, { wch: 10 }
    ]

    // Merge cells
    ws_main['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 11, c: 0 }, e: { r: 11, c: 5 } },
      { s: { r: 12, c: 0 }, e: { r: 12, c: 5 } }
    ]

    XLSX.utils.book_append_sheet(wb, ws_main, "Report Summary")

    // Create items sheet
    const items = reportData.items || ((reportData as any).damage_items || [])
    if (items.length > 0) {
      const itemsData = [
        ["DAMAGED ITEMS LIST"],
        ["", "", "", "", ""],
        ["No.", "Material Description", "Serial No.", "Damage Type", "Damage Description"],
        ...items.map(item => [
          item.item_number,
          item.material_description || 'Unknown',
          item.barcode,
          item.damage_type || '',
          item.damage_description || ''
        ]),
        ["", "", "", "", ""],
        ["Total Items:", items.length, "", "", ""]
      ]

      const ws_items = XLSX.utils.aoa_to_sheet(itemsData)
      
      ws_items['!cols'] = [
        { wch: 5 }, { wch: 40 }, { wch: 20 },
        { wch: 15 }, { wch: 50 }
      ]

      ws_items['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
      ]

      XLSX.utils.book_append_sheet(wb, ws_items, "Damaged Items")
    }

    // Convert to blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Method for batch export of multiple reports
  static generateBatchExcel(reports: DamageReport[]): void {
    const wb = XLSX.utils.book_new()
    wb.Props = {
      Title: "Damage Reports Export",
      Subject: "Multiple Damage Reports",
      Author: "SF Express Warehouse",
      CreatedDate: new Date()
    }

    // Create summary sheet with all reports
    const summaryData = [
      ["DAMAGE REPORTS SUMMARY"],
      ["", "", "", "", "", "", "", ""],
      ["Report No.", "Report Date", "Driver Name", "Plate No.", "Total Items", "Prepared By", "Noted By", "Acknowledged By"],
      ...reports.map(report => {
        const items = report.items || ((report as any).damage_items || [])
        return [
          report.report_number || report.id,
          report.report_date,
          report.driver_name,
          report.plate_no,
          items.length,
          report.prepared_by,
          report.noted_by,
          report.acknowledged_by
        ]
      })
    ]

    const ws_summary = XLSX.utils.aoa_to_sheet(summaryData)
    ws_summary['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }
    ]
    
    ws_summary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
    ]

    XLSX.utils.book_append_sheet(wb, ws_summary, "Summary")

    // Create individual sheets for each report
    reports.forEach((report, index) => {
      const items = report.items || ((report as any).damage_items || [])
      const reportData = [
        ["DAMAGE AND DEVIATION REPORT"],
        [`Report Number: ${report.report_number || report.id}`],
        [`Report Date: ${report.report_date}`],
        ["", "", "", "", ""],
        ["No.", "Material Description", "Serial No.", "Damage Type", "Damage Description"],
        ...items.map(item => [
          item.item_number,
          item.material_description || 'Unknown',
          item.barcode,
          item.damage_type || '',
          item.damage_description || ''
        ]),
        ["", "", "", "", ""],
        ["Total Items:", items.length, "", "", ""],
        ["", "", "", "", ""],
        ["Narrative Findings:", "", "", "", ""],
        [report.narrative_findings || 'N/A', "", "", "", ""]
      ]

      const ws = XLSX.utils.aoa_to_sheet(reportData)
      ws['!cols'] = [
        { wch: 5 }, { wch: 40 }, { wch: 20 },
        { wch: 15 }, { wch: 50 }
      ]
      
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 4 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 4 } }
      ]

      const sheetName = `Report_${index + 1}_${report.report_number?.substring(0, 10) || report.id?.substring(0, 8) || 'unknown'}`
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)) // Excel sheet names max 31 chars
    })

    // Generate filename
    const filename = `Damage_Reports_Export_${new Date().toISOString().split('T')[0]}.xlsx`

    // Write and download
    XLSX.writeFile(wb, filename)
  }
}