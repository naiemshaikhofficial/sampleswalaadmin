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
  { tab: 'analytics', icon: LayoutDashboard, label: 'Overview', color: '#FF0080', glow: 'rgba(255, 0, 128, 0.3)' },
  { tab: 'packs', icon: Library, label: 'Audio Packs', color: '#FFE600', glow: 'rgba(255, 230, 0, 0.3)' },
  { tab: 'kyc', icon: UserCheck, label: 'Artist KYC', color: '#FF5C00', glow: 'rgba(255, 92, 0, 0.3)' },
  { tab: 'coupons', icon: Ticket, label: 'Promo Coupons', color: '#00BFFF', glow: 'rgba(0, 191, 255, 0.3)' },
  { tab: 'tickets', icon: MessageSquare, label: 'Customer Support', color: '#BF00FF', glow: 'rgba(191, 0, 255, 0.3)' },
  { tab: 'users', icon: Users, label: 'Registered Users', color: '#FF0080', glow: 'rgba(255, 0, 128, 0.3)' },
  { tab: 'sales', icon: Coins, label: 'Orders & Sales', color: '#00FF94', glow: 'rgba(0, 255, 148, 0.3)' },
  { tab: 'newsletter', icon: Mail, label: 'Newsletter Hub', color: '#00BFFF', glow: 'rgba(0, 191, 255, 0.3)' },
  { tab: 'logs', icon: Activity, label: 'Activity Logs', color: '#BF00FF', glow: 'rgba(191, 0, 255, 0.3)' },
  { tab: 'settings', icon: Lock, label: 'Site Settings', color: '#FF5C00', glow: 'rgba(255, 92, 0, 0.3)' },
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
      className={`fixed inset-y-0 left-0 w-72 md:w-64 bg-[#0a0a0d] border-r border-white/[0.08] z-50 flex flex-col transition-transform duration-300 ease-out transform md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:flex flex-shrink-0`}
    >
      {/* LOGO & BRAND HEADER */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#070709] flex items-center justify-between md:flex-col md:justify-center">
        <a
          href="https://sampleswala.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            src="/Logo.png"
            alt="SamplesWala Logo"
            className="w-10 h-10 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,0,128,0.25)]"
          />
          <div className="md:hidden">
            <span className="font-sans font-black text-sm tracking-wider text-white block">SAMPLESWALA</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">ADMIN PORTAL</span>
          </div>
        </a>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/[0.08]"
          title="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NAVIGATION TABS (MINIMALIST, COLORFUL, CLEAN) */}
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
                ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'
                    }`}
                  style={{ color: isActive ? color : undefined }}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${!isActive ? 'text-zinc-400 group-hover:text-zinc-200' : ''
                      }`}
                  />
                </div>
                <span className={`truncate text-xs tracking-wide ${isActive ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                  {label}
                </span>
              </div>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${glow}` }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* THEME ACCENT SWITCHER */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-[#070709] font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold leading-none">
            THEME ACCENT
          </span>
          <span className="text-[9px] font-semibold text-zinc-400 capitalize">
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
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg'
                  : 'opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                title={`Accent: ${item.label}`}
              />
            )
          })}
        </div>
      </div>

      {/* SIDEBAR FOOTER (ADMIN USER & LOGOUT) */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#070709] space-y-2 font-mono">
        <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] p-2 rounded-lg">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm flex-shrink-0">
            {user?.email?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
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
