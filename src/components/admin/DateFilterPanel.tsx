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
    <div className="bg-[#0e0e11] border border-zinc-800/80 rounded-lg p-2.5 sm:p-3 font-mono text-xs shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 mr-1 text-zinc-500 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline font-sans text-[11px] font-semibold text-zinc-400">Period:</span>
          </div>

          <div className="inline-flex flex-wrap items-center bg-zinc-950/80 p-0.5 rounded border border-zinc-800/80 gap-0.5">
            {presets.map(p => {
              const isSelected = !filterStartDate && !filterEndDate && p.key === 'all'
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setQuickRange(p.key)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
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
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded border transition-all cursor-pointer ${
              showDateFilter
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
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
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1 font-sans">
              Start Date
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:border-zinc-600 focus:outline-none transition-colors"
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
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:border-zinc-600 focus:outline-none transition-colors"
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
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:border-zinc-600 focus:outline-none transition-colors"
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
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-1.5 rounded focus:border-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 w-full h-[32px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] font-semibold rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  )
}
