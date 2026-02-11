'use client'

import { X } from 'lucide-react'
import type { DamageReport } from '@/lib/services/damageReportService'

interface ViewReportModalProps {
  show: boolean
  report: DamageReport | null
  onClose: () => void
}

export function ViewReportModal({ show, report, onClose }: ViewReportModalProps) {
  if (!show || !report) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Report #{report.report_number}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Report Date</p>
                <p className="font-medium">{report.report_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seal Number</p>
                <p className="font-medium">{report.seal_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Driver Name</p>
                <p className="font-medium">{report.driver_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plate Number</p>
                <p className="font-medium">{report.plate_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Container Number</p>
                <p className="font-medium">{report.container_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{report.status}</p>
              </div>
            </div>
          </div>

          {/* Personnel */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Personnel</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Prepared By</p>
                <p className="font-medium">{report.prepared_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Noted By</p>
                <p className="font-medium">{report.noted_by || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Acknowledged By</p>
                <p className="font-medium">{report.acknowledged_by || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Narrative */}
          {report.narrative_findings && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Narrative Findings</h4>
              <p className="text-gray-700">{report.narrative_findings}</p>
            </div>
          )}

          {/* Actions Required */}
          {report.actions_required && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Actions Required</h4>
              <p className="text-gray-700">{report.actions_required}</p>
            </div>
          )}

          {/* Items */}
          {report.items && report.items.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Damaged Items ({report.items.length})</h4>
              <div className="space-y-3">
                {report.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Item #{item.item_number}</p>
                        <p className="font-medium">{item.material_description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Barcode</p>
                        <p className="font-mono text-sm">{item.barcode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Damage Type</p>
                        <p className="font-medium">{item.damage_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Damage Description</p>
                        <p className="text-sm">{item.damage_description || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-900 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
