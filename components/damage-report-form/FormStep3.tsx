'use client'

import React from "react"

import { Plus, Camera, Trash2, Edit2 } from 'lucide-react'
import type { DamageReport, DamageItem } from '@/lib/services/damageReportService'

interface FormStep3Props {
  report: DamageReport
  uploadingItemIndex: number | null
  onAddItem: () => void
  onUpdateItem: (index: number, field: string, value: any) => void
  onRemoveItem: (index: number) => void
  onPhotoUpload: (index: number, file: File) => void
  onEditBarcode: (index: number) => void
  barcodeInput: string
  onBarcodeInputChange: (value: string) => void
  barcodeInputRef: React.RefObject<HTMLInputElement>
  onBarcodeKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const DAMAGE_TYPES = ['Dent', 'Scratch', 'Broken', 'Missing', 'Damaged', 'Other']

export function FormStep3({
  report,
  uploadingItemIndex,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onPhotoUpload,
  onEditBarcode,
  barcodeInput,
  onBarcodeInputChange,
  barcodeInputRef,
  onBarcodeKeyPress,
}: FormStep3Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Add Damaged Items</h2>

      {/* Barcode Input */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Scan or Enter Barcode</label>
        <div className="flex gap-2">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => onBarcodeInputChange(e.target.value)}
            onKeyPress={onBarcodeKeyPress}
            placeholder="Scan barcode or enter manually, then press Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={onAddItem}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {report.items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items added yet</p>
        ) : (
          report.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Item #{item.item_number}</h4>
                <button
                  onClick={() => onRemoveItem(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.barcode}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => onEditBarcode(index)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Description</label>
                  <input
                    type="text"
                    value={item.material_description}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage Type*</label>
                  <select
                    value={item.damage_type}
                    onChange={(e) => onUpdateItem(index, 'damage_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Damage Type</option>
                    {DAMAGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Damage Description</label>
                  <input
                    type="text"
                    value={item.damage_description || ''}
                    onChange={(e) => onUpdateItem(index, 'damage_description', e.target.value)}
                    placeholder="Describe the damage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  {item.photo_url && (
                    <img
                      src={item.photo_url || "/placeholder.svg"}
                      alt="Damage photo"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    <span>{uploadingItemIndex === index ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onPhotoUpload(index, file)
                      }}
                      className="hidden"
                      disabled={uploadingItemIndex === index}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
