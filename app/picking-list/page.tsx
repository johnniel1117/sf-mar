import { PickingListMaker } from '@/components/PickingListMaker'

export default function PickingListPage() {
  return (
    <div className="h-screen bg-[#0D1117] overflow-y-auto">
      {/* Header — matches your app's existing style */}
      <header className="border-b border-[#30363D] backdrop-blur sticky top-0 z-50 bg-[#0D1117]">
        <div className="px-5 sm:px-8 h-[72px] flex items-center gap-3">
          <img src="/sf-light.png" alt="SF Express" className="h-5 sm:h-6 w-auto" />
          <div className="w-px h-4 bg-[#30363D]" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#6E7681]">
            Picking List
          </span>
        </div>
      </header>
      <PickingListMaker />
    </div>
  )
}