'use client'

import { ClipboardList, FileText, BarChart2, X, ChevronRight, ChevronLeft } from 'lucide-react'

type Tab = 'create' | 'saved' | 'analytics'

interface ManifestTabsProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ManifestTabs({
  activeTab,
  onTabChange,
  isOpen = true,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: ManifestTabsProps) {
  const handleTabChange = (tab: Tab) => {
    onTabChange(tab)
    onClose?.()
  }

  const tabs = [
    { id: 'create' as const, label: 'Create Manifest', icon: ClipboardList },
    { id: 'saved' as const, label: 'Saved Manifests', icon: FileText },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-[73px] bg-[#121212] border-r border-[#282828] flex flex-col z-50
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-[73px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
        `}
        style={{ height: 'calc(100vh - 73px)' }}
      >
        {/* Nav Items */}
        <nav className="flex-1 py-3 overflow-hidden">
          <div className="space-y-0.5 px-2">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg font-semibold text-sm
                    transition-all duration-150 relative group
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-[#E8192C]/15 text-white'
                      : 'text-[#B3B3B3] hover:bg-[#282828] hover:text-white'
                    }
                  `}
                  title={isCollapsed ? label : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#E8192C] rounded-r-full" />
                  )}

                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#E8192C]' : ''}`} />

                  {!isCollapsed && <span>{label}</span>}

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="
                      absolute left-16 top-1/2 -translate-y-1/2 
                      bg-[#282828] border border-[#3E3E3E] 
                      px-3 py-1.5 rounded-lg whitespace-nowrap 
                      opacity-0 group-hover:opacity-100 transition-opacity 
                      pointer-events-none text-xs text-white z-50 shadow-xl
                    ">
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="flex-shrink-0 border-t border-[#282828] p-2">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2.5 rounded-lg hover:bg-[#282828] transition-colors text-[#6A6A6A] hover:text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Optional version footer */}
          {!isCollapsed && (
            <p className="text-[10px] text-[#6A6A6A] text-center pb-1 pt-0.5">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  )
}