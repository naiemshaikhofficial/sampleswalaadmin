'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import { saveCoupon, deleteCoupon } from '@/app/actions'
import { supabase } from '@/lib/supabase'

interface CouponsTabProps {
  coupons: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

export function CouponsTab({
  coupons,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation,
  paletteSelection,
  setPaletteSelection
}: CouponsTabProps) {
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [activeCoupon, setActiveCoupon] = useState<any>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [packs, setPacks] = useState<any[]>([])
  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [packsRes, presetsRes] = await Promise.all([
          supabase.from('sample_packs').select('id, name').order('name'),
          supabase.from('presets').select('id, name').order('name')
        ])
        if (packsRes.data) setPacks(packsRes.data)
        if (presetsRes.data) setPresets(presetsRes.data)
      } catch (err) {
        console.error('Error fetching packs/presets for coupon selection:', err)
      }
    }
    fetchItems()
  }, [])

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'coupon') {
      setActiveCoupon(paletteSelection.data)
      setShowCouponModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const handleCouponSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const discountVal = Number(activeCoupon.discount_percent)
    if (!activeCoupon.code?.trim() || isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
      showToast('Please enter a valid coupon code and discount percentage (between 0.01% and 100%)!', 'error')
      return
    }

    setSaveLoading(true)
    try {
      const payload = {
        ...activeCoupon,
        code: activeCoupon.code.trim().toUpperCase(),
        discount_percent: discountVal
      }
      const saved = await saveCoupon(payload)
      showToast(`Coupon "${saved.code}" saved!`, 'success')
      addAuditLog(activeCoupon.id ? 'UPDATE_COUPON' : 'CREATE_COUPON', `Saved discount coupon: ${saved.code} (${saved.discount_percent}% off)`, 'info')
      setShowCouponModal(false)
      invalidateCacheAndReload('coupons')
    } catch (err: any) {
      showToast(err.message || 'Failed to save coupon', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleCouponDelete = async (id: string, code: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM DISCOUNT COUPON DELETION',
      `Are you sure you want to permanently delete coupon "${code}"? This discount code will instantly stop working for all active customers.`,
      true,
      'DELETE COUPON'
    )
    if (!approved) return
    try {
      await deleteCoupon(id)
      showToast(`Coupon "${code}" deleted`, 'success')
      addAuditLog('DELETE_COUPON', `Deleted discount coupon: ${code}`, 'danger')
      invalidateCacheAndReload('coupons')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete coupon', 'error')
    }
  }

   return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl shadow-md flex justify-between items-center">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">
            Promo & Discount Coupons
          </h3>
          <p className="text-zinc-400 text-xs font-sans mt-0.5">
            Create discount codes, set percentage reductions, and configure usage limits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveCoupon({
              code: '',
              discount_percent: '',
              is_active: true,
              expires_at: '',
              applicable_items: null,
              max_uses: null,
              limit_per_user: null
            })
            setShowCouponModal(true)
          }}
          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer font-sans"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* COUPONS DISPLAY */}
      {coupons.length === 0 ? (
        <div className="border border-[#222222] rounded-xl bg-[#181818] p-8 text-center text-zinc-500 font-sans text-xs">
          No coupons created yet.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: COUPON CARDS (NO HORIZONTAL SCROLLBAR) */}
          <div className="md:hidden space-y-2.5">
            {coupons.map((coupon: any) => (
              <div
                key={coupon.id}
                className="border border-[#222222] rounded-xl bg-[#181818] p-3.5 space-y-2.5 hover:border-[#333333] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-100 font-bold text-sm">{coupon.code}</span>
                    <span className="font-bold text-xs text-white font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                      {coupon.discount_percent}% OFF
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    coupon.is_active ? 'bg-white/10 text-white border border-white/20' : 'bg-[#222222] text-zinc-400 border border-zinc-700'
                  }`}>
                    {coupon.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-[#222222]">
                  <div>
                    Uses: {coupon.max_uses ? `${coupon.current_uses || 0}/${coupon.max_uses}` : 'Unlimited'}
                  </div>
                  <div className="text-zinc-500">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No Expiry'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCoupon({ ...coupon })
                        setShowCouponModal(true)
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCouponDelete(coupon.id, coupon.code)}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60 transition-all cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: DATA TABLE */}
          <div className="hidden md:block border border-[#222222] rounded-xl bg-[#181818] overflow-x-auto shadow-md">
            <table className="w-full text-left text-xs font-sans border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#141414] border-b border-[#222222] text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4 text-center">Discount</th>
                  <th className="p-4 text-center">Uses / Limits</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Expiration Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]">
                {coupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4 text-white font-bold text-sm tracking-wider">
                      <div className="font-mono text-zinc-100 font-bold">{coupon.code}</div>
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5 font-sans">
                        {coupon.applicable_items && coupon.applicable_items.length > 0 
                          ? `${coupon.applicable_items.length} Specific Items` 
                          : 'All Store Products'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-sm text-white font-mono">
                        {coupon.discount_percent}% OFF
                      </span>
                    </td>
                    <td className="p-4 text-center text-zinc-300 font-mono text-[11px]">
                      {coupon.max_uses ? `${coupon.current_uses || 0} / ${coupon.max_uses}` : 'Unlimited'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        coupon.is_active ? 'bg-white/10 text-white border border-white/20' : 'bg-[#222222] text-zinc-400 border border-zinc-700'
                      }`}>
                        {coupon.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-zinc-400 font-mono text-[10px]">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No Expiry'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCoupon({ ...coupon })
                            setShowCouponModal(true)
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCouponDelete(coupon.id, coupon.code)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60 transition-all cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DRAWER: COUPON DETAILS */}
      {showCouponModal && activeCoupon && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleCouponSave}
            className="w-full max-w-md border border-[#282828] bg-[#181818] rounded-xl p-6 sm:p-7 shadow-2xl relative font-sans text-xs"
          >
            <button
              type="button"
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#202020] hover:bg-[#252525] border border-[#2c2c2c] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              {activeCoupon.id ? 'Edit Coupon' : 'Create Discount Coupon'}
            </h3>

             <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={activeCoupon.code}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. FESTIVAL30"
                  className="w-full bg-[#121212] border border-[#252525] rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold uppercase text-sm tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max="100"
                  required
                  placeholder="e.g. 20 or 99.99"
                  value={activeCoupon.discount_percent !== undefined && activeCoupon.discount_percent !== null ? activeCoupon.discount_percent : ''}
                  onChange={e => {
                    const val = e.target.value
                    setActiveCoupon((prev: any) => ({
                      ...prev,
                      discount_percent: val
                    }))
                  }}
                  className="w-full bg-[#121212] border border-[#252525] rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Max Total Uses</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Infinite"
                    value={activeCoupon.max_uses || ''}
                    onChange={e => setActiveCoupon((prev: any) => ({ ...prev, max_uses: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full bg-[#121212] border border-[#252525] rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Limit Per User</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Infinite"
                    value={activeCoupon.limit_per_user || ''}
                    onChange={e => setActiveCoupon((prev: any) => ({ ...prev, limit_per_user: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full bg-[#121212] border border-[#252525] rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Applicability</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveCoupon((prev: any) => ({ ...prev, applicable_items: null }))}
                    className={`flex-grow p-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${!activeCoupon.applicable_items ? 'bg-white text-black font-bold' : 'bg-[#141414] border border-[#222222] text-zinc-400 hover:text-white'}`}
                  >
                    All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCoupon((prev: any) => ({ ...prev, applicable_items: prev.applicable_items || [] }))}
                    className={`flex-grow p-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${activeCoupon.applicable_items ? 'bg-white text-black font-bold' : 'bg-[#141414] border border-[#222222] text-zinc-400 hover:text-white'}`}
                  >
                    Specific Products
                  </button>
                </div>

                {activeCoupon.applicable_items && (
                  <div className="border border-[#222222] bg-[#141414] rounded-xl p-3 max-h-40 overflow-y-auto space-y-3 font-mono text-[9px]">
                    {packs.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider">Sample Packs</p>
                        {packs.map(pack => {
                          const isChecked = activeCoupon.applicable_items?.includes(pack.id)
                          return (
                            <label key={pack.id} className="flex items-center gap-2 text-zinc-300 font-medium hover:text-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const current = activeCoupon.applicable_items || []
                                  const next = e.target.checked
                                    ? [...current, pack.id]
                                    : current.filter((id: string) => id !== pack.id)
                                  setActiveCoupon((prev: any) => ({ ...prev, applicable_items: next }))
                                }}
                                className="accent-white"
                              />
                              {pack.name}
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {presets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#202020]">
                        <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider">Presets</p>
                        {presets.map(preset => {
                          const isChecked = activeCoupon.applicable_items?.includes(preset.id)
                          return (
                            <label key={preset.id} className="flex items-center gap-2 text-zinc-300 font-medium hover:text-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const current = activeCoupon.applicable_items || []
                                  const next = e.target.checked
                                    ? [...current, preset.id]
                                    : current.filter((id: string) => id !== preset.id)
                                  setActiveCoupon((prev: any) => ({ ...prev, applicable_items: next }))
                                }}
                                className="accent-white"
                              />
                              {preset.name}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Expiration Date</label>
                <input
                  type="datetime-local"
                  value={activeCoupon.expires_at ? activeCoupon.expires_at.slice(0, 16) : ''}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                  className="w-full bg-[#121212] border border-[#252525] rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-medium"
                />
              </div>

              <label className="border border-[#222222] bg-[#141414] rounded-xl p-3 flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={activeCoupon.is_active}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                  className="accent-white"
                />
                Enabled for Checkout
              </label>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full mt-4 bg-white hover:bg-zinc-200 text-black font-bold py-3 rounded-lg cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {saveLoading ? 'Saving...' : (
                  <>
                    <Check className="w-4 h-4 text-black" /> Save Coupon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
