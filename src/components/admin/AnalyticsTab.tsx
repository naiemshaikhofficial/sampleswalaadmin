'use client'

import React from 'react'
import {
  DollarSign,
  Users,
  Activity,
  Layers,
  Coins,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Ticket,
  ShoppingCart,
  Package,
  Heart,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

interface VaultSale {
  pack_name: string
  user_id: string
  created_at: string
  amount: number
  is_usd?: boolean
  original_amount?: number
  converted_amount_inr?: number
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
  usersList?: any[]
  tickets?: any[]
  setActiveTab?: (tab: any) => void
}

export function AnalyticsTab({
  stats,
  filterStartDate,
  filterEndDate,
  filteredMetrics,
  vaultSalesList,
  usersList = [],
  tickets = [],
  setActiveTab
}: AnalyticsTabProps) {
  const [activeMetric, setActiveMetric] = React.useState<'revenue' | 'signups' | 'tickets'>('revenue')
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState<number | null>(null)

  // 1. Group metric data chronologically
  const chartData = React.useMemo(() => {
    const groups: Record<string, number> = {}

    if (activeMetric === 'revenue') {
      vaultSalesList.forEach(s => {
        if (!s.created_at) return
        const d = new Date(s.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const val = s.converted_amount_inr !== undefined ? Number(s.converted_amount_inr) : Number(s.amount || 0)
        groups[dateStr] = (groups[dateStr] || 0) + val
      })
    } else if (activeMetric === 'signups') {
      usersList.forEach(u => {
        if (!u.created_at) return
        const d = new Date(u.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        groups[dateStr] = (groups[dateStr] || 0) + 1
      })
    } else if (activeMetric === 'tickets') {
      tickets.forEach(t => {
        if (!t.created_at) return
        const d = new Date(t.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        groups[dateStr] = (groups[dateStr] || 0) + 1
      })
    }

    const currentYear = new Date().getFullYear()
    return Object.entries(groups)
      .map(([date, value]) => ({
        date,
        value,
        timestamp: new Date(`${date}, ${currentYear}`).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7) // Last 7 active data points
  }, [activeMetric, vaultSalesList, usersList, tickets])

  // Chart summary stats
  const chartSummary = React.useMemo(() => {
    if (chartData.length === 0) return { total: 0, peak: { date: '-', value: 0 }, avg: 0 }
    const total = chartData.reduce((acc, d) => acc + d.value, 0)
    const peak = chartData.reduce((max, d) => (d.value > max.value ? d : max), chartData[0])
    const avg = Math.round(total / chartData.length)
    return { total, peak, avg }
  }, [chartData])

  // SVG layout calculations
  const lineChartPoints = React.useMemo(() => {
    let data = chartData
    if (data.length === 0) {
      data = [
        { date: 'Day 1', value: 0, timestamp: 0 },
        { date: 'Day 2', value: 0, timestamp: 1 },
        { date: 'Day 3', value: 0, timestamp: 2 },
        { date: 'Day 4', value: 0, timestamp: 3 }
      ]
    }

    const width = 760
    const height = 220
    const paddingLeft = 55
    const paddingRight = 25
    const paddingTop = 20
    const paddingBottom = 30

    const graphWidth = width - paddingLeft - paddingRight
    const graphHeight = height - paddingTop - paddingBottom

    const rawMax = Math.max(...data.map(d => d.value), 0)
    // Add headroom
    const maxVal = rawMax === 0 ? (activeMetric === 'revenue' ? 2000 : 10) : Math.ceil(rawMax * 1.15)

    const points = data.map((d, i) => {
      const x = paddingLeft + (data.length > 1 ? (i / (data.length - 1)) * graphWidth : graphWidth / 2)
      const y = height - paddingBottom - (d.value / maxVal) * graphHeight
      return { x, y, date: d.date, value: d.value }
    })

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaPath =
      points.length > 0
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
      graphHeight
    }
  }, [chartData, activeMetric])

  // Detailed calculations for Global KPI Cards
  const kpiDetails = React.useMemo(() => {
    const paidSales = vaultSalesList.filter(s => Number(s.amount) > 0)
    const freeSales = vaultSalesList.filter(s => Number(s.amount) === 0)
    const uniqueBuyers = new Set(vaultSalesList.map(s => s.user_id).filter(Boolean)).size
    const aov = paidSales.length > 0 ? Math.round(stats.totalRevenueINR / paidSales.length) : 0
    const buyerConversion =
      stats.totalUsers > 0 ? ((uniqueBuyers / stats.totalUsers) * 100).toFixed(1) : '0.0'
    const usdOrders = vaultSalesList.filter(s => s.is_usd)
    const downloadsPerUser =
      stats.totalUsers > 0 ? (stats.totalDownloads / stats.totalUsers).toFixed(1) : '0'

    return {
      paidCount: paidSales.length,
      freeCount: freeSales.length,
      uniqueBuyers,
      aov,
      buyerConversion,
      usdCount: usdOrders.length,
      downloadsPerUser
    }
  }, [vaultSalesList, stats])

  // Top Selling Sample Packs
  const topPacks = React.useMemo(() => {
    const counts: Record<string, { revenue: number; sales: number }> = {}
    vaultSalesList.forEach(s => {
      const name = s.pack_name || 'Other Packs'
      const amt = s.converted_amount_inr !== undefined ? Number(s.converted_amount_inr) : Number(s.amount || 0)
      if (!counts[name]) {
        counts[name] = { revenue: 0, sales: 0 }
      }
      counts[name].revenue += amt
      counts[name].sales += 1
    })

    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
  }, [vaultSalesList])

  const totalTopRevenue = React.useMemo(() => {
    return topPacks.reduce((acc, p) => acc + p.revenue, 0) || 1
  }, [topPacks])

  // Quick Store Highlights (Today, Month, Breakdown)
  const quickHighlights = React.useMemo(() => {
    const now = new Date()
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDate = now.getDate()

    let todayRevenue = 0
    let todayOrders = 0
    let monthRevenue = 0
    let monthOrders = 0
    let totalPaidOrders = 0
    let totalFreeDownloads = 0

    vaultSalesList.forEach(s => {
      const amt = s.converted_amount_inr !== undefined ? Number(s.converted_amount_inr) : Number(s.amount || 0)
      if (amt > 0) {
        totalPaidOrders++
      } else {
        totalFreeDownloads++
      }

      if (s.created_at) {
        const d = new Date(s.created_at)
        if (d.getFullYear() === todayYear && d.getMonth() === todayMonth && d.getDate() === todayDate) {
          todayRevenue += amt
          todayOrders++
        }
        if (d.getFullYear() === todayYear && d.getMonth() === todayMonth) {
          monthRevenue += amt
          monthOrders++
        }
      }
    })

    const totalOrdersCount = vaultSalesList.length
    const paidPercentage = totalOrdersCount > 0 ? Math.round((totalPaidOrders / totalOrdersCount) * 100) : 0

    return {
      todayRevenue,
      todayOrders,
      monthRevenue,
      monthOrders,
      totalPaidOrders,
      totalFreeDownloads,
      paidPercentage
    }
  }, [vaultSalesList])

  const activePoint = hoveredPointIndex !== null ? lineChartPoints.points[hoveredPointIndex] : null

  const metricColor =
    activeMetric === 'revenue'
      ? { stroke: '#0074e4', fillGradient: '#0074e4', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
      : activeMetric === 'signups'
      ? { stroke: '#00FF94', fillGradient: '#00FF94', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
      : { stroke: '#BF00FF', fillGradient: '#BF00FF', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }

  return (
    <div className="space-y-5 animate-fadeIn font-mono text-xs">
      
      {/* 🚀 QUICK STORE PERFORMANCE HIGHLIGHTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">Today's Sales</span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-sans font-bold text-base sm:text-xl text-white">
              ₹{quickHighlights.todayRevenue.toLocaleString()}
            </span>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {quickHighlights.todayOrders} {quickHighlights.todayOrders === 1 ? 'order' : 'orders'} today
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">This Month</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-sans font-bold text-base sm:text-xl text-white">
              ₹{quickHighlights.monthRevenue.toLocaleString()}
            </span>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {quickHighlights.monthOrders} {quickHighlights.monthOrders === 1 ? 'order' : 'orders'} this month
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">Paid Ratio</span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-sans font-bold text-base sm:text-xl text-white">
              {quickHighlights.paidPercentage}% <span className="text-xs font-normal text-zinc-400">Paid</span>
            </span>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
              {quickHighlights.totalPaidOrders} paid · {quickHighlights.totalFreeDownloads} free
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">Wishlist</span>
            <div className="p-1 rounded bg-pink-500/10 text-pink-400">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-sans font-bold text-base sm:text-xl text-white">
              {stats.wishlistCount || 0} <span className="text-xs font-normal text-zinc-400">Saved</span>
            </span>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Items saved by users
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ STORE ALERTS & PENDING TASKS (If any open tickets or pending KYCs) */}
      {(stats.openTickets > 0 || stats.pendingKYCs > 0) && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-sans font-semibold text-amber-200">
                Action Required:
              </span>{' '}
              <span className="text-zinc-300">
                {stats.openTickets > 0 && `${stats.openTickets} open support ticket${stats.openTickets > 1 ? 's' : ''}`}
                {stats.openTickets > 0 && stats.pendingKYCs > 0 && ' and '}
                {stats.pendingKYCs > 0 && `${stats.pendingKYCs} artist KYC${stats.pendingKYCs > 1 ? 's' : ''} waiting for approval`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {stats.openTickets > 0 && setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                View Tickets <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {stats.pendingKYCs > 0 && setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('kyc')}
                className="px-2.5 py-1 text-[11px] font-medium bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              >
                Review KYCs <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🎯 FILTERED PERIOD SUMMARY BANNER (Minimalist & Detailed) */}
      {(filterStartDate || filterEndDate) && (
        <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-zinc-200">
                Filtered Period Performance
              </h4>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {filterStartDate || 'Earliest'} → {filterEndDate || 'Latest'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <span className="text-[10px] text-zinc-400 block uppercase font-sans">Period Revenue</span>
              <p className="font-sans font-bold text-base sm:text-lg text-white mt-1">
                ₹{filteredMetrics.revenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <span className="text-[10px] text-zinc-400 block uppercase font-sans">Total Sales</span>
              <p className="font-sans font-bold text-base sm:text-lg text-white mt-1">
                {filteredMetrics.count} <span className="text-xs font-normal text-zinc-400">orders</span>
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <span className="text-[10px] text-zinc-400 block uppercase font-sans">Average Order (AOV)</span>
              <p className="font-sans font-bold text-base sm:text-lg text-white mt-1">
                ₹{filteredMetrics.aov.toLocaleString()}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <span className="text-[10px] text-zinc-400 block uppercase font-sans">Unique Buyers</span>
              <p className="font-sans font-bold text-base sm:text-lg text-white mt-1">
                {filteredMetrics.uniqueBuyersCount} <span className="text-xs font-normal text-zinc-400">users</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* LEFT COLUMN: INTERACTIVE CHART & DISTRIBUTION (2 cols) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          
          {/* 1. PERFORMANCE & VOLATILITY CHART */}
          <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-sm">
            
            {/* Chart Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <h3 className="font-sans font-bold text-sm text-zinc-100">
                    Sales & Growth Trends
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                  Performance and activity over time
                </p>
              </div>

              {/* Segmented Metric Control */}
              <div className="inline-flex items-center bg-black/40 p-1 rounded-lg border border-white/[0.08] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMetric('revenue')
                    setHoveredPointIndex(null)
                  }}
                  className={`px-3 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    activeMetric === 'revenue'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMetric('signups')
                    setHoveredPointIndex(null)
                  }}
                  className={`px-3 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    activeMetric === 'signups'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  New Customers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMetric('tickets')
                    setHoveredPointIndex(null)
                  }}
                  className={`px-3 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    activeMetric === 'tickets'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Support Tickets
                </button>
              </div>
            </div>

            {/* Micro Context Bar (Detailed Summaries) */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-zinc-900/60 text-[11px]">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] block uppercase">Period Total</span>
                  <span className="font-sans font-bold text-sm text-zinc-100">
                    {activeMetric === 'revenue' ? `₹${chartSummary.total.toLocaleString()}` : `${chartSummary.total}`}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-zinc-800" />
                <div>
                  <span className="text-zinc-500 text-[10px] block uppercase">Daily Average</span>
                  <span className="font-sans font-bold text-sm text-zinc-200">
                    {activeMetric === 'revenue' ? `₹${chartSummary.avg.toLocaleString()}` : `${chartSummary.avg}`}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />
                <div className="hidden sm:block">
                  <span className="text-zinc-500 text-[10px] block uppercase">Best Day</span>
                  <span className="font-sans font-semibold text-xs text-zinc-300">
                    {chartSummary.peak.date} ({activeMetric === 'revenue' ? `₹${chartSummary.peak.value.toLocaleString()}` : chartSummary.peak.value})
                  </span>
                </div>
              </div>

              {/* Active Hover / Instruction Pill */}
              <div>
                {activePoint ? (
                  <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1 rounded">
                    <span className="text-zinc-400 text-[10px]">{activePoint.date}:</span>
                    <span className="font-sans font-bold text-xs text-white">
                      {activeMetric === 'revenue' ? `₹${activePoint.value.toLocaleString()}` : `${activePoint.value}`}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Hover points for details
                  </span>
                )}
              </div>
            </div>

            {/* SVG Line & Area Chart (Clean & Collision-Free) */}
            <div className="pt-4 relative">
              {chartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-zinc-500 font-medium text-xs">
                  No transaction or activity data logged for this timeframe
                </div>
              ) : (
                <div className="w-full">
                  <svg
                    viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
                    className="w-full h-auto overflow-visible select-none"
                  >
                    <defs>
                      <linearGradient id="chartGradientMinimal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={metricColor.fillGradient} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={metricColor.fillGradient} stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines & Y-Axis Labels */}
                    {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                      const y = lineChartPoints.height - lineChartPoints.paddingBottom - ratio * lineChartPoints.graphHeight
                      const labelVal = Math.round(ratio * lineChartPoints.maxVal)
                      return (
                        <g key={idx}>
                          <line
                            x1={lineChartPoints.paddingLeft}
                            y1={y}
                            x2={lineChartPoints.width - 20}
                            y2={y}
                            stroke="#222226"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={lineChartPoints.paddingLeft - 8}
                            y={y + 3.5}
                            fill="#71717a"
                            className="text-[9px] font-mono"
                            textAnchor="end"
                          >
                            {activeMetric === 'revenue'
                              ? (labelVal >= 1000 ? `₹${(labelVal / 1000).toFixed(1)}k` : `₹${labelVal}`)
                              : labelVal}
                          </text>
                        </g>
                      )
                    })}

                    {/* Gradient Area Fill */}
                    <path d={lineChartPoints.areaPath} fill="url(#chartGradientMinimal)" />

                    {/* Volatility Path Line */}
                    <path
                      d={lineChartPoints.linePath}
                      fill="none"
                      stroke={metricColor.stroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Vertical Crosshair Line when hovering */}
                    {activePoint && (
                      <line
                        x1={activePoint.x}
                        y1={20}
                        x2={activePoint.x}
                        y2={lineChartPoints.height - lineChartPoints.paddingBottom}
                        stroke="#3f3f46"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Interactive Points (No overlapping text badges!) */}
                    {lineChartPoints.points.map((p, i) => {
                      const isHovered = hoveredPointIndex === i
                      return (
                        <g
                          key={i}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPointIndex(i)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        >
                          {/* Expanded transparent hit area for easy hover */}
                          <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                          {/* Outer glow ring on hover */}
                          {isHovered && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="8"
                              fill={metricColor.stroke}
                              fillOpacity="0.25"
                            />
                          )}

                          {/* Point Dot */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? '5' : '3.5'}
                            fill={isHovered ? '#ffffff' : metricColor.stroke}
                            stroke="#0e0e11"
                            strokeWidth="2"
                            className="transition-all duration-150"
                          />

                          {/* X-Axis Date Label */}
                          <text
                            x={p.x}
                            y={lineChartPoints.height - 10}
                            fill={isHovered ? '#ffffff' : '#71717a'}
                            className="text-[9px] font-mono font-medium transition-colors"
                            textAnchor="middle"
                          >
                            {p.date}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 2. TOP SELLING PRODUCTS */}
          <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-400" />
                <h3 className="font-sans font-bold text-sm text-zinc-100">
                  Top Selling Products
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Top {topPacks.length} by revenue
              </span>
            </div>

            {topPacks.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No product sales recorded yet
              </div>
            ) : (
              <div className="space-y-3.5">
                {topPacks.map((pack, idx) => {
                  const percent = Math.round((pack.revenue / totalTopRevenue) * 100)
                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-zinc-600 font-mono text-[10px] font-semibold">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-zinc-200 font-medium truncate max-w-[140px] sm:max-w-[280px]" title={pack.name}>
                            {pack.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
                          <span className="font-sans font-semibold text-white">
                            ₹{pack.revenue.toLocaleString()}
                          </span>
                          <span className="text-zinc-400 font-mono text-[10px]">
                            ({pack.sales} {pack.sales === 1 ? 'sale' : 'sales'} · {percent}% share)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500 group-hover:bg-blue-400"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: GLOBAL DETAILED KPI CARDS & RECENT ORDERS (1 col) */}
        <div className="space-y-4 sm:space-y-5">
          
          {/* GLOBAL KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-3.5">
            
            {/* Card 1: Total Revenue */}
            <div className="bg-[#0a0a0d] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-4 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                  Total Revenue
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-sans font-bold text-xl sm:text-2xl text-white mt-2 tracking-tight">
                ₹{stats.totalRevenueINR.toLocaleString()}
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
                <span>Avg Order: ₹{kpiDetails.aov.toLocaleString()}</span>
                <span>{kpiDetails.paidCount} paid orders</span>
              </div>
              {kpiDetails.usdCount > 0 && (
                <div className="mt-1 text-[9px] text-emerald-400 font-mono">
                  Includes {kpiDetails.usdCount} international USD orders
                </div>
              )}
            </div>

            {/* Card 2: Total Customers */}
            <div className="bg-[#0a0a0d] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-4 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                  Total Customers
                </span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-sans font-bold text-xl sm:text-2xl text-white mt-2 tracking-tight">
                {stats.totalUsers} <span className="text-sm font-normal text-zinc-400">Customers</span>
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
                <span>{kpiDetails.uniqueBuyers} paying buyers</span>
                <span className="text-emerald-400">{kpiDetails.buyerConversion}% conversion</span>
              </div>
            </div>

            {/* Card 3: Total Orders (Replaced Secure Vault Deliveries) */}
            <div className="bg-[#0a0a0d] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-4 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                  Total Orders
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-sans font-bold text-xl sm:text-2xl text-white mt-2 tracking-tight">
                {kpiDetails.paidCount} <span className="text-sm font-normal text-zinc-400">Paid Orders</span>
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
                <span>₹{stats.totalRevenueINR.toLocaleString()} paid volume</span>
                <span className="text-zinc-400">
                  {kpiDetails.freeCount || (stats.totalDownloads > kpiDetails.paidCount ? stats.totalDownloads - kpiDetails.paidCount : 0)} free claims
                </span>
              </div>
            </div>

            {/* Card 4: Total Products (Replaced Catalog Inventory) */}
            <div className="bg-[#0a0a0d] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-4 transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                  Total Products
                </span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="font-sans font-bold text-xl sm:text-2xl text-white mt-2 tracking-tight">
                {stats.samplePacksCount || 0} <span className="text-sm font-normal text-zinc-400">Products</span>
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 font-mono">
                <span>Published in store</span>
                <span>{stats.wishlistCount || 0} saved in wishlist</span>
              </div>
            </div>

          </div>

          {/* RECENT ORDERS FEED */}
          <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-zinc-400" />
                <h3 className="font-sans font-bold text-xs uppercase tracking-wide text-zinc-200">
                  Recent Orders
                </h3>
              </div>
              {setActiveTab ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('sales')}
                  className="text-[10px] font-sans font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View All Orders <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Latest 5
                </span>
              )}
            </div>

            {!stats.recentVaultSales || stats.recentVaultSales.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs font-mono">
                No orders logged yet
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentVaultSales.map((sale: any, idx: number) => {
                  const isFree = Number(sale.amount) === 0
                  const dateStr = sale.created_at
                    ? new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : ''

                  return (
                    <div
                      key={idx}
                      className="bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-2.5 transition-colors flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <p
                          className="font-sans font-medium text-zinc-200 text-xs truncate max-w-[120px] sm:max-w-[170px]"
                          title={sale.pack_name}
                        >
                          {sale.pack_name}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                          #{sale.user_id ? sale.user_id.slice(0, 8) : 'guest'} · {dateStr}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-sans font-bold text-white text-xs">
                          {sale.is_usd
                            ? `$${Number(sale.original_amount !== undefined ? sale.original_amount : sale.amount).toFixed(2)}`
                            : (isFree ? 'FREE' : `₹${sale.amount}`)}
                        </p>
                        {sale.is_usd && (
                          <span className="text-[9px] text-emerald-400 font-mono block">
                            ≈ ₹{sale.converted_amount_inr?.toLocaleString() || Math.round(Number(sale.amount) * 90)}
                          </span>
                        )}
                        <span
                          className={`inline-block text-[8px] font-sans font-semibold uppercase px-1.5 py-0.5 rounded mt-1 ${
                            isFree
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isFree ? 'Free Download' : 'Paid Order'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
