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

                return filteredLogs.map((l) => (
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
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
