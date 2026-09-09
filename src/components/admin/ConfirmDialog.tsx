'use client'

import React from 'react'
import { AlertTriangle, AlertCircle } from 'lucide-react'

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md relative text-left shadow-2xl font-sans">
        {/* Header Banner */}
        <div className="flex items-center gap-3 border-b border-[#2a2a2a] pb-4 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDanger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/10 text-white border border-white/15'
          }`}>
            {isDanger ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-base text-white">
              {title}
            </h4>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold block mt-0.5">
              Action Confirmation Required
            </span>
          </div>
        </div>

        {/* Description Text */}
        <div className="text-zinc-300 text-xs leading-relaxed mb-6 font-normal">
          {message}
        </div>

        {/* Actions Grid */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-[#222222] hover:bg-[#282828] text-zinc-300 border border-[#333333] font-semibold text-xs rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
