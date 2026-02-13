import { ClipboardList, FileText } from 'lucide-react'

interface ManifestTabsProps {
  activeTab: 'create' | 'saved'
  onTabChange: (tab: 'create' | 'saved') => void
}

export function ManifestTabs({ activeTab, onTabChange }: ManifestTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('create')}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Create Manifest
        </button>
        <button
          onClick={() => onTabChange('saved')}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-blue-600 text-white border-b-2 border-blue-600'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <FileText className="w-5 h-5" />
          Saved Manifests
        </button>
      </div>
    </div>
  )
}