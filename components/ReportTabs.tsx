'use client'

import React from 'react'
import { FileText, Download, Star } from 'lucide-react'

const icons = {
  FileText,
  Download,
  Star,
} as const

interface ReportTabsProps {
  activeTab: 'create' | 'saved' | 'materials'
  onTabChange: (tab: 'create' | 'saved' | 'materials') => void
  onMaterialsTab?: () => void
}

export function ReportTabs({ activeTab, onTabChange, onMaterialsTab }: ReportTabsProps) {
  return (
    <div className="flex gap-2 mb-6 p-1 rounded-lg justify-center w-full">
      <button
        onClick={() => onTabChange('create')}
        className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
          activeTab === 'create'
            ? 'bg-orange-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FileText className="w-4 h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Create Report</span>
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
        <Download className="w-4 h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Saved Reports</span>
        <span className="sm:hidden">Saved</span>
      </button>
      <button
        onClick={() => {
          onTabChange('materials')
          onMaterialsTab?.()
        }}
        className={`flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-md font-semibold transition-all text-xs sm:text-sm md:text-base whitespace-nowrap ${
          activeTab === 'materials'
            ? 'bg-orange-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Star className="w-4 h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Material Mappings</span>
        <span className="sm:hidden">Materials</span>
      </button>
    </div>
  )
}
