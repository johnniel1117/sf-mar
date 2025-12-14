"use client"

import type React from "react"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Upload, X, FileSpreadsheet, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MaterialData {
  materialCode: string
  materialDescription: string
  category: string
  qty: number
  remarks: string
  shipName: string
}

interface UploadedFile {
  id: string
  name: string
  dnNo: string
  data: MaterialData[]
}

export default function ExcelUploader() {
  const [groupedData, setGroupedData] = useState<MaterialData[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
          existing.qty += 1
          if (item.shipName && !existing.shipName.includes(item.shipName)) {
            existing.shipName = existing.shipName ? `${existing.shipName}, ${item.shipName}` : item.shipName
          }
        } else {
          groupedMap.set(key, { ...item, qty: 1 })
        }
      })
    })

    return Array.from(groupedMap.values())
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

        let dnNo = "N/A"
        if (dnNoIdx >= 0 && jsonData[1]) {
          dnNo = String(jsonData[1][dnNoIdx] || "N/A")
        }

        const fileData: MaterialData[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]

          if (!row || row.length === 0 || !row[materialCodeIdx]) continue

          const materialCode = String(row[materialCodeIdx] || "").trim()
          const materialDescription = materialDescIdx >= 0 ? String(row[materialDescIdx] || "").trim() : ""
          const binCode = binCodeIdx >= 0 ? String(row[binCodeIdx] || "") : ""
          const shipName = shipToNameIdx >= 0 ? String(row[shipToNameIdx] || "").trim() : ""

          if (!materialCode) continue

          const category = getCategoryFromBinCode(binCode)

          fileData.push({
            materialCode,
            materialDescription,
            category,
            qty: 1,
            remarks: dnNo,
            shipName,
          })
        }

        newFiles.push({
          id: `${Date.now()}-${fileIdx}`,
          name: file.name,
          dnNo,
          data: fileData,
        })
      }

      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      setGroupedData(groupAllData(allFiles))
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
  }

  const handleClear = () => {
    setGroupedData([])
    setUploadedFiles([])
  }

  const handleDownload = () => {
    const wb = XLSX.utils.book_new()
    const wsData: any[][] = []

    // Header section
    wsData.push(["(GF) BUSINESS", "", "", "", "", "DELIVERY NOTE", "", `D${Date.now().toString().slice(-8)}`])
    wsData.push([])
    wsData.push([
      "Company Name:",
      "",
      "",
      "",
      "",
      "Dispatch Date:",
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    ])
    wsData.push(["Company Branch:", "", "", "", "", "Deliver/Receive:"])
    wsData.push(["Contact No.:", "", "", "", "", "DV No./Plate No.:"])
    wsData.push(["Deliver Address:", "", "", "", "", "DR No.:"])
    wsData.push([])

    // Table headers
    wsData.push(["", "MATERIAL CODE", "MATERIAL DESCRIPTION", "CATEGORY", "QTY.", "UM", "SHIPNAME", "REMARKS"])

    // Data rows
    groupedData.forEach((row, idx) => {
      wsData.push([
        idx + 1,
        row.materialCode,
        row.materialDescription,
        row.category,
        row.qty,
        "",
        row.shipName,
        row.remarks,
      ])
    })

    // Add empty rows to reach row 25
    const currentRows = wsData.length
    const totalRows = 25
    for (let i = currentRows; i < totalRows; i++) {
      wsData.push(["", "", "", "", "", "", "", ""])
    }

    // Footer section
    wsData.push([])
    wsData.push([
      "Prepared and Checked by (CapSurety/Your Printed Name):",
      "",
      "",
      "Approved by (Signature/Your Printed Name):",
      "",
      "",
      "Start",
      "",
    ])
    wsData.push([])
    wsData.push(["Original: Tagbilaran City", "", "", "Witnessed by (Signature/Your Printed Name):", "", "", "End", ""])
    wsData.push(["Duplicate: Warehouse"])
    wsData.push(["Triplicate: Vehicle File"])
    wsData.push([])
    wsData.push([
      "Received by (Signature/Your Printed Name):",
      "",
      "",
      "Witnessed by (Signature/Your Printed Name):",
      "",
      "",
      "Dispatched:",
      "",
    ])
    wsData.push([])
    wsData.push(["Company/Project/Branch Representative", "", "", "Security Guard", "", ""])
    wsData.push([])
    wsData.push([
      "Checked Status of Items/Material/Warehouse/Loading/Stocks/Transfer/Employee/Technician-Project Officer/Engineering Department/Admin",
      "",
      "",
      "",
      "",
      "",
      "Scan: Date: Date: Year",
    ])

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    ws["!cols"] = [{ wch: 4 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 6 }, { wch: 6 }, { wch: 25 }, { wch: 15 }]

    // Merge cells for header
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // (GF) BUSINESS
      { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // DELIVERY NOTE
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // Company Name
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, // Dispatch Date
      { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // Company Branch
      { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } }, // Contact No
      { s: { r: 5, c: 1 }, e: { r: 5, c: 4 } }, // Deliver Address
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Delivery Note")

    // Write to binary string and create blob for browser download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Delivery_Note_${Date.now()}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-6">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg">
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
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <p className="text-sm font-medium text-primary">Processing files...</p>
              </div>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Uploaded Files <span className="text-muted-foreground font-normal">({uploadedFiles.length})</span>
                </h2>
              </div>
              <Button
                onClick={handleClear}
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-accent/20 hover:bg-accent/30 rounded-xl border border-border/30 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background/50">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">DN No: {file.dnNo}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteFile(file.id)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedData.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Consolidated Materials</h2>
                <p className="text-sm text-muted-foreground mt-1">{groupedData.length} items ready for export</p>
              </div>
              <Button onClick={handleDownload} className="gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-accent/40 hover:bg-accent/40 border-b border-border/50">
                      <TableHead className="font-semibold text-foreground border-r border-border/30">#</TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">
                        MATERIAL CODE
                      </TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">
                        MATERIAL DESCRIPTION
                      </TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">
                        CATEGORY
                      </TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">QTY.</TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">UM</TableHead>
                      <TableHead className="font-semibold text-foreground border-r border-border/30">
                        SHIPNAME
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">REMARKS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-accent/20 border-b border-border/30">
                        <TableCell className="border-r border-border/30 font-medium text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="border-r border-border/30 text-foreground font-medium">
                          {row.materialCode}
                        </TableCell>
                        <TableCell className="border-r border-border/30 text-foreground">
                          {row.materialDescription}
                        </TableCell>
                        <TableCell className="border-r border-border/30 text-foreground">{row.category}</TableCell>
                        <TableCell className="border-r border-border/30 text-center text-foreground font-semibold">
                          {row.qty}
                        </TableCell>
                        <TableCell className="border-r border-border/30 text-muted-foreground"></TableCell>
                        <TableCell className="border-r border-border/30 text-foreground">{row.shipName}</TableCell>
                        <TableCell className="text-foreground">{row.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}