'use client'

import React from 'react'
import { AlertTriangle, AlertCircle, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDangerous ? 'bg-[#E8192C]/15 border border-[#E8192C]/30' : 'bg-[#E8192C]/10 border border-[#E8192C]/20'
          }`}>
            {isDangerous
              ? <AlertTriangle className="w-5 h-5 text-[#E8192C]" />
              : <AlertCircle className="w-5 h-5 text-[#E8192C]" />
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-sm font-black text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full bg-[#282828] hover:bg-[#3E3E3E] text-[#B3B3B3] hover:text-white transition-all flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-[#B3B3B3] leading-relaxed mb-6 pl-14">
          {message}
        </p>

        {isDangerous && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#E8192C]/8 border border-[#E8192C]/20 rounded-xl mb-5 ml-14">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E8192C] flex-shrink-0" />
            <p className="text-xs text-[#E8192C] font-semibold">This action cannot be undone.</p>
          </div>
        )}

        <div className="flex gap-3 pl-14">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-sm font-semibold hover:border-white hover:text-white transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-full text-white text-sm font-bold transition-all hover:scale-105 active:scale-100 shadow-lg"
            style={{
              background: isDangerous
                ? 'linear-gradient(135deg, #E8192C, #7f0e18)'
                : 'linear-gradient(135deg, #E8192C, #7f0e18)',
              boxShadow: '0 4px 16px rgba(232,25,44,0.25)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}