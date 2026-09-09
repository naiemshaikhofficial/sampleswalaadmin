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
    <div className={`fixed bottom-6 right-6 z-50 border rounded-lg p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 font-sans text-xs font-semibold flex items-center gap-3 animate-slideUp ${
      type === 'success' 
        ? 'bg-[#181818]/95 border-[#333333] text-white' 
        : type === 'error' 
        ? 'bg-[#181818]/95 border-red-500/40 text-red-200' 
        : 'bg-[#181818]/95 border-[#333333] text-zinc-200'
    }`}>
      {type === 'success' ? (
        <CheckCircle2 className="w-4.5 h-4.5 text-white flex-shrink-0" />
      ) : type === 'error' ? (
        <XCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4.5 h-4.5 text-zinc-400 flex-shrink-0" />
      )}
      <span className="leading-snug">{message}</span>
    </div>
  )
}
