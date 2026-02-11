'use client'

import type { DamageReport } from '@/lib/services/damageReportService'

interface FormStep1Props {
  report: DamageReport
  onReportChange: (report: DamageReport) => void
}

export function FormStep1({ report, onReportChange }: FormStep1Props) {
  const handleChange = (field: string, value: string) => {
    onReportChange({
      ...report,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Vehicle Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name*</label>
          <input
            type="text"
            value={report.driver_name}
            onChange={(e) => handleChange('driver_name', e.target.value)}
            placeholder="Enter driver name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">License Plate*</label>
          <input
            type="text"
            value={report.plate_no}
            onChange={(e) => handleChange('plate_no', e.target.value)}
            placeholder="e.g., ABC123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Container Number</label>
          <input
            type="text"
            value={report.container_no}
            onChange={(e) => handleChange('container_no', e.target.value)}
            placeholder="Enter container number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seal Number</label>
          <input
            type="text"
            value={report.seal_no}
            onChange={(e) => handleChange('seal_no', e.target.value)}
            placeholder="Enter seal number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Date</label>
          <input
            type="date"
            value={report.report_date}
            onChange={(e) => handleChange('report_date', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Number</label>
          <input
            type="text"
            value={report.report_number}
            onChange={(e) => handleChange('report_number', e.target.value)}
            placeholder="Auto-generated"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
