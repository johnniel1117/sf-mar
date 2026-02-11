'use client'

import React, { useState, useRef } from 'react'
import { Truck, Barcode, ClipboardList, Users, Camera, ChevronLeft, ChevronRight, X, Save, AlertCircle, CheckCircle2, Trash2, Edit } from 'lucide-react'
import { StepsIndicator } from '@/components/StepsIndicator'
import { DAMAGE_TYPES, Step } from '@/lib/constants/damageReportConstants'
import type { DamageItem, DamageReport } from '@/lib/services/damageReportService'

const icons = {
  Truck,
  Barcode,
  ClipboardList,
  Users,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
} as const

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
  personnelData: {
    admins: any[]
    guards: any[]
    supervisors: any[]
  }
  selectedPersonnel: {
    admin: string
    guard: string
    supervisor: string
  }
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
  currentStep,
  setCurrentStep,
  report,
  setReport,
  barcodeInput,
  setBarcodeInput,
  materialLookup,
  uploadingItemIndex,
  editingItemIndex,
  setEditingItemIndex,
  editingItemBarcode,
  setEditingItemBarcode,
  personnelData,
  selectedPersonnel,
  isLoading,
  isEditMode,
  showToast,
  handleBarcodeInput,
  handleEditItemBarcode,
  handleSaveEditedBarcode,
  handleCancelEditBarcode,
  updateItem,
  removeItem,
  handlePhotoUpload,
  handlePersonnelChange,
  canProceedToStep2,
  canProceedToStep3,
  canProceedToStep4,
  resetForm,
  saveReport,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Local handler for barcode input
  const handleLocalBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleBarcodeInput(e).catch(error => {
      console.error('Error in barcode input:', error)
      showToast('Error processing barcode', 'error')
    })
  }

  // Local handler for saving edited barcode
  const handleLocalSaveEditedBarcode = async (index: number) => {
    try {
      await handleSaveEditedBarcode(index)
    } catch (error) {
      console.error('Error saving edited barcode:', error)
      showToast('Error saving barcode', 'error')
    }
  }

  // Local handler for photo upload
  const handleLocalPhotoUpload = async (index: number, file: File) => {
    try {
      await handlePhotoUpload(index, file)
    } catch (error) {
      console.error('Error uploading photo:', error)
      showToast('Error uploading photo', 'error')
    }
  }

  // Local handler for save report
  const handleLocalSaveReport = async () => {
    try {
      await saveReport()
    } catch (error) {
      console.error('Error saving report:', error)
      showToast('Error saving report', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
        <StepsIndicator currentStep={currentStep} isEditMode={isEditMode} />

        {/* Step Content */}
        <div className="mt-8">
          {/* Step 1: Truck Info */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <icons.Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vehicle & Shipment Information</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Enter the truck and delivery details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={report.report_date}
                    onChange={(e) => setReport({ ...report, report_date: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Driver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={report.driver_name}
                    onChange={(e) => setReport({ ...report, driver_name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="Driver's name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Plate No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={report.plate_no}
                    onChange={(e) => setReport({ ...report, plate_no: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="Plate number"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Seal No.
                  </label>
                  <input
                    type="text"
                    value={report.seal_no}
                    onChange={(e) => setReport({ ...report, seal_no: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="Seal number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Container No.
                  </label>
                  <input
                    type="text"
                    value={report.container_no}
                    onChange={(e) => setReport({ ...report, container_no: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="Container number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scan Items with Barcode Editing */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <icons.Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Scan Damaged Items</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Scan barcodes to add items to the report</p>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 sm:p-6 text-white">
                <label className="block text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <icons.Barcode className="w-5 h-5" />
                  Scan Barcode
                </label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleLocalBarcodeInput}
                  placeholder="Scan or type barcode and press Enter..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                {materialLookup.material_description && (
                  <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-start gap-2">
                    <icons.CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium text-sm break-words">
                      Found: {materialLookup.material_description} ({materialLookup.category})
                    </p>
                  </div>
                )}
              </div>

              {/* Items List with Barcode Editing */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Scanned Items ({report.items.length})
                  </h3>
                </div>

                {report.items.length === 0 ? (
                  <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <icons.AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">No items scanned yet</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Scan a barcode to add items</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {report.items.map((item, idx) => (
                      <div key={idx} className="p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                            {item.item_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.material_description || 'Unknown Item'}</p>
                            <p className="text-xs text-gray-500 truncate">Code: {item.material_code || 'N/A'}</p>
                            
                            {/* Barcode Display/Edit */}
                            {editingItemIndex === idx ? (
                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  value={editingItemBarcode}
                                  onChange={(e) => setEditingItemBarcode(e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg text-sm font-mono"
                                  placeholder="Enter new barcode..."
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleLocalSaveEditedBarcode(idx)}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                                  >
                                    <icons.Save className="w-3 h-3 inline mr-1" />
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditBarcode}
                                    className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500 transition-colors"
                                  >
                                    <icons.X className="w-3 h-3 inline mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-600">Barcode:</span>
                                <span className="font-mono text-xs font-semibold break-all">{item.barcode}</span>
                                <button
                                  onClick={() => handleEditItemBarcode(idx)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit barcode"
                                >
                                  <icons.Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <icons.Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Item Details */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <icons.ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Damage Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Provide information for each damaged item</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                {report.items.map((item, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                        {item.item_number}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {item.material_description || 'Item Details'}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Scanned Serial Number</p>
                            <p className="text-sm font-bold text-gray-900 break-all">
                              {item.barcode || 'No barcode scanned'}
                            </p>
                          </div>
                          <icons.Barcode className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                          Damage Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.damage_type}
                          onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                          className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select type</option>
                          {DAMAGE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                          Damage Description
                        </label>
                        <textarea
                          value={item.damage_description}
                          onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                          placeholder="Describe the damage..."
                          rows={2}
                          className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <icons.Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                          Photo Evidence
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleLocalPhotoUpload(idx, e.target.files[0])
                              }
                            }}
                            disabled={uploadingItemIndex === idx}
                            className="flex-1 px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-2 sm:file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                          {item.photo_url && (
                            <a
                              href={item.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto px-3 py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-700 transition-colors text-center"
                            >
                              View
                            </a>
                          )}
                        </div>
                        {uploadingItemIndex === idx && (
                          <p className="text-xs text-orange-600 mt-2 font-medium">Uploading...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review & Save with Personnel Dropdowns */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <icons.Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Review & Finalize</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Add final notes and signatures</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Personnel Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Admin Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Prepared By (Admin) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPersonnel.admin}
                      onChange={(e) => handlePersonnelChange('admin', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    >
                      <option value="">Select Admin</option>
                      {personnelData.admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                    {selectedPersonnel.admin && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Selected: {personnelData.admins.find(a => a.id === selectedPersonnel.admin)?.name}
                      </p>
                    )}
                  </div>

                  {/* Guard Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Noted By (Guard) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPersonnel.guard}
                      onChange={(e) => handlePersonnelChange('guard', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    >
                      <option value="">Select Guard</option>
                      {personnelData.guards.map((guard) => (
                        <option key={guard.id} value={guard.id}>
                          {guard.name}
                        </option>
                      ))}
                    </select>
                    {selectedPersonnel.guard && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Selected: {personnelData.guards.find(g => g.id === selectedPersonnel.guard)?.name}
                      </p>
                    )}
                  </div>

                  {/* Supervisor Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Acknowledged By (Supervisor) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPersonnel.supervisor}
                      onChange={(e) => handlePersonnelChange('supervisor', e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    >
                      <option value="">Select Supervisor</option>
                      {personnelData.supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </option>
                      ))}
                    </select>
                    {selectedPersonnel.supervisor && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Selected: {personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor)?.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Narrative Findings
                  </label>
                  <textarea
                    value={report.narrative_findings}
                    onChange={(e) => setReport({ ...report, narrative_findings: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="Describe what happened and what was found..."
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
                  <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Report Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex justify-between sm:flex-col sm:gap-1">
                      <span className="text-gray-600 font-medium">Driver:</span>
                      <span className="font-semibold text-gray-900">{report.driver_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:gap-1">
                      <span className="text-gray-600 font-medium">Plate No:</span>
                      <span className="font-semibold text-gray-900">{report.plate_no || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:gap-1">
                      <span className="text-gray-600 font-medium">Prepared By:</span>
                      <span className="font-semibold text-gray-900">
                        {report.prepared_by || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:gap-1">
                      <span className="text-gray-600 font-medium">Total Items:</span>
                      <span className="font-semibold text-gray-900">{report.items?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">
          <button
            onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as Step)}
            disabled={currentStep === 1}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <icons.ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) {
                  showToast('Please fill in all required fields (Driver Name, Plate No.)', 'error')
                  return
                }
                if (currentStep === 2 && !canProceedToStep3()) {
                  showToast('Please add at least one item', 'error')
                  return
                }
                if (currentStep === 3 && !canProceedToStep4()) {
                  showToast('Please fill in Damage Type for all items', 'error')
                  return
                }
                setCurrentStep((currentStep + 1) as Step)
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg"
            >
              Next
              <icons.ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                <icons.X className="w-4 h-4 sm:w-5 sm:h-5" />
                Clear
              </button>
              <button
                onClick={handleLocalSaveReport}
                disabled={isLoading || !selectedPersonnel.admin || !selectedPersonnel.guard || !selectedPersonnel.supervisor}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg font-semibold transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <icons.Save className="w-4 h-4 sm:w-5 sm:h-5" />
                {isLoading ? 'Saving...' : isEditMode ? 'Update Report' : 'Save Report'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}