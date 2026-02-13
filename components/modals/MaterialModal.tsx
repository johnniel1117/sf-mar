'use client'

import React from 'react'
import { AlertCircle, X, Barcode, Info, Save } from 'lucide-react'

interface MaterialModalProps {
  isOpen: boolean
  pendingBarcode: string
  materialDescription: string
  materialCategory: string
  isSaving: boolean
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function MaterialModal({
  isOpen,
  pendingBarcode,
  materialDescription,
  materialCategory,
  isSaving,
  onDescriptionChange,
  onCategoryChange,
  onSave,
  onCancel,
}: MaterialModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Material Not Found
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Please enter material description for the scanned barcode
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Barcode Display */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Scanned Barcode</p>
                <p className="text-sm font-bold text-gray-900 break-all font-mono">{pendingBarcode}</p>
              </div>
              <Barcode className="w-5 h-5 text-gray-600 flex-shrink-0" />
            </div>
          </div>

          {/* Material Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={materialDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter material description..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              autoFocus
            />
          </div>

          {/* Category Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={materialCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="e.g., Electronics, Furniture, etc."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                This material will be saved to your database and automatically retrieved next time you scan this barcode.
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!materialDescription.trim() || isSaving}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
