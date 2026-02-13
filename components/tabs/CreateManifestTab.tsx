import { 
  Truck, 
  Barcode, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  X, 
  Info, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Search 
} from 'lucide-react'
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
  searchDocument: (documentNumber: string) => Promise<{ shipToName: string; quantity: number } | null>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-slideUp">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-light text-gray-900">Ship-To Name Required</h3>
            <p className="text-sm text-gray-500 mt-1">
              The system couldn't find a ship-to name for this document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50 hover:bg-white transition-colors">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Document Number</p>
              <p className="font-mono text-sm font-medium text-gray-900">{documentNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
              <p className="text-sm font-medium text-blue-600">{quantity}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
            Ship-To Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter ship-to name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Please enter the customer or delivery location name
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!shipToName.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
  searchDocument,
}: CreateManifestTabProps) {
  const [searchResults, setSearchResults] = useState<{ shipToName: string; quantity: number } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)

  useEffect(() => {
    if (!isEditMode && !manifest.manifest_number) {
      generateManifestNumber()
    }
  }, [])

  useEffect(() => {
    if (barcodeInput.trim().length >= 3 && searchDocument) {
      if (searchTimeout) clearTimeout(searchTimeout)

      const timeout = setTimeout(async () => {
        setIsSearching(true)
        try {
          const result = await searchDocument(barcodeInput.trim())
          setSearchResults(result)
        } catch (error) {
          console.error('Error searching document:', error)
          setSearchResults(null)
        } finally {
          setIsSearching(false)
        }
      }, 500)

      setSearchTimeout(timeout)
    } else {
      setSearchResults(null)
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [barcodeInput, searchDocument])

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

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBarcodeInput(e)
      setSearchResults(null)
    }
  }

  // Reusable step header (consistent with CreateReportTab style)
  const StepHeader = ({ icon: Icon, title, description }: {
    icon: typeof Truck
    title: string
    description: string
  }) => (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <h2 className="text-2xl font-light tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border border-gray-200">
        {/* Progress Steps (kept your original style) */}
        <div className="flex items-center justify-between mb-6">
          {[
            { number: 1, title: 'Vehicle & Trip Info', icon: Truck },
            { number: 2, title: 'Scan Documents', icon: Barcode },
            { number: 3, title: 'Review & Finalize', icon: Save },
          ].map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs uppercase tracking-wide ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      Step {step.number}
                    </p>
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-px mx-4 transition-all ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="sm:hidden text-center mb-6">
          <p className="text-sm font-medium text-blue-600">
            {['Vehicle & Trip Info', 'Scan Documents', 'Review & Finalize'][currentStep - 1]}
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <StepHeader
                icon={Truck}
                title="Vehicle & Trip Information"
                description="Enter the truck and trip details"
              />

              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Manifest Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={manifest.manifest_number}
                          onChange={(e) => !isEditMode && setManifest({ ...manifest, manifest_number: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-mono ${
                            !isEditMode ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50'
                          }`}
                          placeholder="TM-YYYYMMDD-XXX"
                          readOnly={isEditMode}
                          required
                        />
                      </div>
                      {!isEditMode && (
                        <button
                          onClick={regenerateManifestNumber}
                          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                          title="Generate new manifest number"
                        >
                          ↻
                        </button>
                      )}
                    </div>
                    {!isEditMode && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Auto-generated format: TM-YYYYMMDD-XXX
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Manifest Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={manifest.manifest_date}
                      onChange={(e) => setManifest({ ...manifest, manifest_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Trucker
                    </label>
                    <input
                      type="text"
                      value={manifest.trucker}
                      onChange={(e) => setManifest({ ...manifest, trucker: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="ACCLI, SF EXPRESS, SUYLI"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Driver Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manifest.driver_name}
                      onChange={(e) => setManifest({ ...manifest, driver_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="Driver's name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Plate No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manifest.plate_no}
                      onChange={(e) => setManifest({ ...manifest, plate_no: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm uppercase"
                      placeholder="e.g., ABC-1234"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                      Truck Type
                    </label>
                    <input
                      type="text"
                      value={manifest.truck_type}
                      onChange={(e) => setManifest({ ...manifest, truck_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      placeholder="E.G., 10W - 6W"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <StepHeader
                icon={Barcode}
                title="Scan Documents"
                description="Scan or type DN/TRA numbers to add documents"
              />

              {/* Rest of step 2 remains mostly the same – only changed focus ring to blue */}
              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  Document Search
                </h3>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="Search DN/TRA number..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm bg-gray-50 hover:bg-white focus:bg-white"
                    disabled={scanningDocument || isSearching}
                    autoFocus
                  />
                  
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                  
                  {!isSearching && barcodeInput.length >= 3 && searchResults && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  
                  {!isSearching && barcodeInput.length >= 3 && !searchResults && !scanningDocument && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                </div>

                {barcodeInput.length >= 3 && barcodeInput.length > 0 && (
                  <div className="mt-3">
                    {isSearching ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-sm text-blue-900">Searching for document...</p>
                      </div>
                    ) : searchResults ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-900">Document Found</p>
                            <p className="text-xs text-green-700 mt-1">
                              Ship-To: {searchResults.shipToName} • Quantity: {searchResults.quantity}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Press Enter to add this document
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-900">Document Not Found</p>
                            <p className="text-xs text-amber-700 mt-1">
                              No document matches "{barcodeInput}"
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Press Enter to manually add this document
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scanningDocument && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm text-blue-900">Processing document...</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Type the DN/TRA number to search. The system will auto-detect the document and display its details. Press Enter to add it to the manifest.</span>
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    Scanned Documents ({manifest.items.length})
                  </h3>
                  {manifest.items.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Total Qty: <span className="font-semibold text-blue-600">{totalQuantity}</span>
                    </div>
                  )}
                </div>

                {manifest.items.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium text-sm">No documents scanned yet</p>
                    <p className="text-gray-500 text-xs mt-1">Search for a document to add it to the manifest</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manifest.items.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg flex items-center justify-center font-medium text-sm flex-shrink-0">
                            {item.item_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 mb-2">{item.ship_to_name}</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">DN/TRA No.</p>
                                <p className="font-mono text-sm font-medium text-gray-900">{item.document_number}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                                <p className="text-sm font-semibold text-blue-600">{item.total_quantity}</p>
                              </div>
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

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <StepHeader
                icon={Save}
                title="Review & Finalize"
                description="Review the manifest details before saving"
              />

              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  Trip Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Manifest No.</p>
                    <p className="font-mono text-sm font-medium text-gray-900">{manifest.manifest_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900">{manifest.manifest_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver</p>
                    <p className="text-sm font-medium text-gray-900">{manifest.driver_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plate No.</p>
                    <p className="text-sm font-medium text-gray-900">{manifest.plate_no || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trucker</p>
                    <p className="text-sm font-medium text-gray-900">{manifest.trucker || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Truck Type</p>
                    <p className="text-sm font-medium text-gray-900">{manifest.truck_type || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    Documents Summary ({totalDocuments})
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total Qty: <span className="font-semibold text-blue-600">{totalQuantity}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">No.</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Ship To Name</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">DN/TRA No.</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wide">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {manifest.items.map((item) => (
                        <tr key={item.item_number} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.item_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.ship_to_name}</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.document_number}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{item.total_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  Remarks (Optional)
                </h3>
                <textarea
                  value={manifest.remarks}
                  onChange={(e) => setManifest({ ...manifest, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Add any additional notes or remarks..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons – updated colors to blue theme */}
        <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => currentStep > 1 && setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              currentStep === 1
                ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) return
                if (currentStep === 2 && !canProceedToStep3()) return
                setCurrentStep((currentStep + 1) as 1 | 2 | 3)
              }}
              disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all"
              >
                Clear
              </button>
              <button
                onClick={saveManifest}
                disabled={isLoading}
                className={`px-6 py-3 text-white rounded-lg font-medium text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : isEditMode ? 'Update Manifest' : 'Save Manifest'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  )
}