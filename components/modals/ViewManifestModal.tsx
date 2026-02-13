import { X, Download, Edit, Truck, Calendar, Clock, Package, MapPin } from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

interface ViewManifestModalProps {
  isOpen: boolean
  manifest: TripManifest | null
  onClose: () => void
  onEdit: (manifest: TripManifest) => void
  onDownload: (manifest: TripManifest) => void
}

export function ViewManifestModal({
  isOpen,
  manifest,
  onClose,
  onEdit,
  onDownload,
}: ViewManifestModalProps) {
  if (!isOpen || !manifest) return null

  const totalQuantity = manifest.items?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
  const totalDocs = manifest.items?.length || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trip Manifest</h2>
              <p className="text-sm text-blue-100">{manifest.manifest_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Trip Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Trip Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date
                </p>
                <p className="font-semibold text-gray-900">{manifest.manifest_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Driver</p>
                <p className="font-semibold text-gray-900">{manifest.driver_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Plate No.</p>
                <p className="font-semibold text-gray-900">{manifest.plate_no}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Helper</p>
                <p className="font-semibold text-gray-900">{manifest.helper_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Route
                </p>
                <p className="font-semibold text-gray-900">{manifest.route || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Departure
                </p>
                <p className="font-semibold text-gray-900">{manifest.departure_time || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-xl">
              <p className="text-sm text-blue-800 mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-blue-900">{totalDocs}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-xl">
              <p className="text-sm text-green-800 mb-1">Total Quantity</p>
              <p className="text-3xl font-bold text-green-900">{totalQuantity}</p>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                Documents
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ship To Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">DN/TRA No.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {manifest.items?.map((item) => (
                    <tr key={item.item_number} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.item_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.ship_to_name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.document_number}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                        {item.total_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {manifest.remarks && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-2">Remarks</h4>
              <p className="text-sm text-gray-700">{manifest.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onEdit(manifest)
              onClose()
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              onDownload(manifest)
              onClose()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}