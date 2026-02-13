import { Truck, Barcode, Save, ChevronRight, ChevronLeft, Trash2, X, Info, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'
import { useEffect, useState } from 'react'

interface CreateManifestTabProps {
  currentStep: 1 | 2 | 3
  setCurrentStep: (step: 1 | 2 | 3) => void
  manifest: TripManifest
  setManifest: (manifest: TripManifest) => void
  barcodeInput: string
  setBarcodeInput: (value: string) => void
  scanningDocument: boolean
  barcodeInputRef: React.RefObject<HTMLInputElement>
  isLoading: boolean
  isEditMode: boolean
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => void
  removeItem: (index: number) => void
  canProceedToStep2: () => boolean
  canProceedToStep3: () => boolean
  resetForm: () => void
  saveManifest: () => void
  showManualEntryModal: boolean
  setShowManualEntryModal: (show: boolean) => void
  pendingDocument: { documentNumber: string; quantity: number } | null
  setPendingDocument: (doc: { documentNumber: string; quantity: number } | null) => void
  addDocumentWithManualShipTo: (shipToName: string) => void
}

interface ManualEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shipToName: string) => void
  documentNumber: string
  quantity: number
}

function ManualEntryModal({ isOpen, onClose, onSave, documentNumber, quantity }: ManualEntryModalProps) {
  const [shipToName, setShipToName] = useState('')

  useEffect(() => {
    if (isOpen) {
      setShipToName('')
    }
  }, [isOpen])

  const handleSave = () => {
    if (shipToName.trim()) {
      onSave(shipToName.trim())
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Ship-To Name Required</h3>
            <p className="text-sm text-gray-500 mt-1">
              The system couldn't find a ship-to name for this document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Document Number:</span>
            <span className="font-mono font-semibold text-gray-900">{documentNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-semibold text-blue-600">{quantity}</span>
          </div>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ship-To Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter ship-to name..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Please enter the customer or delivery location name
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!shipToName.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Add
          </button>
        </div>
      </div>
    </div>
  )
}

export function CreateManifestTab({
  currentStep,
  setCurrentStep,
  manifest,
  setManifest,
  barcodeInput,
  setBarcodeInput,
  scanningDocument,
  barcodeInputRef,
  isLoading,
  isEditMode,
  handleBarcodeInput,
  removeItem,
  canProceedToStep2,
  canProceedToStep3,
  resetForm,
  saveManifest,
  showManualEntryModal,
  setShowManualEntryModal,
  pendingDocument,
  setPendingDocument,
  addDocumentWithManualShipTo,
}: CreateManifestTabProps) {
  // Calculate totals
  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)

  // Auto-generate manifest number on component mount (for new manifests only)
  useEffect(() => {
    if (!isEditMode && !manifest.manifest_number) {
      generateManifestNumber()
    }
  }, [])

  const generateManifestNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const manifestNumber = `TM-${year}${month}${day}-${random}`
    
    setManifest({ ...manifest, manifest_number: manifestNumber })
  }

  const regenerateManifestNumber = () => {
    if (!isEditMode) {
      generateManifestNumber()
    }
  }

  // Step configuration
  const steps = [
    { number: 1, title: 'Truck Info', icon: Truck },
    { number: 2, title: 'Scan Documents', icon: Barcode },
    { number: 3, title: 'Review', icon: Save },
  ]

  return (
    <div className="space-y-6">
      {/* Manual Entry Modal */}
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => {
          setShowManualEntryModal(false)
          setPendingDocument(null)
        }}
        onSave={addDocumentWithManualShipTo}
        documentNumber={pendingDocument?.documentNumber || ''}
        quantity={pendingDocument?.quantity || 0}
      />

      {/* Progress Steps - Matching Damage Report Style */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      Step {step.number}
                    </p>
                    <p className={`text-sm font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded transition-all ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Mobile step title */}
        <div className="sm:hidden text-center mt-3">
          <p className="text-sm font-bold text-blue-600">{steps[currentStep - 1].title}</p>
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {/* Step 1: Truck Information */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vehicle & Trip Information</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Enter the truck and trip details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Manifest Number - Auto-generated */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Manifest Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={manifest.manifest_number}
                        onChange={(e) => !isEditMode && setManifest({ ...manifest, manifest_number: e.target.value })}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-mono ${
                          !isEditMode ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="TM-YYYYMMDD-XXX"
                        readOnly={isEditMode}
                        required
                      />
                      {!isEditMode && manifest.manifest_number && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    {!isEditMode && (
                      <button
                        onClick={regenerateManifestNumber}
                        type="button"
                        className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border-2 border-gray-300 text-sm font-medium"
                        title="Generate new manifest number"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                  {!isEditMode && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <Info className="w-3 h-3 flex-shrink-0" />
                      <span>Auto-generated format: TM-YYYYMMDD-XXX</span>
                    </div>
                  )}
                </div>

                {/* Manifest Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Manifest Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={manifest.manifest_date}
                    onChange={(e) => setManifest({ ...manifest, manifest_date: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>

                {/* Trucker */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Trucker
                  </label>
                  <input
                    type="text"
                    value={manifest.trucker}
                    onChange={(e) => setManifest({ ...manifest, trucker: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="ACCLI, SF EXPRESS, SUYLI"
                  />
                </div>

                {/* Driver Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Driver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.driver_name}
                    onChange={(e) => setManifest({ ...manifest, driver_name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="Driver's name"
                    required
                  />
                </div>

                {/* Plate Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Plate No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.plate_no}
                    onChange={(e) => setManifest({ ...manifest, plate_no: e.target.value.toUpperCase() })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm uppercase"
                    placeholder="e.g., ABC-1234"
                    required
                  />
                </div>

                {/* Truck Type */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Truck Type
                  </label>
                  <input
                    type="text"
                    value={manifest.truck_type}
                    onChange={(e) => setManifest({ ...manifest, truck_type: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    placeholder="E.G., 10W - 6W"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Scan Documents */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Scan Documents</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Scan DN/TRA barcodes to add documents</p>
                </div>
              </div>

              {/* Barcode Scanner */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                <label className="block text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Barcode className="w-5 h-5" />
                  Scan Barcode
                </label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  placeholder="Scan or type DN/TRA number and press Enter..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={scanningDocument}
                  autoFocus
                />
                {scanningDocument && (
                  <div className="mt-3 p-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <p className="font-medium text-sm">Looking up document...</p>
                  </div>
                )}
                <div className="mt-3 p-3 bg-blue-500 bg-opacity-20 border border-blue-300 rounded-lg flex items-start gap-2">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    Scan the DN/TRA barcode or manually enter the document number. The system will automatically 
                    retrieve the ship-to name and quantity.
                  </p>
                </div>
              </div>

              {/* Documents List */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Scanned Documents ({manifest.items.length})
                  </h3>
                  {manifest.items.length > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Total Qty: <span className="font-bold text-blue-600">{totalQuantity}</span>
                      </span>
                    </div>
                  )}
                </div>

                {manifest.items.length === 0 ? (
                  <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">No documents scanned yet</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Scan a barcode to add documents</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {manifest.items.map((item, idx) => (
                      <div key={idx} className="p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                            {item.item_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.ship_to_name}</p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">DN/TRA:</span> <span className="font-mono">{item.document_number}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Quantity:</span> <span className="font-bold text-blue-600">{item.total_quantity}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Save className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Review & Finalize</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Review the manifest details before saving</p>
                </div>
              </div>

              {/* Trip Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Trip Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Manifest No.:</span>
                    <span className="font-semibold text-gray-900 font-mono">{manifest.manifest_number}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Date:</span>
                    <span className="font-semibold text-gray-900">{manifest.manifest_date}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Driver:</span>
                    <span className="font-semibold text-gray-900">{manifest.driver_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Plate No.:</span>
                    <span className="font-semibold text-gray-900">{manifest.plate_no || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Trucker:</span>
                    <span className="font-semibold text-gray-900">{manifest.trucker || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:gap-1">
                    <span className="text-gray-600 font-medium">Truck Type:</span>
                    <span className="font-semibold text-gray-900">{manifest.truck_type || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Documents Summary */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Documents Summary
                  </h3>
                  <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <span className="text-gray-600">
                      Total Docs: <span className="font-bold text-blue-600">{totalDocuments}</span>
                    </span>
                    <span className="text-gray-600">
                      Total Qty: <span className="font-bold text-blue-600">{totalQuantity}</span>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">No.</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Ship To Name</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">DN/TRA No.</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {manifest.items.map((item) => (
                          <tr key={item.item_number} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium">{item.item_number}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{item.ship_to_name}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-gray-900">{item.document_number}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-semibold text-blue-600">{item.total_quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={manifest.remarks}
                  onChange={(e) => setManifest({ ...manifest, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Add any additional notes or remarks..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-gray-200">
          <button
            onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
            disabled={currentStep === 1}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) {
                  return
                }
                if (currentStep === 2 && !canProceedToStep3()) {
                  return
                }
                setCurrentStep((currentStep + 1) as 1 | 2 | 3)
              }}
              disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                Clear
              </button>
              <button
                onClick={saveManifest}
                disabled={isLoading}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                {isLoading ? 'Saving...' : isEditMode ? 'Update Manifest' : 'Save Manifest'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}