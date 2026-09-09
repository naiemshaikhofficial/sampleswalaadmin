'use client'

import React from 'react'
import { Flame, Layers, ChevronDown } from 'lucide-react'
import { AttributionSource } from './types'

interface AnalyticsAttributionProps {
  attributionData: AttributionSource[]
  grossRevenue: number
}

export function AnalyticsAttribution({
  attributionData,
  grossRevenue
}: AnalyticsAttributionProps) {
  const [selectedAttributionSource, setSelectedAttributionSource] = React.useState<string | null>(null)

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-xs">
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-white" />
              Traffic Sources & Revenue Attribution
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Multi-touch attribution tracking where your sales originate and which sample packs each source buys.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            100% Attributed Volume: <strong className="text-white">₹{grossRevenue.toLocaleString()}</strong>
          </span>
        </div>

        {/* 5 Channel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {attributionData.map((src, idx) => {
            const isSelected = selectedAttributionSource === src.id

            return (
              <div
                key={idx}
                onClick={() => setSelectedAttributionSource(isSelected ? null : src.id)}
                className={`bg-[#121212] border rounded-xl p-3.5 space-y-2 cursor-pointer transition-all ${
                  isSelected ? 'border-white bg-[#1a1a1a] shadow-sm' : 'border-[#222222] hover:border-[#333333]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold truncate max-w-[120px]">{src.name}</span>
                  <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
                    {src.share}%
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="font-mono font-bold text-base text-white block">
                    ₹{src.revenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono block">
                    {src.orders} orders · {src.conversionRate} conv.
                  </span>
                </div>

                <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden border border-[#262626]">
                  <div className="bg-white h-full rounded-full" style={{ width: `${src.share}%` }} />
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="truncate">Top: <strong className="text-zinc-200">{src.topPack.slice(0, 14)}...</strong></span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-180 text-white' : 'text-zinc-500'}`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Source -> Product -> Revenue Drilldown Table */}
        <div className="overflow-hidden rounded-xl border border-[#222222] mt-4">
          <div className="bg-[#141414] p-3 border-b border-[#242424] flex items-center justify-between">
            <span className="font-bold text-xs text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Source → Product → Revenue Drilldown Mapping
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {selectedAttributionSource ? `Filtered by ${selectedAttributionSource.toUpperCase()}` : 'Showing all channel sales'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#161616] border-b border-[#222222] text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                  <th className="p-3">Traffic Channel</th>
                  <th className="p-3">Sample Pack Purchased</th>
                  <th className="p-3 text-center">Orders</th>
                  <th className="p-3 text-right">Revenue Generated</th>
                  <th className="p-3 text-center">Channel Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] text-xs">
                {attributionData
                  .filter(s => !selectedAttributionSource || s.id === selectedAttributionSource)
                  .flatMap((src) =>
                    src.products.map((prod, pIdx) => {
                      const prodShare = src.revenue > 0 ? Math.round((prod.revenue / src.revenue) * 100) : 0

                      return (
                        <tr key={`${src.id}-${pIdx}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 font-medium text-white">
                            <span className="block font-bold">{src.name}</span>
                            <span className="text-[10px] font-mono text-zinc-500">{src.channelType}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-zinc-200 block truncate max-w-[240px]">
                              {prod.name}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-white">
                            {prod.orders}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            {prod.revenue > 0 ? `₹${prod.revenue.toLocaleString()}` : 'Free Magnet'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/20">
                              {prodShare}%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
