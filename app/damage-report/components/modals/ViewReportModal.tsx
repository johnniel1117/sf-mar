import React from 'react';
import { ICONS } from '../../utils/constants';
import { DamageReport } from '../../utils/types';

interface ViewReportModalProps {
  report: DamageReport;
  onClose: () => void;
  onEdit: () => void;
  onDownload: () => void;
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({
  report,
  onClose,
  onEdit,
  onDownload,
}) => {
  const reportItems = report.items || (report as any).damage_items || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ICONS.FileText className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-semibold">Damage Report Details</h2>
              <p className="text-orange-100 text-sm">
                Report #{report.report_number || report.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-700 rounded"
          >
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {/* Report Information */}
          <div className="border rounded p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ICONS.Truck className="w-5 h-5 text-orange-600" />
              Report Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Report Date</p>
                <p className="font-medium">
                  {report.report_date ? new Date(report.report_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Driver Name</p>
                <p className="font-medium">{report.driver_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plate Number</p>
                <p className="font-medium">{report.plate_no || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seal Number</p>
                <p className="font-medium">{report.seal_no || 'N/A'}</p>
              </div>
              {report.container_no && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600">Container Number</p>
                  <p className="font-medium">{report.container_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Damaged Items */}
          <div className="border rounded p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ICONS.ClipboardList className="w-5 h-5 text-orange-600" />
              Damaged Items ({reportItems.length})
            </h3>
            <div className="space-y-3">
              {reportItems.map((item: any, idx: number) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded flex items-center justify-center font-medium text-sm">
                      {item.item_number || idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {item.material_description || 'Unknown Item'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Material Code</p>
                          <p className="font-medium">{item.material_code || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Serial Number</p>
                          <p className="font-mono font-medium">{item.barcode || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Damage Type</p>
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            {item.damage_type || 'Not specified'}
                          </span>
                        </div>
                        {item.photo_url && (
                          <div>
                            <p className="text-gray-600">Photo Evidence</p>
                            <a
                              href={item.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              <ICONS.Camera className="w-4 h-4" />
                              View Photo
                            </a>
                          </div>
                        )}
                        {item.damage_description && (
                          <div className="sm:col-span-2">
                            <p className="text-gray-600">Damage Description</p>
                            <p className="text-gray-700 mt-1 p-2 bg-gray-50 rounded">
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
            <div className="border rounded p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ICONS.Info className="w-5 h-5 text-orange-600" />
                Narrative Findings
              </h3>
              <p className="text-gray-700 p-3 bg-gray-50 rounded">
                {report.narrative_findings}
              </p>
            </div>
          )}

          {/* Personnel */}
          <div className="border rounded p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ICONS.Users className="w-5 h-5 text-orange-600" />
              Personnel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border rounded p-3">
                <p className="text-sm text-gray-600">Prepared By</p>
                <p className="font-medium">{report.prepared_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">Admin Staff</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-sm text-gray-600">Noted By</p>
                <p className="font-medium">{report.noted_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">Security Guard</p>
              </div>
              <div className="border rounded p-3">
                <p className="text-sm text-gray-600">Acknowledged By</p>
                <p className="font-medium">{report.acknowledged_by || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">Supervisor</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Edit Report
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Download Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-50 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReportModal;