import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12  rounded-lg flex items-center justify-center">
            <img
              src="/sf-express.png"
              alt="SF Express Logo"
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SF EXPRESS</h1>
        </div>
        <p className="text-gray-600 text-lg">Choose a service to get started</p>
      </div>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Excel Uploader Card */}
        <Link href="/excel-uploader">
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 hover:border-blue-500">
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6  transition-transform duration-300">
                <FileSpreadsheet className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Excel Uploader
              </h2>
              <p className="text-gray-600 mb-4">
                Upload and process barcode Excel files of Haier products
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  .xlsx
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  .xls
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  .csv
                </span>
              </div>
            </div>
            <div className="bg-blue-50 px-8 py-4 group-hover:bg-blue-100 transition-colors">
              <p className="text-blue-700 font-semibold text-center">
                Click to upload files →
              </p>
            </div>
          </div>
        </Link>

        {/* Damage Report Card */}
        <Link href="/damage-report">
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 hover:border-orange-500">
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6  transition-transform duration-300">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Damage Report
              </h2>
              <p className="text-gray-600 mb-4">
                Report and track damaged products and shipments
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Photos
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Details
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Tracking
                </span>
              </div>
            </div>
            <div className="bg-orange-50 px-8 py-4 group-hover:bg-orange-100 transition-colors">
              <p className="text-orange-700 font-semibold text-center">
                Click to create report →
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-500 text-sm">
        Developed by <span className="font-semibold">MAR</span> · All Rights Reserved © 2026
      </div>
    </div>
  )
}