'use client'

import React from 'react'
import { Terminal, Search, X } from 'lucide-react'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

interface CommandPaletteProps {
  showPalette: boolean
  setShowPalette: (show: boolean) => void
  paletteSearch: string
  setPaletteSearch: (search: string) => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  handleReload: () => void
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
  setPaletteSelection: (val: any) => void
  // Data for entity search
  usersList: any[]
  packs: any[]
  vaultSalesList: any[]
  tickets: any[]
  coupons: any[]
}

export function CommandPalette({
  showPalette,
  setShowPalette,
  paletteSearch,
  setPaletteSearch,
  activeTab,
  setActiveTab,
  handleReload,
  showToast,
  setPaletteSelection,
  usersList,
  packs,
  vaultSalesList,
  tickets,
  coupons
}: CommandPaletteProps) {
  if (!showPalette) return null

  const query = paletteSearch.trim().toLowerCase()

  // 1. SLASH COMMANDS
  const allCommands = [
    { path: '/analytics', label: 'Go to Performance Analytics', action: () => { setActiveTab('analytics'); setShowPalette(false); } },
    { path: '/packs', label: 'Go to Sample Packs Inventory', action: () => { setActiveTab('packs'); setShowPalette(false); } },
    { path: '/kyc', label: 'Go to Artist KYCs & Payouts', action: () => { setActiveTab('kyc'); setShowPalette(false); } },
    { path: '/coupons', label: 'Go to Discount Coupons Register', action: () => { setActiveTab('coupons'); setShowPalette(false); } },
    { path: '/tickets', label: 'Go to Support Ticket Hub', action: () => { setActiveTab('tickets'); setShowPalette(false); } },
    { path: '/users', label: 'Go to Users Management Hub', action: () => { setActiveTab('users'); setShowPalette(false); } },
    { path: '/sales', label: 'Go to Vault Orders Logs', action: () => { setActiveTab('sales'); setShowPalette(false); } },
    { path: '/logs', label: 'Go to System Audit Trails', action: () => { setActiveTab('logs'); setShowPalette(false); } },
    { path: '/refresh', label: 'Bypass cache & force reload database', action: () => { handleReload(); setShowPalette(false); showToast('Database revalidated!', 'success'); } },
  ]

  const renderContent = () => {
    // 1. SLASH COMMANDS
    if (query.startsWith('/') || query === '') {
      const filteredCmds = allCommands.filter(c => c.path.includes(query))

      if (filteredCmds.length > 0) {
        return (
          <div className="space-y-1.5 font-mono">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
              📟 SYSTEM SLASH COMMANDS
            </span>
            {filteredCmds.map(c => (
              <div
                key={c.path}
                onClick={c.action}
                className="bg-[#181818] hover:bg-studio-pink/10 border-2 border-black hover:border-studio-pink p-2.5 flex items-center justify-between cursor-pointer transition-all"
              >
                <span className="text-studio-pink font-bold">{c.path}</span>
                <span className="text-zinc-400 text-[10px] uppercase font-bold">{c.label}</span>
              </div>
            ))}
          </div>
        )
      }
    }

    // 2. LIVE DATABASE COLLECTION SEARCH
    if (query !== '') {
      const matchedUsers = usersList.filter(u =>
        (u.full_name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query)
      ).slice(0, 5)

      const matchedPacks = packs.filter(p =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.slug || '').toLowerCase().includes(query)
      ).slice(0, 5)

      const matchedOrders = vaultSalesList.filter(s =>
        (s.pack_name || '').toLowerCase().includes(query) ||
        (s.buyer_name || '').toLowerCase().includes(query) ||
        (s.buyer_email || '').toLowerCase().includes(query)
      ).slice(0, 5)

      const matchedTickets = tickets.filter(t =>
        (t.user_name || '').toLowerCase().includes(query) ||
        (t.user_email || '').toLowerCase().includes(query) ||
        (t.subject || '').toLowerCase().includes(query)
      ).slice(0, 5)

      const matchedCoupons = coupons.filter(c =>
        (c.code || '').toLowerCase().includes(query)
      ).slice(0, 5)

      const totalMatches = matchedUsers.length + matchedPacks.length + matchedOrders.length + matchedTickets.length + matchedCoupons.length

      if (totalMatches === 0) {
        return (
          <div className="p-8 text-center border-2 border-black bg-black text-zinc-500 font-mono font-bold uppercase text-[10px]">
            No matching entities found in database.
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {/* Users */}
          {matchedUsers.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                👥 USERS ({matchedUsers.length})
              </span>
              {matchedUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    setActiveTab('users');
                    setPaletteSelection({ type: 'user', data: u });
                    setShowPalette(false);
                  }}
                  className="bg-[#151515] hover:bg-studio-pink/10 border-2 border-black hover:border-studio-pink p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                >
                  <div className="font-sans font-bold text-zinc-100 normal-case">{u.full_name}</div>
                  <div className="font-mono text-zinc-500 text-[10px] lowercase">{u.email}</div>
                </div>
              ))}
            </div>
          )}

          {/* Packs */}
          {matchedPacks.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                📦 SAMPLE PACKS ({matchedPacks.length})
              </span>
              {matchedPacks.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActiveTab('packs');
                    setPaletteSelection({ type: 'pack', data: p });
                    setShowPalette(false);
                  }}
                  className="bg-[#151515] hover:bg-studio-yellow/10 border-2 border-black hover:border-studio-yellow p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                >
                  <div className="font-sans font-bold text-zinc-100 normal-case">{p.name}</div>
                  <div className="font-mono text-studio-yellow text-[10px]">₹{p.price_inr}</div>
                </div>
              ))}
            </div>
          )}

          {/* Orders */}
          {matchedOrders.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                💰 SALES & ORDERS ({matchedOrders.length})
              </span>
              {matchedOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => {
                    setActiveTab('sales');
                    setPaletteSelection({ type: 'order', data: o });
                    setShowPalette(false);
                  }}
                  className="bg-[#151515] hover:bg-studio-neon/10 border-2 border-black hover:border-studio-neon p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                >
                  <div className="font-sans font-bold text-zinc-100 normal-case">{o.pack_name}</div>
                  <div className="font-mono text-studio-neon text-[10px] font-bold">₹{o.amount}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tickets */}
          {matchedTickets.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                🎫 SUPPORT TICKETS ({matchedTickets.length})
              </span>
              {matchedTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => {
                    setActiveTab('tickets');
                    setPaletteSelection({ type: 'ticket', data: t });
                    setShowPalette(false);
                  }}
                  className="bg-[#151515] hover:bg-studio-purple/10 border-2 border-black hover:border-studio-purple p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                >
                  <div className="font-sans font-bold text-zinc-100 normal-case">{t.subject}</div>
                  <div className="font-mono text-studio-purple text-[10px] uppercase font-bold">{t.status}</div>
                </div>
              ))}
            </div>
          )}

          {/* Coupons */}
          {matchedCoupons.length > 0 && (
            <div className="space-y-1.5 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                🎟️ COUPONS ({matchedCoupons.length})
              </span>
              {matchedCoupons.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveTab('coupons');
                    setPaletteSelection({ type: 'coupon', data: c });
                    setShowPalette(false);
                  }}
                  className="bg-[#151515] hover:bg-studio-blue/10 border-2 border-black hover:border-studio-blue p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                >
                  <div className="font-mono font-bold text-zinc-100">{c.code}</div>
                  <div className="font-mono text-studio-blue text-[10px] font-bold">{c.discount_percent}% OFF</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-start justify-center p-4 pt-[10vh] animate-fadeIn"
      onClick={() => setShowPalette(false)}
    >
      <div
        className="bg-[#121212] border-4 border-black p-6 w-full max-w-2xl relative text-left shadow-premium"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4 font-mono">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-studio-pink" />
            <div>
              <h4 className="font-sans font-bold text-sm uppercase tracking-wide leading-none">
                UNIVERSAL COMMAND CENTER
              </h4>
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mt-1.5">
                Search users, packs, orders, or run terminal slash commands
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowPalette(false)}
            className="p-1 bg-black border-2 border-black hover:border-studio-pink text-zinc-400 hover:text-white transition-all cursor-pointer text-[10px] font-bold px-2 py-1"
          >
            ESC
          </button>
        </div>

        {/* Input Box */}
        <div className="relative mb-4">
          <input
            autoFocus
            type="text"
            placeholder="Type / for commands or search anything..."
            value={paletteSearch}
            onChange={e => setPaletteSearch(e.target.value)}
            className="w-full bg-black border-4 border-black p-4 text-white outline-none focus:border-studio-pink font-mono text-sm placeholder-zinc-700 uppercase"
          />
        </div>

        {/* List Results */}
        <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 scrollbar">
          {renderContent()}
        </div>

        {/* Hint Footer */}
        <div className="border-t border-zinc-900 pt-3 mt-4 text-[9px] text-zinc-600 font-mono flex items-center justify-between leading-none">
          <span>TIP: CHOOSE COMMANDS OR CLICK DIRECTLY</span>
          <span>PRESS ESC TO DISMISS COMMAND MODAL</span>
        </div>
      </div>
    </div>
  )
}
