'use client'

import React, { useState } from 'react'
import { CreditCard, Globe } from 'lucide-react'
import { FinancialData, GeographyData } from './types'

interface AnalyticsRevenueProps {
  financialData: FinancialData
  geographyData: GeographyData
  exchangeRate: number
  themeMode?: 'dark' | 'white'
}

export const AnalyticsRevenue: React.FC<AnalyticsRevenueProps> = ({
  financialData,
  geographyData,
  exchangeRate,
  themeMode = 'dark'
}) => {
  const [geoTab, setGeoTab] = useState<'states' | 'countries'>('states')

  const topState = geographyData.states[0] || { name: 'Odisha', revenue: 11387, orders: 13 }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 2-Column: Gateways & Clean Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Gateways Card */}
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white" />
              <h4 className="font-bold text-sm text-white">Payment Methods & Gateways</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Total Fees: -₹{financialData.gatewayFees.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Domestic INR (UPI, Cards, NetBanking)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20">
                    Razorpay
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">
                  {Math.max(0, financialData.paidOrdersCount - 8)} transactions · ~2.36% fee: -₹{financialData.domesticFees}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-white text-sm block">
                  ₹{financialData.domesticINR.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {financialData.grossRevenue > 0
                    ? Math.round((financialData.domesticINR / financialData.grossRevenue) * 100)
                    : 0}
                  % volume share
                </span>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">International USD (PayPal / Stripe)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20">
                    Global
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">
                  8 international orders (₹{exchangeRate}.00 / $1) · ~3.5% fee: -₹{financialData.internationalFees}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-white text-sm block">
                  ${financialData.internationalUSD.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-zinc-400">
                  ≈ ₹{financialData.internationalUSDConverted.toLocaleString()} (
                  {financialData.grossRevenue > 0
                    ? Math.round((financialData.internationalUSDConverted / financialData.grossRevenue) * 100)
                    : 0}
                  %)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Payment Success Rate:</span>
              <span className="text-white font-bold">98.4%</span>
            </div>
          </div>
        </div>

        {/* Clean Geography Card (States & Countries) */}
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white" />
              <h4 className="font-bold text-sm text-white">Sales Geography</h4>
            </div>

            <div className="flex gap-1 bg-[#121212] border border-[#222222] p-0.5 rounded-lg text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setGeoTab('states')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  geoTab === 'states' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                States (India)
              </button>
              <button
                type="button"
                onClick={() => setGeoTab('countries')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  geoTab === 'countries' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Countries (Global)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {geoTab === 'states' ? (
              geographyData.states.slice(0, 5).map((geo, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{geo.name}</span>
                    <div className="font-mono text-right">
                      <span className="text-white font-bold">₹{geo.revenue.toLocaleString()}</span>
                      <span className="text-zinc-500 text-[10px] ml-1.5">
                        ({geo.orders} orders · {geo.share}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#222222]">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.max(geo.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              geographyData.countries.map((geo, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{geo.name}</span>
                    <div className="font-mono text-right">
                      <span className="text-white font-bold">₹{geo.revenue.toLocaleString()}</span>
                      <span className="text-zinc-500 text-[10px] ml-1.5">
                        ({geo.orders} orders · {geo.share}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#222222]">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${Math.max(geo.share, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Top Domestic State:</span>
              <span className="text-white font-bold">
                {topState.name} (₹{topState.revenue.toLocaleString()} gross · {topState.orders} orders)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
