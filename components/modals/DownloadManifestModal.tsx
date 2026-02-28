'use client'

import React from 'react'
import { X, FileText, FileSpreadsheet, Download, ArrowUpRight } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  downloadType: 'pdf' | 'excel' | 'both'
  onDownloadTypeChange: (type: 'pdf' | 'excel' | 'both') => void
  onConfirm: () => void
  onClose: () => void
}

export function DownloadModal({
  isOpen,
  downloadType,
  onDownloadTypeChange,
  onConfirm,
  onClose,
}: DownloadModalProps) {
  if (!isOpen) return null

  const options = [
    { type: 'pdf'   as const, label: 'PDF Document',      desc: 'Best for printing & signatures', index: '01', icon: FileText       },
    { type: 'excel' as const, label: 'Excel Spreadsheet', desc: 'Editable data & analysis',        index: '02', icon: FileSpreadsheet },
    { type: 'both'  as const, label: 'Both Formats',      desc: 'PDF + Excel downloaded at once',  index: '03', icon: Download        },
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-black border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-[#1a1a1a] flex items-end justify-between">
          <div>
            <p className="text-[10px]  uppercase tracking-[0.25em] font-bold text-yellow-600 mb-1.5">
              Export
            </p>
            <h3 className="text-xl font-black text-white tracking-tight leading-none">
              Download Manifest
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#0a0a0a] text-gray-500 hover:text-white transition-colors mb-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options — landing services-list style */}
        <div className="divide-y divide-[#1a1a1a] px-0">
          {options.map(opt => {
            const active = downloadType === opt.type
            const Icon   = opt.icon
            return (
              <button
                key={opt.type}
                onClick={() => onDownloadTypeChange(opt.type)}
                className={`w-full flex items-center gap-5 px-7 py-4 transition-all duration-200 group text-left ${
                  active ? 'pl-8' : 'hover:pl-8'
                }`}
              >
                <span className={`text-[11px]  font-bold w-5 flex-shrink-0 transition-colors ${
                  active ? 'text-[#E8192C]' : 'text-[#282828] group-hover:text-[#E8192C]'
                }`}>
                  {opt.index}
                </span>
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all duration-200 ${
                  active
                    ? 'border-[#E8192C]/20 bg-[#E8192C]/8'
                    : 'border-[#1a1a1a] bg-transparent group-hover:border-[#E8192C]/20 group-hover:bg-[#E8192C]/6'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${active ? 'text-[#E8192C]' : 'text-gray-500 group-hover:text-[#E8192C]'}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-black leading-snug transition-colors ${
                    active ? 'text-white' : 'text-gray-500 group-hover:text-white'
                  }`}>
                    {opt.label}
                  </p>
                  <p className={`text-[11px]  mt-0.5 transition-colors ${
                    active ? 'text-[#6A6A6A]' : 'text-[#282828] group-hover:text-gray-500'
                  }`}>
                    {opt.desc}
                  </p>
                </div>
                <ArrowUpRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 ${
                  active ? 'text-[#E8192C]' : 'text-[#282828] group-hover:text-[#E8192C]'
                }`} />
              </button>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-7 py-5 border-t border-[#1a1a1a]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#1a1a1a] text-[#6A6A6A] rounded-full text-[10px]  font-bold uppercase tracking-widest hover:border-gray-500 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#E8192C] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}