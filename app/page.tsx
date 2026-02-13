import Link from 'next/link'
import { FileSpreadsheet, AlertTriangle, Truck } from 'lucide-react'

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
   
          {/* Main Content */}
          <div className=" grid   items-center justify-center max-w-4xl w-full ">
            <div className="w-full max-w-6xl">
            
              
              {/* Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Serial Number Management */}
                <Link href="/excel-uploader">
                  <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                    <div className="mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Serial List
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Upload and process product barcode data
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">.xlsx</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">.xls</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
                    </div>
                  </div>
                </Link>

                {/* Trip Manifest */}
                <Link href="/trip-manifest">
                  <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                    <div className="mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Trip Manifest
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Document and manage shipment details and delivery logistics
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">Documentation</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Details</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Tracking</span>
                    </div>
                  </div>
                </Link>

                {/* Damage Report */}
                <Link href="/damage-report">
                  <div className="border border-gray-200 rounded-xl p-6 bg-white hover:border-gray-300 transition-colors cursor-pointer group h-full">
                    <div className="mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Damage Report
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                      Document and track damaged products and shipment incidents
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">Documentation</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Details</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Tracking</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          Developed by <span className="font-semibold">MAR</span> · All Rights Reserved © 2026
        </div>
      
    </div>
  )
}