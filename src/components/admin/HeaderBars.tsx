'use client'

import React from 'react'
import { Menu, Search, RefreshCw } from 'lucide-react'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

const tabLabels: Record<TabType, { mobile: string; desktop: string }> = {
  analytics: { mobile: 'Overview', desktop: 'Overview & Statistics' },
  packs: { mobile: 'Audio Packs', desktop: 'Manage Audio Packs' },
  kyc: { mobile: 'Artist KYC', desktop: 'Artist Verification & KYC Payouts' },
  coupons: { mobile: 'Coupons', desktop: 'Discount Coupons & Promo Codes' },
  tickets: { mobile: 'Support', desktop: 'Customer Support Tickets' },
  users: { mobile: 'Users', desktop: 'Registered Customers & Users' },
  sales: { mobile: 'Orders', desktop: 'Orders & Sales Receipts' },
  logs: { mobile: 'Logs', desktop: 'Admin Activity & Audit Logs' },
  newsletter: { mobile: 'Newsletter', desktop: 'Newsletter Hub & Subscribers' },
  settings: { mobile: 'Settings', desktop: 'Global Site Settings' },
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
    <header className="flex md:hidden items-center justify-between bg-[#0a0a0d]/95 backdrop-blur-md border-b border-white/[0.08] px-3.5 py-2.5 flex-shrink-0 z-20 sticky top-0">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuOpen}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors border border-white/[0.06] cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/Logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold tracking-wide text-zinc-100 uppercase font-sans">
            {tabLabels[activeTab]?.mobile || 'Admin'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPaletteOpen}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors border border-white/[0.06] cursor-pointer"
          title="Search / Commands"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onReload}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors border border-white/[0.06] cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  )
}

export function DesktopHeader({ activeTab, dataLoading, onPaletteOpen, onReload }: HeaderBarsProps) {
  return (
    <header className="hidden md:flex border-b border-white/[0.08] bg-[#0a0a0d]/90 backdrop-blur-md px-6 py-3.5 items-center justify-between flex-shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-bold tracking-tight text-white font-sans">
          {tabLabels[activeTab]?.desktop}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onPaletteOpen}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/[0.08] rounded-lg bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] transition-all font-mono text-[10px] cursor-pointer shadow-sm"
          title="Open Command Palette & Entity Search"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span>SEARCH / COMMANDS</span>
          <kbd className="bg-black/60 px-1.5 py-0.5 border border-white/[0.08] rounded text-[8px] font-mono font-medium text-zinc-400">Ctrl+K</kbd>
        </button>

        {dataLoading && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching DB...
          </div>
        )}
        <button
          type="button"
          onClick={onReload}
          className="p-2 border border-white/[0.08] rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all cursor-pointer shadow-sm"
          title="Refresh database collections"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>
    </header>
  )
}
