'use client'

import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface ToastProps {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export function Toast({ show, message, type }: ToastProps) {
  if (!show) return null

  return (
    <div className={`fixed bottom-6 right-6 z-50 border rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all duration-300 font-sans text-xs font-semibold flex items-center gap-3 animate-slideUp ${
      type === 'success' 
        ? 'bg-[#18181c]/95 border-emerald-500/40 text-white' 
        : type === 'error' 
        ? 'bg-[#18181c]/95 border-red-500/40 text-white' 
        : 'bg-[#18181c]/95 border-amber-500/40 text-white'
    }`}>
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-[#00FF94] flex-shrink-0" />
      ) : type === 'error' ? (
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
      )}
      <span className="leading-snug">{message}</span>
    </div>
  )
}
