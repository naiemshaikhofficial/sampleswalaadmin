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
    <div className={`fixed bottom-6 right-6 z-50 border-4 border-black p-4 shadow-premium transition-transform duration-300 font-mono text-xs uppercase font-black flex items-center gap-3 ${type === 'success' ? 'bg-studio-neon text-black' : type === 'error' ? 'bg-studio-red text-white' : 'bg-studio-yellow text-black'
      }`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <span>{message}</span>
    </div>
  )
}
