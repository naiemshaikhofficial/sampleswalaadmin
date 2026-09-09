'use client'

import React, { useState } from 'react'
import {
  Sliders,
  ShieldAlert,
  Gamepad2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio
} from 'lucide-react'
import { revalidateAdminTag } from '@/app/actions'

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
  user,
  showToast
}: SettingsTabProps) {
  const [revalidating, setRevalidating] = useState(false)

  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://sampleswala.com'
  const previewUrl = `${mainSiteUrl.replace(/\/$/, '')}/maintenance?preview=1`

  const handleManualRevalidate = async () => {
    setRevalidating(true)
    try {
      await revalidateAdminTag('admin-settings')
      await revalidateAdminTag('maintenance')
      showToast('Cache purged and settings synced with main site!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to sync cache', 'error')
    } finally {
      setRevalidating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      {/* HEADER CARD */}
      <div className="bg-[#181818] p-5 sm:p-6 border border-[#2a2a2a] rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-white" />
            Site Configuration & Maintenance
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Control the global maintenance gateway and visitor redirection for SamplesWala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border bg-[#121212] border-[#2a2a2a] text-zinc-300">
            <Radio className={`w-3.5 h-3.5 ${maintenanceEnabled ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            {maintenanceEnabled ? 'Maintenance: ON' : 'Store: LIVE'}
          </span>
        </div>
      </div>

      {/* PRIMARY HERO CARD: MAINTENANCE MODE */}
      <div
        className={`p-6 sm:p-7 rounded-xl border transition-all shadow-lg ${
          maintenanceEnabled
            ? 'bg-amber-950/10 border-amber-500/40 shadow-amber-950/30'
            : 'bg-[#181818] border-[#2a2a2a]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#2a2a2a]/60">
          <div className="space-y-3 max-w-2xl">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase border">
              {maintenanceEnabled ? (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Maintenance Mode Active (Traffic Locked)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Storefront Public & Active
                </span>
              )}
            </div>

            <h4 className="text-xl font-bold text-white tracking-tight">
              {maintenanceEnabled
                ? 'Visitors are Redirected to /maintenance'
                : 'Maintenance Mode Gateway'}
            </h4>

            <p className="text-zinc-300 text-xs leading-relaxed">
              {maintenanceEnabled
                ? 'All traffic visiting SamplesWala is currently being intercepted and redirected to the arcade Rocket Shooter mini-game on /maintenance. Normal checkout, downloads, and catalog browsing are temporarily paused.'
                : 'Turn this on before performing major database migrations, sound engine refactors, or scheduled system maintenance. When active, every visitor is automatically routed to the interactive /maintenance mini-game.'}
            </p>
          </div>

          {/* Large Interactive Toggle Switch */}
          <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleMaintenance}
                disabled={maintenancePending}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 cursor-pointer shadow-inner ${
                  maintenanceEnabled ? 'bg-amber-500' : 'bg-[#282828]'
                }`}
              >
                <span className="sr-only">Toggle Maintenance Mode</span>
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform duration-300 shadow-md ${
                    maintenanceEnabled ? 'translate-x-7' : 'translate-x-1'
                  } flex items-center justify-center`}
                >
                  {maintenancePending ? (
                    <RefreshCw size={12} className="animate-spin text-white" />
                  ) : maintenanceEnabled ? (
                    <AlertTriangle size={12} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={12} className="text-zinc-500" />
                  )}
                </span>
              </button>
              <span className={`text-xs font-bold font-mono min-w-16 ${maintenanceEnabled ? 'text-amber-400' : 'text-zinc-400'}`}>
                {maintenanceEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {maintenancePending ? 'Updating database...' : 'Click switch to toggle'}
            </span>
          </div>
        </div>

        {/* DETAILS & ACTIONS ROW */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Action 1: Preview Game */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-[#121212] border border-[#282828] hover:border-white/40 text-left flex flex-col justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                <Gamepad2 className="w-4 h-4 text-white" />
                Play / Preview Mini-Game
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Launch and test the arcade Rocket Shooter game on <code className="text-zinc-200">/maintenance</code> anytime.
            </span>
          </a>

          {/* Action 2: Database Key Status */}
          <div className="p-4 rounded-xl bg-[#121212] border border-[#282828] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-zinc-400" />
                Database Configuration
              </span>
            </div>
            <div className="mt-2 font-mono text-[11px] flex items-center gap-1.5 text-zinc-400">
              <span>app_metadata.maintenance_mode</span>
              <span>→</span>
              <span className={maintenanceEnabled ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {String(maintenanceEnabled)}
              </span>
            </div>
          </div>

          {/* Action 3: Manual Cache Purge */}
          <button
            type="button"
            onClick={handleManualRevalidate}
            disabled={revalidating}
            className="p-4 rounded-xl bg-[#121212] border border-[#282828] hover:border-white/40 text-left flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-zinc-200 transition-colors">
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${revalidating ? 'animate-spin' : ''}`} />
                Force Sync Cache
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Manually invalidate Edge cache and notify main site if changes are delayed.
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
