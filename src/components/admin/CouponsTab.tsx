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
    if (!activeCoupon.code || !activeCoupon.discount_percent) {
      showToast('Coupon code and discount percentage are required!', 'error')
      return
    }

    setSaveLoading(true)
    try {
      const saved = await saveCoupon(activeCoupon)
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
    <div className="space-y-6 animate-fadeIn font-mono">
      <div className="bg-[#121212] p-4 border-4 border-black flex justify-between items-center">
        <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-blue">
          🎟️ COUPON DISCOUNTS
        </h3>
        <button
          onClick={() => {
            setActiveCoupon({
              code: '',
              discount_percent: 15,
              is_active: true,
              expires_at: '',
              applicable_items: null,
              max_uses: null,
              limit_per_user: null
            })
            setShowCouponModal(true)
          }}
          className="comic-button bg-studio-blue hover:bg-studio-blue text-white"
        >
          <Plus className="w-4 h-4" /> ADD DISCOUNT COUPON
        </button>
      </div>

      {/* LIST TABLE OF COUPONS */}
      <div className="border-4 border-black bg-black overflow-x-auto">
        <table className="w-full text-left text-xs uppercase font-black border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black">
              <th className="p-4">COUPON CODE</th>
              <th className="p-4 text-center">DISCOUNT PERCENTAGE</th>
              <th className="p-4 text-center">USES / LIMITS</th>
              <th className="p-4 text-center">STATUS</th>
              <th className="p-4 text-center">EXPIRATION DATE</th>
              <th className="p-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500 uppercase font-black">
                  No coupons created yet.
                </td>
              </tr>
            ) : (
              coupons.map((coupon: any) => (
                <tr key={coupon.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                  <td className="p-4 text-white font-black text-sm tracking-wider">
                    <div>{coupon.code}</div>
                    <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 font-sans">
                      {coupon.applicable_items && coupon.applicable_items.length > 0 
                        ? `🎯 ${coupon.applicable_items.length} SPECIFIC ITEMS` 
                        : '🌎 ALL PRODUCTS'}
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono font-black text-studio-blue text-lg">
                    {coupon.discount_percent}% OFF
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-zinc-400">
                    <div>
                      USES: {coupon.uses_count} / {coupon.max_uses !== null ? coupon.max_uses : '♾️'}
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-1 font-sans">
                      USER LIMIT: {coupon.limit_per_user !== null ? `${coupon.limit_per_user} MAX` : '♾️'}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {coupon.is_active ? (
                      <span className="bg-studio-neon/20 border border-studio-neon text-studio-neon text-[8px] px-2 py-0.5">ACTIVE</span>
                    ) : (
                      <span className="bg-studio-red/20 border border-studio-red text-studio-red text-[8px] px-2 py-0.5">EXPIRED/INACTIVE</span>
                    )}
                  </td>
                  <td className="p-4 text-center font-mono text-zinc-400 font-bold">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'INFINITE / NO EXPIRY'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setActiveCoupon(coupon)
                          setShowCouponModal(true)
                        }}
                        className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCouponDelete(coupon.id, coupon.code)}
                        className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DRAWER: COUPON CRUD DETAILS */}
      {showCouponModal && activeCoupon && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCouponSave}
            className="w-full max-w-md border-4 border-black bg-[#121212] p-6 shadow-premium relative font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-luckiest-guy text-2xl uppercase text-studio-blue mb-6">
              {activeCoupon.id ? '🎟️ edit coupon details' : '🎟️ create discount coupon'}
            </h3>

             <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">COUPON CODE</label>
                <input
                  type="text"
                  required
                  value={activeCoupon.code}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. MAURYA30"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-black uppercase text-sm tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DISCOUNT PERCENTAGE (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={activeCoupon.discount_percent}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, discount_percent: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-black text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">MAX OVERALL USES (OPTIONAL)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="INFINITE"
                    value={activeCoupon.max_uses || ''}
                    onChange={e => setActiveCoupon((prev: any) => ({ ...prev, max_uses: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">LIMIT PER USER (OPTIONAL)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="INFINITE"
                    value={activeCoupon.limit_per_user || ''}
                    onChange={e => setActiveCoupon((prev: any) => ({ ...prev, limit_per_user: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">APPLICABILITY</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveCoupon((prev: any) => ({ ...prev, applicable_items: null }))}
                    className={`flex-grow p-2.5 text-[9px] font-black uppercase border-2 border-black transition-colors ${!activeCoupon.applicable_items ? 'bg-studio-blue text-white' : 'bg-black text-white/40 hover:text-white'}`}
                  >
                    All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCoupon((prev: any) => ({ ...prev, applicable_items: prev.applicable_items || [] }))}
                    className={`flex-grow p-2.5 text-[9px] font-black uppercase border-2 border-black transition-colors ${activeCoupon.applicable_items ? 'bg-studio-blue text-white' : 'bg-black text-white/40 hover:text-white'}`}
                  >
                    Specific Products
                  </button>
                </div>

                {activeCoupon.applicable_items && (
                  <div className="border-2 border-black bg-black p-3 max-h-40 overflow-y-auto space-y-3 font-mono text-[9px]">
                    {/* Sample Packs Group */}
                    {packs.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[8px] text-studio-blue font-black uppercase tracking-wider">📦 Sample Packs</p>
                        {packs.map(pack => {
                          const isChecked = activeCoupon.applicable_items?.includes(pack.id)
                          return (
                            <label key={pack.id} className="flex items-center gap-2 text-zinc-300 font-bold hover:text-white cursor-pointer select-none">
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
                                className="accent-studio-blue"
                              />
                              {pack.name}
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Presets Group */}
                    {presets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <p className="text-[8px] text-studio-pink font-black uppercase tracking-wider">🎹 Presets</p>
                        {presets.map(preset => {
                          const isChecked = activeCoupon.applicable_items?.includes(preset.id)
                          return (
                            <label key={preset.id} className="flex items-center gap-2 text-zinc-300 font-bold hover:text-white cursor-pointer select-none">
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
                                className="accent-studio-pink"
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
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">EXPIRATION TIMESTAMP (OPTIONAL)</label>
                <input
                  type="datetime-local"
                  value={activeCoupon.expires_at ? activeCoupon.expires_at.slice(0, 16) : ''}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-bold"
                />
              </div>

              <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                <input
                  type="checkbox"
                  checked={activeCoupon.is_active}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                  className="accent-studio-blue"
                />
                IS ACTIVE & ENABLED FOR CHECKOUT
              </label>

              <button
                type="submit"
                disabled={saveLoading}
                className="studio-button w-full mt-4 bg-studio-blue text-white font-black"
              >
                {saveLoading ? 'SAVING...' : (
                  <>
                    <Check className="w-4 h-4" /> SAVE DISCOUNT COUPON REGISTER
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
