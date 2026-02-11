import React from 'react';
import { ICONS } from '../../utils/constants';
import { DamageReport } from '../../utils/types';

interface Step1TruckInfoProps {
  report: DamageReport;
  updateReport: (field: string, value: any) => void;
}

const Step1TruckInfo: React.FC<Step1TruckInfoProps> = ({ report, updateReport }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ICONS.Truck className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vehicle & Shipment Information</h2>
          <p className="text-xs sm:text-sm text-gray-500">Enter the truck and delivery details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Report Date
          </label>
          <input
            type="date"
            value={report.report_date}
            onChange={(e) => updateReport('report_date', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Driver Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={report.driver_name}
            onChange={(e) => updateReport('driver_name', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            placeholder="Driver's name"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Plate No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={report.plate_no}
            onChange={(e) => updateReport('plate_no', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            placeholder="Plate number"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Seal No.
          </label>
          <input
            type="text"
            value={report.seal_no}
            onChange={(e) => updateReport('seal_no', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            placeholder="Seal number"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Container No.
          </label>
          <input
            type="text"
            value={report.container_no}
            onChange={(e) => updateReport('container_no', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            placeholder="Container number"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1TruckInfo;