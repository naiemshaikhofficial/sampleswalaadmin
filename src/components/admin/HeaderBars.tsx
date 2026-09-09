'use client'

import React from 'react'
import { Menu, Search, RefreshCw, Sun, Moon } from 'lucide-react'

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
  isCollapsed?: boolean
  onToggleSidebar?: () => void
  themeMode?: 'dark' | 'white'
  onToggleThemeMode?: () => void
}

export function MobileHeader({
  activeTab,
  dataLoading,
  onMenuOpen,
  onPaletteOpen,
  onReload,
  themeMode = 'dark',
  onToggleThemeMode
}: HeaderBarsProps) {
  return (
    <header className="flex md:hidden items-center justify-between bg-[#121212]/95 backdrop-blur-md px-3.5 py-2.5 flex-shrink-0 z-20 sticky top-0">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuOpen}
          className="p-2 text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
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
        {onToggleThemeMode && (
          <button
            type="button"
            onClick={onToggleThemeMode}
            className="p-2 text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
            title={themeMode === 'white' ? 'Switch to Dark Mode' : 'Switch to White Mode'}
          >
            {themeMode === 'white' ? (
              <Moon className="w-4 h-4 text-zinc-200" />
            ) : (
              <Sun className="w-4 h-4 text-zinc-200" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={onPaletteOpen}
          className="p-2 text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
          title="Search / Commands"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onReload}
          className="p-2 text-zinc-400 hover:text-white bg-[#181818] hover:bg-[#202020] rounded-lg transition-colors cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>
    </header>
  )
}

export function DesktopHeader({
  activeTab,
  dataLoading,
  onPaletteOpen,
  onReload,
  themeMode = 'dark',
  onToggleThemeMode
}: HeaderBarsProps) {
  return (
    <header className="hidden md:flex bg-[#121212]/95 backdrop-blur-md px-6 py-3.5 items-center justify-between flex-shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-bold tracking-tight text-white font-sans">
          {tabLabels[activeTab]?.desktop}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onPaletteOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#222222] transition-all font-mono text-[10px] cursor-pointer shadow-sm"
          title="Open Command Palette & Entity Search"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>SEARCH / COMMANDS</span>
          <kbd className="bg-[#121212] px-1.5 py-0.5 rounded text-[8px] font-mono font-medium text-zinc-300">Ctrl+K</kbd>
        </button>

        {/* DARK / WHITE THEME TOGGLE BUTTON */}
        {onToggleThemeMode && (
          <button
            type="button"
            onClick={onToggleThemeMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] text-zinc-300 hover:text-white hover:bg-[#222222] transition-all font-mono text-[10px] cursor-pointer shadow-sm border border-[#222222]"
            title={themeMode === 'white' ? 'Switch to Dark Mode' : 'Switch to White Mode'}
          >
            {themeMode === 'white' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-300" />
                <span className="font-semibold uppercase tracking-wider">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-zinc-200" />
                <span className="font-semibold uppercase tracking-wider">White Mode</span>
              </>
            )}
          </button>
        )}

        {dataLoading && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-zinc-200 bg-white/10 px-2 py-1 rounded">
            <RefreshCw className="w-3 h-3 animate-spin text-white" /> Fetching DB...
          </div>
        )}
        <button
          type="button"
          onClick={onReload}
          className="p-2 rounded-lg bg-[#181818] hover:bg-[#222222] text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Refresh database collections"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>
    </header>
  )
}
