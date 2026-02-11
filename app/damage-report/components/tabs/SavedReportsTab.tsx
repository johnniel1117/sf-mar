'use client'

import React from 'react';
import { useDamageReportForm } from '../../hooks/useDamageReportForm';
import { ICONS } from '../../utils/constants';

const SavedReportsTab: React.FC = () => {
  const {
    savedReports,
    handleViewReport,
    handleEditReport,
    handleOpenDownloadModal,
    handleDeleteReport,
  } = useDamageReportForm();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <ICONS.Download className="w-5 h-5" />
            Saved Reports
          </h3>
          <p className="text-sm text-gray-600">View and download your saved damage reports</p>
        </div>
      </div>

      {savedReports.length === 0 ? (
        <div className="py-8 sm:py-12 text-center">
          <ICONS.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 font-medium text-base sm:text-lg">No reports saved yet</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Create your first damage report to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedReports.map((savedReport) => {
            const reportItems = savedReport.items || ((savedReport as any).damage_items || []);
            const totalItems = reportItems.length;
            const reportDate = savedReport.report_date ? new Date(savedReport.report_date).toLocaleDateString() : 'No date';
            const reportId = savedReport.report_number || savedReport.id || 'Unknown Report';
            
            return (
              <div
                key={savedReport.id}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ICONS.FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                      {reportId}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {reportDate}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                  {savedReport.driver_name && (
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <p className="font-medium text-gray-900 truncate">{savedReport.driver_name}</p>
                    </div>
                  )}
                  {savedReport.plate_no && (
                    <div>
                      <span className="text-gray-500">Plate:</span>
                      <p className="font-medium text-gray-900 truncate">{savedReport.plate_no}</p>
                    </div>
                  )}
                  {savedReport.prepared_by && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-gray-500">Prepared by:</span>
                      <p className="font-medium text-gray-900 truncate">{savedReport.prepared_by}</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleViewReport(savedReport as any)} // Type assertion
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ICONS.Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditReport(savedReport as any)} // Type assertion
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ICONS.Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenDownloadModal(savedReport as any)} // Type assertion
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 border border-gray-300 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ICONS.Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDeleteReport(savedReport.report_number || savedReport.id || '')}
                    className="px-4 py-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ICONS.Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedReportsTab;