'use client'

import React from 'react'
import {
  DollarSign,
  Users,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Clock,
  ArrowRight
} from 'lucide-react'
import {
  FinancialData,
  CustomerAnalytics,
  SalesRecommendation,
  VaultSale
} from './types'
import { resolveCustomerName } from './helpers'

interface AnalyticsOverviewProps {
  financialData: FinancialData
  customerAnalytics: CustomerAnalytics
  salesRecommendations: SalesRecommendation[]
  recentSales: VaultSale[]
  vaultSalesList: VaultSale[]
  usersList?: any[]
  setActiveTab?: (tab: any) => void
}

export function AnalyticsOverview({
  financialData,
  customerAnalytics,
  salesRecommendations,
  recentSales = [],
  vaultSalesList = [],
  usersList = [],
  setActiveTab
}: AnalyticsOverviewProps) {
  const [activeMetric, setActiveMetric] = React.useState<'revenue' | 'paid_orders' | 'free_claims' | 'signups'>('revenue')
  const [hoveredPointIndex, setHoveredPointIndex] = React.useState<number | null>(null)

  // Chart data aggregation
  const chartData = React.useMemo(() => {
    const groups: Record<string, number> = {}

    if (activeMetric === 'revenue') {
      vaultSalesList.forEach(s => {
        if (!s.created_at || Number(s.amount) <= 0) return
        const d = new Date(s.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const val = s.converted_amount_inr !== undefined ? Number(s.converted_amount_inr) : Number(s.amount || 0)
        groups[dateStr] = (groups[dateStr] || 0) + val
      })
    } else if (activeMetric === 'paid_orders') {
      vaultSalesList.forEach(s => {
        if (!s.created_at || Number(s.amount) <= 0) return
        const d = new Date(s.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        groups[dateStr] = (groups[dateStr] || 0) + 1
      })
    } else if (activeMetric === 'free_claims') {
      vaultSalesList.forEach(s => {
        if (!s.created_at || Number(s.amount) > 0) return
        const d = new Date(s.created_at)
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        groups[dateStr] = (groups[dateStr] || 0) + 1
      })
    } else if (activeMetric === 'signups') {
      usersList.forEach(u => {
        if (!u.created_at) return
        const d = new Date(u.created_at)
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
      .slice(-12)
  }, [activeMetric, vaultSalesList, usersList])

  const chartSummary = React.useMemo(() => {
    if (chartData.length === 0) return { total: 0, peak: { date: '-', value: 0 }, avg: 0 }
    const total = chartData.reduce((acc, d) => acc + d.value, 0)
    const peak = chartData.reduce((max, d) => (d.value > max.value ? d : max), chartData[0])
    const avg = Math.round(total / chartData.length)
    return { total, peak, avg }
  }, [chartData])

  const lineChartPoints = React.useMemo(() => {
    let data = chartData
    if (data.length === 0) {
      data = [
        { date: 'Day 1', value: 0, timestamp: 0 },
        { date: 'Day 2', value: 0, timestamp: 1 },
        { date: 'Day 3', value: 0, timestamp: 2 }
      ]
    }

    const width = 760
    const height = 210
    const paddingLeft = 55
    const paddingRight = 25
    const paddingTop = 20
    const paddingBottom = 30

    const graphWidth = width - paddingLeft - paddingRight
    const graphHeight = height - paddingTop - paddingBottom

    const rawMax = Math.max(...data.map(d => d.value), 0)
    const maxVal = rawMax === 0 ? (activeMetric === 'revenue' ? 2000 : 10) : Math.ceil(rawMax * 1.18)

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

  const activePoint = hoveredPointIndex !== null ? lineChartPoints.points[hoveredPointIndex] : null

  return (
    <div className="space-y-5 animate-fadeIn font-sans text-xs">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Gross Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              ₹{financialData.grossRevenue.toLocaleString()}
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>MoM Growth:</span>
              <span className="text-white font-bold">{financialData.formattedGrowth}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Net Profit / Earnings
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              ₹{financialData.netRevenue.toLocaleString()}
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Gateway Fees:</span>
              <span className="text-zinc-300 font-semibold">-₹{financialData.gatewayFees.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Avg Order Value (AOV)
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              ₹{financialData.aov.toLocaleString()}
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Paid Orders Volume:</span>
              <span className="text-white font-bold">{financialData.paidOrdersCount} orders</span>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Customer Lifetime Value
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              ₹{customerAnalytics.ltv.toLocaleString()}
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Repeat Rate:</span>
              <span className="text-white font-bold">{customerAnalytics.repeatBuyerRate}% ({customerAnalytics.repeatBuyersCount} buyers)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Chart */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <h3 className="font-bold text-sm text-white">Store Activity Timeline</h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Exact historical activity plotted from real database transaction records.
            </p>
          </div>

          <div className="flex flex-wrap gap-1 bg-[#121212] border border-[#222222] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => { setActiveMetric('revenue'); setHoveredPointIndex(null) }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'revenue' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => { setActiveMetric('paid_orders'); setHoveredPointIndex(null) }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'paid_orders' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Paid Orders
            </button>
            <button
              type="button"
              onClick={() => { setActiveMetric('free_claims'); setHoveredPointIndex(null) }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'free_claims' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Free Claims
            </button>
            <button
              type="button"
              onClick={() => { setActiveMetric('signups'); setHoveredPointIndex(null) }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeMetric === 'signups' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Signups
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-1">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Total in Window</span>
              <span className="font-bold text-white text-sm">
                {activeMetric === 'revenue' ? `₹${chartSummary.total.toLocaleString()}` : chartSummary.total}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-[#262626]" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Daily Average</span>
              <span className="font-bold text-white text-sm">
                {activeMetric === 'revenue' ? `₹${chartSummary.avg.toLocaleString()}` : chartSummary.avg}
              </span>
            </div>
            <div className="w-[1px] h-6 bg-[#262626] hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[10px] text-zinc-500 uppercase block">Peak Record Day</span>
              <span className="font-bold text-white text-xs">
                {chartSummary.peak.date} ({activeMetric === 'revenue' ? `₹${chartSummary.peak.value.toLocaleString()}` : chartSummary.peak.value})
              </span>
            </div>
          </div>

          <div>
            {activePoint ? (
              <div className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white font-mono text-[11px] flex items-center gap-1.5 shadow-sm">
                <span className="text-zinc-400">{activePoint.date}:</span>
                <span className="font-bold text-white">
                  {activeMetric === 'revenue' ? `₹${activePoint.value.toLocaleString()}` : activePoint.value}
                </span>
              </div>
            ) : (
              <span className="text-zinc-500 text-[10px] font-mono">Hover chart points for exact numbers</span>
            )}
          </div>
        </div>

        <div className="pt-2 relative">
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${lineChartPoints.width} ${lineChartPoints.height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="monoChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
                </linearGradient>
              </defs>

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
                      stroke="#252525"
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

              <path d={lineChartPoints.areaPath} fill="url(#monoChartGradient)" />
              <path
                d={lineChartPoints.linePath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={20}
                  x2={activePoint.x}
                  y2={lineChartPoints.height - lineChartPoints.paddingBottom}
                  stroke="#52525b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {lineChartPoints.points.map((p, i) => {
                const isHovered = hoveredPointIndex === i
                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    <circle cx={p.x} cy={p.y} r="18" fill="transparent" />
                    {isHovered && <circle cx={p.x} cy={p.y} r="8" fill="#ffffff" fillOpacity="0.25" />}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={isHovered ? '#ffffff' : '#181818'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={lineChartPoints.height - 10}
                      fill={isHovered ? '#ffffff' : '#71717a'}
                      className="text-[9px] font-mono font-medium"
                      textAnchor="middle"
                    >
                      {p.date}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Top Automated Insights */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm text-white">Smart Automated Conclusions</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Actionable Intelligence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {salesRecommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 space-y-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-white/10 text-white border border-white/20 font-semibold inline-block">
                {rec.badge}
              </span>
              <h5 className="font-bold text-xs text-white leading-snug">
                {rec.title}
              </h5>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {rec.insight}
              </p>
              <p className="text-[10px] text-zinc-300 font-mono pt-1 border-t border-[#1c1c1c]">
                <strong className="text-white">Action: </strong>{rec.action.replace('Recommended Action: ', '')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Recent Vault Activity */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <h4 className="font-bold text-sm text-white">Real-Time Transactions Stream</h4>
          </div>
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-white hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recentSales.slice(0, 6).map((sale, idx) => {
            const isFree = Number(sale.amount) === 0
            const dateStr = sale.created_at
              ? new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''

            return (
              <div
                key={idx}
                className="bg-[#121212] border border-[#222222] rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-xs text-zinc-100 truncate" title={sale.pack_name}>
                    {sale.pack_name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {resolveCustomerName(sale.buyer_name || '', sale.buyer_email || '')} • {dateStr}
                  </p>
                </div>

                <div className="text-right flex-shrink-0 font-mono">
                  <span className="font-bold text-white text-xs block">
                    {sale.is_usd
                      ? `$${Number(sale.original_amount !== undefined ? sale.original_amount : sale.amount).toFixed(2)} USD`
                      : (isFree ? 'FREE' : `₹${sale.amount}`)}
                  </span>
                  <span className={`inline-block text-[9px] uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                    isFree ? 'bg-zinc-800 text-zinc-400' : 'bg-white/10 text-white border border-white/20'
                  }`}>
                    {isFree ? 'Free Claim' : 'Paid Order'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
