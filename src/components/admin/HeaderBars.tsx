'use client'

import React from 'react'
import { Menu, Search, RefreshCw } from 'lucide-react'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

const tabLabels: Record<TabType, { mobile: string; desktop: string }> = {
  analytics: { mobile: 'Overview', desktop: 'Overview & Earnings Statistics' },
  packs: { mobile: 'Audio Packs', desktop: 'Manage Audio Sample Packs' },
  kyc: { mobile: 'KYC & Payouts', desktop: 'Artist Verification & KYC Payouts' },
  coupons: { mobile: 'Coupons', desktop: 'Discount Codes & Promo Coupons' },
  tickets: { mobile: 'Tickets', desktop: 'Customer Support Help Tickets' },
  users: { mobile: 'Users', desktop: 'Registered User Accounts' },
  sales: { mobile: 'Sales', desktop: 'Sales Receipts & Orders Log' },
  logs: { mobile: 'Logs', desktop: 'Admin Activity Logs' },
  newsletter: { mobile: 'Newsletter', desktop: 'Newsletter Hub & Campaign Manager' },
  settings: { mobile: 'Settings', desktop: 'Global Site Settings & Configuration' },
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
        <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
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
  return (
    <header className="hidden md:flex border-b border-zinc-800 bg-[#121212] px-6 py-3.5 items-center justify-between flex-shrink-0 z-0">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-zinc-100">
          {tabLabels[activeTab]?.desktop}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onPaletteOpen}
          className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 rounded-md bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-mono text-[10px] cursor-pointer"
          title="Open Command Palette & Entity Search"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden sm:inline">SEARCH / COMMANDS</span>
          <kbd className="bg-black px-1.5 py-0.5 border border-zinc-800 rounded text-[8px] font-mono font-medium text-zinc-500">Ctrl+K</kbd>
        </button>

        {dataLoading && (
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono font-semibold text-emerald-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching DB...
          </div>
        )}
        <button
          onClick={onReload}
          className="p-1.5 border border-zinc-800 rounded-md bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Refresh database collections"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
