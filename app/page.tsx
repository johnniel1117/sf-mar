"use client"

import type React from "react"
import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { Upload, X, FileSpreadsheet, Download } from "lucide-react"

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
  shipToRegion: string
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

type TabType = "consolidated" | "serialList"

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

  const getCategoryFromBinCode = (binCode: string): string => {
    const code = String(binCode || "").toUpperCase()
    if (code.includes("HAC")) return "Home Air Conditioner"
    if (code.includes("TV") || code.includes("LED")) return "TV"
    if (code.includes("WM") || code.includes("WASH")) return "Washing Machine"
    if (code.includes("REF") || code.includes("FRIDGE")) return "Refrigerator"
    if (code.includes("FAN")) return "Fan"
    return "Others"
  }

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
    return allSerialData
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
        const shipToRegionIdx = headers.findIndex((h) => h.includes("ship to region") || h.includes("shiptoregion"))
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

          // Parse serial list data
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
            shipToRegion: shipToRegionIdx >= 0 ? String(row[shipToRegionIdx] || "") : "",
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
    const wb = XLSX.utils.book_new()

    if (activeTab === "consolidated") {
      const wsData: any[][] = []
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

          if (R === 0) {
            ws[cellAddress].s.font = { bold: true, sz: 11 }
            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" }
            ws[cellAddress].s.fill = { fgColor: { rgb: "D3D3D3" } }
          }

          if (C === 3 && R > 0) {
            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" }
            ws[cellAddress].s.font = { bold: true }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Consolidated Materials")
    } else {
      const wsData: any[][] = []
      wsData.push([
        "DN No",
        "Order Item",
        "Factory Code",
        "Location",
        "binCode",
        "Material Code",
        "Material Desc",
        "Barcode",
        "Material Type",
        "Product Status",
        "Ship To",
        "Ship To Name",
        "Ship To Address",
        "Ship To Region",
        "Sold To",
        "Sold To Name",
        "Scan By",
        "Scan Time",
      ])

      serialListData.forEach((row) => {
        wsData.push([
          row.dnNo,
          row.orderItem,
          row.factoryCode,
          row.location,
          row.binCode,
          row.materialCode,
          row.materialDesc,
          row.barcode,
          row.materialType,
          row.productStatus,
          row.shipTo,
          row.shipToName,
          row.shipToAddress,
          row.shipToRegion,
          row.soldTo,
          row.soldToName,
          row.scanBy,
          row.scanTime,
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 25 },
        { wch: 15 },
        { wch: 18 },
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

          if (R === 0) {
            ws[cellAddress].s.font = { bold: true, sz: 11 }
            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" }
            ws[cellAddress].s.fill = { fgColor: { rgb: "4472C4" } }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Bulking Serial List")
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${activeTab === "consolidated" ? "Consolidated_Materials" : "Bulking_Serial_List"}_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
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
                <p className="text-base font-semibold text-foreground mb-1">Drop Excel files here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-accent/50 border border-border/50">
                <p className="text-xs text-muted-foreground font-medium">.xlsx, .xls supported</p>
              </div>
            </div>
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            multiple
          />

          {isLoading && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full animate-section">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <p className="text-sm font-medium text-primary">Processing files...</p>
              </div>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg animate-section">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Uploaded Files <span className="text-muted-foreground font-normal">({uploadedFiles.length})</span>
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilesList(!showFilesList)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 shadow-sm font-medium text-sm"
                >
                  {showFilesList ? "Hide Files" : "Show Files"}
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
            {showFilesList && (
              <div className="space-y-2 animate-section">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 animate-file cursor-pointer ${
                      selectedFileId === file.id
                        ? "bg-primary/20 border-primary/50 ring-2 ring-primary/30"
                        : "bg-accent/20 hover:bg-accent/30 border-border/30"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${selectedFileId === file.id ? "bg-primary/20" : "bg-background/50"}`}
                      >
                        <FileSpreadsheet
                          className={`w-5 h-5 ${selectedFileId === file.id ? "text-primary" : "text-primary"}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">DN No: {file.dnNo}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file.id)
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
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
          <div
            ref={tableRef}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg animate-section"
          >
            <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-2">
              <button
                onClick={() => setActiveTab("consolidated")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "consolidated"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                Consolidated Materials
              </button>
              <button
                onClick={() => setActiveTab("serialList")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "serialList"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                }`}
              >
                Bulking Serial List
              </button>
            </div>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {activeTab === "consolidated" ? "Consolidated Materials" : "Bulking Serial List"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "consolidated" ? groupedData.length : serialListData.length} items ready for export
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
              <div className="overflow-x-auto">
                {activeTab === "consolidated" ? (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-accent/40 border-b border-border/50">
                        <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 text-sm">
                          MATERIAL CODE
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 text-sm">
                          MATERIAL DESCRIPTION
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 text-sm">
                          CATEGORY
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground border-r border-border/30 text-sm">
                          QTY.
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-foreground border-r border-border/30 text-sm">
                          UM
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 text-sm">
                          SHIPNAME
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground text-sm">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedData.map((row, index) => (
                        <tr
                          key={index}
                          className={`border-b border-border/30 hover:bg-accent/20 transition-colors duration-150 ${
                            animatingRows.has(index) ? "animate-row" : "opacity-0"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-foreground border-r border-border/20 font-medium">
                            {row.materialCode}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground border-r border-border/20">
                            {row.materialDescription}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground border-r border-border/20">
                            {row.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground border-r border-border/20 text-center font-bold">
                            {row.qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground border-r border-border/20 text-center">
                            -
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground border-r border-border/20">
                            {row.shipName || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{row.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 border-b border-border/50">
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          DN No
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Order Item
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Factory Code
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Location
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          binCode
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Material Code
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Material Desc
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Barcode
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Material Type
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Product Status
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Ship To
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Ship To Name
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Ship To Address
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Ship To Region
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Sold To
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Sold To Name
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white border-r border-blue-500 text-xs whitespace-nowrap">
                          Scan By
                        </th>
                        <th className="px-3 py-3 text-left font-semibold text-white text-xs whitespace-nowrap">
                          Scan Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {serialListData.map((row, index) => (
                        <tr
                          key={index}
                          className={`border-b border-border/30 hover:bg-accent/20 transition-colors duration-150 ${
                            animatingRows.has(index) ? "animate-row" : "opacity-0"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">{row.dnNo}</td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.orderItem}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.factoryCode}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.location}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.binCode}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20 font-medium">
                            {row.materialCode}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.materialDesc}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.barcode}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.materialType}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.productStatus}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.shipTo}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.shipToName}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.shipToAddress}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.shipToRegion}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.soldTo}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.soldToName}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground border-r border-border/20">
                            {row.scanBy}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-foreground">{row.scanTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
