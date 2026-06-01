import React from 'react'
import { DollarSign, Users } from 'lucide-react'

interface VaultSale {
  pack_name: string
  user_id: string
  created_at: string
  amount: number
}

interface AnalyticsStats {
  totalRevenueINR: number
  totalUsers: number
  recentVaultSales: VaultSale[]
}

interface FilteredMetrics {
  revenue: number
  count: number
  aov: number
  uniqueBuyersCount: number
}

interface AnalyticsTabProps {
  stats: AnalyticsStats
  filterStartDate: string
  filterEndDate: string
  filteredMetrics: FilteredMetrics
}

export function AnalyticsTab({
  stats,
  filterStartDate,
  filterEndDate,
  filteredMetrics
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🎯 DYNAMIC PERIOD METRICS SUMMARY */}
      {(filterStartDate || filterEndDate) && (
        <div className="border border-zinc-800 p-5 bg-[#0d0d0d] rounded-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
            <h3 className="font-sans font-black text-xs uppercase text-studio-neon flex items-center gap-2">
              🎯 DYNAMIC METRICS FOR SELECTED PERIOD
            </h3>
            <span className="text-[8px] font-mono font-black text-zinc-500 uppercase">
              TIME-WISE GRANULAR ANALYSIS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-zinc-850 p-4 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-[30px] font-black text-zinc-900 leading-none select-none">₹</div>
              <p className="text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">PERIOD EARNINGS</p>
              <p className="font-sans font-bold text-2xl text-white mt-2 leading-none">
                ₹{filteredMetrics.revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-black border border-zinc-850 p-4 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-[30px] font-black text-zinc-900 leading-none select-none">📦</div>
              <p className="text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">ACQUISITIONS VOLUME</p>
              <p className="font-sans font-bold text-2xl text-white mt-2 leading-none">
                {filteredMetrics.count} SALES
              </p>
            </div>

            <div className="bg-black border border-zinc-850 p-4 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-[30px] font-black text-zinc-900 leading-none select-none">📊</div>
              <p className="text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">AVERAGE ORDER VALUE (AOV)</p>
              <p className="font-sans font-bold text-2xl text-white mt-2 leading-none">
                ₹{filteredMetrics.aov.toLocaleString()}
              </p>
            </div>

            <div className="bg-black border border-zinc-850 p-4 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-[30px] font-black text-zinc-900 leading-none select-none">👤</div>
              <p className="text-[8px] font-mono font-black text-zinc-500 uppercase leading-none">UNIQUE CUSTOMERS</p>
              <p className="font-sans font-bold text-2xl text-white mt-2 leading-none">
                {filteredMetrics.uniqueBuyersCount} BUYERS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATS HEADER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 1. REVENUE CARD */}
        <div className="border border-zinc-800 bg-studio-charcoal p-5 rounded-lg flex items-center gap-4 hover:border-zinc-700 transition-colors">
          <div className="w-12 h-12 bg-studio-yellow/10 rounded flex items-center justify-center text-studio-yellow">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-400">TOTAL COMBINED SALES</h3>
            <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
              ₹{stats.totalRevenueINR.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 2. USERS REGISTERED */}
        <div className="border border-zinc-800 bg-studio-charcoal p-5 rounded-lg flex items-center gap-4 hover:border-zinc-700 transition-colors">
          <div className="w-12 h-12 bg-studio-pink/10 rounded flex items-center justify-center text-studio-pink">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-zinc-400">REGISTERED CUSTOMERS</h3>
            <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
              {stats.totalUsers} USERS
            </p>
          </div>
        </div>
      </div>

      {/* RECENT SALES GRID LAYOUT */}
      <div className="grid grid-cols-1 gap-6">
        {/* SAMPLE PACK SALES (VAULT) */}
        <div className="border border-zinc-800 bg-black p-6 rounded-lg">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
            <h3 className="font-sans font-bold text-lg uppercase text-studio-neon flex items-center gap-2">
              📦 SAMPLE PACK SALES
            </h3>
            <span className="text-[10px] uppercase font-mono font-black bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
              LATEST 5
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {!stats.recentVaultSales || stats.recentVaultSales.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 uppercase font-black">
                No sample pack sales from vault.
              </div>
            ) : (
              stats.recentVaultSales.map((sale: any, idx: number) => (
                <div key={idx} className="bg-black/50 border border-zinc-900 p-3.5 rounded flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white uppercase text-[11px] truncate max-w-[180px]" title={sale.pack_name}>
                      {sale.pack_name}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      BUYER: <span className="text-zinc-500 font-bold">{sale.user_id ? `${sale.user_id.slice(0, 8)}...` : 'Customer'}</span>
                    </p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-white text-[13px]">₹{sale.amount || 0}</p>
                    <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 mt-1 border border-zinc-800 bg-studio-pink/10 text-studio-pink rounded">
                      VAULTED
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
