'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, X, Download } from 'lucide-react'

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
      'Original Amount',
      'Currency',
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
    const rows = filteredSales.map(s => [
      s.id || '',
      `"${(s.pack_name || '').replace(/"/g, '""')}"`,
      s.original_amount !== undefined ? s.original_amount : (s.amount || 0),
      s.currency || (s.is_usd ? 'USD' : 'INR'),
      s.converted_amount_inr !== undefined ? s.converted_amount_inr : (s.amount || 0),
      s.exchange_rate || '',
      `"${(s.buyer_name || '').replace(/"/g, '""')}"`,
      s.buyer_email || '',
      s.buyer_phone || '',
      `"${(s.buyer_address || '').replace(/"/g, '""')}"`,
      s.razorpay_order_id || '',
      s.razorpay_payment_id || '',
      new Date(s.created_at).toLocaleString()
    ])

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#18181c] p-4 sm:p-5 border border-white/10 rounded-2xl shadow-md">
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
            className="studio-button bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <div className="relative font-sans">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search orders by product, buyer, email..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#141418] border border-white/10 rounded-xl text-white text-xs outline-none focus:border-white/25 w-64 md:w-80 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SALES DATA GRID */}
      <div className="border border-white/10 rounded-2xl bg-[#18181c] overflow-x-auto shadow-md">
        <table className="w-full text-left font-sans border-collapse">
          <thead>
            <tr className="bg-[#141418] border-b border-white/10 text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
              <th className="p-4">Product Purchased</th>
              <th className="p-4">Buyer Details</th>
              <th className="p-4">Shipping / Address</th>
              <th className="p-4 text-center">Settlement</th>
              <th className="p-4 text-center">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-sans text-xs">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500 font-sans">
                  No sales transactions logged.
                </td>
              </tr>
            ) : (() => {
              const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
              const paginatedSales = filteredSales.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              )

              return (
                <>
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
                          <span className={`inline-block text-[8px] font-bold uppercase rounded px-2 py-0.5 mt-2 ${
                            Number(s.amount) === 0
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {Number(s.amount) === 0 ? 'Free Claim' : 'Verified Order'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-sans font-bold text-sm tracking-wide text-zinc-100 leading-none">{s.buyer_name}</p>
                        <p className="text-[10px] text-zinc-400 lowercase font-mono mt-1.5 flex items-center gap-1 font-medium">
                          <Mail className="w-3.5 h-3.5 text-blue-400" /> {s.buyer_email}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {s.buyer_phone}
                        </p>
                      </td>
                      <td className="p-4 text-zinc-400 font-medium max-w-xs text-[10px] leading-normal font-mono">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>{s.buyer_address || 'No physical delivery address provided.'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-block bg-[#141418] border border-white/10 rounded-xl p-2.5 font-mono text-left font-medium min-w-[120px]">
                          <p className="text-[9px] text-zinc-500 font-sans uppercase font-bold tracking-wider">Total Paid:</p>
                          {s.is_usd ? (
                            <div className="mt-0.5">
                              <p className="text-sm font-black text-[#00FF94] leading-tight">
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
                                `₹${Number(s.amount).toLocaleString()}`
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
                      <td colSpan={5} className="p-4 bg-[#141418] border-t border-white/10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px]">
                          <div className="text-zinc-400">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)} of {filteredSales.length} transactions
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-3 py-1.5 border border-white/10 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
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
                </>
              )
            })()}
          </tbody>
        </table>
      </div>

      {/* MODAL DRAWER: DETAILED ORDER DESCRIPTION */}
      {showOrderModal && activeOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl border border-white/15 bg-[#18181c] rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans text-xs">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF94]" />
              Order Transaction Receipt
            </h3>

            {/* ORDER TRANSACTION METADATA */}
            <div className="bg-[#141418] border border-white/10 rounded-xl p-4 space-y-3 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Order ID</span>
                <span className="text-white font-mono font-bold">{activeOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Product Purchased</span>
                <span className="text-white font-bold text-sm text-right">{activeOrder.pack_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Name</span>
                <span className="text-zinc-100 font-bold">{activeOrder.buyer_name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Email</span>
                <span className="text-zinc-100 font-mono select-all">{activeOrder.buyer_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Buyer Phone</span>
                <span className="text-zinc-100 font-mono select-all">{activeOrder.buyer_phone || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Delivery Address</span>
                <span className="text-zinc-300 font-mono leading-normal bg-black/40 border border-white/10 p-2.5 rounded-lg text-[10px] select-all">
                  {activeOrder.buyer_address || 'No physical delivery address provided for this order.'}
                </span>
              </div>
               {activeOrder.coupon && (
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-zinc-500 font-bold uppercase text-[10px]">Coupon Applied</span>
                  <span className="text-zinc-200 font-bold uppercase text-[10px]">
                    {activeOrder.coupon.code} ({activeOrder.coupon.discount_percent}% OFF)
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Total Paid</span>
                {activeOrder.is_usd ? (
                  <div className="text-right">
                    <span className="text-[#00FF94] font-bold text-sm">
                      ${Number(activeOrder.original_amount !== undefined ? activeOrder.original_amount : activeOrder.amount).toFixed(2)} USD
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      ≈ ₹{activeOrder.converted_amount_inr?.toLocaleString() || Math.round(Number(activeOrder.amount) * 90)} INR
                    </p>
                  </div>
                ) : (
                  <span className="text-[#00FF94] font-bold text-sm">
                    {Number(activeOrder.amount) === 0 ? 'Free Claim (₹0)' : `₹${activeOrder.amount?.toLocaleString()}`}
                  </span>
                )}
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Razorpay Order ID</span>
                <span className="text-white font-mono tracking-tight text-[10px] select-all">{activeOrder.razorpay_order_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Razorpay Payment ID</span>
                <span className="text-white font-mono tracking-tight text-[10px] select-all">{activeOrder.razorpay_payment_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Order Timestamp</span>
                <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeOrder.created_at).toLocaleString()}</span>
              </div>
            </div>

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
