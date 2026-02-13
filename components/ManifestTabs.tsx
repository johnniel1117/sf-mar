'use client'

import { ClipboardList, FileText } from 'lucide-react'

interface ManifestTabsProps {
  activeTab: 'create' | 'saved'
  onTabChange: (tab: 'create' | 'saved') => void
}

export function ManifestTabs({ activeTab, onTabChange }: ManifestTabsProps) {
  return (
    <div className="flex gap-2 mb-6  p-1 rounded-lg justify-center w-full">
      <button
        onClick={() => onTabChange('create')}
        className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
          activeTab === 'create'
            ? 'bg-orange-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <ClipboardList className="w-4 h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Create Manifest</span>
        <span className="sm:hidden">Create</span>
      </button>

      <button
        onClick={() => onTabChange('saved')}
        className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
          activeTab === 'saved'
            ? 'bg-orange-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Saved Manifests</span>
        <span className="sm:hidden">Saved</span>
      </button>
    </div>
  )
}
