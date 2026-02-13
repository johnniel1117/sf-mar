import { Eye, Download, Edit, Trash2, Truck, Package, Calendar, Clock, FileText } from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
}

export function SavedManifestsTab({
  savedManifests,
  handleViewManifest,
  handleEditManifest,
  handleDownloadManifest,
  handleDeleteManifest,
}: SavedManifestsTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Saved Manifests</h2>
          <p className="text-sm text-gray-600">View and manage your trip manifests</p>
        </div>
      </div>

      {savedManifests.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Manifests</h3>
          <p className="text-gray-600 mb-6">You haven't created any trip manifests yet</p>
          <p className="text-sm text-gray-500">
            Click on "Create Manifest" tab to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {savedManifests.map((manifest) => {
            const totalQuantity = manifest.items?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
            const totalDocs = manifest.items?.length || 0

            return (
              <div
                key={manifest.id}
                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Section - Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {manifest.manifest_number}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {manifest.manifest_date}
                              </span>
                              {/* {manifest.departure_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {manifest.departure_time}
                                </span>
                              )} */}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            manifest.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {manifest.status === 'completed' ? 'Completed' : 'Draft'}
                          </span>
                        </div>

                        {/* Driver and Truck Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Driver</p>
                            <p className="font-semibold text-gray-900 text-sm">{manifest.driver_name}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Plate No.</p>
                            <p className="font-semibold text-gray-900 text-sm">{manifest.plate_no}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Documents</p>
                            <p className="font-semibold text-blue-600 text-sm">{totalDocs}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Total Qty</p>
                            <p className="font-semibold text-blue-600 text-sm">{totalQuantity}</p>
                          </div>
                        </div>

                        {/* Route Info */}
                        {manifest.route && (
                          <div className="bg-blue-50 px-3 py-2 rounded-lg inline-block">
                            <p className="text-sm">
                              <span className="text-gray-600">Route:</span>{' '}
                              <span className="font-semibold text-gray-900">{manifest.route}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-wrap lg:flex-col gap-2">
                    <button
                      onClick={() => handleViewManifest(manifest)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditManifest(manifest)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownloadManifest(manifest)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => manifest.id && handleDeleteManifest(manifest.id)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}