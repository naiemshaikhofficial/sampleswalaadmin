'use client'

import React from 'react'
import {
  LayoutDashboard,
  Library,
  UserCheck,
  Ticket,
  MessageSquare,
  Users,
  Coins,
  Mail,
  Activity,
  Lock,
  LogOut,
  X
} from 'lucide-react'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

interface AccentDetail {
  label: string
  hex: string
  borderClass: string
}

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  accent: string
  setAccent: (accent: any) => void
  accentDetails: Record<string, AccentDetail>
  user: any
  onLogout: () => Promise<void>
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

const navItems: { tab: TabType; icon: React.ElementType; label: string; color: string; glow: string }[] = [
  { tab: 'analytics', icon: LayoutDashboard, label: 'Overview', color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.25)' },
  { tab: 'packs', icon: Library, label: 'Audio Packs', color: '#E4E4E7', glow: 'rgba(228, 228, 231, 0.2)' },
  { tab: 'kyc', icon: UserCheck, label: 'Artist KYC', color: '#D4D4D8', glow: 'rgba(212, 212, 216, 0.2)' },
  { tab: 'coupons', icon: Ticket, label: 'Promo Coupons', color: '#A1A1AA', glow: 'rgba(161, 161, 170, 0.2)' },
  { tab: 'tickets', icon: MessageSquare, label: 'Customer Support', color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.25)' },
  { tab: 'users', icon: Users, label: 'Registered Users', color: '#E4E4E7', glow: 'rgba(228, 228, 231, 0.2)' },
  { tab: 'sales', icon: Coins, label: 'Orders & Sales', color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.25)' },
  { tab: 'newsletter', icon: Mail, label: 'Newsletter Hub', color: '#D4D4D8', glow: 'rgba(212, 212, 216, 0.2)' },
  { tab: 'logs', icon: Activity, label: 'Activity Logs', color: '#A1A1AA', glow: 'rgba(161, 161, 170, 0.2)' },
  { tab: 'settings', icon: Lock, label: 'Site Settings', color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.25)' },
]

export function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  accent,
  setAccent,
  accentDetails,
  user,
  onLogout,
  showToast
}: SidebarProps) {
  const adminRole = user?.app_metadata?.role || (typeof window !== 'undefined' ? localStorage.getItem(`admin_role_${user?.id}`) : null) || 'Super Admin'

  const filteredNavItems = navItems.filter(item => {
    if (adminRole === 'Support Agent') {
      return ['packs', 'kyc', 'coupons', 'tickets', 'users', 'logs'].includes(item.tab)
    }
    if (adminRole === 'Billing Manager') {
      return ['analytics', 'sales', 'coupons', 'logs'].includes(item.tab)
    }
    return true
  })

  // Secure tab redirection if activeTab becomes restricted
  React.useEffect(() => {
    const isTabAllowed = filteredNavItems.some(item => item.tab === activeTab)
    if (!isTabAllowed && filteredNavItems.length > 0) {
      setActiveTab(filteredNavItems[0].tab)
    }
  }, [adminRole, activeTab, filteredNavItems, setActiveTab])

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-72 md:w-64 bg-[#121212] border-r border-[#202020] z-50 flex flex-col transition-transform duration-300 ease-out transform md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:flex flex-shrink-0`}
    >
      {/* LOGO & BRAND HEADER */}
      <div className="p-4 sm:p-5 border-b border-[#202020] bg-[#161616] flex items-center justify-between md:flex-col md:justify-center">
        <a
          href="https://sampleswala.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            src="/Logo.png"
            alt="SamplesWala Logo"
            className="w-10 h-10 md:w-20 md:h-20 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.12)]"
          />
          <div className="md:hidden">
            <span className="font-sans font-black text-sm tracking-wider text-white block">SAMPLESWALA</span>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">ADMIN PORTAL</span>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-[#202020] rounded-lg transition-colors border border-[#2a2a2a]"
          title="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NAVIGATION TABS (PRODUCERTOY MONOCHROME SLATE) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto font-sans text-xs">
        {filteredNavItems.map(({ tab, icon: Icon, label, color, glow }) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left group cursor-pointer ${isActive
                ? 'bg-[#202020] text-white border border-[#333333] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#181818] border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-[#2a2a2a] text-white' : 'bg-transparent text-zinc-400 group-hover:text-zinc-200 group-hover:bg-[#202020]'
                    }`}
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <span className={`truncate text-xs tracking-wide ${isActive ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                  {label}
                </span>
              </div>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* THEME ACCENT SWITCHER */}
      <div className="px-4 py-3 border-t border-[#202020] bg-[#141414] font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold leading-none">
            THEME ACCENT
          </span>
          <span className="text-[9px] font-semibold text-zinc-300 capitalize">
            {accentDetails[accent]?.label || accent}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1.5">
          {Object.entries(accentDetails).map(([key, item]) => {
            const isSelected = accent === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setAccent(key as any)
                  showToast(`Accent set to ${item.label}!`, 'success')
                }}
                style={{ backgroundColor: item.hex }}
                className={`h-5 w-5 rounded-full transition-all cursor-pointer ${isSelected
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121212] scale-110 shadow-lg'
                  : 'opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                title={`Accent: ${item.label}`}
              />
            )
          })}
        </div>
      </div>

      {/* SIDEBAR FOOTER (ADMIN USER & LOGOUT) */}
      <div className="p-3.5 border-t border-[#202020] bg-[#141414] space-y-2 font-mono">
        <div className="flex items-center gap-2.5 bg-[#1a1a1a] border border-[#2a2a2a] p-2 rounded-lg">
          <div className="w-7 h-7 rounded-md bg-[#282828] border border-[#383838] text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm flex-shrink-0">
            {user?.email?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300 bg-white/10 px-1 py-0.2 rounded border border-white/15">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[10px] font-medium text-zinc-300 truncate mt-0.5" title={user?.email}>
              {user?.email || 'admin@sampleswala.com'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
