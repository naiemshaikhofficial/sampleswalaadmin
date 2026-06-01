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
    <div className="space-y-6 animate-fadeIn font-mono">
      <div className="bg-[#121212] p-4 border-4 border-black">
        <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-purple">
          🎫 ACTIVE SUPPORT TICKETS
        </h3>
      </div>

      {/* TICKETS TABLE LIST */}
      <div className="border-4 border-black bg-black overflow-x-auto">
        <table className="w-full text-left text-xs uppercase font-bold border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
              <th className="p-4">USER</th>
              <th className="p-4">SUBJECT & CATEGORY</th>
              <th className="p-4 text-center">STATUS</th>
              <th className="p-4 text-center">CREATED DATE</th>
              <th className="p-4 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500 uppercase font-bold">
                  No support tickets submitted yet.
                </td>
              </tr>
            ) : (
              tickets.map((ticket: any) => (
                <tr key={ticket.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                  <td className="p-4">
                    <p className="text-zinc-100 font-bold text-sm normal-case">{ticket.user_name}</p>
                    <p className="text-[10px] text-zinc-500 leading-none mt-1 lowercase font-mono font-medium">{ticket.user_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-zinc-100 font-semibold text-sm normal-case">{ticket.subject}</p>
                    <span className="inline-block text-[8px] bg-studio-purple/20 border border-studio-purple text-studio-purple px-2 py-0.5 mt-1 font-bold">
                      {ticket.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block text-[8px] font-bold uppercase px-2.5 py-1 border border-black ${
                      ticket.status === 'open' ? 'bg-studio-red text-white animate-pulse' : 'bg-studio-neon text-black'
                    }`}>
                      {ticket.status === 'open' ? '🚨 OPEN TICKET' : '✅ RESOLVED'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-zinc-400 font-mono font-medium text-[10px]">
                    {new Date(ticket.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setActiveTicket(ticket)
                        setTicketReply(ticket.admin_reply || '')
                        setShowTicketModal(true)
                      }}
                      className="px-3 py-1.5 border-2 border-black bg-white text-black font-bold uppercase text-[10px] hover:bg-studio-purple hover:text-white transition-colors"
                    >
                      {ticket.status === 'open' ? '💬 QUICK REPLY' : '🔍 VIEW CHAT'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DRAWER: SUPPORT TICKET DETAILS & CRM CONVERSATION WORKSPACE */}
      {showTicketModal && activeTicket && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <form
            onSubmit={handleTicketReply}
            className="w-full max-w-4xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs flex flex-col md:flex-row gap-6 animate-scaleIn"
          >
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors cursor-pointer z-30"
            >
              <X className="w-4 h-4" />
            </button>

            {/* LEFT COLUMN: INTERACTIVE LIVE CONVERSATION FLOW */}
            <div className="flex-1 flex flex-col space-y-4">
              <h3 className="font-sans font-black text-lg uppercase text-studio-purple border-b border-zinc-800 pb-2 flex items-center gap-1.5 leading-none">
                💬 LIVE CHAT SUPPORT THREAD
              </h3>

              {/* CHAT MESSAGES THREAD COMPONENT */}
              <div className="bg-black border-2 border-black p-4 space-y-4 max-h-[42vh] overflow-y-auto min-h-60 flex flex-col justify-end">
                {/* 1. CUSTOMER CHAT BUBBLE (LEFT) */}
                <div className="flex flex-col items-start max-w-[85%] self-start space-y-1">
                  <span className="text-[7px] text-zinc-500 font-bold uppercase">{activeTicket.user_name} ({new Date(activeTicket.created_at).toLocaleDateString()})</span>
                  <div className="bg-[#1b1b1f] border border-zinc-800 text-zinc-100 p-3 rounded-none text-xs font-sans normal-case leading-relaxed select-all">
                    <p className="font-bold text-studio-purple uppercase text-[8px] tracking-wider mb-1">INQUIRY SUBJECT: {activeTicket.subject}</p>
                    {activeTicket.message}
                  </div>
                </div>

                {/* 2. ADMIN REPLY CHAT BUBBLE (RIGHT) */}
                {activeTicket.admin_reply && (
                  <div className="flex flex-col items-end max-w-[85%] self-end space-y-1">
                    <span className="text-[7px] text-zinc-500 font-bold uppercase">{assignedAgent} ({activeTicket.replied_at ? new Date(activeTicket.replied_at).toLocaleDateString() : 'Replied'})</span>
                    <div className="bg-studio-purple border-2 border-black text-white p-3 rounded-none text-xs font-sans normal-case leading-relaxed shadow-premium-sm select-all">
                      {activeTicket.admin_reply}
                    </div>
                  </div>
                )}
              </div>

              {/* CHAT INPUT AREA */}
              {activeTicket.status === 'open' ? (
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-500 mb-1.5">COMPOSE OFFICAL TICKET RESPONSE</label>
                    <textarea
                      required
                      value={ticketReply}
                      onChange={e => setTicketReply(e.target.value)}
                      rows={3}
                      placeholder="Type your official resolution response... Clicking save will email the customer and resolve the ticket..."
                      className="w-full bg-black border-2 border-black p-3 text-white outline-none focus:border-studio-purple font-medium text-xs normal-case leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="studio-button w-full bg-studio-purple text-white font-bold uppercase py-2.5 text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {saveLoading ? 'EMITTING RESPONSE...' : (
                      <>
                        <Send className="w-3.5 h-3.5" /> EMIT TICKET RESOLUTION REPLY
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-[#121212] border border-studio-purple/20 p-3.5 text-center font-sans font-bold text-studio-purple text-[9px] uppercase">
                  ✅ TICKET RESOLVED & CONVERSATION CLOSED
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ENTERPRISE CRM META & CONTROLS */}
            <div className="w-full md:w-72 bg-[#0c0c0d] border-2 border-black p-4 flex flex-col space-y-4">
              <h4 className="font-sans font-black text-xs uppercase text-zinc-400 border-b border-zinc-800 pb-1.5 leading-none">
                ⚙️ CRM WORKSPACE METADATA
              </h4>

              {/* TICKET DETAILS */}
              <div className="space-y-3 font-sans text-[10px]">
                <div className="flex flex-col gap-0.5 pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500 font-bold text-[8px]">TICKET REFERENCE ID</span>
                  <span className="text-white font-mono font-bold select-all truncate">{activeTicket.id}</span>
                </div>

                <div className="flex flex-col gap-0.5 pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500 font-bold text-[8px]">SUBMITTED BY</span>
                  <span className="text-white font-bold normal-case">{activeTicket.user_name}</span>
                  <span className="text-zinc-400 font-mono text-[8px] lowercase">{activeTicket.user_id}</span>
                </div>

                <div className="flex flex-col gap-0.5 pb-2 border-b border-zinc-900">
                  <span className="text-zinc-500 font-bold text-[8px]">INQUIRY TIER</span>
                  <div>
                    <span className="inline-block bg-studio-purple/10 border border-studio-purple/30 text-studio-purple text-[8px] px-2 py-0.5 font-bold uppercase">
                      {activeTicket.category}
                    </span>
                  </div>
                </div>

                {/* ASSIGNED AGENT CONTROL */}
                <div className="flex flex-col gap-1 pb-2 border-b border-zinc-900">
                  <label className="text-zinc-500 font-bold text-[8px] uppercase">ASSIGNED CRM AGENT</label>
                  <select
                    value={assignedAgent}
                    onChange={e => handleSaveAssignedAgent(e.target.value)}
                    className="bg-black border border-zinc-800 p-1.5 text-white font-bold outline-none focus:border-studio-purple text-[9px]"
                  >
                    <option value="Super Admin">SUPER ADMIN</option>
                    <option value="Naiem Shaikh">NAIEM SHAIKH</option>
                    <option value="System Agent">SYSTEM AGENT</option>
                  </select>
                </div>

                {/* INTERNAL PRIVATE NOTES (Local Caching per Ticket ID) */}
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-500 font-bold text-[8px] uppercase">INTERNAL PRIVATE NOTES (CRM ONLY)</label>
                  <textarea
                    value={internalNote}
                    onChange={e => handleSaveInternalNote(e.target.value)}
                    placeholder="Draft private notes, customer history, or resolution checkmarks here... (Persists locally)"
                    rows={4}
                    className="w-full bg-black border border-zinc-800 p-2 text-zinc-300 font-medium text-[9px] normal-case leading-relaxed outline-none focus:border-studio-purple"
                  />
                  <span className="text-[7px] text-zinc-600 block uppercase leading-none mt-1">notes are confidential and not shown to customer</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="studio-button w-full bg-zinc-850 hover:bg-zinc-800 text-white font-bold uppercase py-2 border-2 border-black text-[9px] tracking-wide cursor-pointer font-sans"
                >
                  CLOSE WORKSPACE
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
