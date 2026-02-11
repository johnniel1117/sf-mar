import React from 'react';
import { ICONS } from '../../utils/constants';
import { DamageReport, PersonnelData, SelectedPersonnel } from '../../utils/types';

interface Step4ReviewFinalizeProps {
  report: DamageReport;
  personnelData: PersonnelData;
  selectedPersonnel: SelectedPersonnel;
  onPersonnelChange: (role: keyof SelectedPersonnel, value: string) => void;
  updateReport: (field: string, value: any) => void;
}

const Step4ReviewFinalize: React.FC<Step4ReviewFinalizeProps> = ({
  report,
  personnelData,
  selectedPersonnel,
  onPersonnelChange,
  updateReport,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ICONS.Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Review & Finalize</h2>
          <p className="text-xs sm:text-sm text-gray-500">Add final notes and signatures</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Personnel Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Admin Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Prepared By (Admin) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPersonnel.admin}
              onChange={(e) => onPersonnelChange('admin', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Admin</option>
              {personnelData.admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
            {selectedPersonnel.admin && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Selected: {personnelData.admins.find(a => a.id === selectedPersonnel.admin)?.name}
              </p>
            )}
          </div>

          {/* Guard Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Noted By (Guard) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPersonnel.guard}
              onChange={(e) => onPersonnelChange('guard', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Guard</option>
              {personnelData.guards.map((guard) => (
                <option key={guard.id} value={guard.id}>
                  {guard.name}
                </option>
              ))}
            </select>
            {selectedPersonnel.guard && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Selected: {personnelData.guards.find(g => g.id === selectedPersonnel.guard)?.name}
              </p>
            )}
          </div>

          {/* Supervisor Dropdown */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Acknowledged By (Supervisor) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPersonnel.supervisor}
              onChange={(e) => onPersonnelChange('supervisor', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">Select Supervisor</option>
              {personnelData.supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </select>
            {selectedPersonnel.supervisor && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Selected: {personnelData.supervisors.find(s => s.id === selectedPersonnel.supervisor)?.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Narrative Findings
          </label>
          <textarea
            value={report.narrative_findings}
            onChange={(e) => updateReport('narrative_findings', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="Describe what happened and what was found..."
            rows={3}
          />
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
          <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Report Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-gray-600 font-medium">Driver:</span>
              <span className="font-semibold text-gray-900">{report.driver_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-gray-600 font-medium">Plate No:</span>
              <span className="font-semibold text-gray-900">{report.plate_no || 'N/A'}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-gray-600 font-medium">Prepared By:</span>
              <span className="font-semibold text-gray-900">
                {report.prepared_by || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-1">
              <span className="text-gray-600 font-medium">Total Items:</span>
              <span className="font-semibold text-gray-900">{report.items?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4ReviewFinalize;