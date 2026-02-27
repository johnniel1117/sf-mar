"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as XLSX from "xlsx-js-style"
import { MATCODE_CATEGORY_MAP, getCategoryFromBinCode } from '../components/CategoryMapping'
import {
  Upload, X, FileSpreadsheet, Download, FileText, CheckCircle2,
  Layers, AlertCircle, ArrowUp, Search, Home, Menu,
  ChevronRight, ChevronLeft
} from "lucide-react"
import LogoGridBackground from "../components/LogoBackground"
import Link from "next/link"
import JsBarcode from "jsbarcode"

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

interface Notification {
  id: string
  type: "error" | "warning" | "success"
  message: string
}

export default function ExcelUploader() {
  const [groupedData, setGroupedData]         = useState<MaterialData[]>([])
  const [serialListData, setSerialListData]   = useState<SerialData[]>([])
  const [uploadedFiles, setUploadedFiles]     = useState<UploadedFile[]>([])
  const [isLoading, setIsLoading]             = useState(false)
  const tableRef                              = useRef<HTMLDivElement>(null)
  const [animatingRows, setAnimatingRows]     = useState<Set<number>>(new Set())
  const [selectedFileId, setSelectedFileId]   = useState<string | null>(null)
  const [showFilesList, setShowFilesList]     = useState(false)
  const [activeTab, setActiveTab]             = useState<TabType>("consolidated")
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType]       = useState<"pdf" | "excel">("excel")
  const [selectedDownloadFile, setSelectedDownloadFile] = useState<UploadedFile | null>(null)
  const [isDownloadingAllDN, setIsDownloadingAllDN] = useState(false)
  const [isDragging, setIsDragging]           = useState(false)
  const [notifications, setNotifications]     = useState<Notification[]>([])
  const [showScrollTop, setShowScrollTop]     = useState(false)
  const [searchQuery, setSearchQuery]         = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [mounted, setMounted]                 = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = showDownloadModal ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [showDownloadModal])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const addNotification = (type: "error" | "warning" | "success", message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000)
  }

  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id))

  const saveToSupabase = async (files: UploadedFile[]) => {
    try {
      for (const file of files) {
        const totalQuantity = file.data.reduce((sum, item) => sum + (item.qty || 0), 0)
        const isDN = file.dnNo.startsWith('DN') || file.dnNo.includes('-DN-')
        const payload = {
          fileName: file.name,
          dnNo: isDN ? file.dnNo : undefined,
          traNo: !isDN ? file.dnNo : undefined,
          totalQuantity,
          data: file.data,
          serialData: file.serialData,
        }
        const response = await fetch('/api/save-excel-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const error = await response.json()
          addNotification('error', `Failed to save ${file.name}: ${error.error}`)
          continue
        }
        addNotification('success', `Saved ${file.name} to database (Qty: ${totalQuantity})`)
      }
    } catch (error) {
      addNotification('error', `Error saving: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }
  const formatDateShort = () => new Date().toLocaleDateString("en-US", { month: '2-digit', day: '2-digit', year: 'numeric' })

  const generateBarcodeSVG = (value: string): string => {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    JsBarcode(svgElement, value, { format: "CODE128", width: 2, height: 60, displayValue: false })
    return svgElement.outerHTML
  }

  const isTRAFormat = (headers: string[]): boolean => {
    const traHeaders = ["order no","order item","factory code","gi location","gr location","material code","material desc","barcode","create by","create date"]
    const hl = headers.map(h => h.toLowerCase().trim())
    return traHeaders.every(t => hl.some(h => h.includes(t)))
  }

  const parseTRAData = (jsonData: any[][], headers: string[]) => {
    const idx = (terms: string[]) => headers.findIndex(h => terms.some(t => h.includes(t)))
    const orderNoIdx      = idx(["order no","orderno"])
    const orderItemIdx    = idx(["order item","orderitem"])
    const factoryCodeIdx  = idx(["factory code","factorycode"])
    const giLocationIdx   = idx(["gi location","gilocation"])
    const grLocationIdx   = idx(["gr location","grlocation"])
    const materialCodeIdx = idx(["material code","materialcode"])
    const materialDescIdx = idx(["material desc","materialdesc"])
    const barcodeIdx      = idx(["barcode","bar code"])
    const createByIdx     = idx(["create by","createby"])
    const createDateIdx   = idx(["create date","createdate"])
    const traNo = jsonData[1] && orderNoIdx >= 0 ? String(jsonData[1][orderNoIdx] || "N/A") : "N/A"
    const materialData: MaterialData[] = []
    const serialData: SerialData[]     = []
    const seenMaterials = new Set<string>()
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || !row[materialCodeIdx]) continue
      const materialCode = String(row[materialCodeIdx] || "").trim()
      const materialDesc = materialDescIdx >= 0 ? String(row[materialDescIdx] || "").trim() : ""
      const barcode      = barcodeIdx >= 0 ? String(row[barcodeIdx] || "").trim() : ""
      if (!materialCode) continue
      const key = `${materialCode}|${materialDesc}`
      if (!seenMaterials.has(key)) {
        seenMaterials.add(key)
        materialData.push({ materialCode, materialDescription: materialDesc, category: MATCODE_CATEGORY_MAP[materialCode] || "Others", qty: 0, remarks: traNo, shipName: "" })
      }
      const matItem = materialData.find(m => m.materialCode === materialCode && m.materialDescription === materialDesc)
      if (matItem) matItem.qty += 1
      serialData.push({ dnNo: traNo, orderItem: orderItemIdx >= 0 ? String(row[orderItemIdx] || "") : "", factoryCode: factoryCodeIdx >= 0 ? String(row[factoryCodeIdx] || "") : "", location: giLocationIdx >= 0 ? String(row[giLocationIdx] || "") : "", binCode: grLocationIdx >= 0 ? String(row[grLocationIdx] || "") : "", materialCode, materialDesc, barcode, materialType: "", productStatus: "", shipTo: "", shipToName: "", shipToAddress: "", soldTo: "", soldToName: "", scanBy: createByIdx >= 0 ? String(row[createByIdx] || "") : "", scanTime: createDateIdx >= 0 ? String(row[createDateIdx] || "") : "" })
    }
    return { material: materialData, serial: serialData, traNo }
  }

  const filterDNsBySearch = (files: UploadedFile[]) => {
    if (!searchQuery.trim()) return files
    const q = searchQuery.toLowerCase()
    return files.filter(f =>
      f.dnNo.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) ||
      f.data.some(i => i.materialCode.toLowerCase().includes(q) || i.materialDescription.toLowerCase().includes(q)) ||
      f.serialData.some(i => i.barcode.toLowerCase().includes(q) || i.shipToName.toLowerCase().includes(q))
    )
  }
  const filterGroupedDataBySearch = (data: MaterialData[]) => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(i => i.materialCode.toLowerCase().includes(q) || i.materialDescription.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.remarks.toLowerCase().includes(q))
  }
  const filterSerialDataBySearch = (data: SerialData[]) => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(i => i.dnNo.toLowerCase().includes(q) || i.barcode.toLowerCase().includes(q) || i.materialCode.toLowerCase().includes(q) || i.materialDesc.toLowerCase().includes(q) || i.shipToName.toLowerCase().includes(q))
  }

  const groupAllData = (files: UploadedFile[]): MaterialData[] => {
    const map = new Map<string, MaterialData>()
    files.forEach(file => file.data.forEach(item => {
      const key = `${item.materialCode}|${item.materialDescription}|${item.remarks}`
      if (map.has(key)) {
        const e = map.get(key)!
        e.qty += item.qty
        if (item.shipName && !e.shipName.includes(item.shipName)) e.shipName = e.shipName ? `${e.shipName}, ${item.shipName}` : item.shipName
      } else map.set(key, { ...item })
    }))
    return Array.from(map.values())
  }

  const combineAllSerialData = (files: UploadedFile[]) =>
    files.flatMap(f => f.serialData).filter(r => r.materialCode && r.barcode)

  const groupSingleFileData = (fileData: MaterialData[]): MaterialData[] => {
    const map = new Map<string, MaterialData>()
    fileData.forEach(item => {
      const key = `${item.materialCode}|${item.materialDescription}|${item.remarks}`
      if (map.has(key)) { const e = map.get(key)!; e.qty += item.qty } else map.set(key, { ...item })
    })
    return Array.from(map.values())
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsLoading(true)
    try {
      const newFiles: UploadedFile[] = []
      const duplicateDNs: string[] = []
      const existingDNs = new Set(uploadedFiles.map(f => f.dnNo))
      for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi]
        const ab = await file.arrayBuffer()
        const wb = XLSX.read(ab)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        const headers = jsonData[0].map((h: any) => String(h || "").toLowerCase().trim())
        const isTRA = isTRAFormat(headers)
        let fileData: MaterialData[] = [], serialData: SerialData[] = [], dnNo = "N/A"
        if (isTRA) {
          const r = parseTRAData(jsonData, headers); fileData = r.material; serialData = r.serial; dnNo = r.traNo
        } else {
          const dnNoIdx = headers.findIndex(h => h.includes("dn no") || h.includes("dnno"))
          const materialCodeIdx = headers.findIndex(h => h.includes("material code") || h.includes("materialcode"))
          const materialDescIdx = headers.findIndex(h => h.includes("material desc") || h.includes("material description"))
          const barCodeIdx = headers.findIndex(h => h.includes("barcode") || h.includes("bar code"))
          const shipToNameIdx = headers.findIndex(h => h.includes("ship to name") || h.includes("shiptoname") || h.includes("ship name"))
          const orderItemIdx = headers.findIndex(h => h.includes("order item"))
          const factoryCodeIdx = headers.findIndex(h => h.includes("factory code"))
          const locationIdx = headers.findIndex(h => h.includes("location"))
          const materialTypeIdx = headers.findIndex(h => h.includes("material type"))
          const productStatusIdx = headers.findIndex(h => h.includes("product status"))
          const shipToIdx = headers.findIndex(h => h === "ship to" || h === "shipto")
          const shipToAddressIdx = headers.findIndex(h => h.includes("ship to address"))
          const soldToIdx = headers.findIndex(h => h === "sold to" || h === "soldto")
          const soldToNameIdx = headers.findIndex(h => h.includes("sold to name"))
          const scanByIdx = headers.findIndex(h => h.includes("scan by"))
          const scanTimeIdx = headers.findIndex(h => h.includes("scan time"))
          if (dnNoIdx >= 0 && jsonData[1]) dnNo = String(jsonData[1][dnNoIdx] || "N/A")
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!row || !row[materialCodeIdx]) continue
            const materialCode = String(row[materialCodeIdx] || "").trim()
            const materialDescription = materialDescIdx >= 0 ? String(row[materialDescIdx] || "").trim() : ""
            const barCode = barCodeIdx >= 0 ? String(row[barCodeIdx] || "") : ""
            const shipName = shipToNameIdx >= 0 ? String(row[shipToNameIdx] || "").trim() : ""
            if (!materialCode) continue
            const qtyIdx = headers.findIndex(h => h.includes("qty") || h.includes("quantity"))
            const qty = qtyIdx >= 0 ? parseInt(String(row[qtyIdx] || "1"), 10) || 1 : 1
            fileData.push({ materialCode, materialDescription, category: MATCODE_CATEGORY_MAP[materialCode] || "Others", qty, remarks: dnNo, shipName })
            serialData.push({ dnNo: dnNoIdx >= 0 ? String(row[dnNoIdx] || dnNo) : dnNo, orderItem: orderItemIdx >= 0 ? String(row[orderItemIdx] || "") : "", factoryCode: factoryCodeIdx >= 0 ? String(row[factoryCodeIdx] || "") : "", location: locationIdx >= 0 ? String(row[locationIdx] || "") : "", binCode: barCodeIdx >= 0 ? String(row[barCodeIdx] || "") : "", materialCode, materialDesc: materialDescription, barcode: barCode, materialType: materialTypeIdx >= 0 ? String(row[materialTypeIdx] || "") : "", productStatus: productStatusIdx >= 0 ? String(row[productStatusIdx] || "") : "", shipTo: shipToIdx >= 0 ? String(row[shipToIdx] || "") : "", shipToName: shipName, shipToAddress: shipToAddressIdx >= 0 ? String(row[shipToAddressIdx] || "") : "", soldTo: soldToIdx >= 0 ? String(row[soldToIdx] || "") : "", soldToName: soldToNameIdx >= 0 ? String(row[soldToNameIdx] || "") : "", scanBy: scanByIdx >= 0 ? String(row[scanByIdx] || "") : "", scanTime: scanTimeIdx >= 0 ? String(row[scanTimeIdx] || "") : "" })
          }
        }
        if (existingDNs.has(dnNo)) { duplicateDNs.push(dnNo); continue }
        newFiles.push({ id: `${Date.now()}-${fi}`, name: file.name, dnNo, data: fileData, serialData })
        existingDNs.add(dnNo)
      }
      if (duplicateDNs.length > 0) addNotification("warning", `Duplicate DN${duplicateDNs.length > 1 ? 's' : ''} skipped: ${duplicateDNs.join(", ")}`)
      if (newFiles.length > 0) { addNotification("success", `Uploaded ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`); await saveToSupabase(newFiles) }
      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      const newGrouped = groupAllData(allFiles); setGroupedData(newGrouped)
      const newSerial = combineAllSerialData(allFiles); setSerialListData(newSerial)
      setAnimatingRows(new Set())
      Array.from({ length: newGrouped.length }).forEach((_, idx) => {
        setTimeout(() => setAnimatingRows(prev => { const s = new Set(prev); s.add(idx); return s }), idx * 50)
      })
      if (newFiles.length > 0) setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), newGrouped.length * 50 + 300)
    } catch (err) {
      addNotification("error", "Error parsing file. Check required columns.")
    } finally { setIsLoading(false); e.target.value = "" }
  }

  const handleDeleteFile = (fileId: string) => {
    const updated = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(updated); setGroupedData(groupAllData(updated)); setSerialListData(combineAllSerialData(updated))
  }

  const handleClear = () => {
    setGroupedData([]); setSerialListData([]); setUploadedFiles([])
    setAnimatingRows(new Set()); setSelectedFileId(null); setShowFilesList(false)
  }

  const handleSelectFile = (fileId: string) => {
    if (selectedFileId === fileId) {
      setSelectedFileId(null)
      const all = groupAllData(uploadedFiles); setGroupedData(all); setSerialListData(combineAllSerialData(uploadedFiles))
    } else {
      setSelectedFileId(fileId)
      const sel = uploadedFiles.find(f => f.id === fileId)
      if (sel) { setGroupedData(groupSingleFileData(sel.data)); setSerialListData(sel.serialData) }
    }
    setAnimatingRows(new Set())
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300)
  }

  const handleDownloadExcel = () => {
    const ws = activeTab === "consolidated"
      ? XLSX.utils.json_to_sheet(groupedData.map(r => ({ "Material Code": r.materialCode, "Material Description": r.materialDescription, Category: r.category, "Qty.": r.qty, UM: "-", ShipName: r.shipName, Remarks: r.remarks })))
      : XLSX.utils.json_to_sheet(serialListData.map(r => ({ "DN No": r.dnNo, Location: r.location, "Bin Code": r.binCode, "Material Code": r.materialCode, "Material Desc": r.materialDesc, Barcode: r.barcode, "Ship To Name": r.shipToName, "Ship To Address": r.shipToAddress })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeTab === "consolidated" ? "Consolidated" : "Serial List")
    XLSX.writeFile(wb, activeTab === "consolidated" ? "Consolidated_Materials.xlsx" : "Bulking_Serial_List.xlsx")
  }

  const handleDownloadAllDN = () => {
    const wb = XLSX.utils.book_new()
    uploadedFiles.forEach(file => {
      const ws = XLSX.utils.json_to_sheet(file.serialData.map(r => ({ "DN No": r.dnNo, Location: r.location, "Bin Code": r.binCode, "Material Code": r.materialCode, "Material Desc": r.materialDesc, Barcode: r.barcode, "Ship To Name": r.shipToName, "Ship To Address": r.shipToAddress })))
      XLSX.utils.book_append_sheet(wb, ws, file.dnNo.substring(0, 31))
    })
    XLSX.writeFile(wb, "All_DN_Serial_Lists.xlsx")
  }

  const handleDownloadIndividualDN = (file: UploadedFile) => {
    const ws = XLSX.utils.json_to_sheet(file.serialData.map(r => ({ "DN No": r.dnNo, Location: r.location, "Bin Code": r.binCode, "Material Code": r.materialCode, "Material Desc": r.materialDesc, Barcode: r.barcode, "Ship To Name": r.shipToName, "Ship To Address": r.shipToAddress })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, file.dnNo.substring(0, 31))
    XLSX.writeFile(wb, `${file.dnNo}_Serial_List.xlsx`)
  }

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return
    const htmlContent = `<!DOCTYPE html><html><head><title>${activeTab === "consolidated" ? "Consolidated Materials Report" : "Bulking Serial List Report"}</title><style>@page{size:landscape;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:20px}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:15px}.logo img{height:45px;width:auto}.date{text-align:right;font-size:11px;color:#000;line-height:1.6}.date strong{font-weight:bold;font-size:12px}h1{color:#000;margin:15px 0 20px;font-size:22px;font-weight:bold;text-align:center}table{width:100%;border-collapse:collapse;margin-top:15px;font-size:10px;background:#fff;border:2px solid #000}th,td{border:1.5px solid #000;padding:10px 8px;text-align:center;word-wrap:break-word;color:#000}th{background:linear-gradient(180deg,#E8E8E8 0%,#D3D3D3 100%);font-weight:bold;font-size:11px;text-transform:uppercase;padding:12px 8px}tbody tr:nth-child(even){background:#F9F9F9}@media print{body{margin:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:landscape;margin:15mm}}</style></head><body><div class="header"><div class="logo"><img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF EXPRESS Logo"/></div><div class="date"><strong>Date Printed:</strong><br/>${formatDate()}</div></div><h1>${activeTab === "consolidated" ? "Consolidated Materials Report" : "Bulking Serial List Report"}</h1>${activeTab === "consolidated" ? `<table><thead><tr><th>MATERIAL CODE</th><th>MATERIAL DESCRIPTION</th><th>CATEGORY</th><th>QTY.</th><th>UM</th><th>SHIP NAME</th><th>REMARKS</th></tr></thead><tbody>${groupedData.filter(r => r.materialCode && r.materialDescription).map(r => `<tr><td style="font-weight:bold">${r.materialCode}</td><td>${r.materialDescription}</td><td>${r.category}</td><td style="font-weight:bold">${r.qty}</td><td>-</td><td>${r.shipName}</td><td>${r.remarks}</td></tr>`).join("")}</tbody></table>` : `<table><thead><tr><th>DN NO</th><th>LOCATION</th><th>BIN CODE</th><th>MATERIAL CODE</th><th>MATERIAL DESC</th><th>SERIAL NUMBER</th><th>SHIP TO NAME</th><th>SHIP TO ADDRESS</th></tr></thead><tbody>${serialListData.filter(r => r.materialCode && r.barcode).map(r => `<tr><td>${r.dnNo}</td><td>${r.location}</td><td>${r.binCode}</td><td style="font-weight:bold">${r.materialCode}</td><td>${r.materialDesc}</td><td style="font-weight:bold">${r.barcode}</td><td>${r.shipToName}</td><td>${r.shipToAddress}</td></tr>`).join("")}</tbody></table>`}</body></html>`
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleDownloadAllDNPDF = () => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return
    const allDNContent = uploadedFiles.map((file, index) => {
      const shipToName = file.serialData[0]?.shipToName || "N/A"
      const shipToAddress = file.serialData[0]?.shipToAddress || ""
      const pageBreakClass = index < uploadedFiles.length - 1 ? "page-break" : ""
      const totalQty = file.serialData.filter(r => r.materialCode && r.barcode).length
      return `<div class="${pageBreakClass}"><div class="header-section"><div class="logo-section"><img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF Express Logo" style="height:60px;width:auto"/><div style="font-size:9px;line-height:1.4;margin-top:5px"><strong>SF Express Warehouse</strong><br/>UPPER TINGUB, MANDAUE, CEBU</div></div><div class="title-section"><div class="dealer-copy">DEALER'S COPY</div><div style="margin-top:8px;text-align:right">${generateBarcodeSVG(file.dnNo)}</div></div></div><div class="document-header"><div class="doc-number">ORDER NO: ${file.dnNo}</div></div><div class="info-row"><div class="info-label">Client</div><div class="info-value">HAIER PHILIPPINES INC.</div></div><div class="info-row"><div class="info-label">Date</div><div class="info-value">${formatDateShort()}</div></div><div class="info-row"><div class="info-label">Customer</div><div class="info-value">${shipToName}</div></div><div class="info-row"><div class="info-label">Address</div><div class="info-value">${shipToAddress}</div></div><table class="data-table"><thead><tr><th style="width:40px">NO.</th><th style="width:120px">CATEGORY</th><th style="width:280px">MATERIAL DESCRIPTION</th><th style="width:200px">SERIAL NUMBER</th><th style="width:100px">REMARKS</th></tr></thead><tbody>${file.serialData.filter(r => r.materialCode && r.barcode).map((r, idx) => `<tr><td style="text-align:center">${idx + 1}</td><td style="text-align:center">${getCategoryFromBinCode(r.barcode).toUpperCase()}</td><td style="text-align:center">${r.materialDesc || r.materialCode}</td><td style="text-align:center;font-weight:bold">${r.barcode}</td><td></td></tr>`).join("")}</tbody></table><div class="footer-info"><div><strong>TOTAL QTY: ${totalQty}</strong></div></div></div>`
    }).join("")
const htmlContent = `<!DOCTYPE html><html><head><title>All DN Serial Lists</title><style>@page{size:portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:15px;font-size:11px}.page-break{page-break-after:always;margin-bottom:20px;margin-right:10px}.header-section{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #000}.title-section{display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start}.dealer-copy{font-size:15px;font-weight:bold;letter-spacing:1px;margin-right:10px;text-align:right;color:#FF2C2C}.document-header{text-align:center;margin:15px 0;font-size:20px;font-weight:bold}.doc-number{font-size:20px;font-weight:bold}.info-row{display:flex;gap:8px;margin-bottom:4px;font-size:10px}.info-label{font-weight:bold;width:80px}.data-table{width:100%;border-collapse:collapse;margin:15px 0;border:2px solid #000}.data-table th{border:1px solid #000;padding:8px 6px;font-weight:bold;font-size:10px;text-align:center;background:#fff}.data-table td{border:1px solid #000;padding:6px;font-size:10px}.footer-info{margin:10px 0;font-size:11px}@media print{body{margin:0;padding:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:portrait;margin:10mm}}</style></head><body>${allDNContent}</body></html>`
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleDownloadIndividualDNPDF = (file: UploadedFile) => {
    const printWindow = window.open("", "", "width=1200,height=800")
    if (!printWindow) return
    const shipToName = file.serialData[0]?.shipToName || "N/A"
    const shipToAddress = file.serialData[0]?.shipToAddress || ""
    const totalQuantity = file.serialData.filter(r => r.materialCode && r.barcode).length
    const htmlContent = `<!DOCTYPE html><html><head><title>${file.dnNo} - Serial List</title><style>@page{size:portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:15px;font-size:11px}.header-section{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #000}.dealer-copy{font-size:18px;font-weight:bold;letter-spacing:1px}.document-header{text-align:center;margin:15px 0}.doc-number{font-size:20px;font-weight:bold}.info-row{display:flex;gap:8px;margin-bottom:4px;font-size:10px}.info-label{font-weight:bold;width:80px}.data-table{width:100%;border-collapse:collapse;margin:15px 0;border:2px solid #000}.data-table th{border:1px solid #000;padding:8px 6px;font-weight:bold;font-size:10px;text-align:center;background:#e8e8e8}.data-table td{border:1px solid #000;padding:6px;font-size:10px}.footer-info{margin:10px 0;font-size:11px}.separator{text-align:center;margin:15px 0;font-size:10px}@media print{body{margin:0;padding:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:portrait;margin:10mm}}</style></head><body><div class="header-section"><div><img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF Express Logo" style="height:60px;width:auto"/><div style="font-size:9px;line-height:1.4;margin-top:5px"><strong>SF Express Warehouse</strong><br/>TINGUB, MANDAUE, CEBU</div></div><div style="text-align:right"><div class="dealer-copy">DEALER'S COPY</div><div style="margin-top:8px">${generateBarcodeSVG(file.dnNo)}</div><div style="font-size:10px;margin-top:4px">${formatDateShort()}</div></div></div><div class="document-header"><div class="doc-number">Doc # : ${file.dnNo}</div></div><div class="info-row"><div class="info-label">Client</div><div>HAIER PHILIPPINES INC.</div></div><div class="info-row"><div class="info-label">Date</div><div>${formatDateShort()}</div></div><div class="info-row"><div class="info-label">Customer</div><div>${shipToName}</div></div><div class="info-row"><div class="info-label">Address</div><div>${shipToAddress}</div></div><table class="data-table"><thead><tr><th style="width:40px">#</th><th style="width:120px">CATEGORY</th><th style="width:280px">MATERIAL DESCRIPTION</th><th style="width:200px">SERIAL NUMBER</th><th style="width:100px">REMARKS</th></tr></thead><tbody>${file.serialData.filter(r => r.materialCode && r.barcode).map((r, idx) => `<tr><td style="text-align:center">${idx + 1}</td><td style="text-align:center">${getCategoryFromBinCode(r.barcode).toUpperCase()}</td><td style="text-align:center">${r.materialDesc || r.materialCode}</td><td style="text-align:center;font-weight:bold">${r.barcode}</td><td></td></tr>`).join("")}</tbody></table><div class="footer-info"><strong>TOTAL QTY: ${totalQuantity}</strong></div><div class="separator">********** Nothing Follows **********</div></body></html>`
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  const handleDownloadConfirm = () => {
    setShowDownloadModal(false)
    if (downloadType === "pdf") {
      if (isDownloadingAllDN) handleDownloadAllDNPDF()
      else if (selectedDownloadFile) handleDownloadIndividualDNPDF(selectedDownloadFile)
      else handleDownloadPDF()
    } else {
      if (isDownloadingAllDN) handleDownloadAllDN()
      else if (selectedDownloadFile) handleDownloadIndividualDN(selectedDownloadFile)
      else handleDownloadExcel()
    }
    setSelectedDownloadFile(null); setIsDownloadingAllDN(false)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const files = e.dataTransfer.files
    if (files?.length) {
      const input = document.getElementById('file-upload') as HTMLInputElement
      if (input) {
        const dt = new DataTransfer()
        Array.from(files).forEach(f => dt.items.add(f))
        input.files = dt.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  const tabs = [
    { id: "consolidated" as TabType, label: "Consolidated",   icon: Layers },
    { id: "serialList"   as TabType, label: "Serial List",    icon: FileText },
    { id: "individualDN" as TabType, label: "Individual DN",  icon: Download },
  ]

  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="flex-shrink-0 h-[73px] border-b border-[#282828] z-50 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-[#282828] rounded-full transition-colors flex-shrink-0">
          <Menu className="w-5 h-5 text-[#B3B3B3]" />
        </button>

        <Link href="/" className="p-2 rounded-full hover:bg-[#282828] transition-colors flex-shrink-0" title="Home">
          <Home className="w-4 h-4 text-[#6A6A6A] hover:text-[#B3B3B3] transition-colors" />
        </Link>

        <div className="w-px h-5 bg-[#282828] flex-shrink-0 hidden sm:block" />

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center">
            <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          </div>
          <div className="hidden sm:block">
            <p className="text-[9px] uppercase tracking-widest font-bold text-white leading-none mb-0.5">SF Express</p>
            <h1 className="text-white text-sm font-black leading-none">Excel Uploader</h1>
          </div>
          <div className="sm:hidden">
            <h1 className="text-white text-sm font-black">Excel Uploader</h1>
          </div>
        </div>

        <div className="flex-1" />

        {uploadedFiles.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border border-[#3E3E3E] rounded-full">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#6A6A6A]">Files</span>
            <span className="text-xs font-black text-white tabular-nums">{uploadedFiles.length}</span>
          </div>
        )}
      </nav>

      {/* ── Toast notifications ── */}
      <div className="fixed top-[85px] right-4 z-[100] space-y-2 max-w-sm pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border pointer-events-auto animate-slideInRight ${
            n.type === 'error'   ? 'bg-[#1E1E1E] border-[#E8192C]/40' :
            n.type === 'warning' ? 'bg-[#1E1E1E] border-yellow-500/40' :
                                   'bg-[#1E1E1E] border-green-500/40'
          }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
              n.type === 'error' ? 'bg-[#E8192C]' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <p className="text-sm font-semibold text-white flex-1">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="p-0.5 hover:bg-[#3E3E3E] rounded-full transition-colors ml-1">
              <X className="w-3 h-3 text-[#6A6A6A]" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .animate-slideInRight { animation: slideInRight 0.3s ease forwards; }
        .animate-row { animation: fadeInUp 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>

      {/* ── Below-nav row ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden bg-black/35">

        {/* ── Sidebar ── */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40" onClick={() => setSidebarOpen(false)} />}
        <aside className={`
          fixed left-0 top-[73px] bg-[#121212] border-r border-[#282828] flex flex-col z-50
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-[73px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        `} style={{ height: 'calc(100vh - 73px)' }}>
          <nav className="flex-1 py-3 overflow-hidden">
            <div className="space-y-0.5 px-2">
              {/* Upload action */}
              <label htmlFor="file-upload" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-150 text-[#B3B3B3] hover:bg-[#282828] hover:text-white ${sidebarCollapsed ? 'justify-center' : ''} group relative`}>
                <Upload className="w-5 h-5 flex-shrink-0 text-[#E8192C]" />
                {!sidebarCollapsed && <span>Upload Files</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#282828] border border-[#3E3E3E] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs text-white z-50 shadow-xl">Upload Files</div>
                )}
                <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="h-px bg-[#282828] my-2" />

              {tabs.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id && (groupedData.length > 0 || serialListData.length > 0)
                return (
                  <button key={id} onClick={() => { setActiveTab(id); setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100) }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-150 relative group ${sidebarCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-[#E8192C]/15 text-white' : 'text-[#B3B3B3] hover:bg-[#282828] hover:text-white'}`}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E8192C] rounded-r-full" />}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#E8192C]' : ''}`} />
                    {!sidebarCollapsed && <span>{label}</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#282828] border border-[#3E3E3E] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs text-white z-50 shadow-xl">{label}</div>
                    )}
                  </button>
                )
              })}

              {uploadedFiles.length > 0 && (
                <>
                  <div className="h-px bg-[#282828] my-2" />
                  <button onClick={handleClear} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-semibold text-sm transition-all duration-150 text-[#6A6A6A] hover:bg-[#E8192C]/10 hover:text-[#E8192C] ${sidebarCollapsed ? 'justify-center' : ''} group relative`}>
                    <X className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>Clear All</span>}
                    {sidebarCollapsed && <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#282828] border border-[#3E3E3E] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs text-white z-50 shadow-xl">Clear All</div>}
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="flex-shrink-0 border-t border-[#282828] p-2">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex w-full items-center justify-center p-2.5 rounded-lg hover:bg-[#282828] transition-colors text-[#6A6A6A] hover:text-white">
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            {!sidebarCollapsed && <p className="text-[10px] text-[#6A6A6A] text-center pb-1 pt-0.5">v1.0.0</p>}
          </div>
        </aside>

        {/* ── Main scrollable area ── */}
        <main className="flex-1 overflow-y-auto min-h-0 min-w-0">
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-[#E8192C]/3 rounded-full blur-[120px] z-0" />

          <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* ── Upload drop zone ── */}
            <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden"
              style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.08) 0%, #121212 100%)' }}>
              <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#282828]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shadow-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}>
                    <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-0.5">Haier Barcode Excel</p>
                    <h2 className="text-base sm:text-lg font-black text-white leading-tight">Upload Files</h2>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <label htmlFor="file-upload-main" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  className={`relative block cursor-pointer transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}>
                  <div className={`border-2 border-dashed rounded-xl transition-all duration-300 ${
                    isDragging ? 'border-[#E8192C] bg-[#E8192C]/5' : 'border-[#3E3E3E] hover:border-[#E8192C]/50 hover:bg-[#E8192C]/3'
                  }`}>
                    <div className="flex flex-col items-center justify-center py-12 px-6">
                      <div className="relative mb-5">
                        {isDragging && <div className="absolute inset-0 rounded-full bg-[#E8192C]/20 animate-ping" />}
                        <div className={`relative p-5 rounded-full transition-all duration-300 ${
                          isDragging ? 'scale-110' : 'group-hover:scale-105'
                        }`} style={{ background: isDragging ? 'linear-gradient(135deg, #E8192C, #7f0e18)' : 'linear-gradient(135deg, #282828, #1E1E1E)' }}>
                          <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-[#B3B3B3]'}`} />
                        </div>
                      </div>
                      <p className={`text-lg font-black mb-1 transition-colors duration-300 ${isDragging ? 'text-[#E8192C]' : 'text-white'}`}>
                        {isDragging ? 'Drop files here' : 'Drop files or click to upload'}
                      </p>
                      <p className="text-sm text-[#6A6A6A] mb-4">Haier barcode Excel files</p>
                      <div className="flex items-center gap-2">
                        {['.xlsx', '.xls', '.csv'].map(ext => (
                          <span key={ext} className="px-3 py-1 bg-[#282828] border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-xs font-bold">{ext}</span>
                        ))}
                      </div>
                    </div>

                    {/* Corner decorations */}
                    {['top-3 left-3 border-t-2 border-l-2 rounded-tl-lg', 'top-3 right-3 border-t-2 border-r-2 rounded-tr-lg', 'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg', 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg'].map((cls, i) => (
                      <div key={i} className={`absolute w-5 h-5 ${cls} ${isDragging ? 'border-[#E8192C]/60' : 'border-[#3E3E3E]'} transition-colors duration-300`} />
                    ))}
                  </div>
                  <input id="file-upload-main" type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFileUpload} className="hidden" />
                </label>

                {isLoading && (
                  <div className="mt-6 flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full border-2 border-[#3E3E3E] animate-spin border-t-[#E8192C]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Processing files…</p>
                      <div className="mt-1.5 h-1.5 bg-[#282828] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E8192C] rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Uploaded files list ── */}
            {uploadedFiles.length > 0 && (
              <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden">
                <button onClick={() => setShowFilesList(!showFilesList)}
                  className="w-full flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#282828] hover:bg-[#1E1E1E] transition-colors">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-4 h-4 text-[#E8192C]" />
                    <span className="text-sm font-bold text-white uppercase tracking-widest">Uploaded Files</span>
                    <span className="px-2.5 py-0.5 bg-[#E8192C]/15 border border-[#E8192C]/30 text-[#E8192C] rounded-full text-xs font-black">{uploadedFiles.length}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#6A6A6A] transition-transform duration-300 ${showFilesList ? 'rotate-90' : ''}`} />
                </button>

                {showFilesList && (
                  <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                    {uploadedFiles.map((file, idx) => (
                      <div key={file.id} onClick={() => handleSelectFile(file.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedFileId === file.id
                            ? 'border-[#E8192C]/40 bg-[#E8192C]/8'
                            : 'border-[#282828] bg-[#1E1E1E] hover:border-[#3E3E3E] hover:bg-[#282828]'
                        }`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: selectedFileId === file.id ? 'linear-gradient(135deg, #E8192C, #7f0e18)' : '#282828' }}>
                          <FileSpreadsheet className={`w-4 h-4 ${selectedFileId === file.id ? 'text-white' : 'text-[#6A6A6A]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${selectedFileId === file.id ? 'text-white' : 'text-[#B3B3B3]'}`}>{file.name}</p>
                          <p className="text-[10px] text-[#6A6A6A] mt-0.5">ORDER: {file.dnNo} · {file.data.length} items</p>
                        </div>
                        {selectedFileId === file.id && <CheckCircle2 className="w-4 h-4 text-[#E8192C] flex-shrink-0" />}
                        <button onClick={e => { e.stopPropagation(); handleDeleteFile(file.id) }}
                          className="p-1.5 text-[#6A6A6A] hover:text-[#E8192C] hover:bg-[#E8192C]/10 rounded-full transition-all flex-shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Data table section ── */}
            {(groupedData.length > 0 || serialListData.length > 0) && (
              <div ref={tableRef} className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden">

                {/* Tab bar */}
                <div className="flex border-b border-[#282828]">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-150 relative ${
                        activeTab === id ? 'text-white bg-[#1E1E1E]' : 'text-[#6A6A6A] hover:text-[#B3B3B3] hover:bg-[#1E1E1E]/50'
                      }`}>
                      <Icon className={`w-3.5 h-3.5 ${activeTab === id ? 'text-[#E8192C]' : ''}`} />
                      <span className="hidden sm:inline">{label}</span>
                      {activeTab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E8192C]" />}
                    </button>
                  ))}
                </div>

                <div className="p-4 sm:p-6">
                  {/* Search */}
                  <div className="flex gap-3 mb-5">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A6A]" />
                      <input type="text" placeholder="Search DN, serial, material…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1E1E1E] border border-[#3E3E3E] text-white rounded-xl text-sm placeholder-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/50 focus:border-[#E8192C] transition-all" />
                    </div>
                    <div className="flex gap-2">
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="px-3 py-2.5 bg-[#1E1E1E] border border-[#3E3E3E] text-[#B3B3B3] rounded-xl text-xs font-bold hover:border-white hover:text-white transition-all">
                          Clear
                        </button>
                      )}
                      <button onClick={() => setShowDownloadModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
                        style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>

                  {/* Consolidated tab */}
                  {activeTab === "consolidated" && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-black text-white">Consolidated Materials</h2>
                          <p className="text-xs text-[#6A6A6A] mt-0.5">
                            {selectedFileId ? `Viewing: ${uploadedFiles.find(f => f.id === selectedFileId)?.name}` : 'All uploaded files combined'}
                          </p>
                        </div>
                        <span className="text-xs text-[#E8192C] font-black">{filterGroupedDataBySearch(groupedData).length} items</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#282828]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#282828]" style={{ background: '#1E1E1E' }}>
                              {["Material Code","Material Description","Category","Qty.","UM","Ship Name","Remarks"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filterGroupedDataBySearch(groupedData).filter(r => r.materialCode && r.materialDescription).map((row, idx) => (
                              <tr key={idx} className={`border-b border-[#282828]/50 hover:bg-[#1E1E1E] transition-colors ${animatingRows.has(idx) ? 'animate-row' : 'opacity-0'}`} style={{ animationDelay: `${idx * 0.02}s` }}>
                                <td className="px-4 py-3  text-[10px] text-white font-bold">{row.materialCode}</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.materialDescription}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-[#E8192C]/15 border border-[#E8192C]/30 text-[#E8192C] rounded-full text-[10px] font-bold">{row.category}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="px-2.5 py-1 rounded-full font-black text-white text-xs" style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>{row.qty}</span>
                                </td>
                                <td className="px-4 py-3 text-[#6A6A6A]">—</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.shipName}</td>
                                <td className="px-4 py-3 text-[#6A6A6A]  text-[10px]">{row.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Serial list tab */}
                  {activeTab === "serialList" && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-black text-white">Bulking Serial List</h2>
                          <p className="text-xs text-[#6A6A6A] mt-0.5">All serial numbers combined</p>
                        </div>
                        <span className="text-xs text-[#E8192C] font-black">{filterSerialDataBySearch(serialListData).length} rows</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#282828]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#282828]" style={{ background: '#1E1E1E' }}>
                              {["DN No","Location","Bin Code","Material Code","Material Desc","Barcode","Ship To Name","Ship To Address"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filterSerialDataBySearch(serialListData).filter(r => r.materialCode && r.barcode).map((row, idx) => (
                              <tr key={idx} className={`border-b border-[#282828]/50 hover:bg-[#1E1E1E] transition-colors ${animatingRows.has(idx) ? 'animate-row' : 'opacity-0'}`} style={{ animationDelay: `${idx * 0.02}s` }}>
                                <td className="px-4 py-3 text-white font-bold">{row.dnNo}</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.location}</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.binCode}</td>
                                <td className="px-4 py-3  text-[10px] text-white font-bold">{row.materialCode}</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.materialDesc}</td>
                                <td className="px-4 py-3  text-[10px] font-black text-white">{row.barcode}</td>
                                <td className="px-4 py-3 text-[#B3B3B3]">{row.shipToName}</td>
                                <td className="px-4 py-3 text-[#6A6A6A]">{row.shipToAddress}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Individual DN tab */}
                  {activeTab === "individualDN" && (
                    <>
                      <div className="mb-5">
                        <h2 className="text-base font-black text-white">Individual DN Downloads</h2>
                        <p className="text-xs text-[#6A6A6A] mt-0.5">Download per-DN serial lists or all at once</p>
                      </div>
                      <div className="space-y-3">
                        {/* Download all card */}
                        <div className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#E8192C]/20 rounded-xl hover:border-[#E8192C]/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                              <Layers className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Download All DN Serial Lists</p>
                              <p className="text-xs text-[#6A6A6A]">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} available</p>
                            </div>
                          </div>
                          <button onClick={() => { setIsDownloadingAllDN(true); setShowDownloadModal(true) }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
                            style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                            <Download className="w-3.5 h-3.5" /> Download All
                          </button>
                        </div>

                        {filterDNsBySearch(uploadedFiles).map((file, idx) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#282828] rounded-xl hover:border-[#3E3E3E] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#282828] flex items-center justify-center">
                                <FileSpreadsheet className="w-4 h-4 text-[#6A6A6A]" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{file.dnNo}</p>
                                <p className="text-xs text-[#6A6A6A]">{file.name}</p>
                              </div>
                            </div>
                            <button onClick={() => { setSelectedDownloadFile(file); setIsDownloadingAllDN(false); setShowDownloadModal(true) }}
                              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#727272] text-white text-xs font-bold hover:border-white transition-all">
                              <Download className="w-3.5 h-3.5 text-[#E8192C]" /> Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 pb-2 text-center">
              <p className="text-[10px] text-[#6A6A6A]">
                Developed by <span className="font-bold text-[#B3B3B3]">MAR</span> · All Rights Reserved © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ── Download modal ── */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-black text-white mb-1">Download Format</h3>
            <p className="text-xs text-[#6A6A6A] mb-5">Choose how you'd like to export the data</p>

            <div className="space-y-2 mb-6">
              {[
                { type: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet', icon: FileSpreadsheet },
                { type: 'pdf',   label: 'PDF',           desc: 'Print-ready document', icon: FileText },
              ].map(opt => (
                <button key={opt.type} onClick={() => setDownloadType(opt.type as 'pdf' | 'excel')}
                  className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all duration-150 ${
                    downloadType === opt.type ? 'border-[#E8192C]/50 bg-[#E8192C]/8' : 'border-[#3E3E3E] hover:border-[#E8192C]/30 hover:bg-[#282828]'
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${downloadType === opt.type ? 'border-[#E8192C]' : 'border-[#6A6A6A]'}`}>
                    {downloadType === opt.type && <div className="w-2.5 h-2.5 rounded-full bg-[#E8192C]" />}
                  </div>
                  <opt.icon className={`w-5 h-5 flex-shrink-0 ${downloadType === opt.type ? 'text-[#E8192C]' : 'text-[#6A6A6A]'}`} />
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-xs text-[#6A6A6A]">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowDownloadModal(false); setSelectedDownloadFile(null); setIsDownloadingAllDN(false) }}
                className="flex-1 px-4 py-2.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-sm font-semibold hover:border-white hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleDownloadConfirm}
                className="flex-1 px-4 py-2.5 rounded-full text-white text-sm font-bold hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
                style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scroll to top ── */}
      {showScrollTop && (
        <button onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full text-white shadow-2xl hover:bg-[#FF1F30] transition-all hover:scale-110 shadow-[#E8192C]/25"
          style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)' }}>
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}