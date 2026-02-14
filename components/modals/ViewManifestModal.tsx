'use client'

import { 
  X, Download, Edit, Truck, Calendar, Clock, Package, 
  FileSpreadsheet 
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

interface ViewManifestModalProps {
  isOpen: boolean
  manifest: TripManifest | null
  onClose: () => void
  onEdit: (manifest: TripManifest) => void
  onDownloadPDF: (manifest: TripManifest) => void     // renamed
  onDownloadExcel: (manifest: TripManifest) => void   // new prop
}

export function ViewManifestModal({
  isOpen,
  manifest,
  onClose,
  onEdit,
  onDownloadPDF,
  onDownloadExcel,
}: ViewManifestModalProps) {
  if (!isOpen || !manifest) return null

  const totalQuantity = manifest.items?.reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0
  const totalDocs = manifest.items?.length || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trip Manifest</h2>
              <p className="text-sm text-blue-100 mt-0.5">
                {manifest.manifest_number || 'Draft'} • {manifest.manifest_date || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/20 rounded-xl transition-colors text-white"
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {/* Trip Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-5 text-lg flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-blue-700" />
              Trip Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Manifest Date
                </p>
                <p className="font-semibold text-gray-900">{manifest.manifest_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5">Driver Name</p>
                <p className="font-semibold text-gray-900">{manifest.driver_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5">Plate No.</p>
                <p className="font-semibold text-gray-900">{manifest.plate_no || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5">Trucker</p>
                <p className="font-semibold text-gray-900">{manifest.trucker || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5">Truck Type</p>
                <p className="font-semibold text-gray-900">{manifest.truck_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Time Window
                </p>
                <p className="font-semibold text-gray-900">
                  {manifest.time_start || '—'} – {manifest.time_end || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
              <p className="text-sm text-blue-700 mb-1 font-medium">Total Documents</p>
              <p className="text-4xl font-bold text-blue-800">{totalDocs}</p>
            </div>
            <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center">
              <p className="text-sm text-green-700 mb-1 font-medium">Total Quantity</p>
              <p className="text-4xl font-bold text-green-800">{totalQuantity.toLocaleString()}</p>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2.5">
                <Package className="w-5 h-5 text-gray-700" />
                Loaded Documents
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No.</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ship To</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Document / DN No.</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {manifest.items?.map((item) => (
                    <tr key={item.item_number} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-900 font-medium">{item.item_number}</td>
                      <td className="px-5 py-4 text-sm text-gray-900">{item.ship_to_name || '—'}</td>
                      <td className="px-5 py-4 text-sm font-mono text-gray-800">{item.document_number}</td>
                      <td className="px-5 py-4 text-sm text-right font-semibold text-blue-700">
                        {item.total_quantity?.toLocaleString() || '—'}
                      </td>
                    </tr>
                  ))}
                  {(!manifest.items || manifest.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 italic">
                        No documents added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {manifest.remarks && (
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
              <h4 className="font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-amber-700" />
                Remarks / Special Instructions
              </h4>
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {manifest.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors order-1 sm:order-none"
          >
            Close
          </button>

          <button
            onClick={() => {
              onEdit(manifest)
              onClose()
            }}
            className="px-5 py-2.5 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 order-2 sm:order-none"
          >
            <Edit className="w-4 h-4" />
            Edit Manifest
          </button>

          <div className="flex flex-col sm:flex-row gap-3 order-3 sm:order-none">
            <button
              onClick={() => onDownloadPDF(manifest)}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              title="Download as PDF"
            >
              <Download className="w-4.5 h-4.5" />
              Download PDF
            </button>

            <button
              onClick={() => onDownloadExcel(manifest)}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              title="Download as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}