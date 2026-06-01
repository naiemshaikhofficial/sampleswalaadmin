'use client'

import React from 'react'
import { DollarSign, Users, Activity, TrendingUp, Sparkles, Layers, Coins, Calendar } from 'lucide-react'

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
  totalDownloads: number
  wishlistCount: number
  openTickets: number
  pendingKYCs: number
  samplePacksCount: number
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
  vaultSalesList: any[]
}

export function AnalyticsTab({
  stats,
  filterStartDate,
  filterEndDate,
  filteredMetrics,
  vaultSalesList
}: AnalyticsTabProps) {

  // Group all vault sales by date for the line chart
  const salesByDate = React.useMemo(() => {
    const groups: Record<string, number> = {}
    vaultSalesList.forEach(s => {
      if (!s.created_at) return
      const d = new Date(s.created_at)
      // Format as "MMM DD" (e.g., "Jun 01")
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      groups[dateStr] = (groups[dateStr] || 0) + Number(s.amount || 0)
    })

    // Sort by chronological order
    return Object.entries(groups)
      .map(([date, amount]) => {
        // Parse date to timestamp for sorting. We append current year.
        const currentYear = new Date().getFullYear()
        const timestamp = new Date(`${date}, ${currentYear}`).getTime()
        return { date, amount, timestamp }
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7) // Show last 7 active sales days
  }, [vaultSalesList])

  // Get SVG coordinate points
  const lineChartPoints = React.useMemo(() => {
    let data = salesByDate
    if (data.length === 0) {
      data = [
        { date: 'Day 1', amount: 0, timestamp: 0 },
        { date: 'Day 2', amount: 0, timestamp: 0 }
      ]
    } else if (data.length === 1) {
      data = [
        { date: 'Day 0', amount: 0, timestamp: 0 },
        ...data
      ]
    }

    const maxVal = Math.max(...data.map(d => d.amount), 500)
    const width = 500
    const height = 150
    const paddingLeft = 45
    const paddingRight = 15
    const paddingTop = 15
    const paddingBottom = 25

    const graphWidth = width - paddingLeft - paddingRight
    const graphHeight = height - paddingTop - paddingBottom

    const points = data.map((d, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * graphWidth
      const y = paddingTop + graphHeight - (d.amount / maxVal) * graphHeight
      return { x, y, date: d.date, amount: d.amount }
    })

    // Create line path "M x1 y1 L x2 y2 ..."
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    // Create fill path for gradient
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`
      : ''

    return {
      points,
      linePath,
      areaPath,
      maxVal,
      width,
      height,
      paddingLeft,
      paddingBottom,
      graphWidth,
      graphHeight
    }
  }, [salesByDate])

  // Top Selling Sample Packs
  const topPacks = React.useMemo(() => {
    const counts: Record<string, { revenue: number; sales: number }> = {}
    vaultSalesList.forEach(s => {
      const name = s.pack_name || 'Other Packs'
      const amt = Number(s.amount || 0)
      if (!counts[name]) {
        counts[name] = { revenue: 0, sales: 0 }
      }
      counts[name].revenue += amt
      counts[name].sales += 1
    })

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4) // Show top 4 bestsellers
  }, [vaultSalesList])

  const maxPackRevenue = React.useMemo(() => {
    return Math.max(...topPacks.map(p => p.revenue), 100)
  }, [topPacks])

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs uppercase">
      
      {/* 🎯 DYNAMIC PERIOD METRICS SUMMARY */}
      {(filterStartDate || filterEndDate) && (
        <div className="border-4 border-black p-5 bg-[#121212] shadow-premium animate-fadeIn relative">
          <div className="absolute top-0 right-0 bg-studio-neon text-black font-black uppercase text-[8px] border-l-4 border-b-4 border-black px-2 py-0.5">
            FILTERED PERIOD ACTIVE
          </div>

          <div className="flex items-center gap-2.5 border-b-2 border-black pb-3 mb-4">
            <Calendar className="w-5 h-5 text-studio-neon" />
            <div>
              <h3 className="font-sans font-black text-sm text-zinc-100 leading-none">
                🎯 DYNAMIC METRICS SUMMARY
              </h3>
              <span className="text-[8px] font-black text-zinc-500 block mt-1 leading-none">
                RANGE: {filterStartDate || 'EARLIEST'} TO {filterEndDate || 'LATEST'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border-2 border-black p-4 relative overflow-hidden group shadow-premium-sm">
              <p className="text-[8px] font-black text-zinc-500 leading-none">PERIOD REVENUE</p>
              <p className="font-sans font-bold text-xl text-studio-pink mt-2 leading-none">
                ₹{filteredMetrics.revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-black border-2 border-black p-4 relative overflow-hidden group shadow-premium-sm">
              <p className="text-[8px] font-black text-zinc-500 leading-none">TOTAL ACQUISITIONS</p>
              <p className="font-sans font-bold text-xl text-studio-neon mt-2 leading-none">
                {filteredMetrics.count} SALES
              </p>
            </div>

            <div className="bg-black border-2 border-black p-4 relative overflow-hidden group shadow-premium-sm">
              <p className="text-[8px] font-black text-zinc-500 leading-none">AVERAGE VALUE (AOV)</p>
              <p className="font-sans font-bold text-xl text-studio-yellow mt-2 leading-none">
                ₹{filteredMetrics.aov.toLocaleString()}
              </p>
            </div>

            <div className="bg-black border-2 border-black p-4 relative overflow-hidden group shadow-premium-sm">
              <p className="text-[8px] font-black text-zinc-500 leading-none">UNIQUE BUYERS</p>
              <p className="font-sans font-bold text-xl text-studio-blue mt-2 leading-none">
                {filteredMetrics.uniqueBuyersCount} USERS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TWO COLUMN INTERACTIVE BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: CHARTS & TREND DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. SALES TREND CHART */}
          <div className="border-4 border-black bg-[#121212] p-5 shadow-premium">
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-studio-pink" />
                <h3 className="font-sans font-black text-sm text-zinc-100 leading-none">
                  📈 REVENUE & SALES VOLATILITY TREND
                </h3>
              </div>
              <span className="text-[8px] font-black text-zinc-500">
                LAST 7 ACTIVE SALES DAYS
              </span>
            </div>

            {/* Inlined custom SVG Chart with zero-bundle footprint */}
            <div className="bg-black border-2 border-black p-4 relative overflow-hidden flex items-center justify-center">
              {salesByDate.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                  AWAITING LOGGED TRANSACTIONS FOR VOLATILITY PATH
                </div>
              ) : (
                <div className="w-full relative">
                  <svg 
                    viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
                    className="w-full h-auto overflow-visible"
                  >
                    <defs>
                      <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF0080" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FF0080" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                      const y = lineChartPoints.height - lineChartPoints.paddingBottom - r * lineChartPoints.graphHeight
                      return (
                        <g key={i}>
                          <line 
                            x1={lineChartPoints.paddingLeft}
                            y1={y}
                            x2={lineChartPoints.width - 15}
                            y2={y}
                            stroke="#1d1d20"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text 
                            x={lineChartPoints.paddingLeft - 8}
                            y={y + 3}
                            fill="#52525b"
                            className="text-[8px] font-mono font-bold"
                            textAnchor="end"
                          >
                            ₹{Math.round(r * lineChartPoints.maxVal)}
                          </text>
                        </g>
                      )
                    })}

                    {/* Gradient Area Path */}
                    <path 
                      d={lineChartPoints.areaPath} 
                      fill="url(#chartAreaGradient)"
                    />

                    {/* Volatility Line Path */}
                    <path 
                      d={lineChartPoints.linePath} 
                      fill="none" 
                      stroke="#FF0080" 
                      strokeWidth="2.5"
                    />

                    {/* Interactive points circles */}
                    {lineChartPoints.points.map((p, i) => (
                      <g key={i}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4" 
                          fill="#00FF94" 
                          stroke="#000000" 
                          strokeWidth="1.5"
                        />
                        <text
                          x={p.x}
                          y={p.y - 8}
                          fill="#ffffff"
                          className="text-[7px] font-mono font-bold"
                          textAnchor="middle"
                        >
                          ₹{p.amount}
                        </text>
                        <text
                          x={p.x}
                          y={lineChartPoints.height - 8}
                          fill="#71717a"
                          className="text-[7px] font-mono font-bold"
                          textAnchor="middle"
                        >
                          {p.date}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 2. BESTSELLING PACKS BAR DISTRIBUTION */}
          <div className="border-4 border-black bg-[#121212] p-5 shadow-premium">
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <Layers className="w-5 h-5 text-studio-neon" />
              <h3 className="font-sans font-black text-sm text-zinc-100 leading-none">
                📊 CATEGORY & PRODUCT SALES SHARE
              </h3>
            </div>

            <div className="space-y-4 bg-black border-2 border-black p-4 shadow-premium-sm">
              {topPacks.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 font-bold text-[10px]">
                  NO PACK TRANSACTIONS LOGGED TO EXTRACT SHARE SUMMARY
                </div>
              ) : (
                topPacks.map((pack, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-zinc-200 truncate max-w-[240px]">{pack.name}</span>
                      <span className="text-studio-neon">₹{pack.revenue.toLocaleString()} ({pack.sales} sales)</span>
                    </div>
                    <div className="w-full bg-[#161618] border-2 border-black h-4 rounded-none overflow-hidden relative">
                      <div 
                        className="h-full bg-studio-pink border-r-2 border-black shadow-[0_0_8px_rgba(255,0,128,0.3)] transition-all duration-500"
                        style={{ width: `${(pack.revenue / maxPackRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: OVERALL KPI NUMBERS & AUDITS */}
        <div className="space-y-6">
          
          {/* GLOBAL KPI CARDS */}
          <div className="space-y-4">
            
            {/* TOTAL REVENUE OVERALL */}
            <div className="border-4 border-black bg-[#121212] p-4 flex items-center gap-4 shadow-premium relative">
              <div className="w-12 h-12 border-2 border-black bg-studio-yellow/15 flex items-center justify-center text-studio-yellow flex-shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[9px] font-black text-zinc-500 leading-none">TOTAL SALES VOLUME</h3>
                <p className="font-sans font-bold text-xl text-white mt-1.5 leading-none">
                  ₹{stats.totalRevenueINR.toLocaleString()}
                </p>
              </div>
            </div>

            {/* TOTAL USERS REGISTRATION */}
            <div className="border-4 border-black bg-[#121212] p-4 flex items-center gap-4 shadow-premium relative">
              <div className="w-12 h-12 border-2 border-black bg-studio-pink/15 flex items-center justify-center text-studio-pink flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[9px] font-black text-zinc-500 leading-none">CUSTOMER REGISTRATIONS</h3>
                <p className="font-sans font-bold text-xl text-white mt-1.5 leading-none">
                  {stats.totalUsers} USERS
                </p>
              </div>
            </div>

            {/* DYNAMIC TOTAL DOWNLOADS */}
            <div className="border-4 border-black bg-[#121212] p-4 flex items-center gap-4 shadow-premium relative">
              <div className="w-12 h-12 border-2 border-black bg-studio-neon/15 flex items-center justify-center text-studio-neon flex-shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[9px] font-black text-zinc-500 leading-none">SECURE ACCESS DOWNLOADS</h3>
                <p className="font-sans font-bold text-xl text-white mt-1.5 leading-none">
                  {stats.totalDownloads || 0} DOWNLOADS
                </p>
              </div>
            </div>

            {/* TOTAL PACKS IN INVENTORY */}
            <div className="border-4 border-black bg-[#121212] p-4 flex items-center gap-4 shadow-premium relative">
              <div className="w-12 h-12 border-2 border-black bg-studio-orange/15 flex items-center justify-center text-studio-orange flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[9px] font-black text-zinc-500 leading-none">INVENTORY SAMPLE PACKS</h3>
                <p className="font-sans font-bold text-xl text-white mt-1.5 leading-none">
                  {stats.samplePacksCount || 0} PACKS
                </p>
              </div>
            </div>

          </div>

          {/* LATEST 5 VAULT ACQUISITIONS LIST */}
          <div className="border-4 border-black bg-[#121212] p-5 shadow-premium">
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-studio-yellow" />
                <h3 className="font-sans font-black text-sm text-zinc-100 leading-none">
                  📦 LATEST VAULT SALES
                </h3>
              </div>
              <span className="text-[8px] font-black bg-black text-studio-pink px-2 py-0.5 border border-black rounded shadow-premium-sm">
                LATEST 5
              </span>
            </div>

            <div className="space-y-3.5">
              {!stats.recentVaultSales || stats.recentVaultSales.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 font-bold text-[10px]">
                  NO ACTIVE ACQUISITIONS IN SYSTEM RECORD
                </div>
              ) : (
                stats.recentVaultSales.map((sale: any, idx: number) => (
                  <div key={idx} className="bg-black border-2 border-black p-3 shadow-premium-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-100 uppercase text-[10px] truncate max-w-[150px] leading-tight" title={sale.pack_name}>
                        {sale.pack_name}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                        BUYER: <span className="text-zinc-400 font-black">{sale.user_id ? `${sale.user_id.slice(0, 8)}` : 'Customer'}</span>
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-sans font-black text-white text-[12px] leading-none">₹{sale.amount || 0}</p>
                      <span className="inline-block text-[7px] font-black uppercase px-1.5 py-0.5 mt-1.5 border border-black bg-studio-pink text-black">
                        PAID
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
