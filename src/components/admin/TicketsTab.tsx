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

      {/* MODAL DRAWER: SUPPORT TICKET DETAILS */}
      {showTicketModal && activeTicket && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleTicketReply}
            className="w-full max-w-xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-purple mb-6">
              💬 support ticket conversation
            </h3>

            {/* CUSTOMER TICKET MESSAGE */}
            <div className="space-y-4 mb-6">
              <div className="bg-black p-4 border border-zinc-800">
                <div className="flex justify-between border-b border-zinc-900 pb-2 mb-2 font-sans">
                  <span className="font-bold text-zinc-100 uppercase text-sm">{activeTicket.user_name}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{new Date(activeTicket.created_at).toLocaleString()}</span>
                </div>
                <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">SUBJECT:</p>
                <p className="text-zinc-100 font-bold text-sm normal-case mt-0.5">{activeTicket.subject}</p>

                <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider mt-3">CUSTOMER INQUIRY MESSAGE:</p>
                <div className="text-zinc-200 mt-1 font-sans text-xs leading-relaxed normal-case bg-[#0d0d0d] p-3 border border-zinc-900 whitespace-pre-wrap">
                  {activeTicket.message}
                </div>
              </div>

              {/* ADMIN REPLY LOG */}
              {activeTicket.status === 'resolved' && (
                <div className="bg-studio-purple/5 p-4 border border-studio-purple/30">
                  <div className="flex justify-between border-b border-studio-purple/20 pb-2 mb-2 font-sans">
                    <span className="font-bold text-studio-purple uppercase text-xs">RESOLVED ADMIN REPLY</span>
                    {activeTicket.replied_at && (
                      <span className="text-[10px] text-zinc-500 font-medium">{new Date(activeTicket.replied_at).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-zinc-300 font-sans text-xs leading-relaxed normal-case bg-black p-3 border border-zinc-900 whitespace-pre-wrap">
                    {activeTicket.admin_reply}
                  </div>
                </div>
              )}
            </div>

            {/* REPLY BOX */}
            {activeTicket.status === 'open' ? (
              <div className="space-y-4 font-sans">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-2">COMPOSE TICKET RESOLUTION REPLY</label>
                  <textarea
                    required
                    value={ticketReply}
                    onChange={e => setTicketReply(e.target.value)}
                    rows={4}
                    placeholder="Type your official response here. Clicking save will email the customer and resolve the ticket..."
                    className="w-full bg-black border-2 border-black p-3 text-white outline-none focus:border-studio-purple font-medium text-xs normal-case leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="studio-button w-full bg-studio-purple text-white font-bold uppercase py-2 text-xs"
                >
                  {saveLoading ? 'SENDING...' : (
                    <>
                      <Send className="w-3.5 h-3.5 inline mr-1" /> EMIT TICKET RESOLUTION REPLY
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="studio-button w-full bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2 text-xs"
              >
                CLOSE CONVERSATION SCREEN
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}
