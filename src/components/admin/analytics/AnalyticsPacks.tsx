'use client'

import React from 'react'
import { Package } from 'lucide-react'
import { ProductMetric } from './types'

interface AnalyticsPacksProps {
  productAnalytics: ProductMetric[]
}

export function AnalyticsPacks({ productAnalytics }: AnalyticsPacksProps) {
  return (
    <div className="space-y-4 animate-fadeIn font-sans text-xs">
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-white" />
              Product-Wise Performance & Catalog Rankings
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Individual sample pack profitability, download conversion, and catalog revenue share.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {productAnalytics.length} Catalog Products Tracked
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-3">
          {productAnalytics.map((pack, idx) => (
            <div
              key={idx}
              className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-[10px] text-zinc-500 font-bold">#{idx + 1}</span>
                  <span className="font-bold text-xs text-white truncate">{pack.name}</span>
                </div>
                <div className="text-right font-mono flex-shrink-0">
                  <span className="text-xs font-bold text-white block">
                    ₹{pack.revenueINR.toLocaleString()}
                  </span>
                  {pack.revenueUSD > 0 && (
                    <span className="text-[10px] text-zinc-400 block">
                      +${pack.revenueUSD.toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono bg-[#181818] p-2 rounded-lg border border-[#222222]">
                <div>
                  <span className="text-zinc-500 block">Paid Orders</span>
                  <span className="text-white font-bold">{pack.paidSales} sales</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Free Claims</span>
                  <span className="text-zinc-300 font-bold">{pack.freeDownloads} claims</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Conv %</span>
                  <span className="text-white font-bold">{pack.conversionRate}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Revenue Share</span>
                  <span>{pack.share}%</span>
                </div>
                <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden border border-[#262626]">
                  <div className="bg-white h-full rounded-full" style={{ width: `${Math.max(pack.share, 4)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-[#222222]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Sample Pack Product</th>
                  <th className="p-3.5 text-right">Revenue (₹)</th>
                  <th className="p-3.5 text-center">Revenue Share</th>
                  <th className="p-3.5 text-center">Paid Orders</th>
                  <th className="p-3.5 text-center">Free Downloads</th>
                  <th className="p-3.5 text-center">Paid Conversion</th>
                  <th className="p-3.5 text-right">Avg Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-xs">
                {productAnalytics.map((pack, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono text-zinc-500 text-[11px]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block truncate max-w-[240px]" title={pack.name}>
                        {pack.name}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      <span className="font-bold text-white block">
                        ₹{pack.revenueINR.toLocaleString()}
                      </span>
                      {pack.revenueUSD > 0 && (
                        <span className="text-[10px] text-zinc-400 block">
                          +${pack.revenueUSD.toFixed(2)} USD
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-2 w-28">
                        <div className="flex-1 bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#262626]">
                          <div className="bg-white h-full rounded-full" style={{ width: `${Math.max(pack.share, 4)}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-zinc-300 w-7 text-right">{pack.share}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-zinc-200">
                      {pack.paidSales}
                    </td>
                    <td className="p-3.5 text-center font-mono text-zinc-400">
                      {pack.freeDownloads}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/20">
                        {pack.conversionRate}%
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-zinc-300">
                      {pack.asp > 0 ? `₹${pack.asp.toLocaleString()}` : 'Free Magnet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
