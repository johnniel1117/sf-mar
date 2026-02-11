'use client'

import { X, FileText, FileSpreadsheet } from 'lucide-react'

interface DownloadModalProps {
  show: boolean
  downloadType: 'pdf' | 'excel'
  onDownloadTypeChange: (type: 'pdf' | 'excel') => void
  onDownload: () => void
  onCancel: () => void
}

export function DownloadModal({
  show,
  downloadType,
  onDownloadTypeChange,
  onDownload,
  onCancel,
}: DownloadModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Download Report</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">Choose your preferred format:</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: downloadType === 'pdf' ? '#ea580c' : '#e5e7eb'}}>
            <input
              type="radio"
              name="format"
              value="pdf"
              checked={downloadType === 'pdf'}
              onChange={() => onDownloadTypeChange('pdf')}
              className="w-4 h-4"
            />
            <FileText className="w-5 h-5 ml-3 text-orange-600" />
            <div className="ml-3">
              <div className="font-semibold text-gray-900">PDF Document</div>
              <div className="text-sm text-gray-500">Professional format for printing</div>
            </div>
          </label>

          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: downloadType === 'excel' ? '#ea580c' : '#e5e7eb'}}>
            <input
              type="radio"
              name="format"
              value="excel"
              checked={downloadType === 'excel'}
              onChange={() => onDownloadTypeChange('excel')}
              className="w-4 h-4"
            />
            <FileSpreadsheet className="w-5 h-5 ml-3 text-orange-600" />
            <div className="ml-3">
              <div className="font-semibold text-gray-900">Excel Spreadsheet</div>
              <div className="text-sm text-gray-500">For data analysis</div>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
