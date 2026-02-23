'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Eye, Download, Edit, Trash2, Calendar, FileText,
  ChevronDown, Search, X, BarChart2, ChevronRight,
  Truck, User, Hash, Clock, Package, Play
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'
import * as XLSX from 'xlsx-js-style'

const MONTHS = [
  'All Months','January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function FilterDropdown({ selectedMonth, onMonthChange, months }: {
  selectedMonth: string; onMonthChange: (m: string) => void; months: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3 sm:px-4 bg-[#282828] rounded-full text-sm font-semibold text-[#B3B3B3] hover:bg-[#3E3E3E] hover:text-white hover:scale-105 active:scale-100 transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap"
      >
        <Calendar className="w-3.5 h-3.5 text-[#E8192C] flex-shrink-0" />
        <span className="hidden sm:inline">{selectedMonth}</span>
        <span className="sm:hidden text-xs">{selectedMonth === 'All Months' ? 'Month' : selectedMonth.slice(0, 3)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-[#282828] rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto py-1.5 border border-[#3E3E3E]">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => { onMonthChange(month); setIsOpen(false) }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors duration-100 ${
                selectedMonth === month
                  ? 'text-[#E8192C] font-bold bg-[#E8192C]/10'
                  : 'text-[#B3B3B3] hover:bg-[#3E3E3E] hover:text-white'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ManifestAvatar({ seed }: { seed: string }) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  const lightness = 25 + (Math.abs(hash) % 15)
  return (
    <div
      className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-md shadow-lg flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, hsl(352,${70 + (Math.abs(hash) % 20)}%,${lightness}%) 0%, hsl(5,80%,${lightness - 8}%) 100%)` }}
    >
      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" />
    </div>
  )
}

function ManifestRow({
  manifest, index, expanded, onToggle, onView, onEdit, onDownload, onDelete,
}: {
  manifest: TripManifest; index: number; expanded: boolean
  onToggle: () => void; onView: () => void; onEdit: () => void
  onDownload: () => void; onDelete: () => void
}) {
  const totalQty = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const manifestId = manifest.manifest_number || manifest.id || '—'
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className={`group bg-border-b border-[#282828] last:border-b-0 transition-colors duration-150 ${expanded ? 'bg-[#1E1E1E]' : 'hover:bg-[#1A1A1A]'}`}>
      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Row number — hidden on mobile to save space */}
        <div className="hidden sm:flex flex-shrink-0 w-7 items-center justify-center">
          <span className="text-sm text-[#6A6A6A] tabular-nums group-hover:hidden">{index + 1}</span>
          <Play className="w-4 h-4 text-white hidden group-hover:block fill-white" />
        </div>

        {/* Avatar */}
        <ManifestAvatar seed={manifestId} />

        {/* Title + subtitle — flex-1 with min-w-0 so it truncates */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate group-hover:text-[#E8192C] transition-colors duration-150 leading-tight">
            {manifestId}
          </p>
          <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
            {manifest.driver_name || 'No driver'}
            {manifest.plate_no ? ` · ${manifest.plate_no}` : ''}
          </p>
        </div>

        {/* Date — hidden on small mobile */}
        <span className="hidden sm:block text-xs text-[#B3B3B3] flex-shrink-0 w-24 text-right">
          {manifestDate}
        </span>

        {/* Qty badge — always visible, compact */}
        <span className="flex-shrink-0 text-xs font-bold tabular-nums text-[#B3B3B3] group-hover:text-white transition-colors w-8 text-right">
          {totalQty}
        </span>

        {/* Docs — hidden on very small */}
        <span className="hidden xs:block flex-shrink-0 text-xs text-[#6A6A6A] w-12 text-center tabular-nums">
          {totalDocs}d
        </span>

        {/* Expand chevron */}
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90 text-[#E8192C]' : 'text-[#6A6A6A] group-hover:text-[#B3B3B3]'}`}
        />

        {/* Delete — ALWAYS visible on mobile, hover-reveal on desktop */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 p-1.5 rounded-full text-[#6A6A6A] hover:text-[#E8192C] hover:bg-[#E8192C]/10 transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className="border-t border-[#282828] bg-[#121212] px-4 sm:px-5 py-4 sm:py-5">
          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 mb-4 sm:mb-5">
            <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date" value={manifestDate} />
            <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Driver" value={manifest.driver_name || '—'} />
            <DetailItem icon={<Hash className="w-3.5 h-3.5" />} label="Plate" value={manifest.plate_no || '—'} mono />
            <DetailItem icon={<Truck className="w-3.5 h-3.5" />} label="Trucker" value={manifest.trucker || '—'} />
            <DetailItem icon={<Truck className="w-3.5 h-3.5" />} label="Truck Type" value={manifest.truck_type || '—'} />
            <DetailItem icon={<Clock className="w-3.5 h-3.5" />} label="Start" value={manifest.time_start || '—'} />
            <DetailItem icon={<Clock className="w-3.5 h-3.5" />} label="End" value={manifest.time_end || '—'} />
            <DetailItem icon={<Package className="w-3.5 h-3.5" />} label="Total Qty" value={String(totalQty)} highlight />
          </div>

          {/* Items table */}
          {(manifest.items?.length ?? 0) > 0 && (
            <div className="mb-4 sm:mb-5 rounded-lg overflow-hidden border border-[#282828]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1E1E1E] text-[#6A6A6A] uppercase tracking-widest">
                    <th className="text-left px-3 py-2.5 font-bold">#</th>
                    <th className="text-left px-3 py-2.5 font-bold">Ship To</th>
                    <th className="text-left px-3 py-2.5 font-bold hidden sm:table-cell">DN / TRA</th>
                    <th className="text-right px-3 py-2.5 font-bold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.items!.map((item, idx) => (
                    <tr key={idx} className="border-t border-[#282828] hover:bg-[#1E1E1E] transition-colors group/row">
                      <td className="px-3 py-2.5 text-[#6A6A6A]">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-white font-medium truncate max-w-[100px] sm:max-w-none group-hover/row:text-[#E8192C] transition-colors">{item.ship_to_name || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-[#B3B3B3] hidden sm:table-cell">{item.document_number || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#E8192C]">{item.total_quantity ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <button
              onClick={onView}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#E8192C] text-white text-xs sm:text-sm font-bold hover:bg-[#FF1F30] hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-[#E8192C]/30"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#727272] text-white text-xs sm:text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all duration-150"
            >
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#727272] text-white text-xs sm:text-sm font-semibold hover:border-white hover:scale-105 active:scale-100 transition-all duration-150"
            >
              <Download className="w-3.5 h-3.5 text-[#E8192C]" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon, label, value, mono, highlight }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[#6A6A6A] mb-0.5">
        <span className="text-[#E8192C]">{icon}</span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-xs sm:text-sm truncate ${mono ? 'font-mono' : 'font-semibold'} ${highlight ? 'text-[#E8192C] font-black' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
}

export function SavedManifestsTab({
  savedManifests, handleViewManifest, handleEditManifest,
  handleDownloadManifest, handleDeleteManifest,
}: SavedManifestsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All Months')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const itemsPerPage = 10

  const sortedManifests = useMemo(() =>
    [...savedManifests].sort((a, b) => {
      if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (a.manifest_date && b.manifest_date) return new Date(b.manifest_date).getTime() - new Date(a.manifest_date).getTime()
      if (a.id && b.id) return b.id.localeCompare(a.id)
      return 0
    }), [savedManifests])

  const filteredManifests = useMemo(() =>
    sortedManifests.filter((manifest) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (manifest.manifest_number || '').toLowerCase().includes(q) ||
        (manifest.driver_name || '').toLowerCase().includes(q) ||
        (manifest.plate_no || '').toLowerCase().includes(q) ||
        (manifest.trucker || '').toLowerCase().includes(q)
      if (!matchesSearch) return false
      if (selectedMonth === 'All Months') return true
      const date = new Date(manifest.manifest_date || manifest.created_at || '')
      return MONTHS[date.getMonth() + 1] === selectedMonth
    }), [sortedManifests, searchQuery, selectedMonth])

  const totalPages = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  )

  const handleDownloadMonitoring = () => {
    const wb = XLSX.utils.book_new()
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
    let row = 0
    const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
      ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: type, s: style } as XLSX.CellObject
    }
    if (!ws['!merges']) ws['!merges'] = []
    const bThin = { top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'} }
    const bMedium = { top:{style:'medium'},bottom:{style:'medium'},left:{style:'medium'},right:{style:'medium'} }
    setCell(row,0,'SF EXPRESS WAREHOUSE — TRIP MANIFEST MONITORING',{font:{bold:true,sz:16,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'DC2626'}},alignment:{horizontal:'center',vertical:'center'},border:bMedium})
    ws['!merges'].push({s:{r:row,c:0},e:{r:row,c:10}})
    row++
    setCell(row,0,`Generated: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}  |  Total Manifests: ${filteredManifests.length}`,{font:{sz:10,italic:true},fill:{fgColor:{rgb:'FEE2E2'}},alignment:{horizontal:'center'},border:bThin})
    ws['!merges'].push({s:{r:row,c:0},e:{r:row,c:10}})
    row+=2
    ;['MANIFEST NO.','DISPATCH DATE','TRUCKER','DRIVER','PLATE NO.','TRUCK TYPE','TIME START','TIME END','DN / TRA NO.','SHIP TO NAME','QTY'].forEach((h,c)=>
      setCell(row,c,h,{font:{bold:true,sz:11,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'1E3A5F'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:bThin}))
    row++
    let grandQty=0,grandDocs=0,globalIdx=0
    filteredManifests.forEach((manifest)=>{
      const d=manifest.manifest_date?new Date(manifest.manifest_date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}):'—'
      const items=manifest.items||[]
      const rowCount=Math.max(items.length,1)
      const fill={fgColor:{rgb:globalIdx%2===0?'F9FAFB':'FFFFFF'}}
      const base=(ex:any={})=>({font:{sz:10},fill,border:bThin,alignment:{vertical:'center',wrapText:true},...ex})
      const center=(ex:any={})=>base({alignment:{horizontal:'center',vertical:'center'},...ex})
      const bold=(ex:any={})=>base({font:{sz:10,bold:true},...ex})
      const startRow=row
      if(items.length===0){
        setCell(row,0,manifest.manifest_number||manifest.id||'—',bold())
        setCell(row,1,d,center());setCell(row,2,manifest.trucker||'—',base())
        setCell(row,3,manifest.driver_name||'—',base());setCell(row,4,manifest.plate_no||'—',center())
        setCell(row,5,manifest.truck_type||'—',base());setCell(row,6,manifest.time_start||'—',center())
        setCell(row,7,manifest.time_end||'—',center());setCell(row,8,'—',center())
        setCell(row,9,'No documents',base());setCell(row,10,0,center(),'n')
        row++
      }else{
        items.forEach((item,idx)=>{
          const first=idx===0
          setCell(row,0,first?(manifest.manifest_number||manifest.id||'—'):'',first?bold():base())
          setCell(row,1,first?d:'',first?center():base())
          setCell(row,2,first?(manifest.trucker||'—'):'',base())
          setCell(row,3,first?(manifest.driver_name||'—'):'',base())
          setCell(row,4,first?(manifest.plate_no||'—'):'',first?center():base())
          setCell(row,5,first?(manifest.truck_type||'—'):'',base())
          setCell(row,6,first?(manifest.time_start||'—'):'',first?center():base())
          setCell(row,7,first?(manifest.time_end||'—'):'',first?center():base())
          setCell(row,8,item.document_number||'—',bold({alignment:{horizontal:'center',vertical:'center'}}))
          setCell(row,9,item.ship_to_name||'—',base())
          setCell(row,10,item.total_quantity||0,center(),'n')
          grandQty+=item.total_quantity||0;grandDocs++;row++
        })
        if(rowCount>1){
          const endRow=startRow+rowCount-1
          ;[0,1,2,3,4,5,6,7].forEach(c=>ws['!merges']!.push({s:{r:startRow,c},e:{r:endRow,c}}))
        }
      }
      globalIdx++
    })
    row++
    const totalStyle={font:{bold:true,sz:11,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'1E3A5F'}},alignment:{horizontal:'center',vertical:'center'},border:bMedium}
    setCell(row,0,`GRAND TOTAL  —  ${filteredManifests.length} manifests  |  ${grandDocs} documents`,totalStyle)
    ws['!merges']!.push({s:{r:row,c:0},e:{r:row,c:9}})
    setCell(row,10,grandQty,totalStyle,'n')
    ws['!ref']=`A1:K${row+5}`
    ws['!cols']=[{wch:18},{wch:14},{wch:22},{wch:22},{wch:14},{wch:16},{wch:12},{wch:12},{wch:18},{wch:40},{wch:10}]
    XLSX.utils.book_append_sheet(wb,ws,'Monitoring')
    XLSX.writeFile(wb,`Manifest-Monitoring-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const handleExportAll = () => {
    const wb = XLSX.utils.book_new()
    filteredManifests.forEach((manifest,manifestIndex)=>{
      const ws:XLSX.WorkSheet=XLSX.utils.aoa_to_sheet([])
      let row=0
      if(!ws['!merges'])ws['!merges']=[]
      const setCell=(r:number,c:number,value:any,style:any={},type:XLSX.CellObject['t']='s')=>{
        ws[XLSX.utils.encode_cell({r,c})]={v:value,t:type,s:style}as XLSX.CellObject
      }
      const bThin={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}}
      const d=manifest.manifest_date?new Date(manifest.manifest_date).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}):'—'
      setCell(row,0,'SF EXPRESS WAREHOUSE',{font:{bold:true,sz:14}})
      setCell(row,1,'UPPER TINGUB, MANDAUE, CEBU')
      row+=2
      setCell(row,4,manifest.manifest_number||'—',{font:{bold:true,sz:16},fill:{fgColor:{rgb:'FFFFC400'}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium'},bottom:{style:'medium'},left:{style:'medium'},right:{style:'medium'}}})
      row+=3
      setCell(row,0,'TRIP MANIFEST',{font:{bold:true,sz:20},alignment:{horizontal:'center',vertical:'center'}})
      ws['!merges'].push({s:{r:row,c:0},e:{r:row,c:4}})
      row+=3
      ;[['Client','HAIER PHILIPPINES INC.','Dispatch Date',d],['Trucker',manifest.trucker||'N/A','Driver',manifest.driver_name||'—'],['Plate No.',manifest.plate_no||'—','Truck Type',manifest.truck_type||'N/A'],['Time Start',manifest.time_start||'—','Time End',manifest.time_end||'—']].forEach(([l1,v1,l2,v2])=>{
        setCell(row,0,l1,{font:{bold:true}});setCell(row,1,v1);setCell(row,2,l2,{font:{bold:true}});setCell(row,3,v2);row++
      })
      row++
      const tableStartRow=row
      const hStyle={font:{bold:true,sz:11},alignment:{horizontal:'center',vertical:'center',wrapText:true},fill:{fgColor:{rgb:'E8E8E8'}},border:bThin}
      ;['NO.','SHIP TO NAME','DN/TRA NO.','QTY','REMARKS'].forEach((h,c)=>setCell(row,c,h,hStyle))
      row++
      const items=manifest.items||[]
      if(items.length===0){
        setCell(row,0,'—',{border:bThin,alignment:{horizontal:'center'}});setCell(row,1,'No documents added',{border:bThin});setCell(row,2,'—',{border:bThin,alignment:{horizontal:'center'}});setCell(row,3,0,{border:bThin,alignment:{horizontal:'center'}},'n');setCell(row,4,'—',{border:bThin,alignment:{horizontal:'center'}});row++
      }else{
        items.forEach((item,idx)=>{
          const cs={border:bThin,alignment:{horizontal:'center',vertical:'center'}}
          setCell(row,0,idx+1,cs,'n');setCell(row,1,item.ship_to_name||'—',{...cs,alignment:{horizontal:'left',vertical:'center',wrapText:true}});setCell(row,2,item.document_number||'—',{...cs,font:{bold:true}});setCell(row,3,item.total_quantity||0,cs,'n');setCell(row,4,'',cs);row++
        })
      }
      const totalQty=items.reduce((s,i)=>s+(i.total_quantity||0),0)
      setCell(row,0,'TOTAL',{font:{bold:true},alignment:{horizontal:'right'},border:bThin});setCell(row,1,'',{border:bThin});setCell(row,2,'',{border:bThin});setCell(row,3,totalQty,{font:{bold:true},alignment:{horizontal:'center'},border:bThin},'n');setCell(row,4,'',{border:bThin})
      for(let r=tableStartRow;r<=row;r++)for(let c=0;c<=4;c++){const addr=XLSX.utils.encode_cell({r,c});if(ws[addr])ws[addr].s={...(ws[addr].s||{}),border:bThin}}
      row+=2
      setCell(row,2,`TOTAL DOCUMENTS: ${items.length}  |  TOTAL QUANTITY: ${totalQty}`,{font:{bold:true},alignment:{horizontal:'right'}})
      row+=3
      ws['!ref']=`A1:E${row+10}`
      ws['!cols']=[{wch:6},{wch:45},{wch:20},{wch:12},{wch:25}]
      XLSX.utils.book_append_sheet(wb,ws,(manifest.manifest_number||`Manifest-${manifestIndex+1}`).replace(/[\\/*?[\]:]/g,'-').slice(0,31))
    })
    XLSX.writeFile(wb,`Manifests-Export-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden h-full flex flex-col min-h-0">
      {/* ── Header ── */}
      <div
        className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-[#282828] flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.18) 0%, #121212 100%)' }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg shadow-xl flex-shrink-0 flex items-center justify-center"
              // style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
            >
              <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-0.5">View</p>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">Saved Reports</h3>
              <p className="text-xs text-[#B3B3B3] mt-0.5">
                SF Express · {savedManifests.length} manifest{savedManifests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadMonitoring}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-[#727272] text-white text-xs font-bold hover:border-white hover:scale-105 active:scale-100 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-[#727272]"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#E8192C]" />
              <span>Monitoring</span>
            </button>
            <button
              onClick={handleExportAll}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#E8192C] text-white text-xs font-bold hover:bg-[#FF1F30] hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-[#E8192C]/25 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6A6A]" />
            <input
              type="text"
              placeholder="Search manifests…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full h-10 pl-9 sm:pl-10 pr-8 bg-[#3E3E3E] rounded-full text-sm text-white placeholder-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-[#E8192C]/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <FilterDropdown selectedMonth={selectedMonth} onMonthChange={(m) => { setSelectedMonth(m); setCurrentPage(1) }} months={MONTHS} />
        </div>

        {(searchQuery || selectedMonth !== 'All Months') && (
          <p className="text-xs text-[#B3B3B3] mt-2">
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Column headers ── */}
      {filteredManifests.length > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-[#282828] flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A]">
          <span className="hidden sm:block w-7 text-center">#</span>
          <span className="w-9 sm:w-10" />
          <span className="flex-1">Title</span>
          <span className="hidden sm:block w-24 text-right">Date</span>
          <span className="w-8 text-right">Qty</span>
          <span className="hidden xs:block w-12 text-center">Docs</span>
          <span className="w-4" />
          <span className="w-7" />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {savedManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-5 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}>
              <FileText className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
            </div>
            <p className="font-black text-white text-base sm:text-lg">No manifests yet</p>
            <p className="text-sm text-[#B3B3B3] mt-1 max-w-xs">Create your first trip manifest to see it here</p>
          </div>
        ) : filteredManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#282828] flex items-center justify-center mb-4 sm:mb-5">
              <Search className="w-7 h-7 sm:w-9 sm:h-9 text-[#6A6A6A]" />
            </div>
            <p className="font-black text-white text-base sm:text-lg">No results found</p>
            <p className="text-sm text-[#B3B3B3] mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          paginatedManifests.map((manifest, idx) => (
            <ManifestRow
              key={manifest.id}
              manifest={manifest}
              index={(currentPage - 1) * itemsPerPage + idx}
              expanded={expandedId === manifest.id}
              onToggle={() => setExpandedId(expandedId === manifest.id ? null : (manifest.id ?? null))}
              onView={() => handleViewManifest(manifest)}
              onEdit={() => handleEditManifest(manifest)}
              onDownload={() => handleDownloadManifest(manifest)}
              onDelete={() => manifest.id && handleDeleteManifest(manifest.id)}
            />
          ))
        )}
      </div>

      {/* ── Pagination — fixed ── */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-3.5 border-t border-[#282828] bg-[#121212] flex items-center justify-between gap-2 sm:gap-3">
          <p className="text-xs text-[#B3B3B3] font-medium">
            <span className="text-white font-bold">{currentPage}</span>/{totalPages}
          </p>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 rounded-full border border-[#3E3E3E] text-xs font-semibold text-[#B3B3B3] hover:border-white hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 1)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all duration-150 ${
                    currentPage === page
                      ? 'bg-[#E8192C] text-white shadow-md shadow-[#E8192C]/30 scale-110'
                      : 'border border-[#3E3E3E] text-[#B3B3B3] hover:border-white hover:text-white'
                  }`}
                >{page}</button>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1.5 rounded-full border border-[#3E3E3E] text-xs font-semibold text-[#B3B3B3] hover:border-white hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  )
}