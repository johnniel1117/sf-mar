'use client'

import React from 'react'
import { X, FileText, Truck, ClipboardList, Users, Camera, Info } from 'lucide-react'
import type { DamageReport } from '@/lib/services/damageReportService'

interface ViewReportModalProps {
  isOpen: boolean
  report: DamageReport | null
  onClose: () => void
  onEdit: (report: DamageReport) => void
  onDownload: (report: DamageReport) => void
}

export function ViewReportModal({
  isOpen,
  report,
  onClose,
  onEdit,
  onDownload,
}: ViewReportModalProps) {
  if (!isOpen || !report) return null

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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-light tracking-tight text-gray-900">Damage Report</h2>
              <p className="text-sm text-gray-500 mt-1">Report #{report.report_number || report.id}</p>
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
          {/* Report Information */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-orange-600" />
              </div>
              Report Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Report Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {report.report_date ? new Date(report.report_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver Name</p>
                <p className="text-sm font-medium text-gray-900">{report.driver_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plate Number</p>
                <p className="text-sm font-medium text-gray-900">{report.plate_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Seal Number</p>
                <p className="text-sm font-medium text-gray-900">{report.seal_no || 'N/A'}</p>
              </div>
              {report.container_no && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Container Number</p>
                  <p className="text-sm font-medium text-gray-900">{report.container_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Damaged Items */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-orange-600" />
              </div>
              Damaged Items ({(report.items || (report as any).damage_items || []).length})
            </h3>
            <div className="space-y-4">
              {(report.items || (report as any).damage_items || []).map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-150 rounded-xl p-5 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0">
                      {item.item_number || idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-3">{item.material_description || 'Unknown Item'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Material Code</p>
                          <p className="text-sm font-medium text-gray-900">{item.material_code || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serial Number</p>
                          <p className="font-mono text-sm font-medium text-gray-900">{item.barcode || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Damage Type</p>
                          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                            {item.damage_type || 'Not specified'}
                          </span>
                        </div>
                        {item.photo_url && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Photo Evidence</p>
                            <a
                              href={item.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                              View Photo
                            </a>
                          </div>
                        )}
                        {item.damage_description && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Damage Description</p>
                            <p className="text-sm text-gray-700 mt-1 p-3 bg-white rounded border border-gray-200">
                              {item.damage_description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative Findings */}
          {report.narrative_findings && (
            <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-orange-600" />
                </div>
                Narrative Findings
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{report.narrative_findings}</p>
            </div>
          )}

          {/* Personnel */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              Personnel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prepared By</p>
                <p className="font-medium text-gray-900">{report.prepared_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-2">Admin Staff</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Noted By</p>
                <p className="font-medium text-gray-900">{report.noted_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-2">Security Guard</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Acknowledged By</p>
                <p className="font-medium text-gray-900">{report.acknowledged_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-2">Supervisor</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                onEdit(report)
                onClose()
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all hover:shadow-md"
            >
              Edit Report
            </button>
            <button
              onClick={() => {
                onDownload(report)
                onClose()
              }}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-all hover:shadow-md"
            >
              Download Report
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
