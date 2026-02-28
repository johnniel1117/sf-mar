'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Eye, Download, Edit, Trash2, Calendar, FileText,
  ChevronDown, Search, X, BarChart2, ChevronRight,
  Truck, User, Hash, Clock, Package, ArrowUpRight,
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'
import * as XLSX from 'xlsx-js-style'

const MONTHS = [
  'All Months','January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Filter Dropdown ───────────────────────────────────────────────────────────

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
        className="h-9 px-3 sm:px-4 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#3E3E3E] hover:text-[#D0D0D0] transition-all flex items-center gap-1.5 whitespace-nowrap"
      >
        <Calendar className="w-3 h-3 text-[#E8192C] flex-shrink-0" />
        <span className="hidden sm:inline">{selectedMonth}</span>
        <span className="sm:hidden">{selectedMonth === 'All Months' ? 'Month' : selectedMonth.slice(0, 3)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-black border border-[#282828] shadow-2xl z-50 max-h-60 overflow-y-auto py-1">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => { onMonthChange(month); setIsOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
                selectedMonth === month
                  ? 'text-[#E8192C] bg-[#E8192C]/6'
                  : 'text-[#9A9A9A] hover:bg-[#0a0a0a] hover:text-[#D0D0D0]'
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

// ── Manifest Row ──────────────────────────────────────────────────────────────

function ManifestRow({
  manifest, index, expanded, onToggle, onView, onEdit, onDownload, onDelete, isViewer,
}: {
  manifest: TripManifest; index: number; expanded: boolean
  onToggle: () => void; onView: () => void; onEdit: () => void
  onDownload: () => void; onDelete: () => void; isViewer?: boolean
}) {
  const totalQty  = manifest.items?.reduce((s, i) => s + (i.total_quantity || 0), 0) ?? 0
  const totalDocs = manifest.items?.length ?? 0
  const manifestId   = manifest.manifest_number || manifest.id || '—'
  const manifestDate = manifest.manifest_date
    ? new Date(manifest.manifest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className={`group border-b border-[#1a1a1a] last:border-b-0 transition-colors duration-150 ${expanded ? 'bg-[#0a0a0a]' : 'hover:bg-[#0a0a0a]'}`}>

      {/* ── Collapsed Row ── */}
      <div
        className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-5 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Index */}
        <span className="hidden sm:block text-[11px]  font-bold text-[#5A5A5A] w-5 flex-shrink-0 group-hover:text-[#E8192C] transition-colors">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black text-[#D0D0D0] truncate group-hover:text-white transition-colors leading-snug">
            {manifestId}
          </p>
          <p className="text-[12px] text-[#9A9A9A] mt-0.5 truncate group-hover:text-[#9A9A9A] transition-colors">
            {manifest.driver_name || 'No driver'}
            {manifest.plate_no ? ` · ${manifest.plate_no}` : ''}
          </p>
        </div>

        {/* Date */}
        <span className="hidden sm:block text-[11px] font-bold text-[#9A9A9A] group-hover:text-[#9A9A9A] transition-colors flex-shrink-0 w-28 text-right tabular-nums">
          {manifestDate}
        </span>

        {/* Qty */}
        <span className="flex-shrink-0 text-2xl font-black text-[#D0D0D0] group-hover:text-white transition-colors tabular-nums w-12 text-right leading-none">
          {totalQty}
        </span>

        {/* Docs */}
        <span className="hidden sm:block flex-shrink-0 text-[11px] font-bold text-[#9A9A9A] w-10 text-center tabular-nums uppercase tracking-widest">
          {totalDocs}d
        </span>

        {/* Chevron */}
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90 text-[#E8192C]' : 'text-[#5A5A5A] group-hover:text-[#D0D0D0]'}`}
        />

        {/* Delete */}
        {!isViewer && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-shrink-0 p-1.5 text-[#5A5A5A] hover:text-[#E8192C] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Expanded Panel ── */}
      {expanded && (
        <div className="border-t border-[#1a1a1a] px-5 sm:px-8 py-6 sm:py-8">

          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 mb-7 sm:mb-8">
            <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Date"       value={manifestDate}                  />
            <DetailItem icon={<User     className="w-3.5 h-3.5" />} label="Driver"     value={manifest.driver_name || '—'}   />
            <DetailItem icon={<Hash     className="w-3.5 h-3.5" />} label="Plate"      value={manifest.plate_no    || '—'}   mono />
            <DetailItem icon={<Truck    className="w-3.5 h-3.5" />} label="Trucker"    value={manifest.trucker     || '—'}   />
            <DetailItem icon={<Truck    className="w-3.5 h-3.5" />} label="Truck type" value={manifest.truck_type  || '—'}   />
            <DetailItem icon={<Clock    className="w-3.5 h-3.5" />} label="Start"      value={manifest.time_start  || '—'}   />
            <DetailItem icon={<Clock    className="w-3.5 h-3.5" />} label="End"        value={manifest.time_end    || '—'}   />
            <DetailItem icon={<Package  className="w-3.5 h-3.5" />} label="Total qty"  value={String(totalQty)}               highlight />
          </div>

          {/* Items table */}
          {(manifest.items?.length ?? 0) > 0 && (
            <div className="mb-7 sm:mb-8 border-t border-[#1a1a1a]">
              {/* Table header */}
              <div className="grid grid-cols-4 border-b border-[#1a1a1a] py-3">
                {['#', 'Ship To', 'DN / TRA', 'Qty'].map(h => (
                  <span key={h} className="text-[10px] uppercase tracking-widest font-bold text-[#9A9A9A]">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {manifest.items!.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 py-3.5 group/row hover:pl-1 transition-all duration-150">
                    <span className="text-[11px]  font-bold text-[#5A5A5A] group-hover/row:text-[#E8192C] transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] font-semibold text-[#D0D0D0] truncate group-hover/row:text-white transition-colors col-span-1 sm:col-span-1">{item.ship_to_name || '—'}</span>
                    <span className="text-[13px]  text-[#9A9A9A] truncate hidden sm:block">{item.document_number || '—'}</span>
                    <span className="text-[13px] font-black text-white tabular-nums text-right sm:text-left">{item.total_quantity ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <button
              onClick={onView}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#F5A623]/40 text-[#F5A623] text-[11px] font-bold uppercase tracking-widest hover:bg-[#F5A623]/5 hover:border-[#F5A623] transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            {!isViewer && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#282828] text-[#D0D0D0] text-[11px] font-bold uppercase tracking-widest hover:border-[#B3B3B3] hover:text-white transition-all"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#282828] text-[#D0D0D0] text-[11px] font-bold uppercase tracking-widest hover:border-[#B3B3B3] hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#E8192C]" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Detail Item ───────────────────────────────────────────────────────────────

function DetailItem({ icon, label, value, mono, highlight }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[#9A9A9A] mb-1.5">
        <span className="text-[#E8192C]">{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className={`text-sm truncate ${mono ? '' : 'font-black'} ${highlight ? 'text-[#F5A623]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
  isViewer?: boolean
}

export function SavedManifestsTab({
  savedManifests, handleViewManifest, handleEditManifest,
  handleDownloadManifest, handleDeleteManifest, isViewer,
}: SavedManifestsTabProps) {
  const [searchQuery,   setSearchQuery]   = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All Months')
  const [currentPage,   setCurrentPage]   = useState(1)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [sortDir,       setSortDir]       = useState<'desc' | 'asc'>('desc')
  const itemsPerPage = 10

  const sortedManifests = useMemo(() =>
    [...savedManifests].sort((a, b) => {
      const aTime = new Date(a.manifest_date || '').getTime()
      const bTime = new Date(b.manifest_date || '').getTime()
      if (!isNaN(aTime) && !isNaN(bTime)) return sortDir === 'desc' ? bTime - aTime : aTime - bTime
      if (!isNaN(bTime)) return 1
      if (!isNaN(aTime)) return -1
      return 0
    }), [savedManifests, sortDir])

  const filteredManifests = useMemo(() =>
    sortedManifests.filter((manifest) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (manifest.manifest_number || '').toLowerCase().includes(q) ||
        (manifest.driver_name || '').toLowerCase().includes(q) ||
        (manifest.plate_no || '').toLowerCase().includes(q) ||
        (manifest.trucker || '').toLowerCase().includes(q) ||
        (manifest.items || []).some(item =>
          (item.document_number || '').toLowerCase().includes(q) ||
          (item.ship_to_name || '').toLowerCase().includes(q)
        )
      if (!matchesSearch) return false
      if (selectedMonth === 'All Months') return true
      const date = new Date(manifest.manifest_date || manifest.created_at || '')
      return MONTHS[date.getMonth() + 1] === selectedMonth
    }), [sortedManifests, searchQuery, selectedMonth])

  const totalPages         = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Auto-expand on search hit
  useEffect(() => {
    if (!searchQuery) return
    const hit = filteredManifests.find(m =>
      (m.items || []).some(i => (i.document_number || '').toLowerCase().includes(searchQuery.toLowerCase()))
    )
    if (hit?.id) setExpandedId(hit.id)
  }, [searchQuery, filteredManifests])

  // ── Excel exports (logic unchanged) ──────────────────────────────────────

  const handleDownloadMonitoring = () => {
    const wb = XLSX.utils.book_new()
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])
    let row = 0
    const setCell = (r: number, c: number, value: any, style: any = {}, type: XLSX.CellObject['t'] = 's') => {
      ws[XLSX.utils.encode_cell({ r, c })] = { v: value, t: type, s: style } as XLSX.CellObject
    }
    if (!ws['!merges']) ws['!merges'] = []
    const bThin   = { top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'} }
    const bMedium = { top:{style:'medium'},bottom:{style:'medium'},left:{style:'medium'},right:{style:'medium'} }
    setCell(row,0,'SF EXPRESS CEBU WAREHOUSE — TRIP MANIFEST MONITORING',{font:{bold:true,sz:16,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'DC2626'}},alignment:{horizontal:'center',vertical:'center'}})
    ws['!merges'].push({s:{r:row,c:0},e:{r:row,c:10}})
    row++
    setCell(row,0,`Generated: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}  |  Total Manifests: ${filteredManifests.length}`,{font:{sz:10,italic:true},fill:{fgColor:{rgb:'FEE2E2'}},alignment:{horizontal:'center'}})
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
          setCell(row,0,first?(manifest.manifest_number||manifest.id||'—'):'',bold({alignment:{horizontal:'center',vertical:'center'}}))
          setCell(row,1,first?d:'',first?center():base())
          setCell(row,2,first?(manifest.trucker||'—'):'',first?center():base())
          setCell(row,3,first?(manifest.driver_name||'—'):'',first?center():base())
          setCell(row,4,first?(manifest.plate_no||'—'):'',first?center():base())
          setCell(row,5,first?(manifest.truck_type||'—'):'',first?center():base())
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
      setCell(row,0,'SF EXPRESS CEBU WAREHOUSE',{font:{bold:true,sz:14}})
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
          setCell(row,0,idx+1,cs,'n');setCell(row,1,item.ship_to_name||'—',{...cs,alignment:{horizontal:'center',vertical:'center',wrapText:true}});setCell(row,2,item.document_number||'—',{...cs,font:{bold:true}});setCell(row,3,item.total_quantity||0,cs,'n');setCell(row,4,'',cs);row++
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-black border rounded-2xl border-[#1a1a1a] overflow-hidden flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-5 sm:px-8 pt-8 pb-7 border-b border-[#1a1a1a] flex-shrink-0">

        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#F5A623] mb-3">Trip manifests</p>
            <h2 className="text-[clamp(1.6rem,4vw,2.6rem)] font-black text-white leading-[0.93] tracking-tight">
              {savedManifests.length} manifest{savedManifests.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-[12px] text-[#9A9A9A] mt-2">SF Express · Cebu Warehouse</p>
          </div>

          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadMonitoring}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#282828] text-[#D0D0D0] text-[11px] font-bold uppercase tracking-widest hover:border-[#B3B3B3] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#E8192C]" />
              Monitoring
            </button>
            <button
              onClick={handleExportAll}
              disabled={filteredManifests.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#F5A623]/40 text-[#F5A623] text-[11px] font-bold uppercase tracking-widest hover:border-[#F5A623] hover:bg-[#F5A623]/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export All
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A9A9A]" />
            <input
              type="text"
              placeholder="Search manifests…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full h-9 pl-9 pr-8 bg-transparent border border-[#282828] text-[13px] text-white placeholder-[#3E3E3E] focus:outline-none focus:border-[#6A6A6A] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <FilterDropdown
            selectedMonth={selectedMonth}
            onMonthChange={(m) => { setSelectedMonth(m); setCurrentPage(1) }}
            months={MONTHS}
          />
        </div>

        {(searchQuery || selectedMonth !== 'All Months') && (
          <p className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-widest mt-3">
            {filteredManifests.length} result{filteredManifests.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Column headers ── */}
      {filteredManifests.length > 0 && (
        <div className="flex items-center gap-3 sm:gap-5 px-5 sm:px-8 py-3 border-b border-[#1a1a1a] flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
          <span className="hidden sm:block w-5">No.</span>
          <span className="flex-1">Title</span>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="hidden sm:flex items-center justify-end gap-1 w-28 hover:text-[#D0D0D0] transition-colors cursor-pointer"
            title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            Date
            <span className="text-[#E8192C]">{sortDir === 'desc' ? '↓' : '↑'}</span>
          </button>
          <span className="w-12 text-right">Qty</span>
          <span className="hidden sm:block w-10 text-center">Docs</span>
          <span className="w-4" />
          {!isViewer && <span className="w-7" />}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {savedManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
            <FileText className="w-8 h-8 text-[#5A5A5A]" />
            <div>
              <p className="font-black text-[#9A9A9A] text-base">No manifests yet</p>
              <p className="text-[12px] text-[#5A5A5A] mt-1 max-w-xs">Create your first trip manifest to see it here</p>
            </div>
          </div>
        ) : filteredManifests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-4">
            <Search className="w-8 h-8 text-[#5A5A5A]" />
            <div>
              <p className="font-black text-[#9A9A9A] text-base">No results found</p>
              <p className="text-[12px] text-[#5A5A5A] mt-1">Try adjusting your search or filter</p>
            </div>
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
              isViewer={isViewer}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 px-5 sm:px-8 py-4 border-t border-[#1a1a1a] flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-widest tabular-nums">
            <span className="text-white">{currentPage}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - currentPage) <= 1)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-[11px] font-black uppercase tracking-widest transition-all ${
                    currentPage === page
                      ? 'bg-[#E8192C] text-white border border-[#E8192C]'
                      : 'border border-[#282828] text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white'
                  }`}
                >{page}</button>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-[#282828] text-[11px] font-bold uppercase tracking-widest text-[#9A9A9A] hover:border-[#6A6A6A] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  )
}