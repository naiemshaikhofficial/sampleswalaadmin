import React from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'

interface SettingsTabProps {
  bannerEnabled: boolean
  bannerPending: boolean
  handleToggleLaunchOffer: () => void
  user: any
}

export function SettingsTab({
  bannerEnabled,
  bannerPending,
  handleToggleLaunchOffer,
  user
}: SettingsTabProps) {
  const [role, setRole] = React.useState('Super Admin')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`admin_role_${user?.id || 'default'}`) || 'Super Admin'
      setRole(saved)
    }
  }, [user])

  const handleRoleChange = (newRole: string) => {
    setRole(newRole)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`admin_role_${user?.id || 'default'}`, newRole)
      window.location.reload() // Dynamic refresh to enforce sidebar navigation updates
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#121212] p-6 border border-zinc-800 rounded-none border-4 border-black">
        <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-[#FF5C00]">
          ⚙️ GLOBAL SITE CONFIGURATION
        </h3>
        <p className="text-zinc-400 mt-1 uppercase text-[10px] font-black">
          Manage application flags, configurations, and settings.
        </p>
      </div>

      {/* STAFF RBAC CONTROLS CARD */}
      <div className="border-4 border-black bg-black p-6 rounded-none font-sans">
        <div className="max-w-xl pb-4 border-b border-zinc-900 mb-6">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-studio-pink" /> STAFF AUTHORIZATION & ROLE SIMULATOR
          </h4>
          <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
            Configure your active staff clearance credentials. Changes will dynamically restrict sidebar tabs, revenue analytics panels, and dashboard operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'Super Admin', desc: 'ALL OVERVIEWS, PRODUCTS, INTEGRATIONS ACCESSIBLE' },
            { id: 'Support Agent', desc: 'RESTRICTED TO PACKS, KYC, COUPONS, SUPPORT CHATS, USERS' },
            { id: 'Billing Manager', desc: 'RESTRICTED TO OVERVIEWS, ORDERS, COUPONS, SYSTEM LOGS' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleChange(r.id)}
              className={`p-4 border-2 border-black text-left flex flex-col justify-between transition-all h-28 rounded-none cursor-pointer ${
                role === r.id
                  ? 'bg-studio-pink text-black shadow-premium-sm -translate-y-0.5'
                  : 'bg-[#0d0d0f] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">{r.id}</span>
              <span className={`text-[7px] leading-tight font-mono uppercase mt-2 block ${role === r.id ? 'text-black font-black' : 'text-zinc-500'}`}>
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Banner Settings Card */}
      <div className="border-4 border-black bg-black p-6 rounded-none font-sans">
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
                bannerEnabled ? 'bg-studio-neon shadow-[0_0_12px_rgba(0,255,148,0.3)] border-2 border-black' : 'bg-zinc-800 border-2 border-black'
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

        <div className="mt-6 bg-[#0c0c0c] border border-zinc-900 p-4 rounded-none">
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
