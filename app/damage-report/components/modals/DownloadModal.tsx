import React from 'react';
import { ICONS } from '../../utils/constants';
import { DamageReport } from '../../utils/types';

interface DownloadModalProps {
  report: DamageReport | null;
  downloadType: 'pdf' | 'excel';
  onDownloadTypeChange: (type: 'pdf' | 'excel') => void;
  onClose: () => void;
  onDownload: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  report,
  downloadType,
  onDownloadTypeChange,
  onClose,
  onDownload,
}) => {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Choose Download Format</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ICONS.X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-3 mb-8">
          {/* PDF Option */}
          <button
            onClick={() => onDownloadTypeChange('pdf')}
            className={`w-full flex items-center gap-4 p-4 sm:p-5 border-2 rounded-xl transition-all duration-300 hover:shadow-md ${
              downloadType === 'pdf'
                ? "border-green-500 bg-gradient-to-r from-green-50 to-green-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              downloadType === 'pdf' ? "border-green-600" : "border-gray-300"
            }`}>
              {downloadType === 'pdf' && (
                <div className="w-3.5 h-3.5 rounded-full bg-green-600" />
              )}
            </div>
            <ICONS.FileText className={`w-6 h-6 ${downloadType === 'pdf' ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">PDF Document</p>
              <p className="text-sm text-gray-500 mt-0.5">Print-ready format for signatures</p>
            </div>
          </button>
          
          {/* Excel Option */}
          <button
            onClick={() => onDownloadTypeChange('excel')}
            className={`w-full flex items-center gap-4 p-4 sm:p-5 border-2 rounded-xl transition-all duration-300 hover:shadow-md ${
              downloadType === 'excel'
                ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              downloadType === 'excel' ? "border-blue-600" : "border-gray-300"
            }`}>
              {downloadType === 'excel' && (
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
              )}
            </div>
            <ICONS.FileSpreadsheet className={`w-6 h-6 ${downloadType === 'excel' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left flex-1">
              <p className="font-bold text-gray-800">Excel Spreadsheet</p>
              <p className="text-sm text-gray-500 mt-0.5">Editable spreadsheet format</p>
            </div>
          </button>
        </div>
        
        {/* Report Info Preview */}
        {report && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Selected Report</p>
            <p className="text-xs text-gray-600">
              Report #: {report.report_number || report.id}
            </p>
            <p className="text-xs text-gray-600">
              Date: {new Date(report.report_date).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">
              Items: {report.items?.length || 0} damaged items
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 sm:px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-semibold text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            className="flex-1 px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Download Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;