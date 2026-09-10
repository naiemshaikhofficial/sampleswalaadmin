'use client'

import React from 'react'
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

interface SettingsTabProps {
  maintenanceEnabled: boolean
  maintenancePending: boolean
  handleToggleMaintenance: () => void
  user: any
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void
}

export function SettingsTab({
  maintenanceEnabled,
  maintenancePending,
  handleToggleMaintenance,
}: SettingsTabProps) {
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://sampleswala.com'
  const previewUrl = `${mainSiteUrl.replace(/\/$/, '')}/maintenance?preview=1`

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-xs max-w-3xl">
      <div className="bg-[#181818] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Maintenance Mode</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                maintenanceEnabled
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {maintenanceEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              When enabled, all visitors will automatically be redirected to the <code className="text-zinc-200">/maintenance</code> page.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={maintenancePending}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 cursor-pointer ${
                maintenanceEnabled ? 'bg-white' : 'bg-[#2a2a2a]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-black transition-transform duration-200 shadow-md ${
                  maintenanceEnabled ? 'translate-x-6' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {maintenancePending && <RefreshCw size={11} className="animate-spin text-white" />}
              </span>
            </button>
            <span className={`font-mono text-xs font-bold ${maintenanceEnabled ? 'text-white' : 'text-zinc-500'}`}>
              {maintenanceEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-zinc-500 text-[11px] font-mono">
            Status: {maintenanceEnabled ? 'Traffic redirected to /maintenance' : 'Website is live'}
          </span>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 hover:text-white flex items-center gap-1 font-medium underline"
          >
            Preview Maintenance Page <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
