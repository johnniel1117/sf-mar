'use client'

import React from 'react'
import { AlertTriangle, AlertCircle } from 'lucide-react'

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

  const Icon = isDangerous ? AlertTriangle : AlertCircle

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[#1E1E1E] border border-[#3E3E3E] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Body */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
            isDangerous
              ? 'bg-[#E8192C]/15 border border-[#E8192C]/30'
              : 'bg-[#E8192C]/10 border border-[#E8192C]/20'
          }`}>
            <Icon className="w-5 h-5 text-[#E8192C]" />
          </div>

          {/* Title + message */}
          <h2 className="text-base font-black text-white mb-1.5">{title}</h2>
          <p className="text-sm text-[#6A6A6A] leading-relaxed">{message}</p>

          {/* Danger notice */}
          {isDangerous && (
            <div className="flex items-center gap-2 px-3 py-2.5 mt-4 bg-[#E8192C]/8 border border-[#E8192C]/20 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8192C] flex-shrink-0" />
              <p className="text-xs text-[#E8192C] font-semibold">This action cannot be undone.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#3E3E3E] text-[#B3B3B3] rounded-full text-sm font-semibold hover:border-white hover:text-white transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all hover:scale-105 active:scale-100"
            style={{
              background: 'linear-gradient(135deg, #E8192C, #7f0e18)',
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