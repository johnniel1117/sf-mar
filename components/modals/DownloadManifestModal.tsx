'use client'

import React from 'react'
import { X, FileText, FileSpreadsheet, Download } from 'lucide-react'

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
    { type: 'pdf'   as const, label: 'PDF Document',      desc: 'Best for printing & signatures', icon: FileText },
    { type: 'excel' as const, label: 'Excel Spreadsheet', desc: 'Editable data & analysis',        icon: FileSpreadsheet },
    { type: 'both'  as const, label: 'Both Formats',       desc: 'PDF + Excel downloaded at once',  icon: Download },
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-black text-white">Download Manifest</h3>
            <p className="text-xs text-[#6A6A6A] mt-0.5">Choose your export format</p>
          </div>
          {/* <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#282828] hover:bg-[#3E3E3E] text-[#B3B3B3] hover:text-white transition-all hover:scale-105 active:scale-100"
          >
            <X className="w-4 h-4" />
          </button> */}
        </div>

        <div className="space-y-2 mb-6">
          {options.map(opt => {
            const active = downloadType === opt.type
            return (
              <button
                key={opt.type}
                onClick={() => onDownloadTypeChange(opt.type)}
                className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all duration-150 text-left ${
                  active
                    ? 'border-[#E8192C]/50 bg-[#E8192C]/8'
                    : 'border-[#3E3E3E] hover:border-[#E8192C]/30 hover:bg-[#282828]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  active ? 'border-[#E8192C]' : 'border-[#6A6A6A]'
                }`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-[#E8192C]" />}
                </div>
                <opt.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#E8192C]' : 'text-[#6A6A6A]'}`} />
                <div>
                  <p className="text-sm font-bold text-white">{opt.label}</p>
                  <p className="text-xs text-[#6A6A6A]">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-sm font-semibold hover:border-white hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-full text-white text-sm font-bold hover:scale-105 active:scale-100 transition-all"
            style={{ background: 'linear-gradient(135deg, #E8192C, #7f0e18)', boxShadow: '0 4px 16px rgba(232,25,44,0.25)' }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}