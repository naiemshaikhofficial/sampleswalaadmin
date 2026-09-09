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
  themeMode
}: AnalyticsTabProps) {
  // YouTube Studio Sub-Tabs
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('overview')

  const exchangeRate = stats.exchangeRate || 90

  // 1. Revenue & Financial Computations (100% Real Database Data)
  const financialData = useMemo(() => {
    return computeFinancialData(vaultSalesList, stats.totalRevenueINR, exchangeRate)
  }, [vaultSalesList, stats.totalRevenueINR, exchangeRate])

  // 2. Customer & Audience Analytics
  const customerAnalytics = useMemo(() => {
    return computeCustomerAnalytics(vaultSalesList, stats.totalUsers || 96, usersList.length, exchangeRate)
  }, [vaultSalesList, stats.totalUsers, usersList.length, exchangeRate])

  // 3. Product Catalog Metrics
  const productAnalytics = useMemo(() => {
    return computeProductMetrics(vaultSalesList, packs, financialData.grossRevenue, exchangeRate)
  }, [packs, vaultSalesList, financialData.grossRevenue, exchangeRate])

  // 4. Traffic & Attribution
  const attributionData = useMemo(() => {
    return computeAttributionData(financialData.grossRevenue)
  }, [financialData.grossRevenue])

  // 5. Checkout & Abandonment
  const abandonmentData = useMemo(() => {
    return computeAbandonmentData(financialData.totalOrdersCount, financialData.aov)
  }, [financialData.totalOrdersCount, financialData.aov])

  // 6. Automated Smart Sales Recommendations
  const salesRecommendations = useMemo(() => {
    return computeSalesRecommendations(financialData, customerAnalytics, abandonmentData)
  }, [financialData, customerAnalytics, abandonmentData])

  // 7. Geography Data
  const geographyData = useMemo(() => {
    return computeGeographyData(vaultSalesList, financialData.grossRevenue)
  }, [vaultSalesList, financialData.grossRevenue])

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
          {subTabs.map(tab => {
            const Icon = tab.icon
            const isActive = subTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* RENDER MODULAR SUB-TAB COMPONENTS */}
      {subTab === 'overview' && (
        <AnalyticsOverview
          financialData={financialData}
          customerAnalytics={customerAnalytics}
          salesRecommendations={salesRecommendations}
          recentSales={stats.recentVaultSales || []}
          vaultSalesList={vaultSalesList}
          usersList={usersList}
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
