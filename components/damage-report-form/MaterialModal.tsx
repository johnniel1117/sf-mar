'use client'

import { X } from 'lucide-react'

interface MaterialModalProps {
  show: boolean
  pendingBarcode: string
  description: string
  category: string
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function MaterialModal({
  show,
  pendingBarcode,
  description,
  category,
  onDescriptionChange,
  onCategoryChange,
  onSave,
  onCancel,
  isLoading = false,
}: MaterialModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Material Information</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
            <input
              type="text"
              value={pendingBarcode}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter material description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option>Manual Entry</option>
              <option>System Entry</option>
              <option>Imported</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isLoading || !description.trim()}
            className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Material'}
          </button>
        </div>
      </div>
    </div>
  )
}
