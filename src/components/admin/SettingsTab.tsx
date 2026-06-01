import React from 'react'
import { RefreshCw } from 'lucide-react'

interface SettingsTabProps {
  bannerEnabled: boolean
  bannerPending: boolean
  handleToggleLaunchOffer: () => void
}

export function SettingsTab({
  bannerEnabled,
  bannerPending,
  handleToggleLaunchOffer
}: SettingsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#121212] p-6 border border-zinc-800 rounded-lg">
        <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-[#FF5C00]">
          ⚙️ GLOBAL SITE CONFIGURATION
        </h3>
        <p className="text-zinc-400 mt-1 uppercase text-[10px] font-black">
          Manage application flags, configurations, and settings.
        </p>
      </div>

      {/* Banner Settings Card */}
      <div className="border border-zinc-800 bg-black p-6 rounded-lg font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
          <div className="max-w-xl">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              Announcement Banner (Launch Offer)
            </h4>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Toggle the visibility of the promo banner displaying the <span className="text-[#FF5C00] font-semibold">₹499 Offer</span> across the top of all main website pages. Changes apply instantly.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-4 self-start md:self-auto">
            <button
              onClick={handleToggleLaunchOffer}
              disabled={bannerPending}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 cursor-pointer ${
                bannerEnabled ? 'bg-studio-neon shadow-[0_0_12px_rgba(0,255,148,0.3)]' : 'bg-zinc-800'
              }`}
            >
              <span className="sr-only">Toggle banner</span>
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-[0_2px_4px_black] ${
                  bannerEnabled ? 'translate-x-7' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {bannerPending && <RefreshCw size={12} className="animate-spin text-zinc-900" />}
              </span>
            </button>
            <span className="text-xs font-black text-zinc-300 min-w-10">
              {bannerEnabled ? 'ACTIVE' : 'HIDDEN'}
            </span>
          </div>
        </div>

        <div className="mt-6 bg-[#0c0c0c] border border-zinc-900 p-4 rounded-md">
          <span className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest mb-2">
            Current Database Flag:
          </span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-zinc-400">key:</span>
            <span className="text-white font-bold">show_launch_offer</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">value:</span>
            <span className={bannerEnabled ? 'text-studio-neon font-black' : 'text-studio-red font-black'}>
              {String(bannerEnabled)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
