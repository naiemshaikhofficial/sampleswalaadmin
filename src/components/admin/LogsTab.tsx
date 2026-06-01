import React from 'react'

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
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#121212] p-6 border border-zinc-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-purple">
            🛠️ Admin Activity Logs
          </h3>
          <p className="text-zinc-400 mt-1 uppercase text-[10px] font-bold">
            This shows a list of all recent actions done by administrators (e.g. banning users, deleting items, or approving artist KYCs).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
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
            className="px-3 py-2 bg-studio-red hover:bg-studio-red/80 text-white font-bold uppercase text-[10px] transition-all cursor-pointer rounded"
          >
            🗑️ Clear Log History
          </button>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="border border-zinc-800 bg-black rounded-lg overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-left uppercase font-bold border-collapse">
            <thead>
              <tr className="bg-[#121212] border-b border-zinc-800 text-zinc-400">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Action Done</th>
                <th className="p-4">Details of Change</th>
                <th className="p-4">Done By (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-mono text-xs">
              {(() => {
                const filteredLogs = auditLogs.filter(l => isDateWithinRange(l.timestamp))

                if (filteredLogs.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500 uppercase font-bold">
                        No activity logs found matching the filter range.
                      </td>
                    </tr>
                  )
                }

                const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
                const paginatedLogs = filteredLogs.slice(
                  (currentPage - 1) * ITEMS_PER_PAGE,
                  currentPage * ITEMS_PER_PAGE
                )

                return (
                  <>
                    {paginatedLogs.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors"
                      >
                        <td className="p-4 text-zinc-500 font-mono text-[10px] font-medium min-w-[140px]">
                          {l.timestamp}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block font-sans font-black text-[9px] px-2 py-0.5 border border-black shadow-sm rounded ${
                            l.type === 'danger'
                              ? 'bg-studio-red text-white'
                              : l.type === 'warning'
                                ? 'bg-studio-yellow text-black'
                                : l.type === 'success'
                                  ? 'bg-studio-neon text-black'
                                  : 'bg-studio-pink text-black'
                          }`}>
                            {l.action}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-200 normal-case font-medium max-w-md leading-relaxed">
                          {l.target}
                        </td>
                        <td className="p-4 text-zinc-400 font-mono text-[10px]">
                          {l.admin}
                        </td>
                      </tr>
                    ))}

                    {/* Pagination Bar inside table body row */}
                    {totalPages > 1 && (
                      <tr>
                        <td colSpan={4} className="p-4 bg-[#121212] border-t border-zinc-800">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase font-bold">
                            <div className="text-zinc-500">
                              SHOWING {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} OF {filteredLogs.length} AUDIT LOGS
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 border border-zinc-800 bg-black text-white hover:bg-studio-purple hover:text-white font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded"
                              >
                                PREV
                              </button>
                              
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => {
                                  const elements = []
                                  if (idx > 0 && p - arr[idx - 1] > 1) {
                                    elements.push(<span key={`dot-${p}`} className="text-zinc-700 px-1">...</span>)
                                  }
                                  elements.push(
                                    <button
                                      key={p}
                                      onClick={() => setCurrentPage(p)}
                                      className={`w-7 h-7 border border-zinc-800 font-bold uppercase transition-all cursor-pointer rounded ${
                                        currentPage === p 
                                          ? 'bg-studio-purple text-white border-studio-purple' 
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
                                className="px-3 py-1.5 border border-zinc-800 bg-black text-white hover:bg-studio-purple hover:text-white font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer rounded"
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
      </div>
    </div>
  )
}
