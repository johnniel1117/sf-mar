'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors flex-shrink-0"
      style={{ border: '1px solid #E8192C', color: '#E8192C', background: 'rgba(232,25,44,0.06)' }}
    >
      <Printer className="w-3.5 h-3.5" />
      Print
    </button>
  )
}