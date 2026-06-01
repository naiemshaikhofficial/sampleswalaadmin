import React from 'react'
import { Calendar } from 'lucide-react'

interface DateFilterPanelProps {
  filterStartDate: string
  setFilterStartDate: (val: string) => void
  filterStartTime: string
  setFilterStartTime: (val: string) => void
  filterEndDate: string
  setFilterEndDate: (val: string) => void
  filterEndTime: string
  setFilterEndTime: (val: string) => void
  showDateFilter: boolean
  setShowDateFilter: (val: boolean) => void
  setQuickRange: (range: 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month') => void
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void
}

export function DateFilterPanel({
  filterStartDate,
  setFilterStartDate,
  filterStartTime,
  setFilterStartTime,
  filterEndDate,
  setFilterEndDate,
  filterEndTime,
  setFilterEndTime,
  showDateFilter,
  setShowDateFilter,
  setQuickRange,
  showToast
}: DateFilterPanelProps) {
  return (
    <div className="studio-panel p-5 bg-[#0c0c0c] border border-zinc-800 rounded-lg font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-studio-pink animate-pulse" />
          <div>
            <h4 className="font-sans font-bold text-sm uppercase text-studio-pink tracking-wider">
              📅 DETAILED DATE-TIME RANGE FILTER
            </h4>
            <p className="text-[9px] font-mono uppercase text-zinc-500 font-bold leading-none mt-0.5">
              Filter all business analytics and orders down to the exact minute
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="px-2 py-1 text-[9px] font-mono font-black uppercase bg-[#151515] border border-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            {showDateFilter ? '🙈 COLLAPSE FILTER' : '👁️ SHOW FILTER'}
          </button>
          {(filterStartDate || filterEndDate) && (
            <span className="inline-block text-[8px] bg-studio-neon/20 text-studio-neon border border-studio-neon px-2 py-0.5 font-bold uppercase animate-bounce rounded">
              FILTER ACTIVE
            </span>
          )}
        </div>
      </div>

      {showDateFilter && (
        <div className="space-y-4">
          {/* Quick Presets row */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-zinc-900">
            <span className="text-[9px] font-mono font-black uppercase text-zinc-500 mr-2">QUICK TIME PRESETS:</span>
            {[
              { label: 'ALL TIME', key: 'all' },
              { label: 'TODAY', key: 'today' },
              { label: 'YESTERDAY', key: 'yesterday' },
              { label: 'LAST 7 DAYS', key: '7days' },
              { label: 'LAST 30 DAYS', key: '30days' },
              { label: 'THIS MONTH', key: 'month' },
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => setQuickRange(preset.key as any)}
                className="px-2 py-1 text-[9px] font-mono font-black uppercase bg-black border border-zinc-800 hover:border-studio-pink text-zinc-400 hover:text-white transition-all cursor-pointer rounded"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Form row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="block text-[8px] font-mono font-black text-zinc-400 uppercase">📅 START DATE</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white font-mono font-bold text-xs p-2 outline-none focus:border-studio-pink rounded"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="block text-[8px] font-mono font-black text-zinc-400 uppercase">⏰ START TIME</label>
              <input
                type="time"
                value={filterStartTime}
                onChange={e => setFilterStartTime(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white font-mono font-bold text-xs p-2 outline-none focus:border-studio-pink rounded"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block text-[8px] font-mono font-black text-zinc-400 uppercase">📅 END DATE</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white font-mono font-bold text-xs p-2 outline-none focus:border-studio-pink rounded"
              />
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <label className="block text-[8px] font-mono font-black text-zinc-400 uppercase">⏰ END TIME</label>
              <input
                type="time"
                value={filterEndTime}
                onChange={e => setFilterEndTime(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white font-mono font-bold text-xs p-2 outline-none focus:border-studio-pink rounded"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setQuickRange('all')
                showToast('Filters cleared!', 'warning')
              }}
              className="w-full h-[36px] border border-zinc-800 hover:border-studio-pink hover:bg-studio-pink/10 text-zinc-400 hover:text-white font-sans font-black uppercase text-[9px] tracking-wide transition-all cursor-pointer rounded"
            >
              🔄 RESET RANGE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
