"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  const tableRef = useRef<HTMLDivElement>(null)
  const [animatingRows, setAnimatingRows] = useState<Set<number>>(new Set())
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

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

          // Check if there's a quantity column in the Excel
          const qtyIdx = headers.findIndex(
            (h) => h.includes("qty") || h.includes("quantity") || h.includes("qnt"),
          )
          const qty = qtyIdx >= 0 ? parseInt(String(row[qtyIdx] || "1"), 10) || 1 : 1

          const category = getCategoryFromBinCode(binCode)

          fileData.push({
            materialCode,
            materialDescription,
            category,
            qty,
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
      const newGroupedData = groupAllData(allFiles)
      setGroupedData(newGroupedData)

      // Trigger staggered animation
      setAnimatingRows(new Set())
      newGroupedData.forEach((_, idx) => {
        setTimeout(() => {
          setAnimatingRows((prev) => {
            const newSet = new Set(prev)
            newSet.add(idx)
            return newSet
          })
        }, idx * 50)
      })

      // Scroll to table after animation completes
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, newGroupedData.length * 50 + 300)
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
    setAnimatingRows(new Set())
    setSelectedFileId(null)
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
        groupedMap.set(key, { ...item })
      }
    })

    return Array.from(groupedMap.values())
  }

  const handleSelectFile = (fileId: string) => {
    // Toggle: if already selected, unselect
    if (selectedFileId === fileId) {
      setSelectedFileId(null)
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

      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, allGrouped.length * 30 + 300)
    } else {
      // Select new file
      setSelectedFileId(fileId)
      setAnimatingRows(new Set())

      const selectedFile = uploadedFiles.find((f) => f.id === fileId)
      if (selectedFile) {
        // Group data by material code, description, AND remarks
        const groupedData = groupSingleFileData(selectedFile.data)
        setGroupedData(groupedData)

        // Trigger staggered animation for selected file data
        groupedData.forEach((_, idx) => {
          setTimeout(() => {
            setAnimatingRows((prev) => {
              const newSet = new Set(prev)
              newSet.add(idx)
              return newSet
            })
          }, idx * 50)
        })

        // Scroll to table after animation completes
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, groupedData.length * 50 + 300)
      }
    }
  }

  const handleShowAll = () => {
    setSelectedFileId(null)
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

    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, allGrouped.length * 30 + 300)
  }

  const handleDownload = () => {
    const wb = XLSX.utils.book_new()
    const wsData: any[][] = []

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

    wsData.push(["", "MATERIAL CODE", "MATERIAL DESCRIPTION", "CATEGORY", "QTY.", "UM", "SHIPNAME", "REMARKS"])

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

    const currentRows = wsData.length
    const totalRows = 25
    for (let i = currentRows; i < totalRows; i++) {
      wsData.push(["", "", "", "", "", "", "", ""])
    }

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
    ws["!cols"] = [{ wch: 4 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 6 }, { wch: 6 }, { wch: 25 }, { wch: 15 }]
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } },
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
      { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } },
      { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } },
      { s: { r: 5, c: 1 }, e: { r: 5, c: 4 } },
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Delivery Note")

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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0);
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

        .animate-scale {
          animation: scaleIn 0.4s ease-out forwards;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-6">
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
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>
            <div className="space-y-2">
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
                    <div className={`p-2 rounded-lg ${selectedFileId === file.id ? "bg-primary/20" : "bg-background/50"}`}>
                      <FileSpreadsheet className={`w-5 h-5 ${selectedFileId === file.id ? "text-primary" : "text-primary"}`} />
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
          </div>
        )}

        {groupedData.length > 0 && (
          <div ref={tableRef} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg animate-section">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Consolidated Materials</h2>
                <p className="text-sm text-muted-foreground mt-1">{groupedData.length} items ready for export</p>
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
                <table className="w-full">
                  <thead>
                    <tr className="bg-accent/40 border-b border-border/50">
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">
                        MATERIAL CODE
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">
                        MATERIAL DESCRIPTION
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">
                        CATEGORY
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-foreground border-r border-border/30">
                        QTY.
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">UM</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30">
                        SHIPNAME
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border/30 hover:bg-accent/20 transition-colors duration-200 animate-row"
                        style={{
                          opacity: animatingRows.has(idx) ? 1 : 0,
                          transform: animatingRows.has(idx) ? "translateY(0)" : "translateY(20px)",
                          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                        }}
                      >
                        <td className="px-4 py-3 border-r border-border/30 font-medium text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 border-r border-border/30 text-foreground font-medium">
                          {row.materialCode}
                        </td>
                        <td className="px-4 py-3 border-r border-border/30 text-foreground">
                          {row.materialDescription}
                        </td>
                        <td className="px-4 py-3 border-r border-border/30 text-foreground">{row.category}</td>
                        <td className="px-4 py-3 border-r border-border/30 text-center text-foreground font-semibold">
                          {row.qty}
                        </td>
                        <td className="px-4 py-3 border-r border-border/30 text-muted-foreground"></td>
                        <td className="px-4 py-3 border-r border-border/30 text-foreground">{row.shipName}</td>
                        <td className="px-4 py-3 text-foreground text-xs bg-accent/30 rounded px-2 py-1 inline-block">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}