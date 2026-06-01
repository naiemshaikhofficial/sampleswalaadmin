'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Filter, Play, Pause, X, Check } from 'lucide-react'
import { saveSample, deleteSample } from '@/app/actions'

interface SamplesTabProps {
  packs: any[]
  samples: any[]
  playingSampleId: string | null
  playSamplePreview: (id: string, url: string) => void
  packFilter: string
  setPackFilter: (val: string) => void
  sampleSearch: string
  setSampleSearch: (val: string) => void
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
}

export function SamplesTab({
  packs,
  samples,
  playingSampleId,
  playSamplePreview,
  packFilter,
  setPackFilter,
  sampleSearch,
  setSampleSearch,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation
}: SamplesTabProps) {
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [activeSample, setActiveSample] = useState<any>(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const handleSampleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSample.name || !activeSample.pack_id) {
      showToast('Name and Pack are required!', 'error')
      return
    }

    setSaveLoading(true)
    try {
      // Tags need to be saved as an array if they are a comma-separated string
      const tagsArray = typeof activeSample.tags === 'string'
        ? activeSample.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : activeSample.tags

      const saved = await saveSample({
        ...activeSample,
        tags: tagsArray
      })
      showToast(`Sample "${saved.name}" saved successfully!`, 'success')
      addAuditLog(activeSample.id ? 'UPDATE_SAMPLE' : 'CREATE_SAMPLE', `Saved audio sample: ${saved.name}`, 'info')
      setShowSampleModal(false)
      invalidateCacheAndReload('samples')
    } catch (err: any) {
      showToast(err.message || 'Failed to save sample', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSampleDelete = async (id: string, name: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM AUDIO REMOVAL',
      `Are you sure you want to permanently delete the audio sample "${name}" from the system library? This will remove it from the customer search catalog immediately.`,
      true,
      'DELETE AUDIO SAMPLE'
    )
    if (!approved) return
    try {
      await deleteSample(id)
      showToast(`Sample "${name}" deleted!`, 'success')
      addAuditLog('DELETE_SAMPLE', `Deleted audio sample: ${name}`, 'danger')
      invalidateCacheAndReload('samples')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete sample', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#121212] p-4 border-4 border-black">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={sampleSearch}
            onChange={e => setSampleSearch(e.target.value)}
            placeholder="SEARCH BY SAMPLE NAME..."
            className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-bold"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <select
            value={packFilter}
            onChange={e => setPackFilter(e.target.value)}
            className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-black uppercase appearance-none"
          >
            <option value="all">ALL SAMPLE PACKS</option>
            {packs.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Create */}
        <button
          onClick={() => {
            setActiveSample({
              name: '',
              pack_id: packFilter !== 'all' ? packFilter : packs[0]?.id || '',
              audio_url: '',
              download_url: '',
              bpm: 120,
              key: 'C Min',
              credit_cost: 10,
              tags: '',
              is_preview_only: false,
              type: 'loop',
              time_signature: '4/4',
              ai_mood: 'Chill',
              ai_genre: 'Hip Hop',
              ai_description: '',
              ai_vibe_score: 5.0,
              ai_is_processed: false
            })
            setShowSampleModal(true)
          }}
          className="comic-button bg-studio-neon hover:bg-studio-neon py-2.5"
        >
          <Plus className="w-4 h-4 text-black" /> NEW AUDIO SAMPLE
        </button>
      </div>

      {/* LIST TABLE OF SAMPLES */}
      <div className="border-4 border-black bg-black overflow-x-auto">
        <table className="w-full text-left text-xs uppercase font-black border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black">
              <th className="p-4 w-12 text-center">PLAY</th>
              <th className="p-4">SAMPLE NAME</th>
              <th className="p-4">PACK SOURCE</th>
              <th className="p-4 text-center">TYPE</th>
              <th className="p-4 text-center">KEY / BPM</th>
              <th className="p-4 text-center">CREDIT COST</th>
              <th className="p-4 text-center">AI VIBE</th>
              <th className="p-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black">
            {samples.map((sample: any) => (
              <tr key={sample.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                <td className="p-4 text-center">
                  <button
                    onClick={() => playSamplePreview(sample.id, sample.audio_url)}
                    className={`p-2 border-2 border-black rounded-none transition-colors ${
                      playingSampleId === sample.id ? 'bg-studio-pink text-black' : 'bg-white text-black hover:bg-studio-neon'
                    }`}
                  >
                    {playingSampleId === sample.id ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                  </button>
                </td>
                <td className="p-4">
                  <p className="font-bold text-white text-sm normal-case">{sample.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {Array.isArray(sample.tags) ? sample.tags.map((t: string) => (
                      <span key={t} className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 py-0.5 lowercase">{t}</span>
                    )) : sample.tags?.split(',').map((t: string) => (
                      <span key={t} className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 py-0.5 lowercase">{t.trim()}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-zinc-400 font-bold">
                  {sample.sample_packs?.name || 'No pack'}
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-block text-[9px] px-2 py-0.5 border border-black ${
                    sample.type === 'loop' ? 'bg-studio-pink/20 text-studio-pink' : 'bg-studio-neon/20 text-studio-neon'
                  }`}>
                    {sample.type}
                  </span>
                </td>
                <td className="p-4 text-center font-mono font-bold text-zinc-300">
                  {sample.key || 'N/A'} / {sample.bpm || 0} BPM
                </td>
                <td className="p-4 text-center text-white font-mono">
                  {sample.credit_cost} CR
                </td>
                <td className="p-4 text-center">
                  <span className="text-studio-yellow font-black text-xs font-mono">
                    ★ {sample.ai_vibe_score || '0.0'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveSample({
                          ...sample,
                          tags: Array.isArray(sample.tags) ? sample.tags.join(', ') : sample.tags || ''
                        })
                        setShowSampleModal(true)
                      }}
                      className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSampleDelete(sample.id, sample.name)}
                      className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80"
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

      {/* MODAL DRAWER: SAMPLE CRUD DETAILS */}
      {showSampleModal && activeSample && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSampleSave}
            className="w-full max-w-2xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowSampleModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-neon mb-6">
              {activeSample.id ? '🎵 edit sample properties' : '🎵 upload sample properties'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SAMPLE TITLE</label>
                <input
                  type="text"
                  required
                  value={activeSample.name}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sitar Melody Cmin 120"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PARENT SAMPLE PACK</label>
                <select
                  value={activeSample.pack_id}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, pack_id: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                >
                  {packs.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PREVIEW AUDIO URL</label>
                <input
                  type="text"
                  required
                  value={activeSample.audio_url}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, audio_url: e.target.value }))}
                  placeholder="https://drive.google.com/...mp3"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">FULL WAV DOWNLOAD URL (DRIVE/CDN)</label>
                <input
                  type="text"
                  required
                  value={activeSample.download_url}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, download_url: e.target.value }))}
                  placeholder="https://drive.google.com/...wav"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">BPM</label>
                <input
                  type="number"
                  value={activeSample.bpm || ''}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, bpm: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SCALE KEY (e.g. C Min)</label>
                <input
                  type="text"
                  value={activeSample.key || ''}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, key: e.target.value }))}
                  placeholder="C Min"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SAMPLE BINDING TYPE</label>
                <select
                  value={activeSample.type}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                >
                  <option value="loop">Loop (Melody/Drums)</option>
                  <option value="one-shot">One-Shot (Single Hit)</option>
                  <option value="preset">Software Patch/Preset</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SINGLE CREDIT COST</label>
                <input
                  type="number"
                  value={activeSample.credit_cost}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, credit_cost: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={activeSample.tags}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, tags: e.target.value }))}
                  placeholder="sitar, indian, acoustic, Bollywood"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI ENGINE MOOD</label>
                <input type="text" value={activeSample.ai_mood || ''} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_mood: e.target.value }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI ENGINE GENRE</label>
                <input type="text" value={activeSample.ai_genre || ''} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_genre: e.target.value }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI VIBE VALUE SCORE (0-10)</label>
                <input type="number" step="0.1" value={activeSample.ai_vibe_score || 0} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_vibe_score: Number(e.target.value) }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                <input
                  type="checkbox"
                  checked={activeSample.is_preview_only}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, is_preview_only: e.target.checked }))}
                  className="accent-studio-neon"
                />
                IS PREVIEW ONLY (NO DOWNLOAD ALLOWED)
              </label>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="studio-button w-full mt-6 bg-studio-neon text-black font-black"
            >
              {saveLoading ? 'SAVING...' : (
                <>
                  <Check className="w-4 h-4" /> SAVE AUDIO FILE PROPERTIES
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
