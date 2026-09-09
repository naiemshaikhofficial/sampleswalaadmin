'use client'

import React, { useState, useEffect } from 'react'
import { X, Send, MessageSquare } from 'lucide-react'
import { replyToTicket } from '@/app/actions'

interface TicketsTabProps {
  tickets: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

export function TicketsTab({
  tickets,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  paletteSelection,
  setPaletteSelection
}: TicketsTabProps) {
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [ticketReply, setTicketReply] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Private CRM states persisting in client storage
  const [internalNote, setInternalNote] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('Naiem Shaikh')

  useEffect(() => {
    if (activeTicket?.id) {
      const savedNote = localStorage.getItem(`ticket_note_${activeTicket.id}`)
      setInternalNote(savedNote || '')
      const savedAgent = localStorage.getItem(`ticket_agent_${activeTicket.id}`)
      setAssignedAgent(savedAgent || 'Naiem Shaikh')
    }
  }, [activeTicket])

  const handleSaveInternalNote = (val: string) => {
    setInternalNote(val)
    if (activeTicket?.id) {
      localStorage.setItem(`ticket_note_${activeTicket.id}`, val)
    }
  }

  const handleSaveAssignedAgent = (val: string) => {
    setAssignedAgent(val)
    if (activeTicket?.id) {
      localStorage.setItem(`ticket_agent_${activeTicket.id}`, val)
    }
  }

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'ticket') {
      setActiveTicket(paletteSelection.data)
      setTicketReply(paletteSelection.data.admin_reply || '')
      setShowTicketModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const handleTicketReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketReply) return

    setSaveLoading(true)
    try {
      await replyToTicket(activeTicket.id, ticketReply)
      showToast('Reply submitted and ticket resolved!', 'success')
      addAuditLog('RESOLVE_TICKET', `Replied and resolved support ticket ID: ${activeTicket.id} (user: ${activeTicket.user_email || 'N/A'})`, 'success')
      setShowTicketModal(false)
      setTicketReply('')
      invalidateCacheAndReload('tickets')
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve ticket', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">
            Customer Support Tickets
          </h3>
          <p className="text-zinc-400 text-xs font-sans mt-0.5">
            Manage user inquiries, technical queries, and support resolutions.
          </p>
        </div>
      </div>

      {/* TICKETS DISPLAY */}
      {tickets.length === 0 ? (
        <div className="border border-[#222222] rounded-xl bg-[#181818] p-8 text-center text-zinc-500 font-sans text-xs">
          No support tickets submitted yet.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: TICKET CARDS (NO HORIZONTAL SCROLLBAR) */}
          <div className="md:hidden space-y-2.5">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="border border-[#222222] rounded-xl bg-[#181818] p-3.5 space-y-2.5 hover:border-[#333333] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-zinc-100 truncate leading-snug" title={ticket.subject}>
                      {ticket.subject}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{ticket.user_name}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ticket.status === 'open' ? 'bg-white/10 border border-white/20 text-white' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {ticket.status === 'open' ? 'Open' : 'Resolved'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#222222]">
                  <span className="text-[9px] bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded px-1.5 py-0.2 font-mono font-bold">
                    {ticket.category}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTicket(ticket)
                      setTicketReply(ticket.admin_reply || '')
                      setShowTicketModal(true)
                    }}
                    className="px-2.5 py-1 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-sans text-[11px] transition-all cursor-pointer"
                  >
                    {ticket.status === 'open' ? 'Reply' : 'View'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: DATA TABLE */}
          <div className="hidden md:block border border-[#222222] rounded-xl bg-[#181818] overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs font-sans border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Subject & Category</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Created Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4">
                      <p className="text-zinc-100 font-bold text-sm">{ticket.user_name}</p>
                      <p className="text-[10px] text-zinc-500 leading-none mt-1 lowercase font-mono">{ticket.user_id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-zinc-100 font-medium text-sm">{ticket.subject}</p>
                      <span className="inline-block text-[9px] bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded px-2 py-0.5 mt-1 font-mono font-bold">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        ticket.status === 'open' ? 'bg-white/10 border border-white/20 text-white' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      }`}>
                        {ticket.status === 'open' ? 'Open Ticket' : 'Resolved'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-zinc-400 font-mono font-medium text-[10px]">
                      {new Date(ticket.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTicket(ticket)
                          setTicketReply(ticket.admin_reply || '')
                          setShowTicketModal(true)
                        }}
                        className="px-3 py-1.5 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white font-sans text-xs transition-all cursor-pointer"
                      >
                        {ticket.status === 'open' ? 'Quick Reply' : 'View Conversation'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DRAWER: SUPPORT TICKET DETAILS & CRM CONVERSATION WORKSPACE */}
      {showTicketModal && activeTicket && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleTicketReply}
            className="w-full max-w-4xl border border-[#2a2a2a] bg-[#181818] rounded-xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans text-xs flex flex-col md:flex-row gap-6"
          >
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer z-30"
            >
              <X className="w-4 h-4" />
            </button>

            {/* LEFT COLUMN: INTERACTIVE LIVE CONVERSATION FLOW */}
            <div className="flex-1 flex flex-col space-y-4">
              <h3 className="font-sans font-bold text-lg text-white border-b border-[#242424] pb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                Support Conversation Thread
              </h3>

              {/* CHAT MESSAGES THREAD COMPONENT */}
              <div className="bg-[#121212] border border-[#222222] rounded-xl p-4 space-y-4 max-h-[42vh] overflow-y-auto min-h-60 flex flex-col justify-end">
                {/* 1. CUSTOMER CHAT BUBBLE (LEFT) */}
                <div className="flex flex-col items-start max-w-[85%] self-start space-y-1">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase">{activeTicket.user_name} ({new Date(activeTicket.created_at).toLocaleDateString()})</span>
                  <div className="bg-[#1c1c1c] border border-[#262626] text-zinc-100 p-3.5 rounded-2xl rounded-tl-sm text-xs font-sans leading-relaxed select-all">
                    <p className="font-bold text-zinc-300 uppercase text-[9px] tracking-wider mb-1">Subject: {activeTicket.subject}</p>
                    {activeTicket.message}
                  </div>
                </div>

                {/* 2. ADMIN REPLY CHAT BUBBLE (RIGHT) */}
                {activeTicket.admin_reply && (
                  <div className="flex flex-col items-end max-w-[85%] self-end space-y-1">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">{assignedAgent} ({activeTicket.replied_at ? new Date(activeTicket.replied_at).toLocaleDateString() : 'Replied'})</span>
                    <div className="bg-purple-600/30 border border-purple-500/40 text-white p-3.5 rounded-2xl rounded-tr-sm text-xs font-sans leading-relaxed select-all">
                      {activeTicket.admin_reply}
                    </div>
                  </div>
                )}
              </div>

              {/* CHAT INPUT AREA */}
              {activeTicket.status === 'open' ? (
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Official Ticket Resolution Response</label>
                    <textarea
                      required
                      value={ticketReply}
                      onChange={e => setTicketReply(e.target.value)}
                      rows={3}
                      placeholder="Type your official resolution response... Clicking submit will email the customer and resolve the ticket..."
                      className="w-full bg-[#121212] border border-[#252525] rounded-xl p-3 text-white outline-none focus:border-zinc-500 font-medium text-xs leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold uppercase py-2.5 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    {saveLoading ? 'Submitting...' : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Resolution Reply
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-white/[0.02] border border-emerald-500/20 rounded-xl p-3 text-center font-sans font-bold text-emerald-400 text-xs">
                  ✓ Ticket Resolved & Closed
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ENTERPRISE CRM META & CONTROLS */}
            <div className="w-full md:w-72 bg-[#121212] border border-[#222222] rounded-xl p-4 flex flex-col space-y-4">
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400 border-b border-[#242424] pb-2">
                Ticket Details
              </h4>

              {/* TICKET DETAILS */}
              <div className="space-y-3 font-sans text-xs">
                <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-500 font-bold text-[9px] uppercase">Ticket Reference</span>
                  <span className="text-white font-mono font-bold select-all truncate">{activeTicket.id}</span>
                </div>

                <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-500 font-bold text-[9px] uppercase">Submitted By</span>
                  <span className="text-white font-bold">{activeTicket.user_name}</span>
                  <span className="text-zinc-400 font-mono text-[9px] lowercase">{activeTicket.user_id}</span>
                </div>

                <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                  <span className="text-zinc-500 font-bold text-[9px] uppercase">Inquiry Category</span>
                  <div>
                    <span className="inline-block bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[9px] px-2 py-0.5 font-bold uppercase rounded">
                      {activeTicket.category}
                    </span>
                  </div>
                </div>

                {/* ASSIGNED AGENT CONTROL */}
                <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.06]">
                  <label className="text-zinc-500 font-bold text-[9px] uppercase">Assigned Agent</label>
                  <select
                    value={assignedAgent}
                    onChange={e => handleSaveAssignedAgent(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg p-2 text-white font-medium outline-none focus:border-white/25 text-xs"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Naiem Shaikh">Naiem Shaikh</option>
                    <option value="System Agent">System Agent</option>
                  </select>
                </div>

                {/* INTERNAL PRIVATE NOTES */}
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-500 font-bold text-[9px] uppercase">Internal Notes (Staff Only)</label>
                  <textarea
                    value={internalNote}
                    onChange={e => handleSaveInternalNote(e.target.value)}
                    placeholder="Draft private notes, customer history, or checklist..."
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-zinc-300 font-medium text-xs leading-relaxed outline-none focus:border-white/25"
                  />
                  <span className="text-[8px] text-zinc-500 mt-0.5">Notes are private and not shown to customer</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="studio-button w-full bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold uppercase py-2 border border-white/15 text-xs rounded-xl cursor-pointer font-sans"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
