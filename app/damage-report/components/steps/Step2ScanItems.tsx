import React, { useRef } from 'react';
import { useDamageReportForm } from '../../hooks/useDamageReportForm';
import { ICONS } from '../../utils/constants';

const Step2ScanItems: React.FC = () => {
  const {
    report,
    barcodeInput,
    setBarcodeInput,
    materialLookup,
    editingItemIndex,
    editingItemBarcode,
    setEditingItemBarcode,
    handleBarcodeInput,
    addItem,
    updateItem,
    removeItem,
    handleEditItemBarcode,
    handleSaveEditedBarcode,
    handleCancelEditBarcode,
  } = useDamageReportForm();

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ICONS.Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Scan Damaged Items</h2>
          <p className="text-xs sm:text-sm text-gray-500">Scan barcodes to add items to the report</p>
        </div>
      </div>

      {/* Barcode Scanner */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 sm:p-6 text-white">
        <label className="block text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
          <ICONS.Barcode className="w-5 h-5" />
          Scan Barcode
        </label>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleBarcodeInput}
          placeholder="Scan or type barcode and press Enter..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300"
          autoFocus
        />
        {materialLookup?.material_description && (
          <div className="mt-3 p-3 bg-green-500 bg-opacity-20 border border-green-300 rounded-lg flex items-start gap-2">
            <ICONS.CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium text-sm break-words">
              Found: {materialLookup.material_description} ({materialLookup.category})
            </p>
          </div>
        )}
      </div>

      {/* Items List with Barcode Editing */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Scanned Items ({report.items.length})
          </h3>
        </div>

        {report.items.length === 0 ? (
          <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ICONS.AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium text-sm sm:text-base">No items scanned yet</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Scan a barcode to add items</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {report.items.map((item, idx) => (
              <div key={idx} className="p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                    {item.item_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.material_description || 'Unknown Item'}</p>
                    <p className="text-xs text-gray-500 truncate">Code: {item.material_code || 'N/A'}</p>
                    
                    {/* Barcode Display/Edit */}
                    {editingItemIndex === idx ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={editingItemBarcode}
                          onChange={(e) => setEditingItemBarcode(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg text-sm font-mono"
                          placeholder="Enter new barcode..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditedBarcode(idx)}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                          >
                            <ICONS.Save className="w-3 h-3 inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditBarcode}
                            className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500 transition-colors"
                          >
                            <ICONS.X className="w-3 h-3 inline mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600">Barcode:</span>
                        <span className="font-mono text-xs font-semibold break-all">{item.barcode}</span>
                        <button
                          onClick={() => handleEditItemBarcode(idx)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit barcode"
                        >
                          <ICONS.Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <ICONS.Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2ScanItems;