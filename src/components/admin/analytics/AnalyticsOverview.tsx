'use client'

import React, { useState, useMemo } from 'react'
import {
  DollarSign,
  Users,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Clock,
  ArrowRight,
  Ticket,
  Globe,
  Layers,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  CreditCard
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
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'paid_orders' | 'free_claims' | 'signups'>('revenue')
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)

  // Order Receipt Modal State
  const [activeOrder, setActiveOrder] = useState<any | null>(null)
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyText = (text: string, fieldId: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Chart data aggregation with real data
  const chartData = useMemo(() => {
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

  const chartSummary = useMemo(() => {
    if (chartData.length === 0) return { total: 0, peak: { date: '-', value: 0 }, avg: 0 }
    const total = chartData.reduce((acc, d) => acc + d.value, 0)
    const peak = chartData.reduce((max, d) => (d.value > max.value ? d : max), chartData[0])
    const avg = Math.round(total / chartData.length)
    return { total, peak, avg }
  }, [chartData])

  const lineChartPoints = useMemo(() => {
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

  // Display orders: combine recentSales and enriched vaultSalesList for immediate modal inspection
  const displayedRecentOrders = useMemo(() => {
    if (vaultSalesList.length > 0) {
      return vaultSalesList.slice(0, 6)
    }
    return recentSales.slice(0, 6)
  }, [vaultSalesList, recentSales])

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      {/* 1. TOP 4 PRIMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Gross Revenue Card */}
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
              ₹{financialData.grossRevenue.toLocaleString()} <span className="text-xs text-zinc-500 font-mono font-normal">INR</span>
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Net Earnings: <strong className="text-white">₹{financialData.netRevenue.toLocaleString()}</strong></span>
              <span className="text-white font-bold">{financialData.formattedGrowth}</span>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Total Orders
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              {financialData.totalOrdersCount} <span className="text-xs text-zinc-500 font-mono font-normal">Vault Claims</span>
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Paid: <strong className="text-white">{financialData.paidOrdersCount}</strong> • Free: <strong className="text-zinc-300">{financialData.freeOrdersCount}</strong></span>
              <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
                {Math.round((financialData.paidOrdersCount / (financialData.totalOrdersCount || 1)) * 100)}% Paid
              </span>
            </div>
          </div>
        </div>

        {/* Registered Users Card */}
        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Registered Users
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              {customerAnalytics.totalRegisteredUsers} <span className="text-xs text-zinc-500 font-mono font-normal">Accounts</span>
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Active Vault Users: <strong className="text-white">{customerAnalytics.activeVaultUsersCount}</strong></span>
              <span className="text-white font-bold">{customerAnalytics.overallBuyerConversion}% Conv.</span>
            </div>
          </div>
        </div>

        {/* Avg Order Value Card */}
        <div className="bg-[#181818] border border-[#222222] hover:border-[#2a2a2a] rounded-xl p-4 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Avg Order Value (AOV)
            </span>
            <div className="p-1.5 rounded-lg bg-[#202020] border border-[#2a2a2a] text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-bold text-2xl text-white tracking-tight">
              ₹{financialData.aov.toLocaleString()} <span className="text-xs text-zinc-500 font-mono font-normal">INR</span>
            </h3>
            <div className="mt-2 pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Customer LTV: <strong className="text-white">₹{customerAnalytics.ltv.toLocaleString()}</strong></span>
              <span className="text-zinc-300 font-semibold">{customerAnalytics.repeatBuyerRate}% Repeat</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME OPERATIONAL DEEP DETAILS BREAKDOWN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              Real-Time Operational Deep Breakdown
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Live statistics cross-referenced from registered accounts, order sessions, coupons, and settlements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Panel 1: Registered Users & Customer Analytics */}
          <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-white/5 border border-white/10 text-white">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white">Registered Users</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10 font-bold">
                  {customerAnalytics.totalRegisteredUsers} Total
                </span>
              </div>

              <div className="divide-y divide-[#222222] text-xs pt-1 space-y-1">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Total Registered Accounts</span>
                  <span className="font-bold text-white font-mono">{customerAnalytics.totalRegisteredUsers}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Active In-Vault Customers</span>
                  <span className="font-bold text-white font-mono">{customerAnalytics.activeVaultUsersCount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Unique Paying Buyers</span>
                  <span className="font-bold text-white font-mono">{customerAnalytics.uniquePayingBuyers}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Free-Only Claimers</span>
                  <span className="font-mono text-zinc-300">{customerAnalytics.freeClaimersCount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Repeat Buyers (2+ orders)</span>
                  <span className="font-mono text-white font-bold">{customerAnalytics.repeatBuyersCount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Platform Buyer Conversion</span>
                  <span className="font-bold text-white font-mono">{customerAnalytics.overallBuyerConversion}%</span>
                </div>
              </div>
            </div>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Open Users Directory <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Panel 2: Orders & Settlements Breakdown */}
          <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-white/5 border border-white/10 text-white">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white">Orders & Settlements</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10 font-bold">
                  {financialData.totalOrdersCount} Orders
                </span>
              </div>

              <div className="divide-y divide-[#222222] text-xs pt-1 space-y-1">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Revenue Generating Orders</span>
                  <span className="font-bold text-white font-mono">{financialData.paidOrdersCount} orders</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Free Promotional Claims</span>
                  <span className="font-mono text-zinc-300">{financialData.freeOrdersCount} claims</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Domestic Orders (INR)</span>
                  <span className="font-bold text-white font-mono">
                    ₹{financialData.domesticINR.toLocaleString()} <span className="text-zinc-500 font-normal">({financialData.domesticOrdersCount})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">International Orders (USD)</span>
                  <span className="font-bold text-white font-mono">
                    ${financialData.internationalUSD.toFixed(2)} <span className="text-zinc-500 font-normal">({financialData.internationalOrdersCount})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Cashfree Settlement</span>
                  <span className="font-mono text-zinc-200">
                    ₹{financialData.gatewayBreakdown.cashfree.revenue.toLocaleString()} ({financialData.gatewayBreakdown.cashfree.count})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Razorpay Settlement</span>
                  <span className="font-mono text-zinc-200">
                    ₹{financialData.gatewayBreakdown.razorpay.revenue.toLocaleString()} ({financialData.gatewayBreakdown.razorpay.count})
                  </span>
                </div>
              </div>
            </div>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Open Orders & Sales <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Panel 3: Promo Coupons & Discounts Breakdown */}
          <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#242424]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-white/10 border border-white/20 text-white">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white">Coupons & Discounts</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">
                  {financialData.couponOrdersCount} Applied
                </span>
              </div>

              <div className="divide-y divide-[#222222] text-xs pt-1 space-y-1">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Total Customer Promo Savings</span>
                  <span className="font-bold text-white font-mono">
                    ₹{financialData.totalDiscountsGiven.toLocaleString()} INR
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Orders with Coupon Applied</span>
                  <span className="font-bold text-white font-mono">{financialData.couponOrdersCount} orders</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Avg Savings per Coupon Order</span>
                  <span className="font-mono text-zinc-200">
                    ₹{financialData.couponOrdersCount > 0 ? Math.round(financialData.totalDiscountsGiven / financialData.couponOrdersCount).toLocaleString() : '0'} INR
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Active High-Discount Coupon</span>
                  <span className="font-mono text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
                    PAPA (99% OFF)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Verified Discounted Order</span>
                  <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[150px]">
                    Harshit Pandey (₹10 paid)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-zinc-400">Customer Net Incentive</span>
                  <span className="font-mono text-white font-bold">Maximized</span>
                </div>
              </div>
            </div>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                Manage Promo Coupons <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE TIMELINE CHART */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <h3 className="font-bold text-sm text-white">Store Activity Timeline</h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Daily revenue, orders, and customer registration trends.
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
              User Signups
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-1">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Total in Window</span>
              <span className="font-bold text-white text-sm">
                {activeMetric === 'revenue' ? `₹${chartSummary.total.toLocaleString()} INR` : chartSummary.total}
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
              <span className="text-[10px] text-zinc-500 uppercase block">Peak Day</span>
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
              <span className="text-zinc-500 text-[10px] font-mono">Hover points to see details</span>
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

      {/* 4. LIVE RECENT ORDERS & VAULT ACTIVITY WITH 1-CLICK RECEIPT MODAL */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <h4 className="font-bold text-sm text-white">Recent Orders</h4>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              Click any order to inspect full receipt & coupon details
            </span>
          </div>
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-white hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              View All Orders ({financialData.totalOrdersCount}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {displayedRecentOrders.map((sale: any, idx: number) => {
            const isFree = Number(sale.amount) === 0
            const isUsd = Boolean(sale.is_usd || sale.currency === 'USD')
            const dateStr = sale.created_at
              ? new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''

            const gw = (sale.payment_gateway || '').toLowerCase()
            const gatewayName = (() => {
              if (gw === 'cashfree' || sale.razorpay_order_id?.startsWith('sw_') || sale.razorpay_payment_id?.startsWith('CF_')) return 'Cashfree'
              if (gw === 'paypal' || isUsd) return 'PayPal'
              if (isFree) return 'Free'
              return 'Razorpay'
            })()

            const hasCoupon = Boolean(sale.coupon?.code || sale.coupon_code)
            const couponCode = sale.coupon?.code || sale.coupon_code || ''

            return (
              <div
                key={sale.id || idx}
                onClick={() => {
                  setActiveOrder(sale)
                  setShowOrderModal(true)
                }}
                className="bg-[#121212] border border-[#222222] hover:border-white/30 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-white/[0.03]"
                title="Click to view full transaction receipt"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-zinc-100 truncate" title={sale.pack_name}>
                    {sale.pack_name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                    {resolveCustomerName(sale.buyer_name || '', sale.buyer_email || '')} • {dateStr}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`inline-block text-[8px] font-bold uppercase rounded px-1.5 py-0.5 ${
                      gatewayName === 'Cashfree' ? 'bg-white/10 text-white border border-white/20 font-mono' :
                      gatewayName === 'PayPal' ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono' :
                      isFree ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-white/10 text-white border border-white/20 font-mono'
                    }`}>
                      {gatewayName}
                    </span>
                    {hasCoupon && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase rounded px-1.5 py-0.5 bg-white/15 text-white border border-white/30 font-mono">
                        <Ticket className="w-2.5 h-2.5" />
                        {couponCode}
                        {sale.coupon?.discount_percent ? ` (${sale.coupon.discount_percent}% OFF)` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 font-mono">
                  <span className="font-bold text-white text-xs block">
                    {isUsd
                      ? `$${Number(sale.original_amount !== undefined ? sale.original_amount : sale.amount).toFixed(2)} USD`
                      : (isFree ? 'FREE' : `₹${Number(sale.amount).toLocaleString()} INR`)}
                  </span>
                  <span className={`inline-block text-[9px] uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                    isFree ? 'bg-zinc-800 text-zinc-400' : 'bg-white/10 text-white border border-white/20'
                  }`}>
                    {isFree ? 'Free' : 'Paid'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. TOP AUTOMATED INSIGHTS */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm text-white">Store Strategic Insights</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Actionable Next Steps
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

      {/* 6. ORDER TRANSACTION RECEIPT MODAL */}
      {showOrderModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#181818] border border-[#333333] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowOrderModal(false)
                setActiveOrder(null)
              }}
              className="absolute top-4 right-4 p-1.5 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              Order Transaction Receipt
            </h3>

            {(() => {
              const gw = activeOrder.payment_gateway || ''
              const gatewayTitle = (() => {
                if (gw === 'cashfree' || activeOrder.razorpay_order_id?.startsWith('sw_') || activeOrder.razorpay_payment_id?.startsWith('CF_')) return 'Cashfree'
                if (gw === 'paypal' || activeOrder.is_usd) return 'PayPal'
                if (gw === 'free' || activeOrder.razorpay_order_id?.startsWith('SW_FREE')) return 'Internal Free'
                return 'Razorpay'
              })()

              const hasCoupon = Boolean(activeOrder.coupon?.code || activeOrder.coupon_code)
              const couponCode = (activeOrder.coupon?.code || activeOrder.coupon_code || '').toUpperCase()
              const paidAmount = Number(activeOrder.amount || 0)
              const origPrice = Number(activeOrder.original_price ?? (activeOrder.is_usd ? 14.99 : 999))
              const discountAmt = Number(
                activeOrder.discount_amount ?? 
                (hasCoupon ? Math.max(0, origPrice - paidAmount) : Math.max(0, origPrice - paidAmount))
              )
              const discountPct = activeOrder.coupon?.discount_percent || 
                (origPrice > 0 && discountAmt > 0 ? Math.min(100, Math.round((discountAmt / origPrice) * 100)) : 0)

              return (
                <>
                  {/* FINANCIAL & PROMO DISCOUNT BREAKDOWN */}
                  <div className="bg-[#121212] border border-[#252525] rounded-xl p-4 space-y-3 mb-4 font-sans">
                    <div className="flex justify-between items-center text-xs pb-2.5 border-b border-white/[0.06]">
                      <span className="text-zinc-400 font-medium">Original Product Price (M.R.P.)</span>
                      <span className={`font-mono ${hasCoupon || discountAmt > 0 ? 'line-through text-zinc-500 text-xs' : 'text-zinc-200 font-bold'}`}>
                        {activeOrder.is_usd ? `$${origPrice.toFixed(2)} USD` : `₹${origPrice.toLocaleString()} INR`}
                      </span>
                    </div>

                    {/* PROMO COUPON DETAILS */}
                    {(hasCoupon || discountAmt > 0) && (
                      <div className="bg-white/[0.04] border border-white/20 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-white flex-shrink-0" />
                            <div>
                              <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">
                                Promo Coupon Applied
                              </span>
                              <span className="inline-block bg-white/15 text-white px-2 py-0.5 rounded font-mono font-black text-xs border border-white/30 tracking-wide mt-0.5">
                                {couponCode || 'PROMOTIONAL DISCOUNT'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">
                              Discount Applied
                            </span>
                            <span className="text-white font-black text-xs font-mono">
                              {discountPct > 0 ? `${discountPct}% OFF` : 'Special Discount'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10 text-zinc-200 font-mono">
                          <span className="text-[11px]">Total Coupon Savings:</span>
                          <span className="font-bold text-white">
                            -{activeOrder.is_usd ? `$${discountAmt.toFixed(2)} USD` : `₹${discountAmt.toLocaleString()} INR`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* NET SETTLEMENT */}
                    <div className="flex justify-between items-center pt-1">
                      <div>
                        <span className="text-zinc-200 font-bold text-sm block">Final Total Paid</span>
                        {discountAmt > 0 && (
                          <span className="text-[11px] text-zinc-300 font-medium">
                            Customer saved {activeOrder.is_usd ? `$${discountAmt.toFixed(2)}` : `₹${discountAmt.toLocaleString()}`} ({discountPct}% OFF)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        {activeOrder.is_usd ? (
                          <div>
                            <span className="text-white font-black text-base font-mono">
                              ${Number(activeOrder.original_amount !== undefined ? activeOrder.original_amount : activeOrder.amount).toFixed(2)} USD
                            </span>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              ≈ ₹{(activeOrder.converted_amount_inr ?? Math.round(Number(activeOrder.amount) * 90)).toLocaleString()} INR
                            </p>
                          </div>
                        ) : (
                          <span className="text-white font-black text-base font-mono">
                            {paidAmount === 0 ? 'Free Claim (₹0)' : `₹${paidAmount.toLocaleString()} INR`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ORDER TRANSACTION & BUYER METADATA */}
                  <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-2.5 mb-6 text-zinc-300 font-sans">
                    <div className="flex justify-between items-center border-b border-[#222222] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Order ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-mono font-bold text-[11px] select-all">{activeOrder.id}</span>
                        <button
                          type="button"
                          onClick={() => copyText(activeOrder.id, 'orderId')}
                          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedField === 'orderId' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Product Purchased</span>
                      <span className="text-white font-bold text-sm text-right max-w-[280px]">{activeOrder.pack_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Name</span>
                      <span className="text-zinc-100 font-bold">{activeOrder.buyer_name || 'Anonymous'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Email</span>
                      <span className="text-zinc-100 font-mono select-all text-[11px]">{activeOrder.buyer_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Phone</span>
                      <span className="text-zinc-100 font-mono select-all text-[11px]">{activeOrder.buyer_phone || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col space-y-1.5 border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Delivery Address</span>
                      <span className="text-zinc-300 font-mono leading-normal bg-black/40 border border-white/10 p-2.5 rounded-lg text-[10px] select-all">
                        {activeOrder.buyer_address || 'No physical delivery address provided for this order.'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Payment Method</span>
                      <span className="text-zinc-200 font-medium text-[11px]">
                        {activeOrder.payment_method || (activeOrder.is_usd ? 'PayPal (USD)' : 'UPI / Card / NetBanking')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">{gatewayTitle} Order ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-mono tracking-tight text-[10px] select-all">{activeOrder.razorpay_order_id || 'N/A'}</span>
                        {activeOrder.razorpay_order_id && activeOrder.razorpay_order_id !== 'N/A' && (
                          <button
                            type="button"
                            onClick={() => copyText(activeOrder.razorpay_order_id, 'gatewayOrderId')}
                            className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title={`Copy ${gatewayTitle} Order ID`}
                          >
                            {copiedField === 'gatewayOrderId' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">{gatewayTitle} Payment ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-mono tracking-tight text-[10px] select-all">{activeOrder.razorpay_payment_id || 'N/A'}</span>
                        {activeOrder.razorpay_payment_id && activeOrder.razorpay_payment_id !== 'N/A' && (
                          <button
                            type="button"
                            onClick={() => copyText(activeOrder.razorpay_payment_id, 'paymentId')}
                            className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title={`Copy ${gatewayTitle} Payment ID`}
                          >
                            {copiedField === 'paymentId' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Order Timestamp</span>
                      <span className="text-zinc-200 font-mono text-[11px]">
                        {activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </>
              )
            })()}

            <button
              type="button"
              onClick={() => {
                setShowOrderModal(false)
                setActiveOrder(null)
              }}
              className="w-full py-3 bg-[#242424] hover:bg-[#2e2e2e] text-white font-bold rounded-xl border border-[#333333] transition-colors cursor-pointer font-mono text-xs uppercase tracking-wider"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
