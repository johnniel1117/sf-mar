"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as XLSX from "xlsx-js-style"
import { Upload, X, FileSpreadsheet, Download, FileText, CheckCircle2, Layers, AlertCircle, ArrowUp, Search } from "lucide-react"
import LogoGridBackground from "../components/LogoBackground"

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
  const [isDragging, setIsDragging] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (showDownloadModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDownloadModal])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const addNotification = (type: "error" | "warning" | "success", message: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setNotifications(prev => [...prev, { id, type, message }])  
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

const MATCODE_CATEGORY_MAP: Record<string, string> = {
  // Exact full MATCODE → Category mapping (highest priority)
  "TD0027283": "Small Appliances",
  "FB28UQM00": "Cooktop",
  "FB28UPM00": "Cooktop",
  "FB28URM00": "Cooktop",
  "TD0027815": "Cooktop",
  "F705V5M02": "Small Appliances",
  "F705V6M02": "Small Appliances",
  "F705V7M02": "Small Appliances",
  "F705V8M02": "Small Appliances",
  "TD0041312": "Cooker",
  "FY01KJM01": "Cooker",
  "TD0038391": "Cooker",
  "TD0038855": "Cooker",
  "FY01KCM01": "Cooker",
  "TD0025710": "Cooker",
  "TD0031890": "Cooker",
  "TD0037147": "Cooker",
  "TD0038392": "Cooker",
  "TD0038854": "Cooker",
  "TD0035664": "Cooker",
  "TD0031891": "Cooker",
  "TD0027816": "Cooker",
  "TD0039389": "Cooker",
  "TD0042656": "Cooker",
  "TD0039388": "Cooker",
  "TD0032570": "Cooker",
  "TD0042657": "Cooker",
  "FY01KGM01": "Cooker",
  "TD0035663": "Cooker",
  "TD0030850": "Cooker",
  "FY01KFM01": "Cooker",
  "TD0041954": "Cooker",
  "TD0042659": "Cooker",
  "TD0017818": "Small Appliances",
  "TD0017819": "Small Appliances",
  "TD0017820": "Small Appliances",
  "TD0017823": "Small Appliances",
  "TD0017822": "Small Appliances",
  "TD0017826": "Small Appliances",
  "F705V9M02": "Small Appliances",
  "TD0026191": "Range Hood",
  "TD0026189": "Range Hood",
  "TD0032571": "Range Hood",
  "TD0038390": "Range Hood",
  "TD0041953": "Range Hood",
  "TD0038853": "Range Hood",
  "FB28UNM00": "Cooktop",
  "TD0042658": "Cooker",
  "B30FZ4M6K": "Freezer",
  "B30FM4M6K": "Freezer",
  "B300G5M6K": "Freezer",
  "B30GK2M6J": "Freezer",
  "BD07U2M00": "Freezer",
  "BF0GS8M00": "Freezer",
  "BF0GS5M00": "Freezer",
  "AD0KG4U00": "Home Air Conditioner",
  "AA93Z2E07": "Home Air Conditioner",
  "AA1P5NE09": "Home Air Conditioner",
  "AAA363E03": "Home Air Conditioner",
  "AAA7B1E00": "Home Air Conditioner",
  "AAA369E03": "Home Air Conditioner",
  "AAA7B8E00": "Home Air Conditioner",
  "AAXN4E07": "Home Air Conditioner",
  "AAXG3E07": "Home Air Conditioner",
  "AAXN2E07": "Home Air Conditioner",
  "AAXG1E07": "Home Air Conditioner",
  "AAC1NUE00": "Home Air Conditioner",
  "AAC1QBE00": "Home Air Conditioner",
  "AAC1NWE00": "Home Air Conditioner",
  "AAC1QDE00": "Home Air Conditioner",
  "AAAV51E07": "Home Air Conditioner",
  "AAAV11E07": "Home Air Conditioner",
  "AABT67E00": "Home Air Conditioner",
  "AABQZ6E00": "Home Air Conditioner",
  "AABT6GE00": "Home Air Conditioner",
  "AABQZDE00": "Home Air Conditioner",
  "AA9401E09": "Home Air Conditioner",
  "AA1PE2E09": "Home Air Conditioner",
  "AAA2HAE00": "Home Air Conditioner",
  "AAA7CDE00": "Home Air Conditioner",
  "AA8X40E4U": "Commercial AC",
  "AA8XD0E4U": "Commercial AC",
  "AA99T0E4U": "Commercial AC",
  "AA9AQ0E29": "Commercial AC",
  "AA8LF0E5W": "Commercial AC",
  "AA8XJ0E4U": "Commercial AC",
  "AA8MR0E5W": "Commercial AC",
  "AZ0Q90E04": "Commercial AC",
  "AA9ZG1E29": "Commercial AC",
  "AZ0Y30E01": "Commercial AC",
  "AA9AE0E29": "Commercial AC",
  "DH1U6BD00": "TV",
  "DH1U6PD01": "TV",
  "DH1U6ND02": "TV",
  "DH1U6CD03": "TV",
  "DH1U8PD03": "TV",
  "DH1U8JD02": "TV",
  "DH1VK3D00": "TV",
  "B00TU8E8N": "Refrigerator",
  "B00U05B8V": "Refrigerator",
  "BS08X2EA6": "Refrigerator",
  "BS08Z2EA6": "Refrigerator",
  "BS09TBM90": "Refrigerator",
  "BS0B830AE": "Refrigerator",
  "BA0A6JM04": "Refrigerator",
  "BS0B9208Z": "Refrigerator",
  "TD0025229": "Refrigerator",
  "BM03U1M4Z": "Refrigerator",
  "BM03U0M4Z": "Refrigerator",

  "CF0HV7E00": "Drum Washing Machine",
  "CEAB9HE00": "Drum Washing Machine",
  "CF05Y7E0H": "Drum Washing Machine",
  "CAABT5M01": "Washing Machine",
  "CAABT7M00": "Washing Machine",
  "CAABT2M01": "Washing Machine",
  "CAAC6AE00": "Washing Machine",
  "CBAMZH00001W1R8F0132": "Washing Machine",
  "CE0J9HE0G": "Drum Washing Machine",
  "CE0JKNE00": "Drum Washing Machine",
  "CE0JYCE0H": "Drum Washing Machine",
  "CC0JRHM00": "Washing Machine",

  "TD0047781": "Home Air Conditioner",
  "AD0P31U00": "Home Air Conditioner",
  "AAC1UDU00": "Home Air Conditioner",
  "AD0P21U00": "Home Air Conditioner",
};

const getCategoryFromBinCode = (barcode: string): string => {
  if (!barcode) return "Others";

  const code = String(barcode).toUpperCase().trim();

  // 1. Exact full MATCODE match (most accurate)
  if (MATCODE_CATEGORY_MAP[code]) {
    return MATCODE_CATEGORY_MAP[code];
  }

  // 2. Keyword-based quick catches (promos, mockups, reserves, TV brackets, etc.)
  if (
    code.includes("MOCKUP") ||
    code.includes("#N/A") ||
    code.startsWith("RESERVE") ||
    code.includes("APRON") ||
    code.includes("GLOVES") ||
    code.includes("FLAG") ||
    code.includes("UMBRELLA") ||
    code.includes("T-SHIRT") ||
    code.includes("CALENDAR") ||
    code.includes("CLOCK") ||
    code.includes("TEARDROP") ||
    code.includes("ROLL-UP") ||
    code.includes("POWERED FAN") ||
    code.includes("JBL FLIP") ||
    code.includes("LUMINARC")
  ) {
    return "Others";
  }

  // 3. TV detection (strong patterns)
  if (
    code.startsWith("DH1") ||
    code.startsWith("DC1") ||
    code.startsWith("DD1") ||
    code.startsWith("DA1") ||
    code.startsWith("DT0") ||
    code.startsWith("DZ0") ||
    code.includes("LE") ||
    code.includes("H") && (code.includes("K") || code.includes("S") || code.includes("U")) ||
    code.includes("BRKT") ||
    code.includes("BRACKET") ||
    code.includes("HHT-MIT") ||
    code.includes("MEDIA TANK") ||
    code.includes("Q70") ||
    code.includes("TVR-") ||
    code.includes("WIRELESS KEYBOARD")
  ) {
    return "TV";
  }

  // 4. Exact full-MATCODE-style fallback (longer & more specific prefixes first)
// This runs only if no exact match was found in MATCODE_CATEGORY_MAP

// Freezer
if (
  code.startsWith("B30FZ") || code.startsWith("B30FM") || code.startsWith("B300G") ||
  code.startsWith("B30GK") || code.startsWith("B30GL") || code.startsWith("B30GM") ||
  code.startsWith("B30JU") || code.startsWith("BD07U") || code.startsWith("BF0GS") ||
  code.startsWith("BF0G3") || code.startsWith("BW0AC") || code.startsWith("BW0AD") ||
  code.startsWith("BW03N") || code.startsWith("BY0H4") || code.startsWith("BY0K1") ||
  code.startsWith("BY0ET") || code.startsWith("BY0H5") || code.startsWith("BY0JQ") ||
  code.startsWith("BB09U") || code.startsWith("B401N") ||
  code.startsWith("TD00438") || code.startsWith("TD00453")  // CF-0* freezers
) return "Freezer";

// Refrigerator
if (
  code.startsWith("B00TU") || code.startsWith("B00U0") ||
  code.startsWith("BA0A6") || code.startsWith("BH02X") || code.startsWith("BH03Y") ||
  code.startsWith("BH034") || code.startsWith("BJ0XC") || code.startsWith("BJ0XD") ||
  code.startsWith("BJ0XE") || code.startsWith("BL05")  || code.startsWith("BL06") ||
  code.startsWith("BM03L") || code.startsWith("BM03M") || code.startsWith("BM03N") || code.startsWith("BM03U1M") ||
  code.startsWith("BM03U") || code.startsWith("BM03Y") || code.startsWith("BM03Z") ||
  code.startsWith("BS08X") || code.startsWith("BS08Z") || code.startsWith("BS09R") ||
  code.startsWith("BS09A") || code.startsWith("BS099") || code.startsWith("BS0B8") ||
  code.startsWith("BS0B9") || code.startsWith("BS0BE") || code.startsWith("BS0BF") ||
  code.startsWith("BS0BG") || code.startsWith("HRF-")  || code.startsWith("HR-IV") ||
  code.startsWith("HR-S")  || code.startsWith("HR-B")  || code.startsWith("HR-C") ||
  code.startsWith("TD00252") || code.startsWith("TD00449") || code.startsWith("TD00463")
) return "Refrigerator";

// TV
if (
  code.startsWith("DH1U6") || code.startsWith("DH1U8") || code.startsWith("DH1U9") ||
  code.startsWith("DH1VK") || code.startsWith("DH1VL") || code.startsWith("DH1VM") ||
  code.startsWith("DH1VV") || code.startsWith("DH1VW") || code.startsWith("DH1X")  ||
  code.startsWith("DH1SX") || code.startsWith("DC1J") || code.startsWith("DC1M") ||
  code.startsWith("DC1Q") || code.startsWith("DD10P") || code.startsWith("DA109") ||
  code.startsWith("DA0QW") || code.startsWith("DT001") || code.startsWith("DZ0Z2") ||
  code.startsWith("FA08G") || code.startsWith("FP243") || code.startsWith("LE22") ||
  code.startsWith("LE24") || code.startsWith("LE28") || code.startsWith("LE32") ||
  code.startsWith("LE39") || code.startsWith("LE40") || code.startsWith("LE42") ||
  code.startsWith("LE43") || code.startsWith("LE46") || code.startsWith("LE48") ||
  code.startsWith("LE49") || code.startsWith("LE50") || code.startsWith("LE55") ||
  code.startsWith("LE58") || code.startsWith("LE65") || code.startsWith("H32")   ||
  code.startsWith("H40")   || code.startsWith("H42")   || code.startsWith("H43")   ||
  code.startsWith("H50")   || code.startsWith("H55")   || code.startsWith("H58")   ||
  code.startsWith("H65")   || code.startsWith("H70")   || code.startsWith("H75")   ||
  code.startsWith("H85")   || code.startsWith("H98")   ||
  code.includes("BRKT") || code.includes("BRACKET") || code.includes("HHT-MIT") ||
  code.includes("MEDIA TANK") || code.includes("Q70") || code.includes("TVR-") ||
  code.includes("WIRELESS KEYBOARD") || code.includes("LCD-") || code.includes("LCE-")
) return "TV";

// Drum Washing Machine
if (
  code.startsWith("CE0J9") || code.startsWith("CE0JK") || code.startsWith("CE0JW") ||
  code.startsWith("CEAAJ") || code.startsWith("CEAB9") || code.startsWith("CEABX") ||
  code.startsWith("CEACE") || code.startsWith("CF0HV") || code.startsWith("CF0J4") ||
  code.startsWith("HWD1") || code.startsWith("HW100") || code.startsWith("HW80-") ||
  code.startsWith("HWD80") || code.startsWith("HWD12")
) return "Drum Washing Machine";

// Washing Machine (mostly top-load/semi-auto)
if (
  code.startsWith("CAABT") || code.startsWith("CA0GF") || code.startsWith("CA0JD") || code.startsWith("CAAC6AE00") ||

  code.startsWith("CA0K4") || code.startsWith("CA0KQ") || code.startsWith("CAACA") || code.startsWith("CEAA37E00") ||

  code.startsWith("CAABS") || code.startsWith("CB0MU") || code.startsWith("CB0MR") ||
  code.startsWith("CBAH7") || code.startsWith("CBAH9") || code.startsWith("CBAJP") ||
  code.startsWith("CBAJZ") || code.startsWith("CBAK5") || code.startsWith("CC0JR") ||
  code.startsWith("CG0LL") || code.startsWith("HTW60") || code.startsWith("HTW70") ||
  code.startsWith("HTW90") || code.startsWith("HTW11") || code.startsWith("HTW13") ||
  code.startsWith("HWM50") || code.startsWith("HWM60") || code.startsWith("HWM70") ||
  code.startsWith("HWM80") || code.startsWith("HWM90") || code.startsWith("HWM10") ||
  code.startsWith("HW-P7") || code.startsWith("HW-P9") || code.startsWith("HW-60") ||
  code.startsWith("HW-70") || code.startsWith("HW-80") || code.startsWith("HW-90") ||
  code.startsWith("SW-60") || code.startsWith("SW-73") || code.startsWith("SW-74") ||
  code.startsWith("SW-83") || code.startsWith("ASW-") || code.startsWith("HW-100")
) return "Washing Machine";

// Home Air Conditioner
if (
  code.startsWith("AA93Z") || code.startsWith("AA94")  || code.startsWith("AA1P5") ||
  code.startsWith("AAA36") || code.startsWith("AAA7B") || code.startsWith("AAAXN") ||
  code.startsWith("AAAXG") || code.startsWith("AAAV5") || code.startsWith("AAAV1") ||
  code.startsWith("AABT6") || code.startsWith("AABQZ") || code.startsWith("AAC1N") ||
  code.startsWith("AAC1Q") || code.startsWith("AD0FF") || code.startsWith("AD0FN") ||  code.startsWith("AAC") ||
  code.startsWith("AD0KG") || code.startsWith("AD0KH") || code.startsWith("AD0L5") || code.startsWith("AD0") ||
  code.startsWith("AD0ME") || code.startsWith("AD0MF") || code.startsWith("AD0P2") ||
  code.startsWith("AD0P3") || code.startsWith("AD0P8") || code.startsWith("HSU-09") ||
  code.startsWith("HSU-10") || code.startsWith("HSU-12") || code.startsWith("HSU-13") ||
  code.startsWith("HSU-18") || code.startsWith("HSU-24") || code.startsWith("HSU-25") ||
  code.startsWith("HSU-30") || code.startsWith("HW-05") || code.startsWith("HW-07") ||
  code.startsWith("HW-09") || code.startsWith("HW-10") || code.startsWith("HW-12") ||
  code.startsWith("HW-13") || code.startsWith("HW-18") || code.startsWith("HW-20") ||
  code.startsWith("HW-24") || code.startsWith("SAP-")  || code.startsWith("AQA-R")
) return "Home Air Conditioner";

// Commercial AC
if (
  code.startsWith("AA8X4") || code.startsWith("AA8XD") || code.startsWith("AA8LF") ||
  code.startsWith("AA8XJ") || code.startsWith("AA8MR") || code.startsWith("AA8WU") ||
  code.startsWith("AA8WM") || code.startsWith("AA8WW") || code.startsWith("AA99T") ||
  code.startsWith("AA9AQ") || code.startsWith("AA9AE") || code.startsWith("AA9AF") ||
  code.startsWith("AA9AR") || code.startsWith("AA9AN") || code.startsWith("AA9ZG") ||
  code.startsWith("AZ0Q9") || code.startsWith("AZ0Y3") || code.startsWith("AZ0Y4") ||
  code.startsWith("AZ0Y5") || code.startsWith("AZ0LL") || code.startsWith("AC25Z") ||
  code.startsWith("AC2B6") || code.startsWith("AC214") || code.startsWith("AC215") ||
  code.startsWith("AC216") || code.startsWith("AC217") || code.startsWith("AE1QC") ||
  code.startsWith("AE1WK") || code.startsWith("AE1WL") || code.startsWith("AE1XL") ||
  code.startsWith("AB182") || code.startsWith("AB242") || code.startsWith("AB302") ||
  code.startsWith("AB382") || code.startsWith("AB482") || code.startsWith("1U36H") ||
  code.startsWith("1U60I") || code.startsWith("AV20N") || code.startsWith("AV26N")
) return "Commercial AC";

// Small Appliances
if (
  code.startsWith("F705V") || code.startsWith("TD00178") || code.startsWith("TD00178") ||
  code.startsWith("HIC-C") || code.startsWith("HKT-2") || code.startsWith("HKT-6") ||
  code.startsWith("HRC-G") || code.startsWith("HCT-")  || code.startsWith("HEO-")  ||
  code.startsWith("FP00J") || code.startsWith("FX50Z") || code.startsWith("HMX-T")
) return "Small Appliances";

// Cooktop
if (
  code.startsWith("FB28U") || code.startsWith("FB28R") || code.startsWith("TCCK2") ||
  code.startsWith("TCCK1") || code.startsWith("HCCK2")
) return "Cooktop";

// Cooker
if (
  code.startsWith("FY01K") || code.startsWith("HFS-5") || code.startsWith("HFS-6") ||
  code.startsWith("HFS-9") || code.startsWith("HFS-1") || code.startsWith("HFS-8") ||
  code.startsWith("HFS-12") || code.startsWith("HCX-T") || code.startsWith("HWO60")
) return "Cooker";

// Water Heater
if (
  code.startsWith("GA0T2") || code.startsWith("EI35E") || code.startsWith("EI35M")
) return "Water Heater";

// Micro-wave Oven
if (
  code.startsWith("GB0E3") || code.startsWith("GX015") || code.startsWith("HMWO-")
) return "Micro-wave Oven";

// Range Hood
if (
  code.startsWith("HRH-T") || code.startsWith("HRH-D")
) return "Range Hood";

// Others (promo, mockup, reserve, etc.)
if (
  code.startsWith("TD0037") || code.startsWith("TD0039") || code.startsWith("TD0040") ||
  code.startsWith("RESERVE") || code.includes("MOCKUP") || code.includes("#N/A") ||
  code.includes("APRON") || code.includes("GLOVES") || code.includes("FLAG") ||
  code.includes("UMBRELLA") || code.includes("T-SHIRT") || code.includes("CALENDAR") ||
  code.includes("CLOCK") || code.includes("TUMBLER") || code.includes("FAN") ||
  code.includes("JBL FLIP") || code.includes("LUMINARC") || code.includes("RUBBERMAID") ||
  code.includes("SURFPOWDER") || code.includes("LOOT BAG")
) return "Others";

// True final fallback
return "Others";
};


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

  const formatDateShort = () => {
    const now = new Date()
    return now.toLocaleDateString("en-US", { month: '2-digit', day: '2-digit', year: 'numeric' })
  }

  const HaierLogo = () => (
    <img
      src="https://vectorise.net/logo/wp-content/uploads/2019/10/SF-Express.png"
      alt="SF EXPRESS Logo"
      style={{ height: "80px", width: "auto" }}
    />
  )

  const SFLogo = () => (
    <img
      src="/sf-express.png"
      alt="SF Express Logo"
      className="h-8 w-auto"
    />
  )

  const filterDNsBySearch = (files: UploadedFile[]): UploadedFile[] => {
    if (!searchQuery.trim()) return files
    const query = searchQuery.toLowerCase().trim()
    return files.filter((file) => file.dnNo.toLowerCase().includes(query))
  }

  const filterGroupedDataBySearch = (data: MaterialData[]): MaterialData[] => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase().trim()
    return data.filter((item) => item.remarks.toLowerCase().includes(query))
  }

  const filterSerialDataBySearch = (data: SerialData[]): SerialData[] => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase().trim()
    return data.filter(
      (item) =>
        item.dnNo.toLowerCase().includes(query) ||
        item.barcode.toLowerCase().includes(query) ||
        item.materialCode.toLowerCase().includes(query)
    )
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
    return allSerialData.filter((row) => row.materialCode && row.barcode)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)

    try {
      const newFiles: UploadedFile[] = []
      const duplicateDNs: string[] = []
      const existingDNs = new Set(uploadedFiles.map(f => f.dnNo))

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
        const barCodeIdx = headers.findIndex((h) => h.includes("barcode") || h.includes("bar code"))
        const shipToNameIdx = headers.findIndex(
          (h) =>
            h.includes("ship to name") || h.includes("shiptoname") || h.includes("ship name") || h.includes("shipname"),
        )

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

        if (existingDNs.has(dnNo)) {
          duplicateDNs.push(dnNo)
          continue
        }

        const fileData: MaterialData[] = []
        const serialData: SerialData[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]

          if (!row || row.length === 0 || !row[materialCodeIdx]) continue

          const materialCode = String(row[materialCodeIdx] || "").trim()
          const materialDescription = materialDescIdx >= 0 ? String(row[materialDescIdx] || "").trim() : ""
          const barCode = barCodeIdx >= 0 ? String(row[barCodeIdx] || "") : ""
          const shipName = shipToNameIdx >= 0 ? String(row[shipToNameIdx] || "").trim() : ""

          if (!materialCode) continue

          const qtyIdx = headers.findIndex((h) => h.includes("qty") || h.includes("quantity") || h.includes("qnt"))
          const qty = qtyIdx >= 0 ? Number.parseInt(String(row[qtyIdx] || "1"), 10) || 1 : 1

          const category = getCategoryFromBinCode(barCode)

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
            binCode: barCodeIdx >= 0 ? String(row[barCodeIdx] || "") : "",
            materialCode: materialCode,
            materialDesc: materialDescription,
            barcode: barCode,
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

        existingDNs.add(dnNo)
      }

      if (duplicateDNs.length > 0) {
        const dnList = duplicateDNs.join(", ")
        addNotification(
          "warning",
          `Duplicate DN${duplicateDNs.length > 1 ? 's' : ''} detected and skipped: ${dnList}`
        )
      }

      if (newFiles.length > 0) {
        addNotification(
          "success",
          `Successfully uploaded ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`
        )
      }

      const allFiles = [...uploadedFiles, ...newFiles]
      setUploadedFiles(allFiles)
      const newGroupedData = groupAllData(allFiles)
      setGroupedData(newGroupedData)
      const newSerialListData = combineAllSerialData(allFiles)
      setSerialListData(newSerialListData)

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

      if (newFiles.length > 0) {
        setTimeout(
          () => {
            tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          },
          dataLength * 50 + 300,
        )
      }
    } catch (error) {
      console.error("Error parsing Excel file:", error)
      addNotification("error", "Error parsing Excel file. Please make sure it contains the required columns.")
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
            <img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF EXPRESS Logo" />
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
              <th>SERIAL NUMBER</th>
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
        const shipToAddress = file.serialData[0]?.shipToAddress || ""
        const pageBreakClass = index < uploadedFiles.length - 1 ? "page-break" : ""
        const totalQty = file.serialData.filter((row) => row.materialCode && row.barcode).length

        return `
      <div class="${pageBreakClass}">
        <div class="header-section">
          <div class="logo-section">
            <img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF Express Logo" style="height: 60px; width: auto;" />
            <div class="warehouse-info">
              <div style="font-size: 9px; line-height: 1.4; margin-top: 5px;">
                <strong>SF Express Warehouse</strong><br/>
                UPPER TINGUB, MANDAUE, CEBU<br/>
                
              </div>
            </div>
          </div>
          
          <div class="title-section">
            
            <div class="dealer-copy">DEALER'S COPY</div>
            <div class="info-value">${formatDateShort()}</div>
          </div>
        </div>

        <div class="document-header">
          
          <div class="doc-number">DN: ${file.dnNo}</div>
        </div>

        <div >
          <div class="info-row">
            <div class="info-label">Client</div>
            <div class="info-value">: HAIER PHILIPPINES INC.</div>
            
            
          </div>
      
        
          <div class="info-row">
            <div class="info-label">Customer</div>
            <div class="info-value">: ${shipToName}</div>
           
            <div class="info-value"></div>
          </div>
          <div class="info-row">
            <div class="info-label">Address</div>
            <div class="info-value" style="grid-column: span 3;">: ${shipToAddress}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">NO.</th>
              <th style="width: 120px;">CATEGORY</th>
              <th style="width: 280px;">MATERIAL DESCRIPTION</th>
              <th style="width: 200px;">SERIAL NUMBER</th>
              <th style="width: 100px;">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${file.serialData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${getCategoryFromBinCode(row.binCode).toUpperCase()}</td>
                <td style="text-align: center;">${row.materialDesc || row.materialCode}</td>
                <td style="text-align: center; font-weight: bold;">${row.barcode}</td>
                <td></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
 

        <div class="footer-info">
          <div><strong>TOTAL QTY: ${totalQty}</strong></div>
         
          
        </div>

       
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
            color: #000;
            background: #fff;
            padding: 15px;
            font-size: 11px;
          }
          
          .page-break {
            page-break-after: always;
            margin-bottom: 20px;
          }

          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .logo-section {
            display: flex;
            flex-direction: column;
          }

          .warehouse-info {
            margin-top: 5px;
          }

          .title-section {
            text-align: right;
          }

          .company-name {
            font-size: 16px;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 10px;
          }

          .dealer-copy {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .document-header {
            text-align: center;
            margin: 15px 0;
            font-size: 30px;
          }

          .serial-list-title {
            font-size: 16px;
            font-weight: bold;
          }

          .doc-number {
            font-size: 20px;
            font-weight: bold;
          }

          .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            border: 1px solid #000;
          }

          .info-row {
            display: table-row;
          }

          .info-label, .info-value {
            display: table-cell;
            padding: 4px 8px;
            margin-bottom: 15px;
            font-size: 10px;
          }

          .info-label {
            font-weight: bold;
            width: 100px;
            
          }

          .info-value {
            width: 200px;
            margin-bottom: 15px;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            margin-top: 15px;
            border: 2px solid #000;
          }

          .data-table th {
          
            border: 1px solid #000;
            padding: 8px 6px;
            font-weight: bold;
            font-size: 10px;
            text-align: center;
          }

          .data-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
          }

          .data-table tbody tr:nth-child(even) {
            
          }

          .footer-info {
            display: flex;
            gap: 30px;
            margin: 10px 0;
            font-size: 11px;
          }

          .separator {
            text-align: center;
            margin: 15px 0;
            font-size: 10px;
          }

          @media print {
            body { 
              margin: 0;
              padding: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: portrait;
              margin: 10mm;
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
    const shipToAddress = file.serialData[0]?.shipToAddress || ""
    const totalQuantity = file.serialData.filter((row) => row.materialCode && row.barcode).length

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${file.dnNo} - Serial List</title>
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
            color: #000;
            background: #fff;
            padding: 15px;
            font-size: 11px;
          }

          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .logo-section {
            display: flex;
            flex-direction: column;
          }

          .warehouse-info {
            margin-top: 5px;
          }

          .title-section {
            text-align: right;
          }

          .company-name {
            font-size: 16px;
            font-weight: bold;
            line-height: 1.2;
            margin-bottom: 10px;
          }

          .dealer-copy {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .document-header {
            text-align: center;
            margin: 15px 0;
          }

          .serial-list-title {
            font-size: 16px;
            font-weight: bold;
          }

          .doc-number {
            font-size: 20px;
            font-weight: bold;
          }

          .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            border: 1px solid #000;
          }

          .info-row {
            display: table-row;
          }

          .info-label, .info-value {
            display: table-cell;
            padding: 4px 8px;
            border: 1px solid #000;
            font-size: 10px;
          }

          .info-label {
            font-weight: bold;
            width: 100px;
            background: #f0f0f0;
          }

          .info-value {
            width: 200px;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            margin-top: 15px;
            border: 2px solid #000;
          }

          .data-table th {
           
            border: 1px solid #000;
            padding: 8px 6px;
            font-weight: bold;
            font-size: 10px;
            text-align: center;
          }

          .data-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
          }

          .data-table tbody tr:nth-child(even) {
            
          }

          .footer-info {
            display: flex;
            gap: 30px;
            margin: 10px 0;
            font-size: 11px;
          }

          .separator {
            text-align: center;
            margin: 15px 0;
            font-size: 10px;
          }

          @media print {
            body { 
              margin: 0;
              padding: 10px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: portrait;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-section">
          <div class="logo-section">
            <img src="https://www.pngkey.com/png/full/77-774114_express-logo-sf-express.png" alt="SF Express Logo" style="height: 60px; width: auto;" />
            <div class="warehouse-info">
              <div style="font-size: 9px; line-height: 1.4; margin-top: 5px;">
                <strong>SF Express Warehouse</strong><br/>
                TINGUB, MANDAUE, CEBU <br/>
                
              </div>
            </div>
          </div>
          
          <div class="title-section">
    
            <div class="dealer-copy">DEALER'S COPY</div>
            <div class="info-value">${formatDateShort()}</div>
          </div>
        </div>

        <div class="document-header">
          
          <div class="doc-number">Doc # : ${file.dnNo}</div>
        </div>

        <div >
          <div >
            <div class="info-label">Client</div>
            <div class="info-value">HAIER PHILIPPINES INCsss.</div>
            <div class="info-label">Date</div>
            
          </div>
          
     
          <div class="info-row">
            <div class="info-label">Customer</div>
            <div class="info-value">${shipToName}</div>
            <div class="info-label">Time Dispatched</div>
            <div class="info-value"></div>
          </div>
          <div class="info-row">
            <div class="info-label">Address</div>
            <div class="info-value" style="grid-column: span 3;">${shipToAddress}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 120px;">CATEGORY</th>
              <th style="width: 280px;">MATERIAL DESCRIPTION</th>
              <th style="width: 200px;">SERIAL NUMBER</th>
              <th style="width: 100px;">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${file.serialData
              .filter((row) => row.materialCode && row.barcode)
              .map(
                (row, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${getCategoryFromBinCode(row.binCode).toUpperCase()}</td>
                <td style="text-align: center;">${row.materialDesc || row.materialCode}</td>
                <td style="text-align: center; font-weight: bold;">${row.barcode}</td>
                <td></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer-info">
          <div><strong>TOTAL QTY: ${totalQuantity}</strong></div>
          
          
        </div>

        <div class="separator">********** Nothing Follows **********</div>
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const input = document.getElementById('file-upload') as HTMLInputElement
      if (input) {
        const dataTransfer = new DataTransfer()
        Array.from(files).forEach(file => dataTransfer.items.add(file))
        input.files = dataTransfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border-2 animate-slide-right ${
              notification.type === "error"
                ? "bg-red-50 border-red-200"
                : notification.type === "warning"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : notification.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  notification.type === "error"
                    ? "text-red-800"
                    : notification.type === "warning"
                    ? "text-yellow-800"
                    : "text-green-800"
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`flex-shrink-0 rounded-lg p-1 transition-colors ${
                notification.type === "error"
                  ? "hover:bg-red-100"
                  : notification.type === "warning"
                  ? "hover:bg-yellow-100"
                  : "hover:bg-green-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-row {
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-file {
          animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-section {
          animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .animate-slide-right {
          animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .loading-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 3px 3px 0 0;
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes expandWidth {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        .progress-bar {
          animation: expandWidth 2s ease-out forwards;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .rotate-animation {
          animation: rotate 1s linear infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }

        .glow-animation {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-12 space-y-8">
        {/* Upload Section */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none [mask-image:linear-gradient(to_top_right,white,transparent,transparent)]">
        <LogoGridBackground />
      </div>
        <div className="relative rounded-3xl p-12  overflow-hidden">
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 rounded-full text-lg font-bold mb-4 animate-slide-right">
                <SFLogo />
                SF EXPRESS
              </div>
            </div>

            <label
              htmlFor="file-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative block transition-all duration-300 cursor-pointer group ${
                isDragging ? 'scale-[1.02]' : ''
              }`}
            >
              <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-white'
              }`}>
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 rounded-full bg-blue-400 opacity-20 ${
                      isDragging ? 'animate-ping' : ''
                    }`} style={{ animation: isDragging ? 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none' }} />
                    
                    <div className={`relative p-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-all duration-300 ${
                      isDragging ? 'scale-110 shadow-xl' : 'group-hover:scale-105 group-hover:shadow-xl'
                    }`}>
                      <Upload className={`w-10 h-10 text-white transition-transform duration-300 ${
                        isDragging ? 'animate-bounce' : 'group-hover:scale-110'
                      }`} />
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-2xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                      {isDragging ? '✨ Drop your files here' : 'Drop files or click to upload'}
                    </p>
                    <p className="text-gray-600">
                      Barcode Excel Files of Haier
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {['.xlsx', '.xls', '.csv'].map((ext) => (
                        <span
                          key={ext}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200"
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-300 rounded-tl-lg opacity-50" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-300 rounded-tr-lg opacity-50" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-300 rounded-bl-lg opacity-50" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-300 rounded-br-lg opacity-50" />
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
              <div className="mt-10 text-center space-y-6">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute animate-spin rounded-full h-16 w-16 border-4 border-blue-200" />
                  <div className="absolute animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <p className="text-lg text-gray-800 font-bold">Processing your files...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                  <div className="max-w-sm mx-auto h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 progress-bar loading-shimmer rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Files List Section */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-section hover-lift">
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilesList(!showFilesList)}
                  className="flex items-center gap-3 text-lg font-bold text-gray-800 hover:text-blue-600 transition-all duration-300 group"
                >
                  <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Uploaded Files</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {uploadedFiles.length}
                  </span>
                  <span
                    className={`transform transition-all duration-300 text-gray-400 ${showFilesList ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-300 font-semibold text-sm hover-lift"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>

            {showFilesList && (
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 animate-file hover-lift cursor-pointer ${
                      selectedFileId === file.id
                        ? "border-green-400 bg-gradient-to-r from-green-50 to-green-100 shadow-md scale-[1.02]"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    onClick={() => handleSelectFile(file.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        selectedFileId === file.id ? 'bg-green-200' : 'bg-blue-100'
                      }`}>
                        <FileSpreadsheet className={`w-6 h-6 transition-all duration-300 ${
                          selectedFileId === file.id ? 'text-green-700' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">{file.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-200 rounded text-gray-700">DN: {file.dnNo}</span>
                          <span className="text-gray-400">•</span>
                          <span>{file.data.length} items</span>
                        </p>
                      </div>
                      {selectedFileId === file.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 animate-slide-right" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file.id)
                      }}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-300 ml-2"
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

        {/* Data Display Section */}
        {(groupedData.length > 0 || serialListData.length > 0) && (
          <div ref={tableRef} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-section">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 relative">
              <div className="flex">
                {[
                  { id: "consolidated", label: "Consolidated Materials", icon: Layers },
                  { id: "serialList", label: "Serial List", icon: FileText },
                  { id: "individualDN", label: "Individual DN", icon: Download },
                ].map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 relative group ${
                      activeTab === tab.id
                        ? "text-green-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <tab.icon className={`w-4 h-4 transition-transform duration-300 ${
                        activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'
                      }`} />
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-t" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              {/* Search Bar */}
              {(groupedData.length > 0 || serialListData.length > 0) && (
                <div className="mb-6 flex gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by DN No., Serial Number, or Material Code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}

              {activeTab === "consolidated" && (
                <>
                  <div className="flex items-center justify-between mb-6 animate-slide-right">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Consolidated Materials Report</h2>
                      <p className="text-sm text-gray-500">
                        {selectedFileId
                          ? `Viewing: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                          : "Combined data from all uploaded files"}
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover-lift"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                        <tr>
                          {["Material Code", "Material Description", "Category", "Qty.", "UM", "Ship Name", "Remarks"].map((header, i) => (
                            <th
                              key={i}
                              className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filterGroupedDataBySearch(groupedData)
                          .filter((row) => row.materialCode && row.materialDescription)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`${
                                animatingRows.has(idx) ? "animate-row" : "opacity-0"
                              } hover:bg-blue-50 transition-all duration-200`}
                              style={{ animationDelay: `${idx * 0.02}s` }}
                            >
                              <td className="px-4 py-4 font-mono text-xs text-gray-700 font-semibold">{row.materialCode}</td>
                              <td className="px-4 py-4 text-gray-700">{row.materialDescription}</td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                  {row.category}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-sm">
                                  {row.qty}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-gray-400">-</td>
                              <td className="px-4 py-4 text-gray-700">{row.shipName}</td>
                              <td className="px-4 py-4 text-gray-600 text-xs">{row.remarks}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "serialList" && (
                <>
                  <div className="flex items-center justify-between mb-6 animate-slide-right">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulking Serial List Report</h2>
                      <p className="text-sm text-gray-500">
                        {selectedFileId
                          ? `Viewing: ${uploadedFiles.find((f) => f.id === selectedFileId)?.name}`
                          : "Combined serial data from all uploaded files"}
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover-lift"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                        <tr>
                          {["DN No", "Location", "Bin Code", "Material Code", "Material Desc", "Barcode", "Ship To Name", "Ship To Address"].map((header, i) => (
                            <th
                              key={i}
                              className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filterSerialDataBySearch(serialListData)
                          .filter((row) => row.materialCode && row.barcode)
                          .map((row, idx) => (
                            <tr
                              key={idx}
                              className={`${
                                animatingRows.has(idx) ? "animate-row" : "opacity-0"
                              } hover:bg-blue-50 transition-all duration-200`}
                              style={{ animationDelay: `${idx * 0.02}s` }}
                            >
                              <td className="px-4 py-4 text-gray-700 font-medium">{row.dnNo}</td>
                              <td className="px-4 py-4 text-gray-700">{row.location}</td>
                              <td className="px-4 py-4 text-gray-700">{row.binCode}</td>
                              <td className="px-4 py-4 font-mono text-xs text-gray-700 font-semibold">{row.materialCode}</td>
                              <td className="px-4 py-4 text-gray-700">{row.materialDesc}</td>
                              <td className="px-4 py-4 font-mono font-bold text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900">
                                {row.barcode}
                              </td>
                              <td className="px-4 py-4 text-gray-700">{row.shipToName}</td>
                              <td className="px-4 py-4 text-gray-600 text-xs">{row.shipToAddress}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "individualDN" && (
                <>
                  <div className="mb-6 animate-slide-right">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Individual DN Downloads</h2>
                    <p className="text-sm text-gray-500">Download individual DN serial lists or all at once</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover-lift">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-200 rounded-xl">
                            <Layers className="w-7 h-7 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-lg">Download All DN Serial Lists</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsDownloadingAllDN(true)
                            setShowDownloadModal(true)
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                        >
                          <Download className="w-5 h-5" />
                          Download All
                        </button>
                      </div>
                    </div>

                    {filterDNsBySearch(uploadedFiles).map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-5 bg-gray-50 border-2 border-gray-200 rounded-xl  transition-all duration-300 animate-file "
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-200 rounded-xl">
                            <FileSpreadsheet className="w-6 h-6 text-gray-700" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{file.dnNo}</p>
                            <p className="text-sm text-gray-500 mt-1">{file.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDownloadFile(file)
                            setIsDownloadingAllDN(false)
                            setShowDownloadModal(true)
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 font-semibold text-sm hover-lift"
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

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-section">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-50 scale-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Choose Download Format</h3>
            <div className="space-y-3 mb-8">
              {[
                { type: 'excel', label: 'Excel (.xlsx)', desc: 'Editable spreadsheet format', icon: FileSpreadsheet },
                { type: 'pdf', label: 'PDF', desc: 'Print-ready document format', icon: FileText }
              ].map((option) => (
                <button
                  key={option.type}
                  onClick={() => setDownloadType(option.type as 'pdf' | 'excel')}
                  className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all duration-300  ${
                    downloadType === option.type
                      ? "border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    downloadType === option.type ? "border-green-600" : "border-gray-300"
                  }`}>
                    {downloadType === option.type && (
                      <div className="w-3.5 h-3.5 rounded-full bg-green-600 animate-scaleIn" />
                    )}
                  </div>
                  <option.icon className={`w-6 h-6 ${downloadType === option.type ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-left flex-1">
                    <p className="font-bold text-gray-800">{option.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDownloadModal(false)
                  setSelectedDownloadFile(null)
                  setIsDownloadingAllDN(false)
                }}
                className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadConfirm}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-110 animate-slide-right group"
          title="Scroll to top"
        >
          <ArrowUp className="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-1" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Back to top
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </button>
      )}

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center">
        <div className="text-sm text-gray-500">
          Developed by <span className="font-semibold text-gray-700">MAR</span> • All Rights Reserved © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}