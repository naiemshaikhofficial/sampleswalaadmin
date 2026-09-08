'use client'

import React from 'react'
import { Menu, Search, RefreshCw } from 'lucide-react'
import { getLiveExchangeRate } from '@/app/actions'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

const tabLabels: Record<TabType, { mobile: string; desktop: string }> = {
  analytics: { mobile: '📈 OVERVIEW', desktop: '📈 Overview & Earnings Statistics' },
  packs: { mobile: '📦 AUDIO PACKS', desktop: '📦 Manage Audio Sample Packs' },
  kyc: { mobile: '🎨 KYC & PAYOUTS', desktop: '🎨 Artist Verification & KYC Payouts' },
  coupons: { mobile: '🎟️ COUPONS', desktop: '🎟️ Discount Codes & Promo Coupons' },
  tickets: { mobile: '🎫 TICKETS', desktop: '🎫 Customer Support Help Tickets' },
  users: { mobile: '👥 USERS', desktop: '👥 Registered User Accounts' },
  sales: { mobile: '💰 SALES', desktop: '💰 Sales Receipts & Orders Log' },
  logs: { mobile: '🛠️ LOGS', desktop: '🛠️ Admin Activity Logs' },
  newsletter: { mobile: '📧 NEWSLETTER', desktop: '📧 Newsletter Hub & Campaign Manager' },
  settings: { mobile: '⚙️ SETTINGS', desktop: '⚙️ Global Site Settings & Configuration' },
}

interface HeaderBarsProps {
  activeTab: TabType
  dataLoading: boolean
  onMenuOpen: () => void
  onPaletteOpen: () => void
  onReload: () => void
}

export function MobileHeader({ activeTab, dataLoading, onMenuOpen, onPaletteOpen, onReload }: HeaderBarsProps) {
  return (
    <header className="flex md:hidden items-center justify-between bg-[#121212] border-b border-zinc-800 px-4 py-3 flex-shrink-0 z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuOpen}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-[11px] font-black tracking-wider uppercase text-zinc-200">
          {tabLabels[activeTab]?.mobile}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onPaletteOpen}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          title="Search / Commands"
        >
          <Search className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={onReload}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          title="Reload Data"
        >
          <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  )
}

export function DesktopHeader({ activeTab, dataLoading, onMenuOpen, onPaletteOpen, onReload }: HeaderBarsProps) {
  const [liveRate, setLiveRate] = React.useState<number>(90.0)

  React.useEffect(() => {
    getLiveExchangeRate()
      .then(info => {
        if (info?.rate) setLiveRate(info.rate)
      })
      .catch(err => console.warn('Exchange rate in HeaderBars:', err))
  }, [])

  return (
    <header className="hidden md:flex border-b border-zinc-800 bg-[#121212] px-6 py-4 items-center justify-between flex-shrink-0 z-0">
      <div className="flex items-center gap-3">
        <span className="text-xl uppercase font-black tracking-tighter">
          {tabLabels[activeTab]?.desktop}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* LIVE USD TO INR BADGE */}
        <div className="hidden lg:flex items-center gap-2 bg-[#18181c] border border-zinc-800 px-3 py-1.5 rounded font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-studio-neon animate-pulse" />
          <span className="text-zinc-400 font-bold uppercase">USD/INR:</span>
          <span className="text-studio-yellow font-black font-mono">₹{liveRate.toFixed(2)}</span>
        </div>

        <button
          onClick={onPaletteOpen}
          className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-mono text-[10px] cursor-pointer"
          title="Open Command Palette & Entity Search"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden sm:inline">SEARCH / COMMANDS</span>
          <kbd className="bg-black px-1.5 py-0.5 border border-zinc-800 rounded text-[8px] font-black tracking-widest text-zinc-500">Ctrl+K</kbd>
        </button>

        {dataLoading && (
          <div className="flex items-center gap-2 text-[10px] uppercase font-black text-studio-neon">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> LOADING DB DATA...
          </div>
        )}
        <button
          onClick={onReload}
          className="p-2 border-3 border-black bg-white hover:bg-studio-pink text-black transition-colors cursor-pointer"
          title="Refresh database collections"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
