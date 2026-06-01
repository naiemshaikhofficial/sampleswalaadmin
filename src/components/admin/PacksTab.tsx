'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Check } from 'lucide-react'
import { saveSamplePack, deleteSamplePack } from '@/app/actions'

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121212] p-4 border-4 border-black">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={packSearch}
            onChange={e => setPackSearch(e.target.value)}
            placeholder="SEARCH PACKS BY TITLE..."
            className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-bold"
          />
        </div>

        <button
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
          className="comic-button bg-studio-neon hover:bg-studio-neon"
        >
          <Plus className="w-4 h-4 text-black" /> NEW PACK INVENTORY
        </button>
      </div>

      {/* LIST TABLE OF PACKS */}
      <div className="border-4 border-black bg-black overflow-x-auto font-sans text-xs">
        <table className="w-full text-left uppercase font-bold border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
              <th className="p-4 w-16">COVER</th>
              <th className="p-4">PACK DETAILS</th>
              <th className="p-4">CATEGORY</th>
              <th className="p-4 text-right">PRICES (INR / USD)</th>
              <th className="p-4 text-center">CREDITS</th>
              <th className="p-4 text-center">RANKING (PRIO)</th>
              <th className="p-4 text-center">FEATURED</th>
              <th className="p-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black font-sans text-xs">
            {packs
              .filter(p => p.name.toLowerCase().includes(packSearch.toLowerCase()))
              .map((pack: any) => {
                const cat = categories.find(c => c.id === pack.category_id)
                return (
                  <tr key={pack.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-zinc-900 border-2 border-black flex-shrink-0 relative overflow-hidden">
                        {pack.cover_url ? (
                          <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-zinc-500">NO IMG</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-sans font-bold text-sm text-zinc-100 normal-case leading-tight">{pack.name}</p>
                      <p className="text-[9px] text-studio-pink mt-1 lowercase font-mono font-medium">{pack.slug}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 text-[9px] font-bold">
                        {cat?.name || 'No category'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      <p className="text-white text-xs">₹{pack.price_inr} <span className="text-[9px] text-zinc-500 line-through">₹{pack.mrp_inr}</span></p>
                      <p className="text-studio-neon mt-0.5 text-[10px]">${pack.price_usd}</p>
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-white font-medium">
                      {pack.bundle_credit_cost} CR
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-studio-pink">
                      {pack.display_rank || 0}
                    </td>
                    <td className="p-4 text-center">
                      {pack.is_featured ? (
                        <span className="bg-studio-neon/20 border border-studio-neon text-studio-neon text-[8px] px-2 py-0.5 font-bold">FEATURED</span>
                      ) : (
                        <span className="text-zinc-600 text-[8px] font-bold">STANDARD</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setActivePack(pack)
                            setShowPackModal(true)
                          }}
                          className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePackDelete(pack.id, pack.name)}
                          className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80 cursor-pointer"
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handlePackSave}
            className="w-full max-w-2xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowPackModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-yellow mb-6">
              {activePack.id ? '📦 edit pack inventory' : '📦 create pack inventory'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PACK TITLE</label>
                <input
                  type="text"
                  required
                  value={activePack.name}
                  onChange={e => handlePackNameChange(e.target.value)}
                  placeholder="e.g. Sitar Masters Volume 1"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SLUG / URL PATH</label>
                <input
                  type="text"
                  required
                  value={activePack.slug}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, slug: e.target.value }))}
                  placeholder="sitar-masters-vol-1"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold lowercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DESCRIPTION</label>
                <textarea
                  value={activePack.description || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about samples counts, recording styles..."
                  rows={3}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PRICE INR (₹)</label>
                <input
                  type="number"
                  required
                  value={activePack.price_inr}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_inr: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">MRP INR (STRIKE-THROUGH)</label>
                <input
                  type="number"
                  value={activePack.mrp_inr || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, mrp_inr: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PRICE USD ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={activePack.price_usd}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_usd: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">BUNDLE CREDIT COST</label>
                <input
                  type="number"
                  required
                  value={activePack.bundle_credit_cost}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, bundle_credit_cost: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">COVER COVER_URL</label>
                <input
                  type="text"
                  value={activePack.cover_url || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, cover_url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">CATEGORY BINDING</label>
                <select
                  value={activePack.category_id || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, category_id: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DISPLAY PRIORITY RANK (MANUAL)</label>
                <input
                  type="number"
                  value={activePack.display_rank || 0}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, display_rank: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">FULL PACK DOWNLOAD URL (DRIVE/CDN)</label>
                <input
                  type="text"
                  value={activePack.full_pack_download_url || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, full_pack_download_url: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              {/* DEMO AUDIO PREVIEW DRAG & DROP ZONE & DYNAMIC PARSER */}
              <div className="md:col-span-2 border-4 border-dashed border-zinc-700 bg-black/40 p-5 relative flex flex-col items-center justify-center min-h-36 transition-all hover:bg-black/60 shadow-premium-sm">
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
                    <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-studio-pink animate-spin flex items-center justify-center">
                      <span className="text-[9px] font-black text-white">{uploadProgress}%</span>
                    </div>
                    <span className="text-[9px] font-black text-studio-pink uppercase animate-pulse">EXTRACTING 80 AUDIO PEAKS VIA WEB AUDIO API...</span>
                  </div>
                ) : waveformPeaks.length > 0 ? (
                  <div className="w-full space-y-3 text-center z-20">
                    <span className="text-[9px] font-black text-studio-neon uppercase">✅ AUDIO WAVEFORM GENERATED</span>
                    
                    {/* Retro pink neo-brutalist waveform graphic */}
                    <div className="h-12 flex items-end justify-center gap-0.5 bg-[#080808] p-2 border-2 border-black shadow-premium-sm">
                      {waveformPeaks.map((peak, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-studio-pink transition-all duration-150"
                          style={{
                            height: `${Math.max(peak * 100, 10)}%`,
                            opacity: 0.3 + peak * 0.7
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-black leading-none">80 digital coordinate array calculated successfully</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5 z-20 pointer-events-none">
                    <p className="text-[10px] font-black text-zinc-300 uppercase">🎵 DEMO TRACK UPLOADER & WAVEFORM ANALYZER</p>
                    <p className="text-[8px] text-zinc-500 uppercase leading-none font-black tracking-wide">DRAG WAV / MP3 FILE HERE TO COMPUTE REAL-TIME AUDIO PEAKS</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_featured}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_featured: e.target.checked }))}
                    className="accent-studio-yellow"
                  />
                  IS FEATURED BOOST
                </label>

                <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_bundle_only}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_bundle_only: e.target.checked }))}
                    className="accent-studio-yellow"
                  />
                  IS BUNDLE ONLY
                </label>
              </div>

              <div className="grid grid-cols-4 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">MELODIES</label>
                  <input type="number" value={activePack.melody_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, melody_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">LOOPS</label>
                  <input type="number" value={activePack.loop_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, loop_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">ONE-SHOTS</label>
                  <input type="number" value={activePack.one_shot_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, one_shot_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">PRESETS</label>
                  <input type="number" value={activePack.preset_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, preset_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="studio-button w-full mt-6 bg-studio-yellow text-black font-black"
            >
              {saveLoading ? 'COMMITTING...' : (
                <>
                  <Check className="w-4 h-4" /> COMMIT PACK DATA TO STORAGE
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
