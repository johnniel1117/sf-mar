import React from 'react';
import { useDamageReportForm } from '../../hooks/useDamageReportForm';
import { ICONS, DAMAGE_TYPES } from '../../utils/constants';

const Step3DamageDetails: React.FC = () => {
  const {
    report,
    updateItem,
    handlePhotoUpload,
    uploadingItemIndex,
  } = useDamageReportForm();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ICONS.ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Damage Details</h2>
          <p className="text-xs sm:text-sm text-gray-500">Provide information for each damaged item</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
        {report.items.map((item, idx) => (
          <div key={idx} className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                {item.item_number}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {item.material_description || 'Item Details'}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Scanned Serial Number</p>
                    <p className="text-sm font-bold text-gray-900 break-all">
                      {item.barcode || 'No barcode scanned'}
                    </p>
                  </div>
                  <ICONS.Barcode className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Damage Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={item.damage_type}
                  onChange={(e) => updateItem(idx, 'damage_type', e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  {DAMAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Damage Description
                </label>
                <textarea
                  value={item.damage_description}
                  onChange={(e) => updateItem(idx, 'damage_description', e.target.value)}
                  placeholder="Describe the damage..."
                  rows={2}
                  className="w-full px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <ICONS.Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  Photo Evidence
                </label>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoUpload(idx, e.target.files[0]);
                      }
                    }}
                    disabled={uploadingItemIndex === idx}
                    className="flex-1 px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-2 sm:file:px-3 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  {item.photo_url && (
                    <a
                      href={item.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-3 py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-700 transition-colors text-center"
                    >
                      View
                    </a>
                  )}
                </div>
                {uploadingItemIndex === idx && (
                  <p className="text-xs text-orange-600 mt-2 font-medium">Uploading...</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step3DamageDetails;