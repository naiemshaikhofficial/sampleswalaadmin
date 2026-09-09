'use client'

import React, { useState, useMemo } from 'react'
import { Crown, Search, Users } from 'lucide-react'
import { CustomerAnalytics, CustomerProfile } from './types'

interface AnalyticsAudienceProps {
  customerAnalytics: CustomerAnalytics
  themeMode?: 'dark' | 'white'
}

type CustomerFilter = 'all' | 'repeat' | 'free_to_paid' | 'high_value' | 'international'

export const AnalyticsAudience: React.FC<AnalyticsAudienceProps> = ({
  customerAnalytics,
  themeMode = 'dark'
}) => {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all')

  // Filtered customer list with instant search and cohort pills
  const filteredCustomers = useMemo(() => {
    return customerAnalytics.allVaultUsers.filter(cust => {
      // 1. Search Query Filter
      if (customerSearch.trim()) {
        const query = customerSearch.toLowerCase().trim()
        const nameMatch = cust.name.toLowerCase().includes(query)
        const emailMatch = cust.email.toLowerCase().includes(query)
        const cityMatch = cust.city.toLowerCase().includes(query)
        const stateMatch = cust.state.toLowerCase().includes(query)
        const countryMatch = cust.country.toLowerCase().includes(query)
        const packMatch = cust.packs.some(p => p.toLowerCase().includes(query))
        if (!nameMatch && !emailMatch && !cityMatch && !stateMatch && !countryMatch && !packMatch) {
          return false
        }
      }

      // 2. Cohort Filter
      if (customerFilter === 'repeat') {
        return cust.paidOrdersCount > 1
      }
      if (customerFilter === 'free_to_paid') {
        return cust.freeClaimsCount > 0 && cust.paidOrdersCount > 0
      }
      if (customerFilter === 'high_value') {
        return cust.totalSpendINR >= 1500
      }
      if (customerFilter === 'international') {
        return cust.isUsdBuyer || cust.country.toLowerCase() !== 'india'
      }

      return true
    })
  }, [customerAnalytics.allVaultUsers, customerSearch, customerFilter])

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Conversion Lifecycle Pipeline */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            Audience Conversion Lifecycle
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">
            Registered → Paying: <strong className="text-white">{customerAnalytics.overallBuyerConversion}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-mono block">STAGE 1</span>
            <span className="font-bold text-xs text-zinc-200 block">Registered</span>
            <p className="font-mono font-bold text-lg text-white">{customerAnalytics.totalRegisteredUsers}</p>
            <span className="text-[10px] text-zinc-400 font-mono block">100% database accounts</span>
          </div>
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-mono block">STAGE 2</span>
            <span className="font-bold text-xs text-zinc-200 block">Active Vault</span>
            <p className="font-mono font-bold text-lg text-white">{customerAnalytics.activeVaultUsersCount}</p>
            <span className="text-[10px] text-zinc-400 font-mono block">
              {customerAnalytics.totalRegisteredUsers > 0
                ? ((customerAnalytics.activeVaultUsersCount / customerAnalytics.totalRegisteredUsers) * 100).toFixed(1)
                : '0'}
              % engaged
            </span>
          </div>
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-mono block">STAGE 3</span>
            <span className="font-bold text-xs text-zinc-200 block">Free Claimers</span>
            <p className="font-mono font-bold text-lg text-white">{customerAnalytics.freeClaimersCount}</p>
            <span className="text-[10px] text-zinc-400 font-mono block">Lead magnets</span>
          </div>
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-mono block">STAGE 4</span>
            <span className="font-bold text-xs text-zinc-200 block">Paid Buyers</span>
            <p className="font-mono font-bold text-lg text-white">{customerAnalytics.uniquePayingBuyers}</p>
            <span className="text-[10px] text-white font-mono block font-bold">
              {customerAnalytics.overallBuyerConversion}% conversion
            </span>
          </div>
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-mono block">STAGE 5</span>
            <span className="font-bold text-xs text-zinc-200 block">Repeat VIP</span>
            <p className="font-mono font-bold text-lg text-white">{customerAnalytics.repeatBuyersCount}</p>
            <span className="text-[10px] text-white font-mono block font-bold">
              {customerAnalytics.repeatBuyerRate}% repeat rate
            </span>
          </div>
        </div>
      </div>

      {/* Customer Spenders Directory */}
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-white" />
              Customer Spenders Directory
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Verified customer names, real locations, lifetime spend in INR & USD, and owned packs.
            </p>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Showing {filteredCustomers.length} of {customerAnalytics.allVaultUsers.length} Customers
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search by customer name, city, state, or pack..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#121212] border border-[#242424] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-[#121212] border border-[#222222] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setCustomerFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                customerFilter === 'all' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({customerAnalytics.allVaultUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('repeat')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                customerFilter === 'repeat' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Repeat VIP ({customerAnalytics.repeatBuyersCount})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('free_to_paid')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                customerFilter === 'free_to_paid' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Free → Paid ({customerAnalytics.freeToPaidCount})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('high_value')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                customerFilter === 'high_value' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              High Value (&gt;₹1.5k)
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('international')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                customerFilter === 'international' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Global USD
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-xl border border-[#222222]">
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left font-sans border-collapse min-w-[750px]">
              <thead className="sticky top-0 bg-[#141414] z-10 border-b border-[#242424]">
                <tr className="text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                  <th className="p-3">#</th>
                  <th className="p-3">Customer Profile</th>
                  <th className="p-3">Location (City / State / Country)</th>
                  <th className="p-3 text-center">Status Cohort</th>
                  <th className="p-3 text-center">Paid Orders</th>
                  <th className="p-3 text-center">Free Claims</th>
                  <th className="p-3">Packs Owned</th>
                  <th className="p-3 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020] text-xs">
                {filteredCustomers.map((cust, idx) => {
                  const isRepeat = cust.paidOrdersCount > 1
                  const isFreeToPaid = cust.freeClaimsCount > 0 && cust.paidOrdersCount > 0
                  const isFreeOnly = cust.paidOrdersCount === 0

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono text-zinc-500 text-[11px]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-white block truncate max-w-[180px]">
                          {cust.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 truncate block max-w-[180px]">
                          {cust.email !== 'N/A' ? cust.email : `ID: #${cust.userId.slice(0, 8)}`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-zinc-200 block truncate max-w-[160px]">
                          {[cust.city, cust.state].filter(Boolean).join(', ') || 'India'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 block">
                          {cust.country || 'India'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isRepeat ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white border border-white/20 inline-block font-bold">
                            REPEAT VIP ({cust.paidOrdersCount})
                          </span>
                        ) : isFreeToPaid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#202020] text-zinc-300 border border-[#333] inline-block">
                            FREE → PAID
                          </span>
                        ) : isFreeOnly ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 inline-block">
                            FREE CLAIM
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a1a1a] text-zinc-300 border border-[#2a2a2a] inline-block">
                            BUYER (1)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-white">
                        {cust.paidOrdersCount}
                      </td>
                      <td className="p-3 text-center font-mono text-zinc-400">
                        {cust.freeClaimsCount}
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-zinc-300 block truncate max-w-[200px]" title={cust.packs.join(', ')}>
                          {cust.packs.join(', ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className="font-bold text-white text-xs block">
                          {isFreeOnly ? 'FREE' : `₹${cust.totalSpendINR.toLocaleString()}`}
                        </span>
                        {cust.isUsdBuyer && cust.totalSpendUSD > 0 && (
                          <span className="text-[10px] text-zinc-400 block">
                            (${cust.totalSpendUSD.toFixed(2)} USD)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
