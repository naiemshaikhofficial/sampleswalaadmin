'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Check } from 'lucide-react'
import { saveSamplePack, deleteSamplePack, getLiveExchangeRate } from '@/app/actions'

interface PacksTabProps {
  packs: any[]
  categories: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

export function PacksTab({
  packs,
  categories,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation,
  paletteSelection,
  setPaletteSelection
}: PacksTabProps) {
  const [packSearch, setPackSearch] = useState('')
  const [showPackModal, setShowPackModal] = useState(false)
  const [activePack, setActivePack] = useState<any>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number>(90.0)
  const [rateLoading, setRateLoading] = useState<boolean>(false)

  useEffect(() => {
    getLiveExchangeRate()
      .then(info => {
        if (info?.rate) setExchangeRate(info.rate)
      })
      .catch(err => console.warn('Failed to fetch live exchange rate in PacksTab:', err))
  }, [])

  // Web Audio Waveform Peak Extractor states
  const [analyzingAudio, setAnalyzingAudio] = useState(false)
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const processAudioFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      showToast('Please upload a valid audio preview track (.wav or .mp3)!', 'error')
      return
    }

    setAnalyzingAudio(true)
    setWaveformPeaks([])
    setUploadProgress(10)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 120)

      const arrayBuffer = await file.arrayBuffer()
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) throw new Error('Web Audio API is not supported by your browser')

      const ctx = new AudioCtx()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      
      const channelData = audioBuffer.getChannelData(0)
      const step = Math.ceil(channelData.length / 80)
      const peaks: number[] = []

      for (let i = 0; i < 80; i++) {
        let max = 0
        const start = i * step
        const end = Math.min(start + step, channelData.length)
        
        for (let j = start; j < end; j++) {
          const val = Math.abs(channelData[j])
          if (val > max) max = val
        }
        peaks.push(Number(max.toFixed(3)))
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setWaveformPeaks(peaks)
      showToast('Audio parsed and waveform peaks generated successfully!', 'success')
      
      setActivePack((prev: any) => ({
        ...prev,
        description: `${prev.description || ''}\n\n[Auto Waveform Peaks: ${peaks.slice(0, 8).join(', ')} ...]`
      }))

    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Error processing audio preview', 'error')
    } finally {
      setTimeout(() => {
        setAnalyzingAudio(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'pack') {
      setActivePack(paletteSelection.data)
      setShowPackModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  // Generate automatically slugs for packs
  const handlePackNameChange = (nameStr: string) => {
    const slugged = nameStr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setActivePack((prev: any) => ({ ...prev, name: nameStr, slug: slugged }))
  }

  const handlePackSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePack.name || !activePack.slug) {
      showToast('Name and Slug are required!', 'error')
      return
    }

    setSaveLoading(true)
    try {
      const saved = await saveSamplePack(activePack)
      showToast(`Pack "${saved.name}" saved successfully!`, 'success')
      addAuditLog(activePack.id ? 'UPDATE_PACK' : 'CREATE_PACK', `Saved sample pack: ${saved.name} (Slug: ${saved.slug})`, 'info')
      setShowPackModal(false)
      invalidateCacheAndReload('packs')
    } catch (err: any) {
      showToast(err.message || 'Failed to save pack', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  const handlePackDelete = async (id: string, name: string) => {
    const approved = await askConfirmation(
      '🚨 DANGER - PACK INVENTORY REMOVAL',
      `You are about to permanently delete the sample pack "${name}" and all associated audio samples contained within it. This action CANNOT BE UNDONE.`,
      true,
      'REMOVE PACK INVENTORY'
    )
    if (!approved) return
    try {
      await deleteSamplePack(id)
      showToast(`Pack "${name}" deleted!`, 'success')
      addAuditLog('DELETE_PACK', `Deleted sample pack: ${name}`, 'danger')
      invalidateCacheAndReload('packs')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete pack', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#18181c] p-4 sm:p-5 border border-white/10 rounded-2xl shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={packSearch}
            onChange={e => setPackSearch(e.target.value)}
            placeholder="Search packs by title..."
            className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 pl-10 text-white text-xs outline-none focus:border-white/25 transition-all font-mono"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setActivePack({
              name: '',
              slug: '',
              description: '',
              price_inr: 999,
              price_usd: 12.99,
              bundle_credit_cost: 50,
              cover_url: '',
              category_id: categories[0]?.id || '',
              is_featured: false,
              is_bundle_only: false,
              video_url: '',
              melody_count: 0,
              loop_count: 0,
              one_shot_count: 0,
              preset_count: 0,
              total_credits: 0,
              mrp_inr: 1999
            })
            setShowPackModal(true)
          }}
          className="studio-button bg-[#00FF94] hover:bg-[#00FF94]/90 text-black font-bold border-none shadow-md px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-black" /> Add New Pack
        </button>
      </div>

      {/* LIST TABLE OF PACKS */}
      <div className="border border-white/10 rounded-2xl bg-[#18181c] overflow-x-auto shadow-md font-sans text-xs">
        <table className="w-full text-left font-sans border-collapse">
          <thead>
            <tr className="bg-[#141418] border-b border-white/10 text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">
              <th className="p-4 w-16">Cover</th>
              <th className="p-4">Pack Details</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Price (INR / USD)</th>
              <th className="p-4 text-center">Credits</th>
              <th className="p-4 text-center">Rank</th>
              <th className="p-4 text-center">Featured</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-sans text-xs">
            {packs
              .filter(p => p.name.toLowerCase().includes(packSearch.toLowerCase()))
              .map((pack: any) => {
                const cat = categories.find(c => c.id === pack.category_id)
                return (
                  <tr key={pack.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-white/10 flex-shrink-0 relative overflow-hidden">
                        {pack.cover_url ? (
                          <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-zinc-500">NO IMG</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-sans font-bold text-sm text-zinc-100 leading-tight">{pack.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 lowercase font-mono">{pack.slug}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-white/[0.06] text-zinc-300 border border-white/10 rounded-md px-2 py-0.5 text-[9px] font-mono font-medium">
                        {cat?.name || 'No category'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      <p className="text-white text-xs font-bold">₹{pack.price_inr} <span className="text-[9px] text-zinc-500 line-through">₹{pack.mrp_inr}</span></p>
                      <p className="text-zinc-400 text-[10px] font-medium mt-0.5">${pack.price_usd}</p>
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-white font-medium">
                      {pack.bundle_credit_cost} CR
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-blue-400">
                      {pack.display_rank || 0}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${pack.is_featured ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                        {pack.is_featured ? 'Featured' : 'Standard'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePack({ ...pack })
                            setShowPackModal(true)
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="Edit Pack"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePackDelete(pack.id, pack.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                          title="Delete Pack"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* MODAL DRAWER: PACK CRUD DETAILS */}
      {showPackModal && activePack && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handlePackSave}
            className="w-full max-w-2xl border border-white/15 bg-[#18181c] rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowPackModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600]" />
              {activePack.id ? 'Edit Sample Pack' : 'Create Sample Pack'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Pack Title</label>
                <input
                  type="text"
                  required
                  value={activePack.name}
                  onChange={e => handlePackNameChange(e.target.value)}
                  placeholder="e.g. Sitar Masters Volume 1"
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Slug / URL Path</label>
                <input
                  type="text"
                  required
                  value={activePack.slug}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, slug: e.target.value }))}
                  placeholder="sitar-masters-vol-1"
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold lowercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Description</label>
                <textarea
                  value={activePack.description || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about samples counts, recording styles..."
                  rows={3}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Price INR (₹)</label>
                  {activePack.price_inr > 0 && exchangeRate > 0 && (
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">
                      ≈ ${(activePack.price_inr / exchangeRate).toFixed(2)} USD
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  value={activePack.price_inr}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_inr: Number(e.target.value) }))}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5 tracking-wider">MRP INR (Strike-Through)</label>
                <input
                  type="number"
                  value={activePack.mrp_inr || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, mrp_inr: Number(e.target.value) }))}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Price USD ($)</label>
                  {activePack.price_usd > 0 && exchangeRate > 0 && (
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">
                      ≈ ₹{Math.round(activePack.price_usd * exchangeRate)} INR
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={activePack.price_usd}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_usd: Number(e.target.value) }))}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Full Pack Download URL</label>
                <input
                  type="text"
                  value={activePack.full_pack_download_url || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, full_pack_download_url: e.target.value }))}
                  className="w-full bg-[#141418] border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-white/25 font-bold"
                />
              </div>

              {/* DEMO AUDIO PREVIEW DRAG & DROP ZONE & DYNAMIC PARSER */}
              <div className="md:col-span-2 border border-dashed border-white/15 bg-white/[0.02] rounded-xl p-5 relative flex flex-col items-center justify-center min-h-32 transition-all hover:bg-white/[0.04]">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) processAudioFile(file)
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                
                {analyzingAudio ? (
                  <div className="flex flex-col items-center space-y-3 z-20">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-blue-500 animate-spin flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{uploadProgress}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 animate-pulse">Computing audio waveform peaks...</span>
                  </div>
                ) : waveformPeaks.length > 0 ? (
                  <div className="w-full space-y-2.5 text-center z-20">
                    <span className="text-[10px] font-bold text-[#00FF94]">Audio Waveform Generated</span>
                    
                    <div className="h-10 flex items-end justify-center gap-0.5 bg-black/50 p-2 rounded-lg border border-white/10">
                      {waveformPeaks.map((peak, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-blue-500 rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.max(peak * 100, 10)}%`,
                            opacity: 0.3 + peak * 0.7
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-zinc-500 block">80 audio coordinate points computed</span>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5 z-20 pointer-events-none">
                    <p className="text-[11px] font-bold text-zinc-300">Preview Track & Waveform Analyzer</p>
                    <p className="text-[9px] text-zinc-500">Drag & drop WAV / MP3 file here to compute real-time waveform</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="border border-white/10 bg-[#141418] rounded-xl p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_featured}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_featured: e.target.checked }))}
                    className="accent-amber-400"
                  />
                  Featured Product
                </label>

                <label className="border border-white/10 bg-[#141418] rounded-xl p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_bundle_only}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_bundle_only: e.target.checked }))}
                    className="accent-amber-400"
                  />
                  Bundle Only
                </label>
              </div>

              <div className="grid grid-cols-4 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">MELODIES</label>
                  <input type="number" value={activePack.melody_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, melody_count: Number(e.target.value) }))} className="w-full bg-[#141418] border border-white/10 rounded-lg p-1.5 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">LOOPS</label>
                  <input type="number" value={activePack.loop_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, loop_count: Number(e.target.value) }))} className="w-full bg-[#141418] border border-white/10 rounded-lg p-1.5 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">ONE-SHOTS</label>
                  <input type="number" value={activePack.one_shot_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, one_shot_count: Number(e.target.value) }))} className="w-full bg-[#141418] border border-white/10 rounded-lg p-1.5 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">PRESETS</label>
                  <input type="number" value={activePack.preset_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, preset_count: Number(e.target.value) }))} className="w-full bg-[#141418] border border-white/10 rounded-lg p-1.5 text-center font-bold" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="studio-button w-full mt-6 bg-[#FFE600] hover:bg-[#FFE600]/90 text-black font-bold border-none shadow-md px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saveLoading ? 'Saving...' : (
                <>
                  <Check className="w-4 h-4 text-black" /> Save Pack Changes
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
