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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

type TabType = 'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  user: any
  onLogout: () => Promise<void>
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

const navItems: { tab: TabType; icon: React.ElementType; label: string }[] = [
  { tab: 'analytics', icon: LayoutDashboard, label: 'Overview' },
  { tab: 'packs', icon: Library, label: 'Audio Packs' },
  { tab: 'kyc', icon: UserCheck, label: 'Artist KYC' },
  { tab: 'coupons', icon: Ticket, label: 'Promo Coupons' },
  { tab: 'tickets', icon: MessageSquare, label: 'Support Tickets' },
  { tab: 'users', icon: Users, label: 'Registered Users' },
  { tab: 'sales', icon: Coins, label: 'Orders & Sales' },
  { tab: 'newsletter', icon: Mail, label: 'Newsletter' },
  { tab: 'logs', icon: Activity, label: 'Audit Logs' },
  { tab: 'settings', icon: Lock, label: 'Site Settings' },
]

export function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  isCollapsed,
  setIsCollapsed,
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
      className={`fixed inset-y-0 left-0 ${
        isCollapsed ? 'md:w-16 w-72' : 'md:w-60 w-72'
      } bg-[#121212] z-50 flex flex-col transition-all duration-200 ease-out transform md:relative md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } md:flex flex-shrink-0 select-none`}
    >
      {/* BRAND & COLLAPSE HEADER (SEAMLESS - NO DIVIDING LINE) */}
      <div className={`p-3 bg-[#121212] flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-4 py-3.5'}`}>
        <a
          href="https://sampleswala.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          title="SamplesWala Home"
        >
          <img
            src="/Logo.png"
            alt="SamplesWala Logo"
            className={`${isCollapsed ? 'w-8 h-8' : 'w-7 h-7'} object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.12)]`}
          />
          {!isCollapsed && (
            <div>
              <span className="font-sans font-bold text-xs tracking-wider text-white block">SAMPLESWALA</span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">ADMIN</span>
            </div>
          )}
        </a>

        <div className="flex items-center gap-1">
          {/* Collapse toggle button for desktop */}
          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="hidden md:flex p-1.5 text-zinc-400 hover:text-white hover:bg-[#1c1c1c] rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Minimize to icons"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close drawer for mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-[#1c1c1c] rounded-lg transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS (PRODUCERTOY SEAMLESS SLATE) */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-3'} py-2 space-y-1 overflow-y-auto font-sans text-xs scrollbar-none`}>
        {filteredNavItems.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              title={label}
              onClick={() => {
                setActiveTab(tab)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
              } rounded-lg transition-all text-left group cursor-pointer relative ${
                isActive
                  ? 'bg-[#1e1e1e] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#181818]'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                <div
                  className={`p-1 rounded-md transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                {!isCollapsed && (
                  <span className={`truncate text-xs tracking-wide ${isActive ? 'font-bold text-white' : 'font-medium text-zinc-300'}`}>
                    {label}
                  </span>
                )}
              </div>

              {isActive && (
                isCollapsed ? (
                  <div
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  />
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                  />
                )
              )}
            </button>
          )
        })}
      </nav>

      {/* SIDEBAR FOOTER (ADMIN USER & LOGOUT - SEAMLESS) */}
      <div className={`${isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'} bg-[#121212] font-mono`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white flex items-center justify-center font-bold uppercase text-xs cursor-default"
              title={`${user?.email || 'admin@sampleswala.com'} (Super Admin)`}
            >
              {user?.email?.charAt(0) || 'A'}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 bg-[#181818] p-2 rounded-lg">
              <div className="w-7 h-7 rounded-md bg-[#242424] text-white flex items-center justify-center font-bold uppercase text-xs shadow-sm flex-shrink-0">
                {user?.email?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300 bg-white/10 px-1 py-0.2 rounded inline-block">
                  SUPER ADMIN
                </span>
                <p className="text-[10px] font-medium text-zinc-300 truncate mt-0.5" title={user?.email}>
                  {user?.email || 'admin@sampleswala.com'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-transparent hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
