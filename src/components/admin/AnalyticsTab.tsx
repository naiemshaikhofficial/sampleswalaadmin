'use client'

import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Package,
  Flame,
  ShoppingCart,
  Users,
  DollarSign
} from 'lucide-react'
import {
  AnalyticsOverview,
  AnalyticsPacks,
  AnalyticsAttribution,
  AnalyticsFunnel,
  AnalyticsAudience,
  AnalyticsRevenue,
  VaultSale,
  computeFinancialData,
  computeCustomerAnalytics,
  computeProductMetrics,
  computeAttributionData,
  computeAbandonmentData,
  computeSalesRecommendations,
  computeGeographyData
} from './analytics'

interface AnalyticsStats {
  totalRevenueINR: number
  totalUsers: number
  recentVaultSales: VaultSale[]
  totalDownloads: number
  wishlistCount: number
  openTickets: number
  pendingKYCs: number
  samplePacksCount: number
  exchangeRate?: number
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
  packs?: any[]
  coupons?: any[]
  setActiveTab?: (tab: any) => void
  themeMode?: 'dark' | 'white'
  isDateWithinRange?: (date: any) => boolean
}

type AnalyticsSubTab = 'overview' | 'packs' | 'attribution' | 'funnel' | 'audience' | 'revenue'

export function AnalyticsTab({
  stats,
  filterStartDate,
  filterEndDate,
  filteredMetrics,
  vaultSalesList = [],
  usersList = [],
  tickets = [],
  packs = [],
  coupons = [],
  setActiveTab,
  themeMode,
  isDateWithinRange
}: AnalyticsTabProps) {
  // YouTube Studio Sub-Tabs
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('overview')

  const exchangeRate = stats.exchangeRate || 90
  const isPeriodFiltered = Boolean(filterStartDate || filterEndDate)

  // Filter vault sales and users strictly according to active Period (Today, Yesterday, 7D, 30D, Month, Custom)
  const periodFilteredSales = useMemo(() => {
    if (!isDateWithinRange || !isPeriodFiltered) return vaultSalesList
    return vaultSalesList.filter(s => isDateWithinRange(s.created_at))
  }, [vaultSalesList, isDateWithinRange, isPeriodFiltered])

  const periodFilteredUsers = useMemo(() => {
    if (!isDateWithinRange || !isPeriodFiltered) return usersList
    return usersList.filter(u => isDateWithinRange(u.created_at))
  }, [usersList, isDateWithinRange, isPeriodFiltered])

  // 1. Revenue & Financial Computations (Filtered by active Period)
  const financialData = useMemo(() => {
    return computeFinancialData(periodFilteredSales, undefined, exchangeRate)
  }, [periodFilteredSales, exchangeRate])

  // 2. Customer & Audience Analytics (Filtered by active Period)
  const customerAnalytics = useMemo(() => {
    return computeCustomerAnalytics(
      periodFilteredSales,
      isPeriodFiltered ? periodFilteredUsers.length : (stats.totalUsers || 104),
      periodFilteredUsers.length,
      exchangeRate
    )
  }, [periodFilteredSales, isPeriodFiltered, periodFilteredUsers.length, stats.totalUsers, exchangeRate])

  // 3. Product Catalog Metrics (Filtered by active Period: packs sold in window)
  const productAnalytics = useMemo(() => {
    return computeProductMetrics(periodFilteredSales, packs, financialData.grossRevenue, exchangeRate)
  }, [packs, periodFilteredSales, financialData.grossRevenue, exchangeRate])

  // 4. Traffic & Attribution (Filtered by active Period)
  const attributionData = useMemo(() => {
    return computeAttributionData(financialData.grossRevenue)
  }, [financialData.grossRevenue])

  // 5. Checkout & Abandonment (Filtered by active Period)
  const abandonmentData = useMemo(() => {
    return computeAbandonmentData(financialData.totalOrdersCount, financialData.aov)
  }, [financialData.totalOrdersCount, financialData.aov])

  // 6. Automated Smart Sales Recommendations
  const salesRecommendations = useMemo(() => {
    return computeSalesRecommendations(financialData, customerAnalytics, abandonmentData)
  }, [financialData, customerAnalytics, abandonmentData])

  // 7. Geography Data (Filtered by active Period)
  const geographyData = useMemo(() => {
    return computeGeographyData(periodFilteredSales, financialData.grossRevenue)
  }, [periodFilteredSales, financialData.grossRevenue])

  const subTabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'packs' as const, label: 'Packs', icon: Package },
    { id: 'attribution' as const, label: 'Traffic', icon: Flame },
    { id: 'funnel' as const, label: 'Checkout', icon: ShoppingCart },
    { id: 'audience' as const, label: 'Customers', icon: Users },
    { id: 'revenue' as const, label: 'Revenue', icon: DollarSign }
  ]

  return (
    <div className="space-y-4 animate-fadeIn font-sans text-xs">
      {/* SUB-TAB NAVIGATION PILLS */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center sm:justify-center gap-1.5 min-w-max px-2 sm:px-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = subTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm scale-105'
                    : 'bg-[#181818] text-zinc-400 hover:text-white hover:bg-[#222222] border border-[#262626]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ACTIVE PERIOD STATUS BANNER IF FILTERED */}
      {isPeriodFiltered && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-xl font-mono text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-zinc-400">Active Period:</span>
            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {filterStartDate || 'Beginning'} → {filterEndDate || 'Current'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Period Orders: <strong className="text-white">{periodFilteredSales.length}</strong></span>
            <span>Period Gross: <strong className="text-white">₹{financialData.grossRevenue.toLocaleString()} INR</strong></span>
          </div>
        </div>
      )}

      {/* RENDER MODULAR SUB-TAB COMPONENTS */}
      {subTab === 'overview' && (
        <AnalyticsOverview
          financialData={financialData}
          customerAnalytics={customerAnalytics}
          salesRecommendations={salesRecommendations}
          recentSales={stats.recentVaultSales || []}
          vaultSalesList={periodFilteredSales}
          usersList={periodFilteredUsers}
          setActiveTab={setActiveTab}
        />
      )}

      {subTab === 'packs' && (
        <AnalyticsPacks productAnalytics={productAnalytics} />
      )}

      {subTab === 'attribution' && (
        <AnalyticsAttribution
          attributionData={attributionData}
          grossRevenue={financialData.grossRevenue}
        />
      )}

      {subTab === 'funnel' && (
        <AnalyticsFunnel
          abandonmentData={abandonmentData}
          paidOrdersCount={financialData.paidOrdersCount}
          freeOrdersCount={financialData.freeOrdersCount}
        />
      )}

      {subTab === 'audience' && (
        <AnalyticsAudience
          customerAnalytics={customerAnalytics}
          themeMode={themeMode}
        />
      )}

      {subTab === 'revenue' && (
        <AnalyticsRevenue
          financialData={financialData}
          geographyData={geographyData}
          exchangeRate={exchangeRate}
          themeMode={themeMode}
        />
      )}
    </div>
  )
}
