'use client'

interface PersonnelData {
  id: string
  name: string
}

interface FormStep2Props {
  selectedPersonnel: {
    admin: string
    guard: string
    supervisor: string
  }
  personnelData: {
    admins: PersonnelData[]
    guards: PersonnelData[]
    supervisors: PersonnelData[]
  }
  onPersonnelChange: (role: 'admin' | 'guard' | 'supervisor', value: string) => void
}

export function FormStep2({ selectedPersonnel, personnelData, onPersonnelChange }: FormStep2Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Personnel Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prepared By</label>
          <select
            value={selectedPersonnel.admin}
            onChange={(e) => onPersonnelChange('admin', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Personnel</option>
            {personnelData.admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Noted By</label>
          <select
            value={selectedPersonnel.guard}
            onChange={(e) => onPersonnelChange('guard', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Personnel</option>
            {personnelData.guards.map((guard) => (
              <option key={guard.id} value={guard.id}>
                {guard.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Acknowledged By</label>
          <select
            value={selectedPersonnel.supervisor}
            onChange={(e) => onPersonnelChange('supervisor', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select Personnel</option>
            {personnelData.supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
