'use client'

import React from 'react'
import {
  ShoppingCart,
  AlertTriangle,
  Compass,
  Mail,
  QrCode
} from 'lucide-react'
import { AbandonmentData } from './types'

interface AnalyticsFunnelProps {
  abandonmentData: AbandonmentData
  paidOrdersCount: number
  freeOrdersCount: number
}

export function AnalyticsFunnel({
  abandonmentData,
  paidOrdersCount,
  freeOrdersCount
}: AnalyticsFunnelProps) {
  return (
    <div className="space-y-4 animate-fadeIn font-sans text-xs">
      <div className="bg-[#181818] border border-[#222222] rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-white" />
              Cart & Checkout Drop-off
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Checkout drop-off rates and recovery opportunities.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Checkout Completion Rate: <strong className="text-white">{(100 - abandonmentData.checkoutAbandonmentRate).toFixed(1)}%</strong>
          </span>
        </div>

        {/* 3 Steps Progression */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Step 1: Intent</span>
              <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">100%</span>
            </div>
            <h5 className="font-bold text-xs text-zinc-200 uppercase tracking-wider font-mono">
              Added to Cart
            </h5>
            <p className="font-mono font-bold text-2xl text-white">
              {abandonmentData.addedToCart.toLocaleString()}
            </p>
            <div className="pt-2 border-t border-[#1c1c1c] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Cart Drop-off Rate:</span>
              <span className="text-white font-bold">{abandonmentData.cartAbandonmentRate}% ({abandonmentData.cartDropoffs} sessions)</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Step 2: Modal Open</span>
              <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">48.4%</span>
            </div>
            <h5 className="font-bold text-xs text-zinc-200 uppercase tracking-wider font-mono">
              Checkout Started
            </h5>
            <p className="font-mono font-bold text-2xl text-white">
              {abandonmentData.checkoutStarted.toLocaleString()}
            </p>
            <div className="pt-2 border-t border-[#1c1c1c] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Checkout Abandonment:</span>
              <span className="text-white font-bold">{abandonmentData.checkoutAbandonmentRate}% ({abandonmentData.checkoutDropoffs} drop-offs)</span>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Step 3: Completion</span>
              <span className="text-white font-bold bg-white/10 px-1.5 py-0.2 rounded border border-white/20">14.2%</span>
            </div>
            <h5 className="font-bold text-xs text-zinc-200 uppercase tracking-wider font-mono">
              Completed Orders
            </h5>
            <p className="font-mono font-bold text-2xl text-white">
              {abandonmentData.completedOrders}
            </p>
            <div className="pt-2 border-t border-[#1c1c1c] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Overall Funnel Success:</span>
              <span className="text-white font-bold">{(100 - abandonmentData.overallDropoffRate).toFixed(1)}% ({paidOrdersCount} paid, {freeOrdersCount} free)</span>
            </div>
          </div>
        </div>

        {/* Financial Impact & Friction Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              Abandoned Opportunity Metrics
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#181818] border border-[#242424] rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Potential Lost Revenue</span>
                <p className="font-bold text-lg text-white font-mono mt-1">
                  ₹{abandonmentData.potentialLostRevenue.toLocaleString()}
                </p>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">{abandonmentData.checkoutDropoffs} uncompleted checkouts</span>
              </div>

              <div className="bg-[#181818] border border-[#242424] rounded-lg p-3">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Avg Abandoned Value</span>
                <p className="font-bold text-lg text-white font-mono mt-1">
                  ₹{abandonmentData.avgAbandonedCartValue.toLocaleString()}
                </p>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">Consistent with AOV</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-white block">Recommended Recovery Automation:</span>
              <div className="flex items-start gap-2 text-[11px] text-zinc-300 bg-[#161616] p-2.5 rounded-lg border border-[#242424]">
                <Mail className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Brevo Abandoned Drip:</strong> Trigger automated email reminders at 1h and 24h with a 10% coupon to recover ~18% of dropped checkouts.
                </span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-zinc-300 bg-[#161616] p-2.5 rounded-lg border border-[#242424]">
                <QrCode className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <span>
                  <strong>1-Tap Instant UPI QR:</strong> Allow desktop and mobile producers to pay immediately without redundant address form filling.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-white" />
              Drop-off Reasons Breakdown
            </h4>

            <div className="space-y-2.5">
              {abandonmentData.frictionReasons.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{f.reason}</span>
                    <div className="font-mono text-right">
                      <span className="text-white font-bold">{f.share}</span>
                      <span className="text-zinc-500 text-[10px] ml-1.5">({f.sessions} sessions)</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden border border-[#242424]">
                    <div className="bg-white h-full rounded-full" style={{ width: f.share }} />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {f.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
