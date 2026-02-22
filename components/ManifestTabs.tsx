'use client'

import { ClipboardList, FileText, X, ChevronRight, ChevronLeft } from 'lucide-react'

interface ManifestTabsProps {
  activeTab: 'create' | 'saved'
  onTabChange: (tab: 'create' | 'saved') => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ManifestTabs({
  activeTab, onTabChange, isOpen = true, onClose,
  isCollapsed = false, onToggleCollapse,
}: ManifestTabsProps) {
  const handleTabChange = (tab: 'create' | 'saved') => {
    onTabChange(tab)
    onClose?.()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar — position: fixed on mobile, sticky on desktop */}
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
        {/* Mobile close */}
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden p-2 hover:bg-[#282828] rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-[#B3B3B3]" />
        </button> */}

        {/* Brand */}
        {/* <div className={`${isCollapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5'} flex items-center gap-3 border-b border-[#282828] flex-shrink-0`}>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #E8192C 0%, #7f0e18 100%)' }}
          >
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#6A6A6A]">SF Express</p>
              <p className="text-sm font-black text-white leading-tight">Manifest</p>
            </div>
          )}
        </div> */}

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-hidden">
          <div className="space-y-0.5 px-2">
            {([
              { tab: 'create' as const, label: 'Create Manifest', icon: ClipboardList },
              { tab: 'saved' as const, label: 'Saved Manifests', icon: FileText },
            ]).map(({ tab, label, icon: Icon }) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
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

                  {/* Tooltip on collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#282828] border border-[#3E3E3E] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs text-white z-50 shadow-xl">
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

          {/* Version footer */}
          {!isCollapsed && (
            <p className="text-[10px] text-[#6A6A6A] text-center pb-1 pt-0.5">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  )
}