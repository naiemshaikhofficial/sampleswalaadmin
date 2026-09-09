'use client'

import React from 'react'
import { History, Trash2 } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  action: string
  type: 'danger' | 'warning' | 'success' | 'info'
  target: string
  admin: string
}

interface LogsTabProps {
  isDateWithinRange: (dateInput: any) => boolean
  auditLogs: LogEntry[]
  setAuditLogs: (val: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void
  session: any
  showToast: (msg: string, type: 'success' | 'error' | 'warning') => void
}

export function LogsTab({
  isDateWithinRange,
  auditLogs,
  setAuditLogs,
  session,
  showToast
}: LogsTabProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const ITEMS_PER_PAGE = 25

  React.useEffect(() => {
    setCurrentPage(1)
  }, [auditLogs])

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      {/* HEADER BAR */}
      <div className="bg-[#181818] p-5 border border-[#222222] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-zinc-300" />
            Admin Activity Logs
          </h3>
          <p className="text-zinc-400 mt-1 text-xs">
            Comprehensive audit trail recording administrative changes, artist approvals, bans, and system operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('sw_audit_logs')
              setAuditLogs([
                {
                  id: 'log-clear',
                  timestamp: new Date().toLocaleString(),
                  action: 'LOGS_CLEARED',
                  type: 'warning',
                  target: 'Audit trail logs cleared by administrative command.',
                  admin: session?.user?.email || 'Admin'
                }
              ])
              showToast('Audit trail logs wiped!', 'warning')
            }}
            className="px-3.5 py-2 bg-[#202020] hover:bg-[#282828] text-zinc-300 hover:text-white border border-[#333333] font-semibold text-xs transition-all cursor-pointer rounded-lg flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log History
          </button>
        </div>
      </div>

      {/* AUDIT LOG DISPLAY */}
      {(() => {
        const filteredLogs = auditLogs.filter(l => isDateWithinRange(l.timestamp))

        if (filteredLogs.length === 0) {
          return (
            <div className="border border-[#222222] bg-[#181818] rounded-xl p-10 text-center text-zinc-500 font-medium text-xs">
              No activity logs found matching the selected filter range.
            </div>
          )
        }

        const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
        const paginatedLogs = filteredLogs.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )

        return (
          <>
            {/* MOBILE VIEW: AUDIT LOG CARDS (NO HORIZONTAL SCROLLBAR) */}
            <div className="md:hidden space-y-2.5">
              {paginatedLogs.map((l) => (
                <div
                  key={l.id}
                  className="border border-[#222222] bg-[#181818] rounded-xl p-3.5 space-y-2 hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      l.type === 'danger'
                        ? 'bg-[#222222] text-zinc-400 border border-zinc-700'
                        : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {l.action}
                    </span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {l.timestamp}
                    </span>
                  </div>

                  <p className="text-zinc-200 font-medium text-xs leading-relaxed line-clamp-2">
                    {l.target}
                  </p>

                  <div className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-[#222222]">
                    Admin: <span className="text-zinc-300">{l.admin}</span>
                  </div>
                </div>
              ))}

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
            <div className="hidden md:block border border-[#222222] bg-[#181818] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Action Type</th>
                      <th className="p-4">Details of Change</th>
                      <th className="p-4">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] text-xs">
                    {paginatedLogs.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="p-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                          {l.timestamp}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            l.type === 'danger'
                              ? 'bg-[#222222] text-zinc-400 border border-zinc-700'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-200 font-medium max-w-md leading-relaxed">
                          {l.target}
                        </td>
                        <td className="p-4 text-zinc-400 font-mono text-[11px] select-all">
                          {l.admin}
                        </td>
                      </tr>
                    ))}

                    {/* Pagination Bar inside table body row */}
                    {totalPages > 1 && (
                      <tr>
                        <td colSpan={4} className="p-4 bg-[#141414] border-t border-[#222222]">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
                            <div className="text-zinc-400">
                              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 border border-[#252525] bg-[#202020] text-white hover:bg-[#252525] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg"
                              >
                                Previous
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
                                      className={`w-7 h-7 font-bold transition-all cursor-pointer rounded-lg border ${
                                        currentPage === p 
                                          ? 'bg-white text-black border-white shadow-sm font-bold' 
                                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
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
                                className="px-3 py-1.5 border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded-lg"
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
            </div>
          </>
        )
      })()}
    </div>
  )
}
