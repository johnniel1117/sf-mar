'use client'

import React from 'react'
import { FileText, Download, Star, ChevronRight } from 'lucide-react'

export type TabType = 'create' | 'saved' | 'materials'

interface SidebarTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  className?: string
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  className = '' 
}) => {
  const tabs = [
    {
      id: 'create' as TabType,
      label: 'Create Report',
      icon: FileText,
      description: 'Create new damage reports',
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      hoverColor: 'hover:bg-orange-50'
    },
    {
      id: 'saved' as TabType,
      label: 'Saved Reports',
      icon: Download,
      description: 'View and manage saved reports',
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      id: 'materials' as TabType,
      label: 'Material Mappings',
      icon: Star,
      description: 'Manage barcode mappings',
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      hoverColor: 'hover:bg-purple-50'
    },
  ]

  return (
    <div className={`w-full md:w-64 lg:w-72 flex flex-col ${className}`}>
      {/* Sidebar Header */}
      <div className="mb-6 px-4">
        <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
        <p className="text-sm text-gray-500 mt-1">Switch between sections</p>
      </div>

      {/* Tabs List */}
      <nav className="flex-1 space-y-1 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? `${tab.color.replace('bg-', 'bg-')} text-white shadow-lg` 
                  : `text-gray-700 ${tab.hoverColor} hover:shadow-md`
                }
                ${!isActive ? 'hover:scale-[1.02]' : ''}
                group
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isActive 
                    ? 'bg-white/20' 
                    : `${tab.color} bg-opacity-10 group-hover:bg-opacity-20`
                  }
                `}>
                  <Icon className={`
                    w-5 h-5
                    ${isActive ? 'text-white' : tab.textColor}
                  `} />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-sm block">{tab.label}</span>
                  <span className={`
                    text-xs block mt-0.5
                    ${isActive ? 'text-white/80' : 'text-gray-500'}
                  `}>
                    {tab.description}
                  </span>
                </div>
              </div>
              
              <ChevronRight className={`
                w-4 h-4 transition-transform duration-200
                ${isActive ? 'text-white' : 'text-gray-400'}
                ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}
              `} />
            </button>
          )
        })}
      </nav>

      {/* Active Tab Indicator */}
      <div className="mt-6 px-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Current Section</p>
          <p className="font-semibold text-gray-900 mt-1">
            {tabs.find(t => t.id === activeTab)?.label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SidebarTabs