'use client'

import React from 'react'
import { X, FileText, FileSpreadsheet, Download } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  downloadType: 'pdf' | 'excel' | 'both'
  onDownloadTypeChange: (type: 'pdf' | 'excel' | 'both') => void
  onConfirm: () => void
  onClose: () => void
}

export function DownloadModal({
  isOpen,
  downloadType,
  onDownloadTypeChange,
  onConfirm,
  onClose,
}: DownloadModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Download Trip Manifest
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => onDownloadTypeChange('pdf')}
            className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all ${
              downloadType === 'pdf'
                ? 'border-red-500 bg-red-50/70 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              downloadType === 'pdf' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <FileText className={`w-6 h-6 ${downloadType === 'pdf' ? 'text-red-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">PDF Document</p>
              <p className="text-sm text-gray-600">Best for printing & signatures</p>
            </div>
          </button>

          <button
            onClick={() => onDownloadTypeChange('excel')}
            className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all ${
              downloadType === 'excel'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              downloadType === 'excel' ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
              <FileSpreadsheet className={`w-6 h-6 ${downloadType === 'excel' ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Excel Spreadsheet</p>
              <p className="text-sm text-gray-600">Editable data & analysis</p>
            </div>
          </button>

          <button
            onClick={() => onDownloadTypeChange('both')}
            className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all ${
              downloadType === 'both'
                ? 'border-orange-500 bg-orange-50/70 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              downloadType === 'both' ? 'bg-orange-100' : 'bg-gray-100'
            }`}>
              <Download className={`w-6 h-6 ${downloadType === 'both' ? 'text-orange-600' : 'text-gray-500'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Both Formats</p>
              <p className="text-sm text-gray-600">PDF + Excel at once</p>
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={downloadType === null}
            className={`flex-1 py-3 px-5 rounded-xl font-semibold text-white transition-all ${
              downloadType
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}