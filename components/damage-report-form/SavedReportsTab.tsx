'use client'

import { Download, Trash2, Eye, Edit } from 'lucide-react'
import type { DamageReport } from '@/lib/services/damageReportService'

interface SavedReportsTabProps {
  reports: DamageReport[]
  onEdit: (report: DamageReport) => void
  onView: (report: DamageReport) => void
  onDownload: (report: DamageReport) => void
  onDelete: (reportNumber: string) => void
  isLoading: boolean
}

export function SavedReportsTab({
  reports,
  onEdit,
  onView,
  onDownload,
  onDelete,
  isLoading,
}: SavedReportsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading reports...</p>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">No saved reports yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Report #{report.report_number}</h4>
              <p className="text-sm text-gray-600">
                {report.driver_name} • {report.plate_no}
              </p>
              <p className="text-xs text-gray-500 mt-1">{report.report_date}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {report.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {report.items?.length || 0} item{report.items?.length !== 1 ? 's' : ''} damaged
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onView(report)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => onEdit(report)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDownload(report)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => onDelete(report.report_number || '')}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
