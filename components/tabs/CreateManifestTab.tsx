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
  Search,
  Clock
} from 'lucide-react'
import type { TripManifest, ManifestItem } from '@/lib/services/tripManifestService'
import { useEffect, useState, useRef } from 'react'
import React from 'react'

interface CreateManifestTabProps {
  currentStep: 1 | 2 | 3
  setCurrentStep: (step: 1 | 2 | 3) => void
  manifest: TripManifest
  setManifest: (manifest: TripManifest) => void
  barcodeInput: string
  setBarcodeInput: (value: string) => void
  scanningDocument: boolean
  barcodeInputRef: React.RefObject<HTMLInputElement | null>
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
  searchDocument: (documentNumber: string) => Promise<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
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
    if (isOpen) setShipToName('')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ship-To Name Required</h3>
              <p className="text-sm text-gray-500 mt-1">
                The system couldn't find a ship-to name for this document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-700">Document Number</p>
              <p className=" text-sm font-semibold text-gray-900">{documentNumber}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">Quantity</p>
              <p className="text-sm font-semibold text-orange-600">{quantity}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ship-To Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter customer or delivery location name..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
            autoFocus
          />
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
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
  showToast,
}: CreateManifestTabProps) {
  const [searchResults, setSearchResults] = useState<Array<{ documentNumber: string; shipToName: string; quantity: number }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const totalDocuments = manifest.items.length
  const totalQuantity = manifest.items.reduce((sum, item) => sum + item.total_quantity, 0)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isEditMode && !manifest.manifest_number) {
      generateManifestNumber()
    }
  }, [isEditMode, manifest.manifest_number])

  useEffect(() => {
    if (barcodeInput.trim().length >= 1 && searchDocument) {
      if (searchTimeout) clearTimeout(searchTimeout)

      const timeout = setTimeout(async () => {
        setIsSearching(true)
        try {
          const result = await searchDocument(barcodeInput.trim())
          if (isMountedRef.current) {
            // Result already has documentNumber from the API
            setSearchResults(result)
          }
        } catch (error) {
          console.error('Error searching document:', error)
          if (isMountedRef.current) {
            setSearchResults(null)
          }
        } finally {
          if (isMountedRef.current) {
            setIsSearching(false)
            // Maintain focus after search completes
            setTimeout(() => {
              if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
                barcodeInputRef.current.focus()
              }
            }, 0)
          }
        }
      }, 300)

      setSearchTimeout(timeout)
    } else {
      setSearchResults(null)
      setIsSearching(false)
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [barcodeInput])

  // Maintain focus on step 2
  useEffect(() => {
    if (currentStep === 2 && barcodeInputRef.current) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentStep, searchResults, isSearching])



  const generateManifestNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setManifest({ ...manifest, manifest_number: `TM-${year}${month}${day}-${random}` })
  }

  const regenerateManifestNumber = () => {
    if (!isEditMode) generateManifestNumber()
  }

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // If there's exactly one search result, use it automatically
      if (searchResults && searchResults.length === 1) {
        selectDocument(searchResults[0])
        return
      }
      
      handleBarcodeInput(e)
      setSearchResults(null)
      setBarcodeInput('')
      
      // Maintain focus on input using requestAnimationFrame
      requestAnimationFrame(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      })
    } else if (e.key === 'Escape') {
      setSearchResults(null)
      setBarcodeInput('')
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }
  }

  const selectDocument = async (doc: { documentNumber: string; shipToName: string; quantity: number }) => {
    // Check if document already exists
    const exists = manifest.items.some(item => item.document_number === doc.documentNumber)
    
    if (exists) {
      if (showToast) showToast(`Document ${doc.documentNumber} already added`, 'error')
      setSearchResults(null)
      setBarcodeInput('')
      return
    }

    // Check if ship-to name is N/A or empty
    const normalizedShipTo = (doc.shipToName || '').trim().toLowerCase()
    
    if (normalizedShipTo === 'n/a' || normalizedShipTo === 'na' || normalizedShipTo === '') {
      // Show manual entry modal for N/A ship-to names
      setPendingDocument({
        documentNumber: doc.documentNumber,
        quantity: doc.quantity,
      })
      setShowManualEntryModal(true)
      setSearchResults(null)
      setBarcodeInput('')
      
      // Maintain focus after modal closes
      requestAnimationFrame(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      })
      return
    }

    // Add the document directly
    const newItem: ManifestItem = {
      item_number: manifest.items.length + 1,
      document_number: doc.documentNumber,
      ship_to_name: doc.shipToName,
      total_quantity: doc.quantity,
    }
    
    setManifest({
      ...manifest,
      items: [...manifest.items, newItem],
    })
    
    if (showToast) showToast(`Document ${doc.documentNumber} added successfully`, 'success')
    setSearchResults(null)
    setBarcodeInput('')
    
    // Maintain focus using requestAnimationFrame
    requestAnimationFrame(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    })
  }

  const getDuration = () => {
    if (!manifest.time_start || !manifest.time_end) return null

    const [h1, m1] = manifest.time_start.split(':').map(Number)
    const [h2, m2] = manifest.time_end.split(':').map(Number)

    let minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (minutes < 0) minutes += 24 * 60

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return `${hours}h ${mins.toString().padStart(2, '0')}m`
  }

  const StepHeader = ({ icon: Icon, title, description }: {
    icon: typeof Truck
    title: string
    description: string
  }) => (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-500">{description}</p>
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

        <div className="flex items-center justify-between gap-2 mb-8">
          {[
            { number: 1, title: 'Vehicle & Trip Info', icon: Truck },
            { number: 2, title: 'Scan Documents', icon: Barcode },
            { number: 3, title: 'Review & Finalize', icon: Save },
          ].map((step, index) => {
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            const Icon = step.icon

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isActive
                        ? 'bg-orange-600 text-white scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-semibold mt-2 text-center ${
                      isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>

                {index < 2 && (
                  <div className="flex items-center" style={{ marginTop: '-28px', flex: '0 0 auto', width: '60px' }}>
                    <div
                      className={`h-1 w-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div className="mt-8 space-y-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <StepHeader
                icon={Truck}
                title="Vehicle & Trip Information"
                description="Enter the truck, driver, and trip timing details"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manifest Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manifest.manifest_number}
                      onChange={(e) => !isEditMode && setManifest({ ...manifest, manifest_number: e.target.value.toUpperCase() })}
                      className={`flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm  ${
                        isEditMode ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                      }`}
                      placeholder="TM-YYYYMMDD-XXX"
                      readOnly={isEditMode}
                      required
                    />
                    {!isEditMode && (
                      <button
                        onClick={regenerateManifestNumber}
                        className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Regenerate"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manifest Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={manifest.manifest_date}
                    onChange={(e) => setManifest({ ...manifest, manifest_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Start <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={manifest.time_start || ''}
                      onChange={(e) => setManifest({ ...manifest, time_start: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time End
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={manifest.time_end || ''}
                      onChange={(e) => setManifest({ ...manifest, time_end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trucker <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.trucker}
                    onChange={(e) => setManifest({ ...manifest, trucker: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="ACCLI, SF EXPRESS, SUYLI"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.driver_name}
                    onChange={(e) => setManifest({ ...manifest, driver_name: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="Driver's name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plate No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.plate_no}
                    onChange={(e) => setManifest({ ...manifest, plate_no: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm uppercase"
                    placeholder="e.g., ABC-1234"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Truck Type</label>
                  <input
                    type="text"
                    value={manifest.truck_type}
                    onChange={(e) => setManifest({ ...manifest, truck_type: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                    placeholder="E.G., 10W - 6W"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <StepHeader
                icon={Barcode}
                title="Scan Documents"
                description="Scan or manually enter DN/TRA numbers"
              />

              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 sm:p-6 text-white">
                <label className="block text-base font-semibold mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Document Search
                </label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Enter DN / TRA number and press Enter..."
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                  disabled={scanningDocument}
                  inputMode="search"
                  autoFocus
                  autoComplete="off"
                />

                {isSearching && barcodeInput.trim().length >= 1 && (
                  <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg flex items-center gap-2 text-sm">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Searching...
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectDocument(result)}
                        type="button"
                        className="w-full p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg flex items-start gap-2 text-left transition-all shadow-sm hover:shadow-md"
                      >
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 ">
                            {result.documentNumber}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {result.shipToName} • Qty: {result.quantity}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && barcodeInput.trim().length >= 1 && searchResults && searchResults.length === 0 && (
                  <div className="mt-3 p-3 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Not Found</p>
                      <p className="text-sm mt-1">
                        Press Enter to add "{barcodeInput}" manually
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    Scanned Documents ({totalDocuments})
                  </span>
                  {totalQuantity > 0 && (
                    <span className="text-sm text-gray-600">
                      Total Qty: <span className="font-bold text-orange-600">{totalQuantity}</span>
                    </span>
                  )}
                </h3>

                {manifest.items.length === 0 ? (
                  <div className="py-10 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No documents added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start scanning above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manifest.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                            {item.item_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{item.ship_to_name}</h4>
                            <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-gray-600">DN/TRA No.</p>
                                <p className=" font-medium text-gray-900">{item.document_number}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Quantity</p>
                                <p className="font-bold text-orange-600">{item.total_quantity}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <StepHeader
                icon={Save}
                title="Review & Finalize"
                description="Check all details before saving"
              />

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  Trip Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Manifest No.</p>
                    <p className=" font-semibold text-gray-900">{manifest.manifest_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{manifest.manifest_date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Time Start</p>
                    <p className="font-semibold text-gray-900">{manifest.time_start || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Time End</p>
                    <p className="font-semibold text-gray-900">{manifest.time_end || '—'}</p>
                  </div>
                  {manifest.time_start && manifest.time_end && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-600">Duration</p>
                      <p className="font-semibold text-emerald-600">{getDuration()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-600">Driver</p>
                    <p className="font-semibold text-gray-900">{manifest.driver_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Plate No.</p>
                    <p className=" font-semibold text-gray-900">{manifest.plate_no || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Trucker</p>
                    <p className="font-semibold text-gray-900">{manifest.trucker || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Truck Type</p>
                    <p className="font-semibold text-gray-900">{manifest.truck_type || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    Documents Summary ({totalDocuments})
                  </h3>
                  <span className="text-sm text-gray-600">
                    Total Qty: <span className="font-bold text-orange-600">{totalQuantity}</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="py-3 text-left text-sm font-medium text-gray-700">No.</th>
                        <th className="py-3 text-left text-sm font-medium text-gray-700">Ship To</th>
                        <th className="py-3 text-left text-sm font-medium text-gray-700">DN/TRA No.</th>
                        <th className="py-3 text-right text-sm font-medium text-gray-700">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manifest.items.map((item) => (
                        <tr key={item.item_number} className="border-b border-gray-200 hover:bg-orange-50/50">
                          <td className="py-3 text-sm font-medium text-gray-900">{item.item_number}</td>
                          <td className="py-3 text-sm text-gray-900">{item.ship_to_name}</td>
                          <td className="py-3 text-sm  text-gray-900">{item.document_number}</td>
                          <td className="py-3 text-right font-bold text-orange-600">{item.total_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-10 pt-6 border-t-2 border-gray-200">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1 as any)}
            disabled={currentStep === 1}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) return
                if (currentStep === 2 && !canProceedToStep3()) return
                setCurrentStep(currentStep + 1 as any)
              }}
              disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-lg"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                <X className="w-5 h-5" />
                Clear
              </button>
              <button
                onClick={saveManifest}
                disabled={isLoading}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition-all shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Saving...' : isEditMode ? 'Update Manifest' : 'Save Manifest'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}