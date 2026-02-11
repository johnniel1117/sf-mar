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
    <div 
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
            <p className="text-gray-500 text-sm mt-1">
              #{report.report_number || report.id} • {report.report_date ? new Date(report.report_date).toLocaleDateString() : 'No date'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ICONS.X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</p>
              <p className="font-medium text-gray-900 mt-1 truncate">{report.driver_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plate No.</p>
              <p className="font-medium text-gray-900 mt-1">{report.plate_no || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Items</p>
              <p className="font-medium text-gray-900 mt-1">{reportItems.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
              <p className="font-medium text-gray-900 mt-1 capitalize">{report.status || 'N/A'}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.seal_no && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Seal Number</p>
                <p className="text-gray-900">{report.seal_no}</p>
              </div>
            )}
            {report.container_no && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Container Number</p>
                <p className="text-gray-900">{report.container_no}</p>
              </div>
            )}
          </div>

          {/* Damaged Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Damaged Items</h3>
              <span className="text-sm text-gray-500">{reportItems.length} items</span>
            </div>
            <div className="space-y-3">
              {reportItems.map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0">
                      {item.item_number || idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {item.material_description || 'Unknown Item'}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">Code: {item.material_code || 'N/A'}</p>
                        </div>
                        {item.damage_type && (
                          <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium self-start">
                            {item.damage_type}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-gray-600">Serial Number</p>
                          <p className="font-mono text-gray-900">{item.barcode || 'N/A'}</p>
                        </div>
                        
                        {item.damage_description && (
                          <div>
                            <p className="text-gray-600">Description</p>
                            <p className="text-gray-700 mt-1">{item.damage_description}</p>
                          </div>
                        )}
                        
                        {item.photo_url && (
                          <div>
                            <p className="text-gray-600">Photo Evidence</p>
                            <a
                              href={item.photo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <ICONS.Camera className="w-4 h-4" />
                              View Photo
                            </a>
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Narrative</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{report.narrative_findings}</p>
              </div>
            </div>
          )}

          {/* Personnel */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Personnel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prepared By</p>
                <p className="font-medium text-gray-900 mt-1">{report.prepared_by || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Noted By</p>
                <p className="font-medium text-gray-900 mt-1">{report.noted_by || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Acknowledged By</p>
                <p className="font-medium text-gray-900 mt-1">{report.acknowledged_by || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDownload}
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors sm:hidden"
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