'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, X, Download, Ticket, Copy, Check } from 'lucide-react'
import { getShortSampleName } from '@/lib/formatUtils'

interface SalesTabProps {
  vaultSalesList: any[]
  isDateWithinRange: (date: any) => boolean
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

export function SalesTab({
  vaultSalesList,
  isDateWithinRange,
  paletteSelection,
  setPaletteSelection
}: SalesTabProps) {
  const [salesSearch, setSalesSearch] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [activeOrder, setActiveOrder] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyText = (text: string, field: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    setCurrentPage(1)
  }, [salesSearch])

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'order') {
      setActiveOrder(paletteSelection.data)
      setShowOrderModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const filteredSales = vaultSalesList.filter(s => {
    // Apply Date/Time-wise Filter
    if (!isDateWithinRange(s.created_at)) return false

    const searchLower = salesSearch.toLowerCase()
    return (
      (s.pack_name || '').toLowerCase().includes(searchLower) ||
      (s.buyer_name || '').toLowerCase().includes(searchLower) ||
      (s.buyer_email || '').toLowerCase().includes(searchLower) ||
      (s.buyer_address || '').toLowerCase().includes(searchLower) ||
      (s.razorpay_order_id || '').toLowerCase().includes(searchLower) ||
      (s.razorpay_payment_id || '').toLowerCase().includes(searchLower)
    )
  })

  const handleExportCSV = () => {
    if (filteredSales.length === 0) return

    // Define CSV Headers
    const headers = [
      'Order ID',
      'Product',
      'Original M.R.P.',
      'Coupon Code',
      'Discount Amount',
      'Final Amount Paid',
      'Currency',
      'Payment Gateway',
      'Converted Amount (INR)',
      'Exchange Rate',
      'Buyer Name',
      'Email',
      'Phone',
      'Address',
      'Order ID (Gateway)',
      'Payment ID (Gateway)',
      'Timestamp'
    ]
    
    // Form row records
    const rows = filteredSales.map(s => {
      const origPrice = s.original_price ?? (s.is_usd ? 14.99 : 999)
      const couponCode = s.coupon?.code || s.coupon_code || ''
      const discountAmt = s.discount_amount ?? (couponCode ? Math.max(0, origPrice - Number(s.amount || 0)) : 0)
      const gateway = s.payment_gateway || (s.is_usd ? 'paypal' : s.razorpay_order_id?.startsWith('sw_') ? 'cashfree' : 'razorpay')

      return [
        s.id || '',
        `"${(s.pack_name || '').replace(/"/g, '""')}"`,
        origPrice,
        couponCode ? `"${couponCode}"` : '',
        discountAmt,
        s.original_amount !== undefined ? s.original_amount : (s.amount || 0),
        s.currency || (s.is_usd ? 'USD' : 'INR'),
        gateway,
        s.converted_amount_inr !== undefined ? s.converted_amount_inr : (s.amount || 0),
        s.exchange_rate || '',
        `"${(s.buyer_name || '').replace(/"/g, '""')}"`,
        s.buyer_email || '',
        s.buyer_phone || '',
        `"${(s.buyer_address || '').replace(/"/g, '""')}"`,
        s.razorpay_order_id || '',
        s.razorpay_payment_id || '',
        new Date(s.created_at).toLocaleString()
      ]
    })

    // Join to single CSV content string
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    // Create secure browser download URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `sampleswala_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl shadow-sm">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">
            Orders & Sales Receipts
          </h3>
          <p className="text-zinc-400 mt-0.5 text-xs font-medium font-sans">
            Complete breakdown of store orders, customer delivery details, and payment settlements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-[#202020] hover:bg-[#282828] text-white border border-[#2e2e2e] px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" /> Export CSV
          </button>
          <div className="relative font-sans">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search orders by product, buyer, email..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs outline-none focus:border-white w-64 md:w-80 font-mono transition-colors"
            />
          </div>
        </div>
      </div>

      {/* SALES DATA GRID */}
      {filteredSales.length === 0 ? (
        <div className="border border-[#222222] rounded-xl bg-[#181818] p-8 text-center text-zinc-500 font-sans text-xs">
          No sales transactions logged.
        </div>
      ) : (() => {
        const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
        const paginatedSales = filteredSales.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )

        return (
          <>
            {/* MOBILE VIEW: SLEEK ORDER CARDS (NO HORIZONTAL SCROLLBAR) */}
            <div className="md:hidden space-y-2.5">
              {paginatedSales.map((s: any) => {
                const shortTitle = getShortSampleName(s.pack_name)
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveOrder(s)
                      setShowOrderModal(true)
                    }}
                    className="border border-[#222222] rounded-xl bg-[#181818] p-3.5 space-y-2.5 cursor-pointer hover:border-[#333333] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-zinc-100 truncate leading-snug" title={s.pack_name}>
                          {shortTitle}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{s.buyer_name}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <span className={`flex-shrink-0 text-[8px] font-bold uppercase rounded px-2 py-0.5 ${
                          Number(s.amount) === 0
                            ? 'bg-[#222222] text-zinc-400 border border-zinc-700'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {Number(s.amount) === 0 ? 'Free' : 'Verified'}
                        </span>
                        {(s.coupon?.code || s.coupon_code) && (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[8px] font-bold uppercase rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Ticket className="w-2.5 h-2.5" />
                            {s.coupon?.code || s.coupon_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#222222]">
                      <div className="text-zinc-400 truncate max-w-[170px]">
                        {s.buyer_email}
                      </div>
                      <div className="font-bold text-white text-right">
                        {s.is_usd ? (
                          <span className="text-white">${Number(s.original_amount !== undefined ? s.original_amount : s.amount).toFixed(2)}</span>
                        ) : Number(s.amount) === 0 ? (
                          <span className="text-zinc-500">₹0</span>
                        ) : (
                          `₹${Number(s.amount).toLocaleString()}`
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 p-3 bg-[#181818] border border-[#222222] rounded-xl text-[10px] font-mono">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Prev
                  </button>
                  <span className="text-zinc-400">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP VIEW: DATA TABLE */}
            <div className="hidden md:block border border-[#222222] rounded-xl bg-[#181818] overflow-x-auto shadow-sm">
              <table className="w-full text-left font-sans border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
                    <th className="p-4">Product Purchased</th>
                    <th className="p-4">Buyer Details</th>
                    <th className="p-4">Shipping / Address</th>
                    <th className="p-4 text-center">Settlement</th>
                    <th className="p-4 text-center">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-sans text-xs">
                  {paginatedSales.map((s: any) => (
                    <tr
                      key={s.id}
                      onClick={() => {
                        setActiveOrder(s)
                        setShowOrderModal(true)
                      }}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                      title="Click to view full detailed order transaction"
                    >
                      <td className="p-4">
                        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 font-sans">
                          <p className="font-sans font-bold text-sm text-zinc-100 leading-tight">{s.pack_name}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className={`inline-block text-[8px] font-bold uppercase rounded px-2 py-0.5 ${
                              Number(s.amount) === 0
                                ? 'bg-[#222222] text-zinc-400 border border-zinc-700'
                                : 'bg-white/10 text-white border border-white/20'
                            }`}>
                              {Number(s.amount) === 0 ? 'Free Claim' : 'Verified Order'}
                            </span>
                            {(s.coupon?.code || s.coupon_code) && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase rounded px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                                <Ticket className="w-2.5 h-2.5" />
                                {s.coupon?.code || s.coupon_code}
                                {s.coupon?.discount_percent ? ` (${s.coupon.discount_percent}% OFF)` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-sans font-bold text-sm tracking-wide text-zinc-100 leading-none">{s.buyer_name}</p>
                        <p className="text-[10px] text-zinc-400 lowercase font-mono mt-1.5 flex items-center gap-1 font-medium">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" /> {s.buyer_email}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {s.buyer_phone}
                        </p>
                      </td>
                      <td className="p-4 text-zinc-400 font-medium max-w-xs text-[10px] leading-normal font-mono">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                          <span>{s.buyer_address || 'No physical delivery address provided.'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-block bg-[#141414] border border-[#222222] rounded-lg p-2.5 font-mono text-left font-medium min-w-[120px]">
                          <p className="text-[9px] text-zinc-500 font-sans uppercase font-bold tracking-wider">Total Paid:</p>
                          {s.is_usd ? (
                            <div className="mt-0.5">
                              <p className="text-sm font-black text-white leading-tight">
                                ${Number(s.original_amount !== undefined ? s.original_amount : s.amount).toFixed(2)}{' '}
                                <span className="text-[8.5px] text-zinc-500 font-sans font-bold">USD</span>
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1 leading-none">
                                ≈ ₹{(s.converted_amount_inr ?? Math.round(Number(s.amount) * 90)).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-zinc-100 mt-0.5 leading-tight">
                              {Number(s.amount) === 0 ? (
                                <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Free Claim</span>
                              ) : (
                                <>
                                  ₹{Number(s.amount).toLocaleString()}{' '}
                                  <span className="text-[8.5px] text-zinc-500 font-sans font-bold">INR</span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono text-[10px] font-medium text-zinc-500">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Pagination Controller Row */}
                  {totalPages > 1 && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-[#141414] border-t border-[#222222]">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px]">
                          <div className="text-zinc-400">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)} of {filteredSales.length} transactions
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-3 py-1.5 border border-[#252525] rounded-lg bg-[#202020] text-white hover:bg-[#252525] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const elements = []
                                if (idx > 0 && p - arr[idx - 1] > 1) {
                                  elements.push(
                                    <span key={`dots-${p}`} className="px-1 text-zinc-500">
                                      ...
                                    </span>
                                  )
                                }
                                elements.push(
                                  <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-7 h-7 rounded-lg border font-bold transition-all cursor-pointer ${
                                      currentPage === p 
                                        ? 'bg-white text-black border-white shadow-sm font-bold' 
                                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                )
                                return elements
                              })}

                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="px-3 py-1.5 border border-white/10 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
      })()}

      {/* MODAL DRAWER: DETAILED ORDER DESCRIPTION */}
      {showOrderModal && activeOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl border border-[#2a2a2a] bg-[#181818] rounded-xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans text-xs">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
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
                  {/* 1. FINANCIAL & PROMO DISCOUNT BREAKDOWN */}
                  <div className="bg-[#121212] border border-[#252525] rounded-xl p-4 space-y-3 mb-4 font-sans">
                    <div className="flex justify-between items-center text-xs pb-2.5 border-b border-white/[0.06]">
                      <span className="text-zinc-400 font-medium">Original Product Price (M.R.P.)</span>
                      <span className={`font-mono ${hasCoupon || discountAmt > 0 ? 'line-through text-zinc-500 text-xs' : 'text-zinc-200 font-bold'}`}>
                        {activeOrder.is_usd ? `$${origPrice.toFixed(2)} USD` : `₹${origPrice.toLocaleString()} INR`}
                      </span>
                    </div>

                    {/* PROMO COUPON DETAILS */}
                    {(hasCoupon || discountAmt > 0) && (
                      <div className="bg-emerald-500/[0.08] border border-emerald-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <div>
                              <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">
                                Promo Coupon Applied
                              </span>
                              <span className="inline-block bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-black text-xs border border-emerald-500/40 tracking-wide mt-0.5">
                                {couponCode || 'PROMOTIONAL DISCOUNT'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">
                              Discount Applied
                            </span>
                            <span className="text-emerald-400 font-black text-xs font-mono">
                              {discountPct > 0 ? `${discountPct}% OFF` : 'Special Discount'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-2 border-t border-emerald-500/20 text-emerald-300 font-mono">
                          <span className="text-[11px]">Total Coupon Savings:</span>
                          <span className="font-bold">
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
                          <span className="text-[11px] text-emerald-400 font-medium">
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

                  {/* 2. ORDER TRANSACTION & BUYER METADATA */}
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
                          {copiedField === 'orderId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
                            {copiedField === 'gatewayOrderId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
                            {copiedField === 'paymentId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">Order Timestamp</span>
                      <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeOrder.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )
            })()}

            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="studio-button w-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 font-bold uppercase py-2.5 text-xs rounded-xl transition-all cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
