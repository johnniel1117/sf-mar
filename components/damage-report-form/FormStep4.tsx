'use client'

import type { DamageReport } from '@/lib/services/damageReportService'

interface FormStep4Props {
  report: DamageReport
  onReportChange: (report: DamageReport) => void
}

export function FormStep4({ report, onReportChange }: FormStep4Props) {
  const handleChange = (field: string, value: string) => {
    onReportChange({
      ...report,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Summary & Notes</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Report Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Driver:</dt>
            <dd className="font-medium">{report.driver_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Plate No:</dt>
            <dd className="font-medium">{report.plate_no}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Items to Report:</dt>
            <dd className="font-medium">{report.items.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Date:</dt>
            <dd className="font-medium">{report.report_date}</dd>
          </div>
        </dl>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Narrative Findings</label>
        <textarea
          value={report.narrative_findings}
          onChange={(e) => handleChange('narrative_findings', e.target.value)}
          placeholder="Provide detailed findings about the damage and conditions..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Actions Required</label>
        <textarea
          value={report.actions_required}
          onChange={(e) => handleChange('actions_required', e.target.value)}
          placeholder="Specify any actions that need to be taken..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Please review all information before submitting. Once saved, you can edit the report later.
        </p>
      </div>
    </div>
  )
}
