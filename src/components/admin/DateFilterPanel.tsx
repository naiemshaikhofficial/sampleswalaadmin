'use client'

import React from 'react'
import { Calendar, SlidersHorizontal, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react'

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
  const isFilterActive = Boolean(filterStartDate || filterEndDate)

  const presets = [
    { label: 'All Time', key: 'all' },
    { label: 'Today', key: 'today' },
    { label: 'Yesterday', key: 'yesterday' },
    { label: 'Last 7D', key: '7days' },
    { label: 'Last 30D', key: '30days' },
    { label: 'This Month', key: 'month' },
  ] as const

  const handleReset = () => {
    setQuickRange('all')
    showToast('Date filter cleared to All Time', 'warning')
  }

  return (
    <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-2.5 sm:p-3 font-mono text-xs shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Presets Row */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 mr-1 text-zinc-500 text-[11px] flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline font-sans text-[11px] font-semibold text-zinc-400">Period:</span>
          </div>

          <div className="inline-flex items-center bg-black/40 p-0.5 rounded-lg border border-white/[0.08] gap-0.5 flex-shrink-0">
            {presets.map(p => {
              const isSelected = !filterStartDate && !filterEndDate && p.key === 'all'
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setQuickRange(p.key)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.12] text-white shadow-sm border border-white/[0.15]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isFilterActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {filterStartDate || 'Start'} → {filterEndDate || 'Now'}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="ml-1 hover:text-white transition-colors cursor-pointer p-0.5"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all cursor-pointer ${
              showDateFilter
                ? 'bg-white/[0.12] text-white border-white/[0.2]'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
            <span>Custom Range</span>
            {showDateFilter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Collapsible Drawer for Custom Date/Time */}
      {showDateFilter && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 font-sans">
              Start Date
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.08] text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-white/[0.2] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 font-sans">
              Start Time
            </label>
            <input
              type="time"
              value={filterStartTime}
              onChange={e => setFilterStartTime(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.08] text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-white/[0.2] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 font-sans">
              End Date
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.08] text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-white/[0.2] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 font-sans">
              End Time
            </label>
            <input
              type="time"
              value={filterEndTime}
              onChange={e => setFilterEndTime(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.08] text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-white/[0.2] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 w-full h-[32px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-zinc-300 hover:text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  )
}
