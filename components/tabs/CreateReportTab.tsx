'use client'

import React, { useRef } from 'react'
import {
  Truck, Barcode, ClipboardList, Users, Camera,
  ChevronLeft, ChevronRight, X, Save, AlertCircle,
  CheckCircle2, Trash2, Edit
} from 'lucide-react'
import { StepsIndicator } from '@/components/StepsIndicator'
import { DAMAGE_TYPES, Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'

// ── shared styles ──────────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 bg-[#282828] border border-[#3E3E3E] text-white rounded-xl focus:ring-2 focus:ring-red-600/50 focus:border-red-600 outline-none transition-all text-sm placeholder-[#6A6A6A]"
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-1.5"
const selectCls = `${inputCls} cursor-pointer`

interface CreateReportTabProps {
  currentStep: Step
  setCurrentStep: (step: Step) => void
  report: DamageReport
  setReport: (report: DamageReport) => void
  barcodeInput: string
  setBarcodeInput: (input: string) => void
  materialLookup: Record<string, any>
  uploadingItemIndex: number | null
  editingItemIndex: number | null
  setEditingItemIndex: (index: number | null) => void
  editingItemBarcode: string
  setEditingItemBarcode: (barcode: string) => void
  personnelData: { admins: any[]; guards: any[]; supervisors: any[] }
  selectedPersonnel: { admin: string; guard: string; supervisor: string }
  isLoading: boolean
  isEditMode: boolean
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>
  handleEditItemBarcode: (index: number) => void
  handleSaveEditedBarcode: (index: number) => Promise<void>
  handleCancelEditBarcode: () => void
  updateItem: (index: number, field: string, value: any) => void
  removeItem: (index: number) => void
  handlePhotoUpload: (index: number, file: File) => Promise<void>
  handlePersonnelChange: (role: 'admin' | 'guard' | 'supervisor', value: string) => void
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  canProceedToStep4: () => boolean
  resetForm: () => void
  saveReport: () => Promise<void>
}

export const CreateReportTab: React.FC<CreateReportTabProps> = ({
  currentStep, setCurrentStep, report, setReport,
  barcodeInput, setBarcodeInput, materialLookup,
  uploadingItemIndex, editingItemIndex, setEditingItemIndex,
  editingItemBarcode, setEditingItemBarcode,
  personnelData, selectedPersonnel,
  isLoading, isEditMode, showToast,
  handleBarcodeInput, handleEditItemBarcode, handleSaveEditedBarcode,
  handleCancelEditBarcode, updateItem, removeItem, handlePhotoUpload,
  handlePersonnelChange, canProceedToStep2, canProceedToStep3,
  canProceedToStep4, resetForm, saveReport,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const handleLocalBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleBarcodeInput(e).catch(() => showToast('Error processing barcode', 'error'))
  }
  const handleLocalSaveEditedBarcode = async (index: number) => {
    try { await handleSaveEditedBarcode(index) }
    catch { showToast('Error saving barcode', 'error') }
  }
  const handleLocalPhotoUpload = async (index: number, file: File) => {
    try { await handlePhotoUpload(index, file) }
    catch { showToast('Error uploading photo', 'error') }
  }
  const handleLocalSaveReport = async () => {
    try { await saveReport() }
    catch { showToast('Error saving report', 'error') }
  }

  const steps = [
    { number: 1, title: 'Trip Info',   icon: Truck },
    { number: 2, title: 'Scan Items',  icon: Barcode },
    { number: 3, title: 'Damage',      icon: ClipboardList },
    { number: 4, title: 'Finalize',    icon: Save },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-[#121212] rounded-xl border border-[#282828] shadow-2xl overflow-hidden">

        {/* ── Playlist-style header ── */}
        <div
          className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 border-b border-[#282828]"
          style={{ background: 'linear-gradient(180deg, rgba(232,25,44,0.18) 0%, #121212 100%)' }}
        >
          {/* Brand row */}
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg shadow-xl flex-shrink-0 flex items-center justify-center"
              // style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
            >
              <ClipboardList className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[#B3B3B3] mb-0.5">
                {isEditMode ? 'Editing' : 'New'}
              </p>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {isEditMode ? 'Edit Report' : 'Create Report'}
              </h2>
              <p className="text-xs text-[#B3B3B3] mt-0.5">SF Express Warehouse</p>
            </div>
          </div>

          {/* ── Step indicator — same style as manifest ── */}
          <div className="flex items-center gap-0">
            {steps.map((step, index) => {
              const isActive    = currentStep === step.number
              const isCompleted = currentStep > step.number
              const Icon        = step.icon
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-110'
                        : isCompleted
                        ? 'bg-red-600/20 text-red-500 border border-red-600/40'
                        : 'bg-[#282828] text-[#6A6A6A] border border-[#3E3E3E]'
                    }`}>
                      {isCompleted
                        ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      }
                    </div>
                    <p className={`text-[10px] sm:text-xs font-bold mt-1.5 text-center ${
                      isActive ? 'text-white' : isCompleted ? 'text-red-500' : 'text-[#6A6A6A]'
                    }`}>{step.title}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-shrink-0 mx-1 sm:mx-2" style={{ marginBottom: '22px' }}>
                      <div className={`h-0.5 w-6 sm:w-10 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-red-600' : 'bg-[#3E3E3E]'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="p-4 sm:p-6">

          {/* ── STEP 1: Vehicle & Shipment Info ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Vehicle & Shipment Information</h3>
                  <p className="text-xs text-[#B3B3B3]">Enter truck and delivery details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                {/* Report Number — static display, same as manifest number card */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Report Number</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl">
                    <div className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ background: 'linear-gradient(180deg, #E8192C 0%, #7f0e18 100%)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-[#6A6A6A] mb-0.5">Auto-generated</p>
                      <p className="text-base sm:text-lg font-black text-white tracking-wider tabular-nums truncate">
                        {report.report_number || '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-2 py-1 bg-yellow-500 border border-[#3E3E3E] rounded-full">
                      <span className="text-[10px] font-bold uppercase tracking-widest ">System</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Report Date</label>
                  <input type="date" value={report.report_date}
                    onChange={(e) => setReport({ ...report, report_date: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Driver Name <span className="text-red-500">*</span></label>
                  <input type="text" value={report.driver_name}
                    onChange={(e) => setReport({ ...report, driver_name: e.target.value })}
                    className={inputCls} placeholder="Driver's name" />
                </div>
                <div>
                  <label className={labelCls}>Plate No. <span className="text-red-500">*</span></label>
                  <input type="text" value={report.plate_no}
                    onChange={(e) => setReport({ ...report, plate_no: e.target.value })}
                    className={inputCls} placeholder="Plate number" />
                </div>
                <div>
                  <label className={labelCls}>Seal No.</label>
                  <input type="text" value={report.seal_no}
                    onChange={(e) => setReport({ ...report, seal_no: e.target.value })}
                    className={inputCls} placeholder="Seal number" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Container No.</label>
                  <input type="text" value={report.container_no}
                    onChange={(e) => setReport({ ...report, container_no: e.target.value })}
                    className={inputCls} placeholder="Container number" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Scan Items ── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                  <Barcode className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Scan Damaged Items</h3>
                  <p className="text-xs text-[#B3B3B3]">Scan barcodes to add items to the report</p>
                </div>
              </div>

              {/* Barcode input */}
              <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">
                  <Barcode className="w-3.5 h-3.5 text-red-500" /> Barcode Scanner
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6A6A]" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleLocalBarcodeInput}
                    placeholder="Scan or type barcode and press Enter…"
                    className={`${inputCls} pl-10`}
                    autoFocus
                  />
                </div>
                {materialLookup.material_description && (
                  <div className="mt-3 p-3 bg-[#282828] border border-green-500/30 rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-white">
                      Found: <span className="text-green-400">{materialLookup.material_description}</span>
                      {materialLookup.category && <span className="text-[#6A6A6A]"> · {materialLookup.category}</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Scanned items list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B3B3B3]">
                    <ClipboardList className="w-3.5 h-3.5 text-red-500" />
                    Scanned Items ({report.items.length})
                  </h4>
                </div>

                {report.items.length === 0 ? (
                  <div className="py-10 text-center bg-[#1E1E1E] rounded-xl border-2 border-dashed border-[#3E3E3E]">
                    <AlertCircle className="w-10 h-10 text-[#3E3E3E] mx-auto mb-3" />
                    <p className="text-[#6A6A6A] font-semibold text-sm">No items scanned yet</p>
                    <p className="text-xs text-[#6A6A6A] mt-1">Scan a barcode above to add items</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.items.map((item, idx) => (
                      <div key={idx} className="group flex items-start gap-3 p-3 sm:p-4 bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl hover:border-red-600/30 hover:bg-[#282828] transition-all">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                          {item.item_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate group-hover:text-red-500 transition-colors">
                            {item.material_description || 'Unknown Item'}
                          </p>
                          <p className="text-[10px] text-[#6A6A6A] mt-0.5">Code: {item.material_code || 'N/A'}</p>

                          {/* Barcode edit / display */}
                          {editingItemIndex === idx ? (
                            <div className="mt-2 space-y-2">
                              <input
                                type="text"
                                value={editingItemBarcode}
                                onChange={(e) => setEditingItemBarcode(e.target.value)}
                                className={inputCls}
                                placeholder="Enter new barcode…"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleLocalSaveEditedBarcode(idx)}
                                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-1">
                                  <Save className="w-3 h-3" /> Save
                                </button>
                                <button onClick={handleCancelEditBarcode}
                                  className="flex-1 px-3 py-1.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-xs font-semibold hover:border-white hover:text-white transition-colors flex items-center justify-center gap-1">
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-[#6A6A6A]">Barcode:</span>
                              <span className="text-[10px]  text-[#B3B3B3] break-all">{item.barcode}</span>
                              <button onClick={() => handleEditItemBarcode(idx)}
                                className="p-1 text-[#6A6A6A] hover:text-red-500 hover:bg-red-600/10 rounded-full transition-all"
                                title="Edit barcode">
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => removeItem(idx)}
                          className="p-1.5 text-[#6A6A6A] hover:text-red-500 hover:bg-red-600/10 rounded-full transition-all flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Damage Details ── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Damage Details</h3>
                  <p className="text-xs text-[#B3B3B3]">Provide information for each damaged item</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {report.items.map((item, idx) => (
                  <div key={idx} className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                        {item.item_number}
                      </div>
                      <h4 className="font-bold text-white text-sm truncate">
                        {item.material_description || 'Item Details'}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {/* Barcode display */}
                      <div className="flex items-center justify-between p-3 bg-[#282828] rounded-lg border border-[#3E3E3E]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">Serial / Barcode</p>
                          <p className="text-sm  font-semibold text-white break-all">{item.barcode || '—'}</p>
                        </div>
                        <Barcode className="w-4 h-4 text-[#6A6A6A] flex-shrink-0" />
                      </div>

                      {/* Damage type */}
                      <div>
                        <label className={labelCls}>Damage Type <span className="text-red-500">*</span></label>
                        <select value={item.damage_type}
                          onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                          className={selectCls}>
                          <option value="">Select damage type</option>
                          {DAMAGE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Damage description */}
                      <div>
                        <label className={labelCls}>Damage Description</label>
                        <textarea value={item.damage_description}
                          onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                          placeholder="Describe the damage…"
                          rows={2}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {/* Photo upload */}
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-1.5">
                          <Camera className="w-3.5 h-3.5 text-red-500" /> Photo Evidence
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input type="file" accept="image/*"
                            onChange={(e) => { if (e.target.files?.[0]) handleLocalPhotoUpload(idx, e.target.files[0]) }}
                            disabled={uploadingItemIndex === idx}
                            className="flex-1 text-xs text-[#B3B3B3] bg-[#282828] border border-[#3E3E3E] rounded-xl px-3 py-2.5
                              file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0
                              file:text-xs file:font-bold file:bg-red-600 file:text-white
                              hover:file:bg-red-500 transition-all cursor-pointer" />
                          {item.photo_url && (
                            <a href={item.photo_url} target="_blank" rel="noopener noreferrer"
                              className="w-full sm:w-auto px-4 py-2 bg-[#282828] border border-[#3E3E3E] text-white rounded-full text-xs font-bold hover:border-white transition-all text-center flex-shrink-0">
                              View Photo
                            </a>
                          )}
                        </div>
                        {uploadingItemIndex === idx && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-3 h-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                            <p className="text-xs text-red-500 font-semibold">Uploading…</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Finalize ── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(#E8192C 0%, #7f0e18 100%)' }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Review & Finalize</h3>
                  <p className="text-xs text-[#B3B3B3]">Add final notes and personnel signatures</p>
                </div>
              </div>

              {/* Personnel selects */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { role: 'admin' as const, label: 'Prepared By (Admin)', list: personnelData.admins },
                  { role: 'guard' as const, label: 'Noted By (Guard)', list: personnelData.guards },
                  { role: 'supervisor' as const, label: 'Acknowledged By (Supervisor)', list: personnelData.supervisors },
                ].map(({ role, label, list }) => (
                  <div key={role}>
                    <label className={labelCls}>{label} <span className="text-red-500">*</span></label>
                    <select value={selectedPersonnel[role]}
                      onChange={(e) => handlePersonnelChange(role, e.target.value)}
                      className={selectCls}>
                      <option value="">Select {role}</option>
                      {list.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {selectedPersonnel[role] && (
                      <p className="text-[10px] text-green-400 font-semibold mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        {list.find(p => p.id === selectedPersonnel[role])?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Narrative findings */}
              <div>
                <label className={labelCls}>Narrative Findings</label>
                <textarea value={report.narrative_findings}
                  onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                  placeholder="Describe what happened and what was found…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Summary card — same table style as manifest review */}
              <div className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-xl p-4 sm:p-5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-4">Report Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  {[
                    ['Report No.', report.report_number || '—'],
                    ['Date', report.report_date || '—'],
                    ['Driver', report.driver_name || '—'],
                    ['Plate No.', report.plate_no || '—'],
                    ['Seal No.', report.seal_no || '—'],
                    ['Container No.', report.container_no || '—'],
                    ['Prepared By', report.prepared_by || 'Not selected'],
                    ['Total Items', String(report.items?.length || 0)],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-0.5">{lbl}</p>
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Items mini-table */}
                {report.items.length > 0 && (
                  <>
                    <div className="border-t border-[#282828] pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6A6A6A] mb-3">
                        Damaged Items ({report.items.length})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[320px]">
                          <thead>
                            <tr className="border-b border-[#3E3E3E] text-[#6A6A6A] uppercase tracking-widest text-[10px]">
                              <th className="pb-2.5 text-left font-bold w-8">#</th>
                              <th className="pb-2.5 text-left font-bold">Description</th>
                              <th className="pb-2.5 text-left font-bold hidden sm:table-cell">Barcode</th>
                              <th className="pb-2.5 text-right font-bold">Damage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.items.map((item) => (
                              <tr key={item.item_number} className="border-b border-[#282828] hover:bg-[#282828] transition-colors group">
                                <td className="py-2.5 text-[#6A6A6A] font-medium">{item.item_number}</td>
                                <td className="py-2.5 text-white font-medium group-hover:text-red-500 transition-colors truncate max-w-[120px] sm:max-w-none">
                                  {item.material_description || '—'}
                                </td>
                                <td className="py-2.5 text-[#B3B3B3]  hidden sm:table-cell">{item.barcode}</td>
                                <td className="py-2.5 text-right font-black text-red-500">{item.damage_type || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 pt-5 border-t border-[#282828]">
            <button
              onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as Step)}
              disabled={currentStep === 1}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 ${
                currentStep === 1
                  ? 'bg-[#282828] text-[#6A6A6A] cursor-not-allowed'
                  : 'border border-[#727272] text-white hover:border-white hover:scale-105 active:scale-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !canProceedToStep2()) {
                    showToast('Please fill in Driver Name and Plate No.', 'error'); return
                  }
                  if (currentStep === 2 && !canProceedToStep3()) {
                    showToast('Please add at least one item', 'error'); return
                  }
                  if (currentStep === 3 && !canProceedToStep4()) {
                    showToast('Please fill in Damage Type for all items', 'error'); return
                  }
                  setCurrentStep((currentStep + 1) as Step)
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white font-bold text-sm hover:bg-red-500 hover:scale-105 active:scale-100 transition-all duration-150 shadow-lg shadow-red-600/25"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={resetForm}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-[#727272] text-white rounded-full font-semibold text-sm hover:border-white hover:scale-105 active:scale-100 transition-all">
                  <X className="w-4 h-4" /> Clear
                </button>
                <button onClick={handleLocalSaveReport}
                  disabled={isLoading || !selectedPersonnel.admin || !selectedPersonnel.guard || !selectedPersonnel.supervisor}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-100 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    isEditMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25'
                  }`}>
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving…' : isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}