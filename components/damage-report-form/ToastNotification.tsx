'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

interface ToastNotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  show: boolean
  onClose: () => void
}

export function ToastNotification({ message, type, show, onClose }: ToastNotificationProps) {
  if (!show) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[type]

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type]

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} border rounded-lg p-4 shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <Icon className={`w-5 h-5 ${textColor} flex-shrink-0`} />
      <p className={`${textColor} font-medium`}>{message}</p>
      <button onClick={onClose} className={`${textColor} hover:opacity-70`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
