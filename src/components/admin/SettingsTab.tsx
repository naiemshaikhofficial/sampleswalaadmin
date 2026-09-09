'use client'

import React from 'react'
import { RefreshCw, ShieldAlert, Sliders, Megaphone, Zap } from 'lucide-react'

interface SettingsTabProps {
  bannerEnabled: boolean
  bannerPending: boolean
  handleToggleLaunchOffer: () => void
  flashSaleEnabled: boolean
  flashSalePending: boolean
  handleToggleFlashSale: () => void
  user: any
}

export function SettingsTab({
  bannerEnabled,
  bannerPending,
  handleToggleLaunchOffer,
  flashSaleEnabled,
  flashSalePending,
  handleToggleFlashSale,
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
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      {/* HEADER CARD */}
      <div className="bg-[#18181c] p-5 sm:p-6 border border-white/10 rounded-2xl shadow-md">
        <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-blue-400" />
          Site Configuration & Controls
        </h3>
        <p className="text-zinc-400 text-xs mt-1">
          Manage system toggles, promotional banners, and active staff role clearance simulations.
        </p>
      </div>

      {/* STAFF RBAC CONTROLS CARD */}
      <div className="border border-white/10 bg-[#18181c] p-6 rounded-2xl shadow-md font-sans">
        <div className="max-w-xl pb-4 border-b border-white/[0.06] mb-6">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Staff Authorization & Role Clearance
          </h4>
          <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
            Simulate permissions to inspect how dashboard views, action triggers, and analytics are restricted for different staff clearance levels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[
            { id: 'Super Admin', desc: 'Full access to all products, orders, payouts, settings and database logs.' },
            { id: 'Support Agent', desc: 'Access to sample packs, artist KYC, coupons, support chat tickets, and users.' },
            { id: 'Billing Manager', desc: 'Access to revenue analytics, sales orders, promo coupons, and audit logs.' }
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleChange(r.id)}
              className={`p-4 border text-left flex flex-col justify-between transition-all rounded-xl cursor-pointer ${
                role === r.id
                  ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-sm'
                  : 'bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{r.id}</span>
                {role === r.id && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] leading-relaxed text-zinc-400 mt-2 block">
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Announcement Banner Card */}
      <div className="border border-white/10 bg-[#18181c] p-6 rounded-2xl shadow-md font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="max-w-xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-400" />
              Launch Offer Announcement Banner
            </h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Controls the visibility of the top header announcement strip displaying the <span className="text-orange-400 font-semibold">₹499 Launch Offer</span> across the main website.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3.5 self-start md:self-auto">
            <button
              type="button"
              onClick={handleToggleLaunchOffer}
              disabled={bannerPending}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 cursor-pointer ${
                bannerEnabled ? 'bg-[#00FF94]' : 'bg-white/10'
              }`}
            >
              <span className="sr-only">Toggle banner</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                  bannerEnabled ? 'translate-x-6' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {bannerPending && <RefreshCw size={11} className="animate-spin text-zinc-900" />}
              </span>
            </button>
            <span className={`text-xs font-semibold min-w-14 ${bannerEnabled ? 'text-[#00FF94]' : 'text-zinc-500'}`}>
              {bannerEnabled ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>

        <div className="mt-5 bg-black/40 border border-white/[0.06] p-3.5 rounded-xl">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">Database Key:</span>
            <span className="text-zinc-200 font-semibold">show_launch_offer</span>
            <span className="text-zinc-600">→</span>
            <span className={bannerEnabled ? 'text-[#00FF94] font-bold' : 'text-zinc-500 font-bold'}>
              {String(bannerEnabled)}
            </span>
          </div>
        </div>
      </div>

      {/* Flash Sale Settings Card */}
      <div className="border border-white/10 bg-[#18181c] p-6 rounded-2xl shadow-md font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="max-w-xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Flash Sale Sidebar Promotion Box
            </h4>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Controls the visibility of the <span className="text-yellow-400 font-semibold">Flash Sale Card</span> showcasing curated discount offers in the browse filter sidebar.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3.5 self-start md:self-auto">
            <button
              type="button"
              onClick={handleToggleFlashSale}
              disabled={flashSalePending}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 cursor-pointer ${
                flashSaleEnabled ? 'bg-[#00FF94]' : 'bg-white/10'
              }`}
            >
              <span className="sr-only">Toggle flash sale</span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                  flashSaleEnabled ? 'translate-x-6' : 'translate-x-1'
                } flex items-center justify-center`}
              >
                {flashSalePending && <RefreshCw size={11} className="animate-spin text-zinc-900" />}
              </span>
            </button>
            <span className={`text-xs font-semibold min-w-14 ${flashSaleEnabled ? 'text-[#00FF94]' : 'text-zinc-500'}`}>
              {flashSaleEnabled ? 'Active' : 'Hidden'}
            </span>
          </div>
        </div>

        <div className="mt-5 bg-black/40 border border-white/[0.06] p-3.5 rounded-xl">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">Database Key:</span>
            <span className="text-zinc-200 font-semibold">show_flash_sale</span>
            <span className="text-zinc-600">→</span>
            <span className={flashSaleEnabled ? 'text-[#00FF94] font-bold' : 'text-zinc-500 font-bold'}>
              {String(flashSaleEnabled)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
