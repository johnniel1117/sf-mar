'use client'

import React from 'react'
import { AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react'

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
  cancelText  = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const Icon = isDangerous ? AlertTriangle : AlertCircle

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="bg-black border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-6 border-b border-[#1a1a1a]">
          {/* Icon */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-5 border ${
            isDangerous
              ? 'bg-[#E8192C]/10 border-[#E8192C]/20'
              : 'bg-[#E8192C]/8 border-[#E8192C]/15'
          }`}>
            <Icon className="w-4 h-4 text-[#E8192C]" />
          </div>

          {/* Eyebrow */}
          <p className="text-[10px]  uppercase tracking-[0.25em] font-bold text-yellow-600 mb-1.5">
            {isDangerous ? 'Warning' : 'Confirm'}
          </p>

          {/* Title */}
          <h2 className="text-xl font-black text-white tracking-tight leading-none mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-[12px]  text-[#3E3E3E] leading-relaxed">
            {message}
          </p>

          {/* Danger strip */}
          {isDangerous && (
            <div className="flex items-center gap-2 px-3 py-2.5 mt-4 border border-[#E8192C]/15 rounded-xl bg-[#E8192C]/5">
              <div className="w-1 h-5 rounded-full bg-[#E8192C]/60 flex-shrink-0" />
              <p className="text-[11px]  text-[#E8192C]/70">This action cannot be undone.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#1a1a1a] text-[#6A6A6A] rounded-full text-[10px]  font-bold uppercase tracking-widest hover:border-[#3E3E3E] hover:text-white transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full bg-[#E8192C] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF1F30] transition-all shadow-lg shadow-[#E8192C]/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}