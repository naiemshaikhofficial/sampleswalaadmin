'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  show: boolean
  title: string
  message: string
  confirmText: string
  isDanger: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  show,
  title,
  message,
  confirmText,
  isDanger,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#121212] border-4 border-black p-6 w-full max-w-md relative text-left shadow-premium">
        {/* Header Banner */}
        <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-4">
          <div className={`w-10 h-10 rounded-none border-2 border-black flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-studio-red text-white' : 'bg-studio-yellow text-black'
            }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-sans font-bold text-sm uppercase tracking-wide leading-none ${isDanger ? 'text-studio-red' : 'text-studio-yellow'
              }`}>
              {title}
            </h4>
            <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold block mt-1.5">
              SYSTEM SECURITY SAFEGUARD
            </span>
          </div>
        </div>

        {/* Description Text */}
        <div className="text-zinc-200 font-sans text-xs leading-relaxed mb-6 font-medium normal-case">
          {message}
        </div>

        {/* Actions Grid */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 studio-button bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2.5 text-xs cursor-pointer font-sans"
          >
            CANCEL / BACK
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 studio-button font-bold uppercase py-2.5 text-xs cursor-pointer font-sans ${isDanger ? 'bg-studio-red text-white hover:bg-studio-red/80' : 'bg-studio-neon text-black hover:bg-studio-neon-hover'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
