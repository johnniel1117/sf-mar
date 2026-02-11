'use client'

import { X, FileText, FileSpreadsheet } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  downloadType: 'pdf' | 'excel'
  onDownloadTypeChange: (type: 'pdf' | 'excel') => void
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Choose Download Format</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {/* PDF Option */}
          <button
            onClick={() => onDownloadTypeChange('pdf')}
            className={`w-full flex items-center gap-4 p-4 sm:p-5 border-2 rounded-xl transition-all duration-300 hover:shadow-md ${
              downloadType === 'pdf'
                ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                downloadType === 'pdf' ? 'border-green-600' : 'border-gray-300'
              }`}
            >
              {downloadType === 'pdf' && <div className="w-3.5 h-3.5 rounded-full bg-green-600" />}
            </div>
            <FileText className={`w-6 h-6 ${downloadType === 'pdf' ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">PDF Document</p>
              <p className="text-sm text-gray-500 mt-0.5">Print-ready format for signatures</p>
            </div>
          </button>

          {/* Excel Option */}
          <button
            onClick={() => onDownloadTypeChange('excel')}
            className={`w-full flex items-center gap-4 p-4 sm:p-5 border-2 rounded-xl transition-all duration-300 hover:shadow-md ${
              downloadType === 'excel'
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                downloadType === 'excel' ? 'border-blue-600' : 'border-gray-300'
              }`}
            >
              {downloadType === 'excel' && <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />}
            </div>
            <FileSpreadsheet className={`w-6 h-6 ${downloadType === 'excel' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">Excel Spreadsheet</p>
              <p className="text-sm text-gray-500 mt-0.5">Structured data for analysis</p>
            </div>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
