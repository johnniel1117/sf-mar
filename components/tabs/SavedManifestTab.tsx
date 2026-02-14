'use client'

import { 
  Eye, Download, Edit, Trash2, Truck, Package, Calendar, 
  FileText, FileSpreadsheet 
} from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

const icons = {
  Eye,
  Download,
  Edit,
  Trash2,
  Truck,
  Package,
  Calendar,
  FileText,
  FileSpreadsheet,   // ← added for Excel
} as const

interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifestPDF: (manifest: TripManifest) => void     // ← renamed
  handleDownloadManifestExcel: (manifest: TripManifest) => void   // ← new
  handleDeleteManifest: (manifestId: string) => void
}

export function SavedManifestsTab({
  savedManifests,
  handleViewManifest,
  handleEditManifest,
  handleDownloadManifestPDF,
  handleDownloadManifestExcel,
  handleDeleteManifest,
}: SavedManifestsTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <icons.FileText className="w-5 h-5" />
            Saved Manifests
          </h3>
          <p className="text-sm text-gray-600">
            View, edit, download (PDF/Excel) or delete your saved trip manifests
          </p>
        </div>
      </div>

      {savedManifests.length === 0 ? (
        <div className="py-8 sm:py-12 text-center">
          <icons.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 font-medium text-base sm:text-lg">No manifests saved yet</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Create your first trip manifest to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedManifests.map((manifest) => {
            const totalQuantity = manifest.items?.reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0
            const totalDocs = manifest.items?.length || 0
            const manifestDate = manifest.manifest_date 
              ? new Date(manifest.manifest_date).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) 
              : 'No date'
            const manifestId = manifest.manifest_number || manifest.id?.slice(0,8)?.toUpperCase() || 'Unknown Manifest'

            return (
              <div
                key={manifest.id || manifest.manifest_number}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all duration-150"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <icons.FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                      {manifestId}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {manifestDate}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {totalDocs} {totalDocs === 1 ? 'document' : 'documents'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {totalQuantity.toLocaleString()} pcs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-5 text-sm">
                  {manifest.driver_name && (
                    <div>
                      <span className="text-gray-500 block">Driver</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.driver_name}</p>
                    </div>
                  )}
                  {manifest.plate_no && (
                    <div>
                      <span className="text-gray-500 block">Plate</span>
                      <p className="font-medium text-gray-900">{manifest.plate_no}</p>
                    </div>
                  )}
                  {manifest.trucker && (
                    <div>
                      <span className="text-gray-500 block">Trucker</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.trucker}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block">Total Qty</span>
                    <p className="font-medium text-gray-900">{totalQuantity.toLocaleString()}</p>
                  </div>
                  {manifest.truck_type && (
                    <div>
                      <span className="text-gray-500 block">Truck Type</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.truck_type}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleViewManifest(manifest)}
                    className="flex-1 min-w-[100px] px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Eye className="w-4 h-4" />
                    View
                  </button>

                  <button
                    onClick={() => handleEditManifest(manifest)}
                    className="flex-1 min-w-[100px] px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Edit className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDownloadManifestPDF(manifest)}
                    className="min-w-[110px] px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                    title="Download PDF"
                  >
                    <icons.Download className="w-4 h-4" />
                    PDF
                  </button>

                  <button
                    onClick={() => handleDownloadManifestExcel(manifest)}
                    className="min-w-[110px] px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                    title="Download Excel"
                  >
                    <icons.FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>

                  <button
                    onClick={() => manifest.id && handleDeleteManifest(manifest.id)}
                    className="px-4 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}