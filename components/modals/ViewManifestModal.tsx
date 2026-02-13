'use client'

import { 
  X, Download, Edit, Truck, Calendar, Clock, Package, 
  FileSpreadsheet, Info
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

interface ViewManifestModalProps {
  isOpen: boolean
  manifest: TripManifest | null
  onClose: () => void
  onEdit: (manifest: TripManifest) => void
  onDownloadPDF: (manifest: TripManifest) => void
}

export function ViewManifestModal({
  isOpen,
  manifest,
  onClose,
  onEdit,
  onDownloadPDF,
}: ViewManifestModalProps) {
  if (!isOpen || !manifest) return null

  const totalQuantity = manifest.items?.reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0
  const totalDocs = manifest.items?.length || 0

  const getDuration = () => {
    if (!manifest.time_start || !manifest.time_end) return null

    const [h1, m1] = manifest.time_start.split(':').map(Number)
    const [h2, m2] = manifest.time_end.split(':').map(Number)

    let minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minutes < 0) minutes += 24 * 60

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return `${hours}h ${mins.toString().padStart(2, '0')}m`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-light tracking-tight text-gray-900">Trip Manifest</h2>
              <p className="text-sm text-gray-500 mt-1">
                {manifest.manifest_number || 'Draft'} • {manifest.manifest_date || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 space-y-6">
          {/* Trip Information */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-orange-600" />
              </div>
              Trip Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Manifest Date</p>
                <p className="text-sm font-medium text-gray-900">{manifest.manifest_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver Name</p>
                <p className="text-sm font-medium text-gray-900">{manifest.driver_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plate Number</p>
                <p className="text-sm font-medium text-gray-900">{manifest.plate_no || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trucker</p>
                <p className="text-sm font-medium text-gray-900">{manifest.trucker || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Truck Type</p>
                <p className="text-sm font-medium text-gray-900">{manifest.truck_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time Window</p>
                <p className="text-sm font-medium text-gray-900">
                  {manifest.time_start || '—'} – {manifest.time_end || '—'}
                </p>
              </div>
              {getDuration() && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-sm font-medium text-emerald-600">{getDuration()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-blue-600">{totalDocs}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Quantity</p>
              <p className="text-3xl font-bold text-green-600">{totalQuantity.toLocaleString()}</p>
            </div>
          </div>

          {/* Documents List */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              Loaded Documents ({totalDocs})
            </h3>
            <div className="space-y-4">
              {manifest.items?.map((item) => (
                <div key={item.item_number} className="border border-gray-150 rounded-xl p-5 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0">
                      {item.item_number}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-3">{item.ship_to_name || 'Unknown'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Document Number</p>
                          <p className="font-mono text-sm font-medium text-gray-900">{item.document_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                          <p className="text-sm font-bold text-orange-600">{item.total_quantity?.toLocaleString() || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!manifest.items || manifest.items.length === 0) && (
                <div className="text-center py-8 text-gray-500 italic">
                  No documents added yet
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          {manifest.remarks && (
            <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-orange-600" />
                </div>
                Remarks
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{manifest.remarks}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                onEdit(manifest)
                onClose()
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all hover:shadow-md"
            >
              Edit Manifest
            </button>
            <button
              onClick={() => onDownloadPDF(manifest)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-all hover:shadow-md"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}