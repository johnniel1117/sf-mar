"use client"

import type React from "react"
import { useState, useRef } from "react"
import * as XLSX from "xlsx-js-style"
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

export function ExcelUploader() {
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
  const [isDownloadingAllDN, setIsDownloadingAllDN] = useState(false)

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
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0ZR-in8sMiX5s52tx76-bB6gw6BqWQzoxiA&s"
      alt="Haier Logo"
      style={{ height: "80px", width: "auto" }}
      className="transition-transform duration-300 hover:scale-105"
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
      if (isDownloadingAllDN) {
        handleDownloadAllDNPDF()
      } else if (selectedDownloadFile) {
        handleDownloadIndividualDNPDF(selectedDownloadFile)
      } else {
        handleDownloadPDF()
      }
    } else {
      if (isDownloadingAllDN) {
        handleDownloadAllDN()
      } else if (selectedDownloadFile) {
        handleDownloadIndividualDN(selectedDownloadFile)
      } else {
        handleDownloadExcel()
      }
    }
    setSelectedDownloadFile(null)
    setIsDownloadingAllDN(false)
  }

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeTab === "consolidated" ? "Consolidated Materials Report" : "Bulking Serial List Report"}</title>
        <style>
          @page {
            size: landscape;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
      
          }
          
          .logo img {
            height: 45px;
            width: auto;
          }
          
          .date {
            text-align: right;
            font-size: 11px;
            color: #000;
            line-height: 1.6;
          }
          
          .date strong {
            font-weight: bold;
            font-size: 12px;
            color: #000;
          }
          
          h1 {
            color: #000;
            margin: 15px 0 20px 0;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
            background: #fff;
            font-family: Arial, sans-serif;
            border: 2px solid #000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          th, td {
            border: 1.5px solid #000;
            padding: 10px 8px;
            text-align: center;
            word-wrap: break-word;
            color: #000;
            background: #fff;
            font-family: Arial, sans-serif;
          }
          
          th {
            background: linear-gradient(180deg, #E8E8E8 0%, #D3D3D3 100%);
            color: #000;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 12px 8px;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          
          tbody tr:nth-child(even) {
            background: #F9F9F9;
          }
          
          tbody tr:hover {
            background: #F0F0F0;
          }
          
          .qty-cell {
            font-weight: bold;
            color: #000;
            font-size: 10px;
          }
          
          .barcode-cell {
            font-family: Arial, sans-serif;
            font-weight: bold;
            color: #000;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          
          .material-code-cell {
            font-family: Arial, sans-serif;
            color: #000;
            font-size: 10px;
            font-weight: bold;
          }
          
          .desc-cell {
            text-align: center;
            max-width: 200px;
            font-size: 9px;
            color: #000;
            line-height: 1.4;
          }
          
          @media print {
            body { 
              margin: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
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
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0ZR-in8sMiX5s52tx76-bB6gw6BqWQzoxiA&s alt="Haier Logo" />
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
              <th>SHIP NAME</th>
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
              <th>DN NO</th>
              <th>LOCATION</th>
              <th>BIN CODE</th>
              <th>MATERIAL CODE</th>
              <th>MATERIAL DESC</th>
              <th>BARCODE</th>
              <th>SHIP TO NAME</th>
              <th>SHIP TO ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            ${serialListData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row) => `
              <tr>
                <td>${row.dnNo}</td>
                <td>${row.location}</td>
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

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownloadAllDNPDF = () => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return

    const allDNContent = uploadedFiles
      .map((file, index) => {
        const shipToName = file.serialData[0]?.shipToName || "Unknown"
        const pageBreakClass = index < uploadedFiles.length - 1 ? "page-break" : ""

        return `
      <div class="${pageBreakClass}">
        <div class="header">
          <div class="logo">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0ZR-in8sMiX5s52tx76-bB6gw6BqWQzoxiA&s" alt="Haier Logo" />
          </div>
          <h2 style="color: #000; font-size: 18px; font-weight: bold; margin: 15px 0; text-align: center;">${file.dnNo} | ${shipToName}</h2>
          <div class="date">
            <strong>Generated:</strong><br/>
            ${formatDate()}
          </div>
        </div>

        
        
        <table>
          <thead>
            <tr>
              <th>DN NO</th>
              <th>LOCATION</th>
              <th>BIN CODE</th>
              <th>MATERIAL CODE</th>
              <th>MATERIAL DESC</th>
              <th>BARCODE</th>
              <th>SHIP TO NAME</th>
              <th>SHIP TO ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            ${file.serialData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row) => `
              <tr>
                <td>${row.dnNo}</td>
                <td>${row.location}</td>
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
      </div>
    `
      })
      .join("")

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>All DN Serial Lists</title>
        <style>
          @page {
            size: landscape;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 20px;
          }
          
          .page-break {
            page-break-after: always;
            margin-bottom: 0;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
           
          }
          
          .logo img {
            height: 45px;
            width: auto;
          }
          
          .date {
            text-align: right;
            font-size: 11px;
            color: #000;
            line-height: 1.6;
          }
          
          .date strong {
            font-weight: bold;
            font-size: 12px;
            color: #000;
          }
          
          h1, h2 {
            color: #000;
            margin: 15px 0 20px 0;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
            background: #fff;
            font-family: Arial, sans-serif;
            border: 2px solid #000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          th, td {
            border: 1.5px solid #000;
            padding: 10px 8px;
            text-align: center;
            word-wrap: break-word;
            color: #000;
            background: #fff;
            font-family: Arial, sans-serif;
          }
          
          th {
            background: linear-gradient(180deg, #E8E8E8 0%, #D3D3D3 100%);
            color: #000;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 12px 8px;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          
          tbody tr:nth-child(even) {
            background: #F9F9F9;
          }
          
          tbody tr:hover {
            background: #F0F0F0;
          }
          
          .barcode-cell {
            font-family: Arial, sans-serif;
            font-weight: bold;
            color: #000;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          
          .material-code-cell {
            font-family: Arial, sans-serif;
            color: #000;
            font-size: 10px;
            font-weight: bold;
          }
          
          .desc-cell {
            text-align: center;
            max-width: 200px;
            font-size: 9px;
            color: #000;
            line-height: 1.4;
          }
          
          @media print {
            body { 
              margin: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none; }
            @page {
              size: landscape;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        ${allDNContent}
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownloadIndividualDNPDF = (file: UploadedFile) => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return

    const shipToName = file.serialData[0]?.shipToName || "Unknown"

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
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 20px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #0057A8;
          }
          
          .logo img {
            height: 45px;
            width: auto;
          }
          
          .date {
            text-align: right;
            font-size: 11px;
            color: #000;
            line-height: 1.6;
          }
          
          .date strong {
            font-weight: bold;
            font-size: 12px;
            color: #000;
          }
          
          h1 {
            color: #000;
            margin: 15px 0 20px 0;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
            background: #fff;
            font-family: Arial, sans-serif;
            border: 2px solid #000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          th, td {
            border: 1.5px solid #000;
            padding: 10px 8px;
            text-align: center;
            word-wrap: break-word;
            color: #000;
            background: #fff;
            font-family: Arial, sans-serif;
          }
          
          th {
            background: linear-gradient(180deg, #E8E8E8 0%, #D3D3D3 100%);
            color: #000;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 12px 8px;
            text-align: center;
            font-family: Arial, sans-serif;
          }
          
          tbody tr:nth-child(even) {
            background: #F9F9F9;
          }
          
          tbody tr:hover {
            background: #F0F0F0;
          }
          
          .barcode-cell {
            font-family: Arial, sans-serif;
            font-weight: bold;
            color: #000;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          
          .material-code-cell {
            font-family: Arial, sans-serif;
            color: #000;
            font-size: 10px;
            font-weight: bold;
          }
          
          .desc-cell {
            text-align: center;
            max-width: 200px;
            font-size: 9px;
            color: #000;
            line-height: 1.4;
          }
          
          @media print {
            body { 
              margin: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
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
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0ZR-in8sMiX5s52tx76-bB6gw6BqWQzoxiA&s alt="Haier Logo" />
          </div>
           <h1>${file.dnNo} | ${shipToName}</h1>
          <div class="date">
            <strong>Date Printed:</strong><br/>
            ${formatDate()}
          </div>
        </div>
        
       
        
        <table>
          <thead>
            <tr>
              <th>DN NO</th>
              <th>LOCATION</th>
              <th>BIN CODE</th>
              <th>MATERIAL CODE</th>
              <th>MATERIAL DESC</th>
              <th>BARCODE</th>
              <th>SHIP TO NAME</th>
              <th>SHIP TO ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            ${file.serialData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row) => `
              <tr>
                <td>${row.dnNo}</td>
                <td>${row.location}</td>
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

    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleDownloadExcel = () => {
    const worksheet =
      activeTab === "consolidated"
        ? XLSX.utils.json_to_sheet(
            groupedData.map((row) => ({
              "Material Code": row.materialCode,
              "Material Description": row.materialDescription,
              Category: row.category,
              "Qty.": row.qty,
              UM: "-",
              ShipName: row.shipName,
              Remarks: row.remarks,
            })),
          )
        : XLSX.utils.json_to_sheet(
            serialListData.map((row) => ({
              "DN No": row.dnNo,
              Location: row.location,
              "Bin Code": row.binCode,
              "Material Code": row.materialCode,
              "Material Desc": row.materialDesc,
              Barcode: row.barcode,
              "Ship To Name": row.shipToName,
              "Ship To Address": row.shipToAddress,
            })),
          )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === "consolidated" ? "Consolidated" : "Serial List")

    XLSX.writeFile(workbook, activeTab === "consolidated" ? "Consolidated_Materials.xlsx" : "Bulking_Serial_List.xlsx")
  }

  const handleDownloadAllDN = () => {
    const workbook = XLSX.utils.book_new()

    uploadedFiles.forEach((file) => {
      const worksheet = XLSX.utils.json_to_sheet(
        file.serialData.map((row) => ({
          "DN No": row.dnNo,
          Location: row.location,
          "Bin Code": row.binCode,
          "Material Code": row.materialCode,
          "Material Desc": row.materialDesc,
          Barcode: row.barcode,
          "Ship To Name": row.shipToName,
          "Ship To Address": row.shipToAddress,
        })),
      )

      const sheetName = file.dnNo.substring(0, 31)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })

    XLSX.writeFile(workbook, "All_DN_Serial_Lists.xlsx")
  }

  const handleDownloadIndividualDN = (file: UploadedFile) => {
    const worksheet = XLSX.utils.json_to_sheet(
      file.serialData.map((row) => ({
        "DN No": row.dnNo,
        Location: row.location,
        "Bin Code": row.binCode,
        "Material Code": row.materialCode,
        "Material Desc": row.materialDesc,
        Barcode: row.barcode,
        "Ship To Name": row.shipToName,
        "Ship To Address": row.shipToAddress,
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, file.dnNo.substring(0, 31))

    XLSX.writeFile(workbook, `${file.dnNo}_Serial_List.xlsx`)
  }

  return (
    <div>
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

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
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

        .upload-zone {
          position: relative;
          overflow: hidden;
        }

        .upload-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease-out;
          pointer-events: none;
        }

        .upload-zone:hover::before {
          opacity: 1;
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-card/60 border border-border/40 backdrop-blur-sm rounded-2xl p-8 shadow-sm animate-section hover:shadow-md transition-shadow duration-300">
          <label
            htmlFor="file-upload"
            className="upload-zone flex flex-col items-center justify-center h-44 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
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
              <p className="mt-3 text-muted-foreground font-medium">Processing your files...</p>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-card/60 border border-border/40 backdrop-blur-sm rounded-2xl p-8 shadow-sm animate-section hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowFilesList(!showFilesList)}
                className="flex items-center gap-3 text-lg font-semibold text-foreground hover:text-primary transition-colors duration-300"
              >
                <FileSpreadsheet className="w-5 h-5" />
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
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all duration-300 font-medium text-sm"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {showFilesList && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 animate-file ${
                      selectedFileId === file.id
                        ? "border-blue-400 shadow-sm bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <button
                      onClick={() => handleSelectFile(file.id)}
                      className="flex items-center gap-3 flex-1 hover:text-blue-600 transition-colors duration-200"
                    >
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-800 text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500">DN: {file.dnNo}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200"
                      title="Delete file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(groupedData.length > 0 || serialListData.length > 0) && (
          <div ref={tableRef} className="bg-white border border-slate-200 rounded-xl shadow-sm animate-section">
            <div className="border-b border-slate-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("consolidated")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "consolidated"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Consolidated Materials
                </button>
                <button
                  onClick={() => setActiveTab("serialList")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "serialList"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Bulking Serial List
                </button>
                <button
                  onClick={() => setActiveTab("individualDN")}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "individualDN"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                      <h2 className="text-xl font-bold text-slate-800">Consolidated Materials Report</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedFileId
                          ? `Showing data for: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                          : "Showing combined data from all files"}
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 border-b-2 border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Material Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Material Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Qty.
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            UM
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Ship Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {groupedData
                          .filter((row) => row.materialCode && row.materialDescription)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`${
                                animatingRows.has(idx) ? "animate-row" : "opacity-0"
                              } hover:bg-slate-50 transition-colors`}
                              style={{ animationDelay: `${idx * 0.03}s` }}
                            >
                              <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.materialCode}</td>
                              <td className="px-4 py-3 text-slate-700">{row.materialDescription}</td>
                              <td className="px-4 py-3 text-slate-700">{row.category}</td>
                              <td className="px-4 py-3 text-center font-semibold text-blue-600">{row.qty}</td>
                              <td className="px-4 py-3 text-center text-slate-500">-</td>
                              <td className="px-4 py-3 text-slate-700">{row.shipName}</td>
                              <td className="px-4 py-3 text-slate-700">{row.remarks}</td>
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
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Bulking Serial List Report</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {selectedFileId
                          ? `Showing data for: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                          : "Showing combined data from all files"}
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 border-b-2 border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            DN No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Bin Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Material Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Material Desc
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Barcode
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Ship To Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Ship To Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {serialListData
                          .filter((row) => row.materialCode && row.barcode)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`${
                                animatingRows.has(idx) ? "animate-row" : "opacity-0"
                              } hover:bg-slate-50 transition-colors`}
                              style={{ animationDelay: `${idx * 0.03}s` }}
                            >
                              <td className="px-4 py-3 text-slate-700">{row.dnNo}</td>
                              <td className="px-4 py-3 text-slate-700">{row.location}</td>
                              <td className="px-4 py-3 text-slate-700">{row.binCode}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-700">{row.materialCode}</td>
                              <td className="px-4 py-3 text-slate-700">{row.materialDesc}</td>
                              <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-900">
                                {row.barcode}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{row.shipToName}</td>
                              <td className="px-4 py-3 text-slate-700">{row.shipToAddress}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "individualDN" && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Individual DN Downloads</h2>
                    <p className="text-sm text-slate-500 mt-1">Download individual DN serial lists or all at once</p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Download All DN Serial Lists</p>
                            <p className="text-sm text-slate-500">{uploadedFiles.length} file(s) available</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsDownloadingAllDN(true)
                            setShowDownloadModal(true)
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
                        >
                          <Download className="w-4 h-4" />
                          Download All
                        </button>
                      </div>
                    </div>

                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors animate-file"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-200 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{file.dnNo}</p>
                            <p className="text-sm text-slate-500">{file.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDownloadFile(file)
                            setIsDownloadingAllDN(false)
                            setShowDownloadModal(true)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Choose Download Format</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setDownloadType("excel")}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                  downloadType === "excel"
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    downloadType === "excel" ? "border-blue-600" : "border-slate-300"
                  }`}
                >
                  {downloadType === "excel" && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Excel (.xlsx)</p>
                  <p className="text-sm text-slate-500">Editable spreadsheet format</p>
                </div>
              </button>
              <button
                onClick={() => setDownloadType("pdf")}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all duration-200 ${
                  downloadType === "pdf"
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    downloadType === "pdf" ? "border-blue-600" : "border-slate-300"
                  }`}
                >
                  {downloadType === "pdf" && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">PDF</p>
                  <p className="text-sm text-slate-500">Print-ready document format</p>
                </div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDownloadModal(false)
                  setSelectedDownloadFile(null)
                  setIsDownloadingAllDN(false)
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadConfirm}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
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
