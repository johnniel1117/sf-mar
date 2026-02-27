'use client'

import { ClipboardList, FileText, BarChart2, ChevronRight, ChevronLeft } from 'lucide-react'

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
    { id: 'create'    as const, label: 'Create Manifest', index: '01', icon: ClipboardList },
    { id: 'saved'     as const, label: 'Saved Manifests', index: '02', icon: FileText      },
    { id: 'analytics' as const, label: 'Analytics',       index: '03', icon: BarChart2     },
  ]

  return (
    <>
      {/* Mobile overlay — tapping it closes the sidebar */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 top-[73px] bg-black/70 backdrop-blur-md z-40
          lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Sidebar
          Mobile  : fixed, slides in/out via translate-x, always w-60
          Desktop : sticky, collapses to w-[60px] when isCollapsed
      */}
      <aside
        className={`
          fixed left-0 top-[73px] bg-black border-r border-[#1a1a1a] flex flex-col z-50
          transition-all duration-300 ease-in-out
          w-60
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-[73px]
          ${isCollapsed ? 'lg:w-[60px]' : 'lg:w-60'}
        `}
        style={{ height: 'calc(100dvh - 73px)' }}
      >
        {/* Nav Items */}
        <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden">
          <div className="divide-y divide-[#1a1a1a]">
            {tabs.map(({ id, label, index, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  title={isCollapsed ? label : undefined}
                  className={`
                    w-full flex items-center transition-all duration-200 relative group
                    ${isCollapsed
                      ? 'flex-row gap-4 px-5 py-5 lg:flex-col lg:justify-center lg:gap-1.5 lg:px-0 lg:py-4'
                      : 'flex-row gap-4 px-5 sm:px-6 py-5 sm:py-6'
                    }
                    ${isActive
                      ? (isCollapsed ? 'pl-6 lg:pl-0' : 'pl-6 sm:pl-7')
                      : (isCollapsed ? 'hover:pl-7 lg:hover:pl-0' : 'hover:pl-7 sm:hover:pl-8')
                    }
                  `}
                >
                  {/* Active left bar — always on mobile, hidden on desktop collapsed */}
                  {isActive && (
                    <span className={`
                      absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#E8192C]
                      ${isCollapsed ? 'lg:hidden' : ''}
                    `} />
                  )}

                  {/* Active top bar — desktop collapsed only */}
                  {isActive && isCollapsed && (
                    <span className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 h-px w-6 bg-[#E8192C]" />
                  )}

                  {/* Index number — always on mobile, hidden on desktop when collapsed */}
                  <span className={`
                    text-[11px] font-bold w-5 flex-shrink-0 transition-colors
                    ${isCollapsed ? 'lg:hidden' : ''}
                    ${isActive ? 'text-[#E8192C]' : 'text-[#282828] group-hover:text-[#E8192C]'}
                  `}>
                    {index}
                  </span>

                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#E8192C]' : 'text-[#3E3E3E] group-hover:text-white'
                    }`}
                    strokeWidth={1.5}
                  />

                  {/* Index below icon — desktop collapsed only */}
                  {isCollapsed && (
                    <span className={`hidden lg:block text-[10px] font-bold tracking-widest transition-colors ${
                      isActive ? 'text-[#E8192C]' : 'text-[#282828] group-hover:text-[#E8192C]'
                    }`}>
                      {index}
                    </span>
                  )}

                  {/* Label — always visible; hidden on desktop when collapsed */}
                  <span className={`
                    text-[13px] font-black leading-snug transition-colors
                    ${isCollapsed ? 'lg:hidden' : ''}
                    ${isActive ? 'text-white' : 'text-[#3E3E3E] group-hover:text-white'}
                  `}>
                    {label}
                  </span>

                  {/* Desktop collapsed hover tooltip */}
                  {isCollapsed && (
                    <div className="
                      hidden lg:block
                      absolute left-14 top-1/2 -translate-y-1/2
                      bg-black border border-[#1a1a1a]
                      px-3 py-1.5 rounded-lg whitespace-nowrap
                      opacity-0 group-hover:opacity-100 transition-opacity
                      pointer-events-none text-[11px] text-white z-50 shadow-2xl
                    ">
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="flex-shrink-0 border-t border-[#1a1a1a] p-3">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2.5 rounded-full hover:bg-[#0a0a0a] transition-colors text-[#282828] hover:text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft  className="w-3.5 h-3.5" />
            }
          </button>

          {!isCollapsed && (
            <p className="text-[10px] text-[#1a1a1a] text-center pt-1">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  )
}