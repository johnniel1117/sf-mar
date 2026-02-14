'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Eye, Download, Edit, Trash2, Truck, Package, Calendar, FileText, ChevronDown, Search, X } from 'lucide-react'
import type { TripManifest } from '@/lib/services/tripManifestService'

const icons = {
  Eye,
  Download,
  Edit,
  Trash2,
  Truck,
  Package,
  Calendar,
  FileText,
  Search,
  X,
  ChevronDown,
} as const

type FilterDropdownProps = {
  selectedMonth: string
  onMonthChange: (month: string) => void
  months: string[]
}

function FilterDropdown({ selectedMonth, onMonthChange, months }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <icons.Calendar className="w-4 h-4" />
        {selectedMonth}
        <icons.ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => {
                onMonthChange(month)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface SavedManifestsTabProps {
  savedManifests: TripManifest[]
  handleViewManifest: (manifest: TripManifest) => void
  handleEditManifest: (manifest: TripManifest) => void
  handleDownloadManifest: (manifest: TripManifest) => void
  handleDeleteManifest: (manifestId: string) => void
}

const MONTHS = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function SavedManifestsTab({
  savedManifests,
  handleViewManifest,
  handleEditManifest,
  handleDownloadManifest,
  handleDeleteManifest,
}: SavedManifestsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('All Months')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Sort manifests by creation date (newest first)
  const sortedManifests = useMemo(() => {
    return [...savedManifests].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (a.manifest_date && b.manifest_date) {
        return new Date(b.manifest_date).getTime() - new Date(a.manifest_date).getTime()
      }
      if (a.id && b.id) {
        return b.id.localeCompare(a.id)
      }
      return 0
    })
  }, [savedManifests])

  // Filter and search manifests
  const filteredManifests = useMemo(() => {
    return sortedManifests.filter((manifest) => {
      const manifestId = manifest.manifest_number || manifest.id || ''
      const driverName = manifest.driver_name || ''
      const plateNo = manifest.plate_no || ''
      const trucker = manifest.trucker || ''

      const matchesSearch =
        manifestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plateNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trucker.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (selectedMonth === 'All Months') return true

      const manifestDate = manifest.manifest_date || manifest.created_at
      if (!manifestDate) return false

      const date = new Date(manifestDate)
      const monthIndex = date.getMonth()
      return MONTHS[monthIndex + 1] === selectedMonth
    })
  }, [sortedManifests, searchQuery, selectedMonth])

  // Pagination
  const totalPages = Math.ceil(filteredManifests.length / itemsPerPage)
  const paginatedManifests = filteredManifests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleExportAll = () => {
    const csvContent = [
      ['Manifest #', 'Date', 'Driver', 'Plate No', 'Trucker', 'Truck Type', 'Total Qty', 'Documents'],
      ...filteredManifests.map((m) => {
        const totalQuantity = m.items?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
        const totalDocs = m.items?.length || 0
        const manifestDate = m.manifest_date
          ? new Date(m.manifest_date).toLocaleDateString()
          : 'No date'
        return [
          m.manifest_number || m.id || '',
          manifestDate,
          m.driver_name || '',
          m.plate_no || '',
          m.trucker || '',
          m.truck_type || '',
          totalQuantity,
          totalDocs,
        ]
      }),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manifests-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white over rounded-xl border p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 ">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <icons.Download className="w-5 h-5" />
            Saved Manifests
          </h3>
          <p className="text-sm text-gray-600">View and download your saved trip manifests</p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={filteredManifests.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <icons.Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Search Bar and Filter */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by manifest #, driver, plate..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
        <FilterDropdown 
          selectedMonth={selectedMonth}
          onMonthChange={(month) => {
            setSelectedMonth(month)
            setCurrentPage(1)
          }}
          months={MONTHS}
        />
      </div>

      {/* Results Info */}
      {(searchQuery || selectedMonth !== 'All Months') && (
        <p className="text-xs text-gray-500 mb-4">
          {filteredManifests.length} manifest{filteredManifests.length !== 1 ? 's' : ''} found
        </p>
      )}

      {savedManifests.length === 0 ? (
        <div className="py-8 sm:py-12 text-center">
          <icons.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 font-medium text-base sm:text-lg">No manifests saved yet</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Create your first trip manifest to see it here</p>
        </div>
      ) : filteredManifests.length === 0 ? (
        <div className="py-8 sm:py-12 text-center">
          <icons.FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 font-medium text-base sm:text-lg">No manifests match your filters</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Try adjusting your search or date filter</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {paginatedManifests.map((manifest) => {
            const totalQuantity = manifest.items?.reduce((sum, item) => sum + item.total_quantity, 0) || 0
            const totalDocs = manifest.items?.length || 0
            const manifestDate = manifest.manifest_date ? new Date(manifest.manifest_date).toLocaleDateString() : 'No date'
            const manifestId = manifest.manifest_number || manifest.id || 'Unknown Manifest'
            
            return (
              <div
                key={manifest.id}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <icons.FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                        {manifestId}
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {manifestDate}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {totalDocs} {totalDocs === 1 ? 'document' : 'documents'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => manifest.id && handleDeleteManifest(manifest.id)}
                    className="px-3 py-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center flex-shrink-0"
                    title="Delete manifest"
                  >
                    <icons.Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
                  {manifest.driver_name && (
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.driver_name}</p>
                    </div>
                  )}
                  {manifest.plate_no && (
                    <div>
                      <span className="text-gray-500">Plate:</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.plate_no}</p>
                    </div>
                  )}
                  {manifest.trucker && (
                    <div>
                      <span className="text-gray-500">Trucker:</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.trucker}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Total Qty:</span>
                    <p className="font-medium  truncate">{totalQuantity}</p>
                  </div>
                  {manifest.truck_type && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-gray-500">Truck Type:</span>
                      <p className="font-medium text-gray-900 truncate">{manifest.truck_type}</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleViewManifest(manifest)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditManifest(manifest)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDownloadManifest(manifest)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 border border-gray-300 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <icons.Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )
          })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredManifests.length} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Previous
                </button>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
