'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Mail,
  Phone,
  MapPin,
  X,
  Download,
  Ticket,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter
} from 'lucide-react'
import { getShortSampleName } from '@/lib/formatUtils'

interface SalesTabProps {
  vaultSalesList: any[]
  isDateWithinRange: (date: any) => boolean
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'transactions'
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  itemLabel?: string
}) {
  if (totalPages <= 1) return null

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages: (number | string)[] = []
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage - 1)
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const startIdx = (currentPage - 1) * itemsPerPage + 1
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#141414] border-t border-[#222222] text-xs font-mono">
      <div className="text-zinc-400 text-[11px]">
        Showing <span className="text-white font-bold">{startIdx}</span> to <span className="text-white font-bold">{endIdx}</span> of <span className="text-white font-bold">{totalItems}</span> {itemLabel}
      </div>

      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-300 hover:text-white border border-[#2c2c2c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-zinc-500 select-none">
                  ...
                </span>
              )
            }
            const pageNum = Number(p)
            const isActive = pageNum === currentPage
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-sm scale-105'
                    : 'bg-[#1e1e1e] hover:bg-[#282828] text-zinc-300 hover:text-white border border-[#2b2b2b]'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-300 hover:text-white border border-[#2c2c2c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function SalesTab({
  vaultSalesList,
  isDateWithinRange,
  paletteSelection,
  setPaletteSelection
}: SalesTabProps) {
  const [salesSearch, setSalesSearch] = useState('')
  const [salesSort, setSalesSort] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc' | 'product_asc'>('newest')
  const [salesTypeFilter, setSalesTypeFilter] = useState<'all' | 'paid' | 'free' | 'coupon'>('all')
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
  }, [salesSearch, salesSort, salesTypeFilter])

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'order') {
      setActiveOrder(paletteSelection.data)
      setShowOrderModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const filteredSales = useMemo(() => {
    const list = vaultSalesList.filter(s => {
      // Apply Date/Time-wise Filter
      if (!isDateWithinRange(s.created_at)) return false

      if (salesTypeFilter === 'paid' && Number(s.amount || 0) <= 0) return false
      if (salesTypeFilter === 'free' && Number(s.amount || 0) > 0) return false
      if (salesTypeFilter === 'coupon' && !s.coupon_code && !s.coupon?.code) return false

      const searchLower = salesSearch.toLowerCase()
      return (
        (s.pack_name || '').toLowerCase().includes(searchLower) ||
        (s.buyer_name || '').toLowerCase().includes(searchLower) ||
        (s.buyer_email || '').toLowerCase().includes(searchLower) ||
        (s.buyer_address || '').toLowerCase().includes(searchLower) ||
        (s.razorpay_order_id || '').toLowerCase().includes(searchLower) ||
        (s.razorpay_payment_id || '').toLowerCase().includes(searchLower) ||
        (s.coupon_code || '').toLowerCase().includes(searchLower) ||
        (s.coupon?.code || '').toLowerCase().includes(searchLower)
      )
    })

    list.sort((a, b) => {
      const aAmt = a.converted_amount_inr !== undefined ? Number(a.converted_amount_inr) : Number(a.amount || 0)
      const bAmt = b.converted_amount_inr !== undefined ? Number(b.converted_amount_inr) : Number(b.amount || 0)

      if (salesSort === 'amount_desc') return bAmt - aAmt
      if (salesSort === 'amount_asc') return aAmt - bAmt
      if (salesSort === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      if (salesSort === 'product_asc') return (a.pack_name || '').localeCompare(b.pack_name || '')
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    return list
  }, [vaultSalesList, isDateWithinRange, salesTypeFilter, salesSearch, salesSort])

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

  // Compute live sales summary statistics for top cards
  const salesSummary = useMemo(() => {
    let totalRevenueINR = 0
    let paidCount = 0
    let freeCount = 0
    let totalDiscountINR = 0
    let couponCount = 0

    filteredSales.forEach((s: any) => {
      const rawAmt = Number(s.amount || 0)
      const isUsd = Boolean(s.is_usd || s.currency === 'USD')
      const converted = s.converted_amount_inr !== undefined
        ? Number(s.converted_amount_inr)
        : (isUsd ? rawAmt * (s.exchange_rate || 90) : rawAmt)

      if (rawAmt > 0) {
        paidCount++
        totalRevenueINR += converted
      } else {
        freeCount++
      }

      const hasCoupon = Boolean(s.coupon?.code || s.coupon_code)
      const discount = Number(s.discount_amount ?? s.coupon?.discount_amount ?? 0)
      if (hasCoupon || discount > 0) {
        couponCount++
        if (discount > 0) {
          totalDiscountINR += discount
        } else if (rawAmt === 10) {
          totalDiscountINR += 989
        }
      }
    })

    return {
      totalOrders: filteredSales.length,
      paidCount,
      freeCount,
      totalRevenueINR,
      totalDiscountINR,
      couponCount
    }
  }, [filteredSales])

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
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-[#202020] hover:bg-[#282828] text-white border border-[#2e2e2e] px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" /> Export CSV
          </button>
          <div className="relative font-sans flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search orders by product, buyer, email, coupon..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white text-xs outline-none focus:border-white font-mono transition-colors"
            />
          </div>
          <select
            value={salesTypeFilter}
            onChange={e => setSalesTypeFilter(e.target.value as any)}
            className="bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-white outline-none focus:border-white text-xs cursor-pointer transition-colors"
          >
            <option value="all">All Orders ({vaultSalesList.length})</option>
            <option value="paid">Paid Only</option>
            <option value="free">Free Claims Only</option>
            <option value="coupon">Coupon Orders Only</option>
          </select>
          <div className="flex items-center gap-1.5 bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-2 text-white text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-500 font-mono text-[10px] uppercase">Sort:</span>
            <select
              value={salesSort}
              onChange={e => setSalesSort(e.target.value as any)}
              className="bg-transparent text-white outline-none text-xs cursor-pointer font-medium"
            >
              <option value="newest" className="bg-[#181818] text-white">Newest First</option>
              <option value="oldest" className="bg-[#181818] text-white">Oldest First</option>
              <option value="amount_desc" className="bg-[#181818] text-white">Amount (High to Low)</option>
              <option value="amount_asc" className="bg-[#181818] text-white">Amount (Low to High)</option>
              <option value="product_asc" className="bg-[#181818] text-white">Product Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ORDERS & SALES SUMMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block">Total Orders</span>
          <p className="font-mono font-bold text-xl text-white">{salesSummary.totalOrders}</p>
          <span className="text-[10px] text-zinc-400 font-mono block">
            {salesSummary.paidCount} Paid • {salesSummary.freeCount} Free
          </span>
        </div>

        <div className="bg-[#181818] border border-[#222222] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block">Gross Sales Volume</span>
          <p className="font-mono font-bold text-xl text-white">₹{salesSummary.totalRevenueINR.toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">INR</span></p>
          <span className="text-[10px] text-zinc-400 font-mono block">
            {salesSummary.paidCount} Paid Settlements
          </span>
        </div>

        <div className="bg-[#181818] border border-[#222222] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block">Free Lead Claims</span>
          <p className="font-mono font-bold text-xl text-white">{salesSummary.freeCount}</p>
          <span className="text-[10px] text-zinc-400 font-mono block">
            Promotional Claims
          </span>
        </div>

        <div className="bg-[#181818] border border-[#222222] rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider block">Promo Savings Given</span>
          <p className="font-mono font-bold text-xl text-white">₹{salesSummary.totalDiscountINR.toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">INR</span></p>
          <span className="text-[10px] text-zinc-400 font-mono block">
            Across {salesSummary.couponCount} Coupon Orders
          </span>
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
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[8px] font-bold uppercase rounded px-1.5 py-0.5 bg-white/15 text-white border border-white/30 font-mono">
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
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredSales.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="orders"
              />
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
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase rounded px-2 py-0.5 bg-white/15 text-white border border-white/30 font-mono">
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
                </tbody>
              </table>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredSales.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="orders"
              />
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
