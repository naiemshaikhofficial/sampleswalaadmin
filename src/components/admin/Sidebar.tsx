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

const navItems: { tab: TabType; icon: React.ElementType; label: string; activeColor: string }[] = [
  { tab: 'analytics', icon: LayoutDashboard, label: '📈 Overview & Earnings', activeColor: 'bg-studio-pink text-white border-studio-pink/30' },
  { tab: 'packs', icon: Library, label: '📦 Manage Audio Packs', activeColor: 'bg-studio-yellow text-black border-studio-yellow/30' },
  { tab: 'kyc', icon: UserCheck, label: '🎨 Artist Verification & KYC', activeColor: 'bg-studio-orange text-white border-studio-orange/30' },
  { tab: 'coupons', icon: Ticket, label: '🎟️ Promo Codes & Coupons', activeColor: 'bg-studio-blue text-white border-studio-blue/30' },
  { tab: 'tickets', icon: MessageSquare, label: '🎫 Customer Support Help', activeColor: 'bg-studio-purple text-white border-studio-purple/30' },
  { tab: 'users', icon: Users, label: '👥 Registered Users', activeColor: 'bg-studio-pink text-white border-studio-pink/30' },
  { tab: 'sales', icon: Coins, label: '💰 Orders & Sales Receipts', activeColor: 'bg-studio-neon text-black border-studio-neon/30' },
  { tab: 'newsletter', icon: Mail, label: '📧 Newsletter Hub', activeColor: 'bg-[#FF0080] text-white border-[#FF0080]/30' },
  { tab: 'logs', icon: Activity, label: '🛠️ Admin Activity Logs', activeColor: 'bg-studio-purple text-white border-studio-purple/30' },
  { tab: 'settings', icon: Lock, label: '⚙️ Global Site Settings', activeColor: 'bg-[#FF5C00] text-white border-[#FF5C00]/30' },
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
  return (
    <aside className={`fixed inset-y-0 left-0 w-72 md:w-64 bg-[#121212] border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:flex flex-shrink-0`}>
      <div className="p-6 border-b border-zinc-800 bg-[#0d0d0d] flex flex-row items-center justify-between md:flex-col md:items-center">
        <a href="https://www.sampleswala.vercel.app" target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-85 transition-opacity">
          <img
            src="/Logo.png"
            alt="SamplesWala Logo"
            className="w-16 h-16 md:w-28 md:h-28 object-contain"
          />
        </a>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded transition-colors"
          title="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MENU TABS GRID WITH ENTERPRISE RBAC FILTERING */}
      <nav className="flex-1 p-4 space-y-1.5 font-sans text-xs font-bold uppercase overflow-y-auto">
        {(() => {
          const adminRole = user?.app_metadata?.role || (typeof window !== 'undefined' ? localStorage.getItem(`admin_role_${user?.id}`) : null) || 'Super Admin'
          
          const filteredNavItems = navItems.filter(item => {
            if (adminRole === 'Support Agent') {
              return ['packs', 'kyc', 'coupons', 'tickets', 'users', 'logs'].includes(item.tab)
            }
            if (adminRole === 'Billing Manager') {
              return ['analytics', 'sales', 'coupons', 'logs'].includes(item.tab)
            }
            return true // Super Admin has full clearance
          })

          // Secure tab redirection if activeTab becomes restricted
          React.useEffect(() => {
            const isTabAllowed = filteredNavItems.some(item => item.tab === activeTab)
            if (!isTabAllowed && filteredNavItems.length > 0) {
              setActiveTab(filteredNavItems[0].tab)
            }
          }, [adminRole, activeTab, filteredNavItems])

          return filteredNavItems.map(({ tab, icon: Icon, label, activeColor }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${activeTab === tab
                ? `${activeColor} shadow-sm`
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))
        })()}
      </nav>

      {/* ACCENT SWITCHER WIDGET */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-[#0d0d0d] font-mono">
        <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mb-2 leading-none">
          🎨 INTERFACE ACCENT
        </span>
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(accentDetails).map(([key, item]) => (
            <button
              key={key}
              onClick={() => {
                setAccent(key as any)
                showToast(`Accent set to ${item.label}!`, 'success')
              }}
              style={{ backgroundColor: item.hex }}
              className={`h-4 w-full border border-black hover:scale-110 active:scale-95 transition-all cursor-pointer rounded ${accent === key ? 'ring-1 ring-white scale-105 opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              title={`Accent: ${item.label}`}
            />
          ))}
        </div>
      </div>

      {/* SIDEBAR FOOTER (USER & LOGOUT) */}
      <div className="p-4 border-t border-zinc-800 bg-[#0d0d0d] space-y-2.5 font-mono">
        <div className="flex items-center gap-3 bg-[#111] p-2 border border-zinc-800 rounded">
          <div className="w-7 h-7 rounded bg-studio-pink text-white flex items-center justify-center font-black uppercase text-xs border border-zinc-700">
            {user?.email?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-black uppercase text-zinc-500 leading-none">AUTHORIZED ADMIN</p>
            <p className="text-[10px] font-bold text-white truncate mt-1">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-studio-red/10 border border-studio-red/30 text-studio-red hover:bg-studio-red hover:text-white transition-all text-xs font-black uppercase rounded"
        >
          <LogOut className="w-3 h-3" />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  )
}
