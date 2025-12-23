"use client"

import type React from "react"
import { useState, useRef } from "react"
import * as XLSX from 'xlsx-js-style';
import { Upload, X, FileSpreadsheet, Download, FileText } from "lucide-react"

interface MaterialData {
  materialCode: string
  materialDescription: string
  category: string
  qty: number
  remarks: string
  shipName: string
}

interface SerialData {
  dnNo: string
  orderItem: string
  factoryCode: string
  location: string
  binCode: string
  materialCode: string
  materialDesc: string
  barcode: string
  materialType: string
  productStatus: string
  shipTo: string
  shipToName: string
  shipToAddress: string
  soldTo: string
  soldToName: string
  scanBy: string
  scanTime: string
}

interface UploadedFile {
  id: string
  name: string
  dnNo: string
  data: MaterialData[]
  serialData: SerialData[]
}

type TabType = "consolidated" | "serialList" | "individualDN"

export default function ExcelUploader() {
  const [groupedData, setGroupedData] = useState<MaterialData[]>([])
  const [serialListData, setSerialListData] = useState<SerialData[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const [animatingRows, setAnimatingRows] = useState<Set<number>>(new Set())
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [showFilesList, setShowFilesList] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("consolidated")
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState<"pdf" | "excel">("excel")
  const [selectedDownloadFile, setSelectedDownloadFile] = useState<UploadedFile | null>(null)

  const getCategoryFromBinCode = (binCode: string): string => {
    const code = String(binCode || "").toUpperCase()
    if (code.includes("HAC")) return "Home Air Conditioner"
    if (code.includes("TV") || code.includes("LED")) return "TV"
    if (code.includes("WM") || code.includes("WASH")) return "Washing Machine"
    if (code.includes("REF") || code.includes("FRIDGE")) return "Refrigerator"
    if (code.includes("FAN")) return "Fan"
    return "Others"
  }

  const formatDate = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return now.toLocaleDateString("en-US", options)
  }

  const HaierLogo = () => (
    <img 
      src="https://i0.wp.com/technode.com/wp-content/uploads/2024/11/%E6%88%AA%E5%B1%8F2024-11-20-17.05.54.png?fit=1696,1136&ssl=1" 
      alt="Haier Logo" 
      style={{ height: "40px", width: "auto" }}
    />
  )

  const groupAllData = (files: UploadedFile[]): MaterialData[] => {
    const groupedMap = new Map<string, MaterialData>()

    files.forEach((file) => {
      file.data.forEach((item) => {
        const key = `${item.materialCode}|${item.materialDescription}|${item.remarks}`

        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key)!
          existing.qty += item.qty
          if (item.shipName && !existing.shipName.includes(item.shipName)) {
            existing.shipName = existing.shipName ? `${existing.shipName}, ${item.shipName}` : item.shipName
          }
        } else {
          groupedMap.set(key, { ...item, qty: item.qty })
        }
      })
    })

    return Array.from(groupedMap.values())
  }

  const combineAllSerialData = (files: UploadedFile[]): SerialData[] => {
    const allSerialData: SerialData[] = []
    files.forEach((file) => {
      allSerialData.push(...file.serialData)
    })
    return allSerialData.filter((row) => row.materialCode && row.barcode)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)

    try {
      const newFiles: UploadedFile[] = []

      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx]

        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        const headers = jsonData[0].map((h: any) =>
          String(h || "")
            .toLowerCase()
            .trim(),
        )

        // Parse for consolidated materials
        const dnNoIdx = headers.findIndex((h) => h.includes("dn no") || h.includes("dn_no") || h.includes("dnno"))
        const materialCodeIdx = headers.findIndex((h) => h.includes("material code") || h.includes("materialcode"))
        const materialDescIdx = headers.findIndex(
          (h) => h.includes("material desc") || h.includes("material description"),
        )
        const binCodeIdx = headers.findIndex((h) => h.includes("bincode") || h.includes("bin code"))
        const shipToNameIdx = headers.findIndex(
          (h) =>
            h.includes("ship to name") || h.includes("shiptoname") || h.includes("ship name") || h.includes("shipname"),
        )

        // Parse for serial list - all columns
        const orderItemIdx = headers.findIndex((h) => h.includes("order item") || h.includes("orderitem"))
        const factoryCodeIdx = headers.findIndex((h) => h.includes("factory code") || h.includes("factorycode"))
        const locationIdx = headers.findIndex((h) => h.includes("location"))
        const barcodeIdx = headers.findIndex((h) => h.includes("barcode"))
        const materialTypeIdx = headers.findIndex((h) => h.includes("material type") || h.includes("materialtype"))
        const productStatusIdx = headers.findIndex((h) => h.includes("product status") || h.includes("productstatus"))
        const shipToIdx = headers.findIndex((h) => h === "ship to" || h === "shipto")
        const shipToAddressIdx = headers.findIndex((h) => h.includes("ship to address") || h.includes("shiptoaddress"))
        const soldToIdx = headers.findIndex((h) => h === "sold to" || h === "soldto")
        const soldToNameIdx = headers.findIndex((h) => h.includes("sold to name") || h.includes("soldtoname"))
        const scanByIdx = headers.findIndex((h) => h.includes("scan by") || h.includes("scanby"))
        const scanTimeIdx = headers.findIndex((h) => h.includes("scan time") || h.includes("scantime"))

        let dnNo = "N/A"
        if (dnNoIdx >= 0 && jsonData[1]) {
          dnNo = String(jsonData[1][dnNoIdx] || "N/A")
        }

        const fileData: MaterialData[] = []
        const serialData: SerialData[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]

          if (!row || row.length === 0 || !row[materialCodeIdx]) continue

          const materialCode = String(row[materialCodeIdx] || "").trim()
          const materialDescription = materialDescIdx >= 0 ? String(row[materialDescIdx] || "").trim() : ""
          const binCode = binCodeIdx >= 0 ? String(row[binCodeIdx] || "") : ""
          const shipName = shipToNameIdx >= 0 ? String(row[shipToNameIdx] || "").trim() : ""

          if (!materialCode) continue

          // Check if there's a quantity column in the Excel
          const qtyIdx = headers.findIndex((h) => h.includes("qty") || h.includes("quantity") || h.includes("qnt"))
          const qty = qtyIdx >= 0 ? Number.parseInt(String(row[qtyIdx] || "1"), 10) || 1 : 1

          const category = getCategoryFromBinCode(binCode)

          fileData.push({
            materialCode,
            materialDescription,
            category,
            qty,
            remarks: dnNo,
            shipName,
          })

          serialData.push({
            dnNo: dnNoIdx >= 0 ? String(row[dnNoIdx] || dnNo) : dnNo,
            orderItem: orderItemIdx >= 0 ? String(row[orderItemIdx] || "") : "",
            factoryCode: factoryCodeIdx >= 0 ? String(row[factoryCodeIdx] || "") : "",
            location: locationIdx >= 0 ? String(row[locationIdx] || "") : "",
            binCode: binCode,
            materialCode: materialCode,
            materialDesc: materialDescription,
            barcode: barcodeIdx >= 0 ? String(row[barcodeIdx] || "") : "",
            materialType: materialTypeIdx >= 0 ? String(row[materialTypeIdx] || "") : "",
            productStatus: productStatusIdx >= 0 ? String(row[productStatusIdx] || "") : "",
            shipTo: shipToIdx >= 0 ? String(row[shipToIdx] || "") : "",
            shipToName: shipName,
            shipToAddress: shipToAddressIdx >= 0 ? String(row[shipToAddressIdx] || "") : "",
            soldTo: soldToIdx >= 0 ? String(row[soldToIdx] || "") : "",
            soldToName: soldToNameIdx >= 0 ? String(row[soldToNameIdx] || "") : "",
            scanBy: scanByIdx >= 0 ? String(row[scanByIdx] || "") : "",
            scanTime: scanTimeIdx >= 0 ? String(row[scanTimeIdx] || "") : "",
          })
        }

        newFiles.push({
          id: `${Date.now()}-${fileIdx}`,
          name: file.name,
          dnNo,
          data: fileData,
          serialData: serialData,
        })
      }

      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      const newGroupedData = groupAllData(allFiles)
      setGroupedData(newGroupedData)
      const newSerialListData = combineAllSerialData(allFiles)
      setSerialListData(newSerialListData)

      // Trigger staggered animation
      setAnimatingRows(new Set())
      const dataLength = activeTab === "consolidated" ? newGroupedData.length : newSerialListData.length
      Array.from({ length: dataLength }).forEach((_, idx) => {
        setTimeout(() => {
          setAnimatingRows((prev) => {
            const newSet = new Set(prev)
            newSet.add(idx)
            return newSet
          })
        }, idx * 50)
      })

      // Scroll to table after animation completes
      setTimeout(
        () => {
          tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        },
        dataLength * 50 + 300,
      )
    } catch (error) {
      console.error("Error parsing Excel file:", error)
      alert("Error parsing Excel file. Please make sure it contains the required columns.")
    } finally {
      setIsLoading(false)
      e.target.value = ""
    }
  }

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    setGroupedData(groupAllData(updatedFiles))
    setSerialListData(combineAllSerialData(updatedFiles))
  }

  const handleClear = () => {
    setGroupedData([])
    setSerialListData([])
    setUploadedFiles([])
    setAnimatingRows(new Set())
    setSelectedFileId(null)
    setShowFilesList(false)
  }

  const groupSingleFileData = (fileData: MaterialData[]): MaterialData[] => {
    const groupedMap = new Map<string, MaterialData>()

    fileData.forEach((item) => {
      const key = `${item.materialCode}|${item.materialDescription}|${item.remarks}`

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!
        existing.qty += item.qty
        if (item.shipName && !existing.shipName.includes(item.shipName)) {
          existing.shipName = existing.shipName ? `${existing.shipName}, ${item.shipName}` : item.shipName
        }
      } else {
        groupedMap.set(key, { ...item, qty: item.qty })
      }
    })

    return Array.from(groupedMap.values())
  }

  const handleSelectFile = (fileId: string) => {
    // Toggle: if already selected, unselect
    if (selectedFileId === fileId) {
      setSelectedFileId(null)
      if (activeTab === "consolidated") {
        const allGrouped = groupAllData(uploadedFiles)
        setGroupedData(allGrouped)
        setAnimatingRows(new Set())

        allGrouped.forEach((_, idx) => {
          setTimeout(() => {
            setAnimatingRows((prev) => {
              const newSet = new Set(prev)
              newSet.add(idx)
              return newSet
            })
          }, idx * 30)
        })
      } else {
        const allSerial = combineAllSerialData(uploadedFiles)
        setSerialListData(allSerial)
        setAnimatingRows(new Set())

        allSerial.forEach((_, idx) => {
          setTimeout(() => {
            setAnimatingRows((prev) => {
              const newSet = new Set(prev)
              newSet.add(idx)
              return newSet
            })
          }, idx * 30)
        })
      }

      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
    } else {
      // Select new file
      setSelectedFileId(fileId)
      setAnimatingRows(new Set())

      const selectedFile = uploadedFiles.find((f) => f.id === fileId)
      if (selectedFile) {
        if (activeTab === "consolidated") {
          const groupedData = groupSingleFileData(selectedFile.data)
          setGroupedData(groupedData)

          groupedData.forEach((_, idx) => {
            setTimeout(() => {
              setAnimatingRows((prev) => {
                const newSet = new Set(prev)
                newSet.add(idx)
                return newSet
              })
            }, idx * 50)
          })

          setTimeout(
            () => {
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            },
            groupedData.length * 50 + 300,
          )
        } else {
          setSerialListData(selectedFile.serialData)

          selectedFile.serialData.forEach((_, idx) => {
            setTimeout(() => {
              setAnimatingRows((prev) => {
                const newSet = new Set(prev)
                newSet.add(idx)
                return newSet
              })
            }, idx * 50)
          })

          setTimeout(
            () => {
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            },
            selectedFile.serialData.length * 50 + 300,
          )
        }
      }
    }
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  const handleDownloadConfirm = () => {
    setShowDownloadModal(false)
    if (downloadType === "pdf") {
      if (selectedDownloadFile) {
        handleDownloadIndividualDNPDF(selectedDownloadFile)
      } else {
        handleDownloadPDF()
      }
    } else {
      if (selectedDownloadFile) {
        handleDownloadIndividualDN(selectedDownloadFile)
      } else {
        handleDownloadExcel()
      }
    }
    setSelectedDownloadFile(null)
  }

  const handleDownloadPDF = () => {
    // Create a printable HTML document
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeTab === "consolidated" ? "Consolidated Materials" : "Bulking Serial List"}</title>
        <style>
          @page {
            size: landscape;
            margin: 15mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            color: #000;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0057A8;
          }
          .logo img {
            height: 40px;
            width: auto;
          }
          .date {
            text-align: right;
            font-size: 12px;
            color: #000;
            font-weight: bold;
          }
          h1 {
            color: #000;
            margin: 15px 0;
            font-size: 20px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px 6px;
            text-align: center;
            word-wrap: break-word;
            color: #000;
          }
          th {
            background-color: #D3D3D3;
            color: #000;
            font-weight: bold;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .qty-cell {
            font-weight: bold;
            color: #000;
          }
          .barcode-cell {
            font-family: Arial, sans-serif;
            font-weight: bold;
            color: #000;
            font-size: 9px;
          }
          .material-code-cell {
            font-weight: 600;
            font-size: 10px;
            color: #000;
          }
          .desc-cell {
            text-align: left;
            max-width: 200px;
            font-size: 9px;
            color: #000;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            @page {
              size: landscape;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <img src="https://i0.wp.com/technode.com/wp-content/uploads/2024/11/%E6%88%AA%E5%B1%8F2024-11-20-17.05.54.png?fit=1696,1136&ssl=1" alt="Haier Logo" />
          </div>
          <div class="date">
            <strong>Date Printed:</strong><br/>
            ${formatDate()}
          </div>
        </div>
        <h1>${activeTab === "consolidated" ? "Consolidated Materials Report" : "Bulking Serial List Report"}</h1>
        ${
          activeTab === "consolidated"
            ? `
        <table>
          <thead>
            <tr>
              <th>MATERIAL CODE</th>
              <th>MATERIAL DESCRIPTION</th>
              <th>CATEGORY</th>
              <th>QTY.</th>
              <th>UM</th>
              <th>SHIPNAME</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${groupedData
              .filter((row) => row.materialCode && row.materialDescription)
              .map(
                (row) => `
              <tr>
                <td class="material-code-cell">${row.materialCode}</td>
                <td class="desc-cell">${row.materialDescription}</td>
                <td>${row.category}</td>
                <td class="qty-cell">${row.qty}</td>
                <td>-</td>
                <td class="desc-cell">${row.shipName}</td>
                <td>${row.remarks}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        `
            : `
        <table>
          <thead>
            <tr>
              <th>DN No</th>
              <th>Location</th>
              <th>Bin Code</th>
              <th>Material Code</th>
              <th>Material Desc</th>
              <th>Barcode</th>
              <th>Ship To Name</th>
              <th>Ship To Address</th>
            </tr>
          </thead>
          <tbody>
            ${serialListData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row) => `
              <tr>
                <td>${row.dnNo}</td>
                <td class="desc-cell">${row.location}</td>
                <td>${row.binCode}</td>
                <td class="material-code-cell">${row.materialCode}</td>
                <td class="desc-cell">${row.materialDesc}</td>
                <td class="barcode-cell">${row.barcode}</td>
                <td class="desc-cell">${row.shipToName}</td>
                <td class="desc-cell">${row.shipToAddress}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        `
        }
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  const handleDownloadIndividualDNPDF = (file: UploadedFile) => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${file.dnNo} - Serial List</title>
        <style>
          @page {
            size: landscape;
            margin: 15mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            color: #000;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #0057A8;
          }
          .logo img {
            height: 40px;
            width: auto;
          }
          .date {
            text-align: right;
            font-size: 12px;
            color: #000;
            font-weight: bold;
          }
          h1 {
            color: #000;
            margin: 15px 0;
            font-size: 20px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px 6px;
            text-align: center;
            word-wrap: break-word;
            color: #000;
          }
          th {
            background-color: #D3D3D3;
            color: #000;
            font-weight: bold;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .barcode-cell {
            font-family: Arial, sans-serif;
            font-weight: bold;
            color: #000;
            font-size: 9px;
          }
          .material-code-cell {
            font-weight: 600;
            font-size: 10px;
            color: #000;
          }
          .desc-cell {
            text-align: left;
            max-width: 200px;
            font-size: 9px;
            color: #000;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
            @page {
              size: landscape;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <img src="https://i.imgur.com/YXK7RZE.png" alt="Haier Logo" />
          </div>
          <div class="date">
            <strong>Date Printed:</strong><br/>
            ${formatDate()}
          </div>
        </div>
        <h1>DN ${file.dnNo} - Serial List Report</h1>
        <table>
          <thead>
            <tr>
              <th>DN No</th>
              <th>Location</th>
              <th>Bin Code</th>
              <th>Material Code</th>
              <th>Material Desc</th>
              <th>Barcode</th>
              <th>Ship To Name</th>
              <th>Ship To Address</th>
            </tr>
          </thead>
          <tbody>
            ${file.serialData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row) => `
              <tr>
                <td>${row.dnNo}</td>
                <td class="desc-cell">${row.location}</td>
                <td>${row.binCode}</td>
                <td class="material-code-cell">${row.materialCode}</td>
                <td class="desc-cell">${row.materialDesc}</td>
                <td class="barcode-cell">${row.barcode}</td>
                <td class="desc-cell">${row.shipToName}</td>
                <td class="desc-cell">${row.shipToAddress}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new()

    if (activeTab === "consolidated") {
      const wsData: any[][] = []
      
      // Add logo and date header rows
      wsData.push(["HAIER", "", "", "", "", "", `Date Printed: ${formatDate()}`])
      wsData.push([]) // Empty row for spacing
      wsData.push(["MATERIAL CODE", "MATERIAL DESCRIPTION", "CATEGORY", "QTY.", "UM", "SHIPNAME", "REMARKS"])

      groupedData.forEach((row) => {
        wsData.push([row.materialCode, row.materialDescription, row.category, row.qty, "", row.shipName, row.remarks])
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [{ wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 8 }, { wch: 6 }, { wch: 28 }, { wch: 18 }]

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" }

          if (!ws[cellAddress].s) ws[cellAddress].s = {}

          ws[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          }

          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true }
          ws[cellAddress].s.font = { name: "Arial", color: { rgb: "000000" } }

          // Header row (row 0 - HAIER and Date)
          if (R === 0) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 14, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" } }
            if (C === 0) {
              ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" }
            } else if (C === 6) {
              ws[cellAddress].s.alignment = { horizontal: "right", vertical: "center" }
            }
          }

          // Column headers (row 2)
          if (R === 2) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 12, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "D3D3D3" } }
          }

          // QTY column bold
          if (C === 3 && R > 2) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, color: { rgb: "000000" } }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Consolidated Materials")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Consolidated_Materials_${Date.now()}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } else if (activeTab === "serialList") {
      const wsData: any[][] = []
      
      // Add logo and date header rows
      wsData.push(["HAIER", "", "", "", "", "", "", `Date Printed: ${formatDate()}`])
      wsData.push([]) // Empty row for spacing
      wsData.push([
        "DN No",
        "Location",
        "binCode",
        "Material Code",
        "Material Desc",
        "Barcode",
        "Ship To Name",
        "Ship To Address",
      ])

      serialListData.forEach((row) => {
        wsData.push([
          row.dnNo,
          row.location,
          row.binCode,
          row.materialCode,
          row.materialDesc,
          row.barcode,
          row.shipToName,
          row.shipToAddress,
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
        { wch: 40 },
        { wch: 30 },
        { wch: 35 },
        { wch: 45 },
      ]

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" }

          if (!ws[cellAddress].s) ws[cellAddress].s = {}

          ws[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          }

          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true }
          ws[cellAddress].s.font = { name: "Arial", color: { rgb: "000000" } }

          // Header row (row 0 - HAIER and Date)
          if (R === 0) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 14, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" } }
            if (C === 0) {
              ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" }
            } else if (C === 7) {
              ws[cellAddress].s.alignment = { horizontal: "right", vertical: "center" }
            }
          }

          // Column headers (row 2)
          if (R === 2) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 12, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "D3D3D3" } }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Bulking Serial List")

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true })
      const blob = new Blob([wbout], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Bulking_Serial_List_${Date.now()}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleDownloadIndividualDN = (file: UploadedFile) => {
    const wb = XLSX.utils.book_new()
    const wsData: any[][] = []
    
    // Add logo and date header rows
    wsData.push(["HAIER", "", "", "", "", "", "", `Date Printed: ${formatDate()}`])
    wsData.push([]) // Empty row for spacing
    wsData.push([
      "DN No",
      "Location",
      "binCode",
      "Material Code",
      "Material Desc",
      "Barcode",
      "Ship To Name",
      "Ship To Address",
    ])

    file.serialData.forEach((row) => {
      wsData.push([
        row.dnNo,
        row.location,
        row.binCode,
        row.materialCode,
        row.materialDesc,
        row.barcode,
        row.shipToName,
        row.shipToAddress,
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 40 },
      { wch: 30 },
      { wch: 35 },
      { wch: 45 },
    ]

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" }

        if (!ws[cellAddress].s) ws[cellAddress].s = {}

        ws[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        }

        ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true }
        ws[cellAddress].s.font = { name: "Arial", color: { rgb: "000000" } }

        // Header row (row 0 - HAIER and Date)
        if (R === 0) {
          ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 14, color: { rgb: "000000" } }
          ws[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" } }
          if (C === 0) {
            ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" }
          } else if (C === 7) {
            ws[cellAddress].s.alignment = { horizontal: "right", vertical: "center" }
          }
        }

        // Column headers (row 2)
        if (R === 2) {
          ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 12, color: { rgb: "000000" } }
          ws[cellAddress].s.fill = { fgColor: { rgb: "D3D3D3" } }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, file.dnNo)

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${file.dnNo}_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAllDN = () => {
    const wb = XLSX.utils.book_new()
    const sheetNames = new Map<string, number>()

    uploadedFiles.forEach((file) => {
      const wsData: any[][] = []
      
      // Add logo and date header rows
      wsData.push(["HAIER", "", "", "", "", "", "", `Date Printed: ${formatDate()}`])
      wsData.push([]) // Empty row for spacing
      wsData.push([
        "DN No",
        "Location",
        "binCode",
        "Material Code",
        "Material Desc",
        "Barcode",
        "Ship To Name",
        "Ship To Address",
      ])

      file.serialData.forEach((row) => {
        wsData.push([
          row.dnNo,
          row.location,
          row.binCode,
          row.materialCode,
          row.materialDesc,
          row.barcode,
          row.shipToName,
          row.shipToAddress,
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
        { wch: 40 },
        { wch: 30 },
        { wch: 35 },
        { wch: 45 },
      ]

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) ws[cellAddress] = { t: "s", v: "" }

          if (!ws[cellAddress].s) ws[cellAddress].s = {}

          ws[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          }

          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true }
          ws[cellAddress].s.font = { name: "Arial", color: { rgb: "000000" } }

          // Header row (row 0 - HAIER and Date)
          if (R === 0) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 14, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" } }
            if (C === 0) {
              ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" }
            } else if (C === 7) {
              ws[cellAddress].s.alignment = { horizontal: "right", vertical: "center" }
            }
          }

          // Column headers (row 2)
          if (R === 2) {
            ws[cellAddress].s.font = { name: "Arial", bold: true, sz: 12, color: { rgb: "000000" } }
            ws[cellAddress].s.fill = { fgColor: { rgb: "D3D3D3" } }
          }
        }
      }

      let sheetName = file.dnNo
      if (sheetNames.has(file.dnNo)) {
        const count = sheetNames.get(file.dnNo)! + 1
        sheetNames.set(file.dnNo, count)
        sheetName = `${file.dnNo} (${count})`
      } else {
        sheetNames.set(file.dnNo, 1)
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `All_DN_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-accent/20">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-row {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        .animate-file {
          animation: slideInLeft 0.4s ease-out forwards;
        }

        .animate-section {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-12 space-y-6">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg animate-section">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  Click to upload Excel file(s)
                </p>
                <p className="text-sm text-muted-foreground">or drag and drop</p>
              </div>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-muted-foreground font-medium">Processing your files...</p>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg animate-section">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowFilesList(!showFilesList)}
                className="flex items-center gap-3 text-xl font-bold text-foreground hover:text-primary transition-colors duration-300"
              >
                <FileSpreadsheet className="w-6 h-6" />
                Uploaded Files ({uploadedFiles.length})
                <span
                  className={`transform transition-transform duration-300 ${showFilesList ? "rotate-90" : ""}`}
                  style={{ display: "inline-block" }}
                >
                  ▶
                </span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-300 font-medium"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {showFilesList && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-4 bg-accent/30 rounded-lg border transition-all duration-300 animate-file ${
                      selectedFileId === file.id ? "border-primary shadow-md bg-primary/10" : "border-border/50"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <button
                      onClick={() => handleSelectFile(file.id)}
                      className="flex items-center gap-3 flex-1 hover:text-primary transition-colors duration-300"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-base">{file.name}</p>
                        <p className="text-sm text-muted-foreground">DN: {file.dnNo}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-all duration-300"
                      title="Delete file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(groupedData.length > 0 || serialListData.length > 0) && (
          <div
            ref={tableRef}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg animate-section"
          >
            <div className="border-b border-border/50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("consolidated")}
                  className={`flex-1 px-6 py-4 text-base font-semibold transition-all duration-300 ${
                    activeTab === "consolidated"
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  Consolidated Materials
                </button>
                <button
                  onClick={() => setActiveTab("serialList")}
                  className={`flex-1 px-6 py-4 text-base font-semibold transition-all duration-300 ${
                    activeTab === "serialList"
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  Bulking Serial List
                </button>
                <button
                  onClick={() => setActiveTab("individualDN")}
                  className={`flex-1 px-6 py-4 text-base font-semibold transition-all duration-300 ${
                    activeTab === "individualDN"
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  Individual DN Downloads
                </button>
              </div>
            </div>

            <div className="p-8">
              {activeTab === "consolidated" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Consolidated Materials</h2>
                      <p className="text-base text-muted-foreground mt-1">
                        {selectedFileId
                          ? `Showing: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                          : `Combined data from ${uploadedFiles.length} file(s)`}
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-border/50">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-accent/50 border-b border-border/50">
                          <th className="px-6 py-4 text-left text-base font-bold text-foreground">MATERIAL CODE</th>
                          <th className="px-6 py-4 text-left text-base font-bold text-foreground">
                            MATERIAL DESCRIPTION
                          </th>
                          <th className="px-6 py-4 text-left text-base font-bold text-foreground">CATEGORY</th>
                          <th className="px-6 py-4 text-center text-base font-bold text-foreground">QTY.</th>
                          <th className="px-6 py-4 text-center text-base font-bold text-foreground">UM</th>
                          <th className="px-6 py-4 text-left text-base font-bold text-foreground">SHIPNAME</th>
                          <th className="px-6 py-4 text-left text-base font-bold text-foreground">REMARKS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedData
                          .filter((row) => row.materialCode && row.materialDescription)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`border-b border-border/30 hover:bg-accent/30 transition-colors duration-300 ${
                                animatingRows.has(idx) ? "animate-row" : ""
                              }`}
                              style={{
                                opacity: animatingRows.has(idx) ? 1 : 0,
                              }}
                            >
                              <td className="px-6 py-4 text-base font-medium text-foreground border border-border/50">
                                {row.materialCode}
                              </td>
                              <td className="px-6 py-4 text-base text-foreground border border-border/50">
                                {row.materialDescription}
                              </td>
                              <td className="px-6 py-4 text-base text-foreground border border-border/50">
                                {row.category}
                              </td>
                              <td className="px-6 py-4 text-base text-center font-bold text-primary border border-border/50">
                                {row.qty}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-muted-foreground border border-border/50">
                                -
                              </td>
                              <td className="px-6 py-4 text-base text-foreground border border-border/50">
                                {row.shipName}
                              </td>
                              <td className="px-6 py-4 text-base text-muted-foreground border border-border/50">
                                {row.remarks}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "serialList" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                      <HaierLogo />
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Bulking Serial List</h2>
                        <p className="text-base text-muted-foreground mt-1">
                          {selectedFileId
                            ? `Showing: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                            : `Combined serial data from ${uploadedFiles.length} file(s)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">Date Printed:</p>
                        <p className="text-sm text-muted-foreground">{formatDate()}</p>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border-2 border-border">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-accent/60">
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            DN No
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Location
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Bin Code
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Material Code
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Material Desc
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Barcode
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Ship To Name
                          </th>
                          <th className="px-6 py-5 text-center text-lg font-bold text-foreground border-2 border-border">
                            Ship To Address
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {serialListData
                          .filter((row) => row.materialCode && row.barcode)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`border-b-2 border-border hover:bg-accent/30 transition-colors duration-300 ${
                                animatingRows.has(idx) ? "animate-row" : ""
                              }`}
                              style={{
                                opacity: animatingRows.has(idx) ? 1 : 0,
                              }}
                            >
                              <td className="px-6 py-4 text-base font-semibold text-center text-foreground border-2 border-border">
                                {row.dnNo}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-foreground border-2 border-border">
                                {row.location}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-foreground border-2 border-border">
                                {row.binCode}
                              </td>
                              <td className="px-6 py-4 text-base font-semibold text-center text-foreground border-2 border-border">
                                {row.materialCode}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-foreground border-2 border-border">
                                {row.materialDesc}
                              </td>
                              <td className="px-6 py-4 text-lg font-mono font-bold text-center text-primary border-2 border-border">
                                {row.barcode}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-foreground border-2 border-border">
                                {row.shipToName}
                              </td>
                              <td className="px-6 py-4 text-base text-center text-foreground border-2 border-border">
                                {row.shipToAddress}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "individualDN" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Individual DN Downloads</h2>
                      <p className="text-base text-muted-foreground mt-1">
                        Download each DN file separately without unnecessary columns
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadAllDN}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download All DN
                    </button>
                  </div>

                  <div className="space-y-4">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-6 bg-accent/30 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 animate-file"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileSpreadsheet className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-lg">{file.name}</p>
                            <p className="text-base text-muted-foreground">
                              DN: {file.dnNo} • {file.serialData.length} items
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadIndividualDN(file)}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                        >
                          <Download className="w-5 h-5" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4">Select Download Format</h3>
            <p className="text-muted-foreground mb-6">Choose how you want to download your report:</p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setDownloadType("excel")}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                  downloadType === "excel"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">Excel Format (.xlsx)</p>
                  <p className="text-sm text-muted-foreground">Editable spreadsheet with formatting</p>
                </div>
              </button>
              
              <button
                onClick={() => setDownloadType("pdf")}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300 ${
                  downloadType === "pdf"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <FileText className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">PDF Format (.pdf)</p>
                  <p className="text-sm text-muted-foreground">Print-ready document with logo</p>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 px-4 py-3 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadConfirm}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-semibold"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}