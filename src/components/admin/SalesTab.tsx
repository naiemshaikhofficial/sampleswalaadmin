'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, X } from 'lucide-react'

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
    const headers = ['Order ID', 'Product', 'Amount (INR)', 'Buyer Name', 'Email', 'Phone', 'Address', 'Razorpay Order ID', 'Razorpay Payment ID', 'Timestamp']
    
    // Form row records
    const rows = filteredSales.map(s => [
      s.id || '',
      s.pack_name || '',
      s.amount || 0,
      s.buyer_name || '',
      s.buyer_email || '',
      s.buyer_phone || '',
      `"${(s.buyer_address || '').replace(/"/g, '""')}"`, // escape quotes
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
      <div className="bg-[#121212] p-4 border-4 border-black flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-neon">
            💰 ORDERS LOG
          </h3>
          <p className="text-zinc-400 mt-1 uppercase text-[10px] font-bold">
            Complete breakdown of cash sales, customer delivery addresses, and Razorpay settlements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="comic-button bg-studio-pink hover:bg-studio-pink font-black text-black text-[10px] uppercase h-10 px-4 border-2 border-black flex items-center justify-center cursor-pointer shadow-premium-sm"
          >
            📥 CSV EXPORT
          </button>
          <div className="relative font-sans">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="SEARCH ORDERS BY PACK/BUYER/PAYMENT..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-black border-2 border-black text-white font-bold placeholder-zinc-600 outline-none focus:border-studio-neon w-64 md:w-80 uppercase text-xs"
            />
          </div>
        </div>
      </div>

      {/* SALES DATA GRID */}
      <div className="border-4 border-black bg-black overflow-x-auto">
        <table className="w-full text-left uppercase font-bold border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
              <th className="p-4">PRODUCT PURCHASED</th>
              <th className="p-4">BUYER PROFILE & METADATA</th>
              <th className="p-4">SHIPPING & BILLING ADDRESS</th>
              <th className="p-4 text-center">GATEWAY SETTLEMENT</th>
              <th className="p-4 text-center">TIMESTAMP</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black font-sans text-xs">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500 uppercase font-bold">
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
                      className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors cursor-pointer"
                      title="Click to view full detailed order transaction"
                    >
                      <td className="p-4">
                        <div className="bg-[#151515] border border-zinc-800 p-3 font-sans">
                          <p className="font-sans font-bold text-sm text-zinc-100 normal-case leading-tight">{s.pack_name}</p>
                          <span className="inline-block text-[8px] bg-studio-pink/20 text-studio-pink border border-studio-pink px-2 py-0.5 mt-2 font-bold uppercase">VAULTED ACQUISITION</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-sans font-bold text-sm tracking-wide text-zinc-100 leading-none">{s.buyer_name}</p>
                        <p className="text-[10px] text-zinc-400 lowercase font-mono mt-1.5 flex items-center gap-1 normal-case font-medium">
                          <Mail className="w-3.5 h-3.5 text-studio-neon" /> {s.buyer_email}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {s.buyer_phone}
                        </p>
                      </td>
                      <td className="p-4 normal-case text-zinc-400 font-medium max-w-xs text-[10px] leading-normal font-mono">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-studio-neon flex-shrink-0 mt-0.5" />
                          <span>{s.buyer_address}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-block bg-black border border-zinc-800 p-2.5 font-mono text-left font-medium">
                          <p className="text-[10px] text-zinc-500 font-sans">PAYMENT TOTAL:</p>
                          <p className="text-base font-bold text-zinc-100 mt-0.5">₹{s.amount?.toLocaleString()}</p>
                          <div className="mt-2 border-t border-zinc-900 pt-1.5 space-y-0.5 font-medium font-mono text-[8px] tracking-tight uppercase text-zinc-400">
                            <p>ORD: <span className="text-studio-neon">{s.razorpay_order_id}</span></p>
                            <p>PAY: <span className="text-studio-pink">{s.razorpay_payment_id}</span></p>
                          </div>
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
                      <td colSpan={5} className="p-4 bg-[#121212] border-t-4 border-black">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase font-black">
                          <div className="text-zinc-400">
                            SHOWING {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)} OF {filteredSales.length} TRANSACTIONS
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-3 py-1.5 border-2 border-black bg-black text-white hover:bg-studio-neon hover:text-black font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              PREV
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                              .map((p, idx, arr) => {
                                const elements = []
                                if (idx > 0 && p - arr[idx - 1] > 1) {
                                  elements.push(<span key={`dot-${p}`} className="text-zinc-600 px-1">...</span>)
                                }
                                elements.push(
                                  <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-7 h-7 border-2 border-black font-bold uppercase transition-all cursor-pointer ${
                                      currentPage === p 
                                        ? 'bg-studio-neon text-black border-studio-neon' 
                                        : 'bg-black text-white hover:bg-zinc-800'
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
                              className="px-3 py-1.5 border-2 border-black bg-black text-white hover:bg-studio-neon hover:text-black font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              NEXT
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-sans text-xs animate-scaleIn">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-neon mb-6">
              📦 Detailed Order Acquisition Receipt
            </h3>

            {/* ORDER TRANSACTION METADATA */}
            <div className="bg-black border border-zinc-800 p-4 space-y-3.5 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">ORDER ID (INTERNAL)</span>
                <span className="text-white font-mono font-bold">{activeOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">PRODUCT PURCHASED</span>
                <span className="text-white font-bold text-sm normal-case text-right">{activeOrder.pack_name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER LEGAL NAME</span>
                <span className="text-zinc-100 font-bold normal-case">{activeOrder.buyer_name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER EMAIL ADDRESS</span>
                <span className="text-zinc-100 font-mono font-medium lowercase select-all">{activeOrder.buyer_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER PHONE NUMBER</span>
                <span className="text-zinc-100 font-mono font-medium select-all">{activeOrder.buyer_phone || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">SHIPPING & BILLING ADDRESS</span>
                <span className="text-zinc-300 font-mono leading-normal bg-[#0c0c0c] border border-zinc-900 p-2.5 rounded-none text-[10px] normal-case select-all">
                  {activeOrder.buyer_address || 'No physical delivery address provided for this order.'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">TOTAL VALUE PAID</span>
                <span className="text-studio-neon font-bold text-sm">₹{activeOrder.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">RAZORPAY ORDER ID</span>
                <span className="text-white font-mono font-bold tracking-tight text-[10px] select-all">{activeOrder.razorpay_order_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">RAZORPAY PAYMENT ID</span>
                <span className="text-white font-mono font-bold tracking-tight text-[10px] select-all">{activeOrder.razorpay_payment_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">ORDER TIMESTAMP</span>
                <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeOrder.created_at).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="studio-button w-full bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2.5 text-xs font-sans"
            >
              CLOSE RECEIPT DRAWER
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
