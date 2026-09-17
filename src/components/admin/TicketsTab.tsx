'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, MessageSquare, CheckCircle2, RotateCcw, ShieldCheck, Clock, Check, Copy, AlertCircle } from 'lucide-react'
import { replyToTicket, getTicketMessages, updateTicketStatus, updateTicketAgent } from '@/app/actions'
import { supabase } from '@/lib/supabase'

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
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Assigned agent & CRM private notes
  const [internalNote, setInternalNote] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('Naiem Shaikh')

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Fetch thread messages for active ticket
  const loadMessages = useCallback(async (ticketId: string) => {
    setMessagesLoading(true)
    try {
      const msgs = await getTicketMessages(ticketId)
      setMessages(msgs || [])
    } catch (err) {
      console.error('Failed to load ticket messages:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // Auto-scroll to bottom of chat when new message arrives or modal opens
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [])

  useEffect(() => {
    if (showTicketModal && messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom(false), 80)
      return () => clearTimeout(timer)
    }
  }, [showTicketModal, messages.length, scrollToBottom])

  // Sync internal notes & agent when active ticket changes
  useEffect(() => {
    if (activeTicket?.id) {
      const savedNote = localStorage.getItem(`ticket_note_${activeTicket.id}`)
      setInternalNote(savedNote || '')
      const agent = activeTicket.assigned_agent || localStorage.getItem(`ticket_agent_${activeTicket.id}`) || 'Naiem Shaikh'
      setAssignedAgent(agent)
      loadMessages(activeTicket.id)
    }
  }, [activeTicket, loadMessages])

  // Realtime subscription for active ticket's messages
  useEffect(() => {
    if (!activeTicket?.id) return

    const channel = supabase
      .channel(`ticket-thread-${activeTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${activeTicket.id}`,
        },
        (payload: any) => {
          if (payload?.new) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
            setTimeout(() => scrollToBottom(true), 100)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTicket?.id, scrollToBottom])

  // Realtime subscription for global ticket updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-tickets-list-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          invalidateCacheAndReload('tickets')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [invalidateCacheAndReload])

  const handleSaveInternalNote = (val: string) => {
    setInternalNote(val)
    if (activeTicket?.id) {
      localStorage.setItem(`ticket_note_${activeTicket.id}`, val)
    }
  }

  const handleSaveAssignedAgent = async (val: string) => {
    setAssignedAgent(val)
    if (activeTicket?.id) {
      localStorage.setItem(`ticket_agent_${activeTicket.id}`, val)
      setActiveTicket((prev: any) => (prev ? { ...prev, assigned_agent: val } : prev))
      try {
        await updateTicketAgent(activeTicket.id, val)
        showToast(`Assigned to ${val}`, 'success')
      } catch (err: any) {
        console.error('Failed to update ticket agent:', err)
      }
    }
  }

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    if (!activeTicket?.id) return
    try {
      await updateTicketStatus(activeTicket.id, newStatus)
      setActiveTicket((prev: any) => (prev ? { ...prev, status: newStatus } : prev))
      showToast(`Ticket status updated to ${newStatus.toUpperCase()}`, 'success')
      addAuditLog('UPDATE_TICKET_STATUS', `Updated ticket #${activeTicket.ticket_number || activeTicket.id} to ${newStatus}`, 'info')
      invalidateCacheAndReload('tickets')
      loadMessages(activeTicket.id)
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket status', 'error')
    }
  }

  // Handle Command Palette opening a ticket
  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'ticket') {
      setActiveTicket(paletteSelection.data)
      setTicketReply('')
      setShowTicketModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  // Handle Admin Reply submission
  const handleSubmitReply = async (e: React.FormEvent, resolveTicket = false) => {
    e.preventDefault()
    if (!ticketReply.trim() || !activeTicket) return

    setSaveLoading(true)
    const replyText = ticketReply.trim()
    try {
      const res = await replyToTicket(activeTicket.id, replyText, {
        resolve: resolveTicket,
        agentName: assignedAgent,
      })

      showToast(
        resolveTicket
          ? 'Reply sent and ticket resolved!'
          : 'Reply sent! Ticket remains open for customer follow-up.',
        'success'
      )

      addAuditLog(
        resolveTicket ? 'RESOLVE_TICKET' : 'REPLY_TICKET',
        `Agent ${assignedAgent} replied to ticket #${activeTicket.ticket_number || activeTicket.id} (${activeTicket.email || 'N/A'})`,
        'success'
      )

      setTicketReply('')
      setActiveTicket((prev: any) => ({
        ...prev,
        status: res.status,
        admin_reply: replyText,
        assigned_agent: assignedAgent,
      }))

      // Reload messages & invalidate list
      await loadMessages(activeTicket.id)
      invalidateCacheAndReload('tickets')

      if (resolveTicket) {
        setShowTicketModal(false)
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  const copyTicketId = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">
            Customer Support Tickets
          </h3>
          <p className="text-zinc-400 text-xs font-sans mt-0.5">
            Manage inquiries, real-time customer conversations, and audio diagnostics.
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
          {/* MOBILE VIEW: TICKET CARDS */}
          <div className="md:hidden space-y-2.5">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="border border-[#222222] rounded-xl bg-[#181818] p-3.5 space-y-2.5 hover:border-[#333333] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] text-zinc-400 font-bold">
                        #{ticket.ticket_number || ticket.id.substring(0, 8)}
                      </span>
                      {ticket.last_reply_by === 'customer' && ticket.status !== 'resolved' && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-bold rounded">
                          User Replied
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-zinc-100 truncate leading-snug" title={ticket.subject}>
                      {ticket.subject}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{ticket.user_name || ticket.name || 'Customer'}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ticket.status === 'open'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : ticket.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-[#222222] text-zinc-400 border border-zinc-700'
                  }`}>
                    {ticket.status === 'open' ? 'Open' : ticket.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#222222]">
                  <span className="text-[9px] bg-white/5 border border-white/10 text-zinc-300 rounded px-1.5 py-0.5 font-mono font-bold">
                    {ticket.category}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTicket(ticket)
                      setTicketReply('')
                      setShowTicketModal(true)
                    }}
                    className="px-2.5 py-1 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 text-white font-sans text-[11px] transition-all cursor-pointer"
                  >
                    Open Thread
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: DATA TABLE */}
          <div className="hidden md:block border border-[#222222] rounded-xl bg-[#181818] overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs font-sans border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[10px] uppercase font-semibold tracking-wider">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Subject & Category</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Assigned Agent</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4 font-mono">
                      <span className="font-bold text-zinc-300">
                        #{ticket.ticket_number || ticket.id.substring(0, 8)}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-zinc-100 font-bold text-sm">
                        {ticket.user_name || ticket.name || 'Customer'}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-none mt-1 lowercase font-mono">
                        {ticket.email || ticket.user_id}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-100 font-medium text-sm truncate max-w-xs">{ticket.subject}</p>
                        {ticket.last_reply_by === 'customer' && ticket.status !== 'resolved' && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold rounded flex-shrink-0">
                            User Replied
                          </span>
                        )}
                      </div>
                      <span className="inline-block text-[9px] bg-white/5 border border-white/10 text-zinc-300 rounded px-2 py-0.5 mt-1 font-mono font-bold">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        ticket.status === 'open'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-[#222222] text-zinc-400 border border-zinc-700'
                      }`}>
                        {ticket.status === 'open' ? 'Open' : ticket.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-zinc-300 font-sans text-xs">
                      <span className="px-2 py-1 bg-white/[0.04] border border-white/10 rounded-md">
                        {ticket.assigned_agent || 'Super Admin'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTicket(ticket)
                          setTicketReply('')
                          setShowTicketModal(true)
                        }}
                        className="px-3.5 py-1.5 border border-white/15 rounded-xl bg-white/5 hover:bg-white/15 text-white font-sans text-xs transition-all cursor-pointer font-bold"
                      >
                        Open Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DRAWER: SUPPORT TICKET DETAILS & ENTERPRISE CONVERSATION WORKSPACE */}
      {showTicketModal && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-4xl border border-[#2a2a2a] bg-[#181818] rounded-xl shadow-2xl relative max-h-[92vh] flex flex-col md:flex-row overflow-hidden font-sans text-xs">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowTicketModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer z-30"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* LEFT COLUMN: SCROLLABLE CONVERSATION THREAD */}
            <div className="flex-1 flex flex-col p-5 sm:p-6 border-b md:border-b-0 md:border-r border-[#242424] min-w-0">
              <div className="flex items-center justify-between pb-3 border-b border-[#242424] mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeTicket.status === 'open' ? 'bg-amber-400 animate-pulse' : activeTicket.status === 'in_progress' ? 'bg-blue-400' : 'bg-emerald-400'
                  }`} />
                  <h3 className="font-sans font-bold text-base text-white">
                    Conversation Thread
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  #{activeTicket.ticket_number || activeTicket.id.substring(0, 8)}
                </span>
              </div>

              {/* TICKET SUBJECT BANNER */}
              <div className="bg-[#141414] border border-[#222222] p-3 rounded-lg mb-3">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Subject</span>
                <p className="text-zinc-100 font-bold text-xs mt-0.5">{activeTicket.subject}</p>
              </div>

              {/* CHAT MESSAGES SCROLL CONTAINER (FIXED SCROLL CLAMP BUG) */}
              <div
                ref={chatContainerRef}
                className="flex-1 bg-[#101010] border border-[#222222] rounded-xl p-4 overflow-y-auto max-h-[46vh] min-h-[260px] space-y-3.5 pr-2 scrollbar-thin"
              >
                {messagesLoading && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 py-10 space-x-2">
                    <Clock className="w-4 h-4 animate-spin text-zinc-400" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isCustomer = msg.sender_type === 'customer'
                    const isSystem = msg.sender_type === 'system'

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="bg-white/5 border border-white/10 text-zinc-400 text-[10px] px-3 py-1 rounded-full font-mono">
                            {msg.message}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-start self-start' : 'items-end self-end'} max-w-[85%] space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                          <span>{msg.sender_name || (isCustomer ? activeTicket.user_name : assignedAgent)}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed select-all whitespace-pre-wrap ${
                            isCustomer
                              ? 'bg-[#1c1c1c] border border-[#262626] text-zinc-100 rounded-tl-sm'
                              : 'bg-[#1e293b] border border-[#334155] text-white rounded-tr-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Fallback if messages table has no rows yet
                  <div className="space-y-3">
                    <div className="flex flex-col items-start max-w-[85%] space-y-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">
                        {activeTicket.user_name || activeTicket.name || 'Customer'}
                      </span>
                      <div className="bg-[#1c1c1c] border border-[#262626] text-zinc-100 p-3.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed select-all whitespace-pre-wrap">
                        {activeTicket.message}
                      </div>
                    </div>
                    {activeTicket.admin_reply && (
                      <div className="flex flex-col items-end max-w-[85%] self-end space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">
                          {activeTicket.assigned_agent || assignedAgent} • Staff
                        </span>
                        <div className="bg-[#1e293b] border border-[#334155] text-white p-3.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed select-all whitespace-pre-wrap">
                          {activeTicket.admin_reply}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* REPLY FORM WORKSPACE */}
              <form onSubmit={(e) => handleSubmitReply(e, false)} className="mt-3.5 space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                      Reply as {assignedAgent}
                    </label>
                    <span className="text-[9px] text-zinc-500">
                      Auto-emails customer via Resend
                    </span>
                  </div>
                  <textarea
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    rows={3}
                    placeholder="Type your response to the customer... Ticket remains OPEN so customer can reply back continuously."
                    className="w-full bg-[#121212] border border-[#282828] focus:border-zinc-500 rounded-xl p-3 text-white outline-none font-medium text-xs leading-relaxed transition-all resize-none"
                  />
                </div>

                {/* DUAL ACTION BUTTONS: SEND REPLY (STAYS OPEN) VS SEND & RESOLVE */}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saveLoading || !ticketReply.trim()}
                    className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold uppercase py-2.5 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-40"
                  >
                    {saveLoading ? 'Sending...' : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Send Reply (Keep Open)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={saveLoading || !ticketReply.trim()}
                    onClick={(e) => handleSubmitReply(e, true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase py-2.5 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Send &amp; Resolve
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: ENTERPRISE CRM CONTROLS & META */}
            <div className="w-full md:w-80 bg-[#141414] p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#242424]">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400">
                    Ticket Metadata
                  </h4>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    activeTicket.status === 'open'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : activeTicket.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {activeTicket.status}
                  </span>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  {/* TICKET ID */}
                  <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                    <span className="text-zinc-500 font-bold text-[9px] uppercase">Ticket Reference</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono font-bold select-all truncate">
                        #{activeTicket.ticket_number || activeTicket.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyTicketId(activeTicket.ticket_number || activeTicket.id)}
                        className="text-zinc-400 hover:text-white p-1"
                        title="Copy Ticket Reference"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* CUSTOMER */}
                  <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                    <span className="text-zinc-500 font-bold text-[9px] uppercase">Customer</span>
                    <span className="text-white font-bold">{activeTicket.user_name || activeTicket.name || 'Customer'}</span>
                    <span className="text-zinc-400 font-mono text-[9px] lowercase select-all">{activeTicket.email || activeTicket.user_id}</span>
                  </div>

                  {/* CATEGORY & DAW */}
                  <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
                    <span className="text-zinc-500 font-bold text-[9px] uppercase">Inquiry Category</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block bg-white/5 border border-white/10 text-zinc-300 text-[9px] px-2 py-0.5 font-bold uppercase rounded">
                        {activeTicket.category}
                      </span>
                      {activeTicket.daw && (
                        <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px] px-2 py-0.5 font-bold uppercase rounded font-mono">
                          {activeTicket.daw}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* STATUS SWITCHER */}
                  <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.06]">
                    <label className="text-zinc-500 font-bold text-[9px] uppercase">Update Status</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(st)}
                          className={`py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                            activeTicket.status === st
                              ? 'bg-white text-black font-extrabold shadow'
                              : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ASSIGNED AGENT CONTROL */}
                  <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.06]">
                    <label className="text-zinc-500 font-bold text-[9px] uppercase">Assigned Agent</label>
                    <select
                      value={assignedAgent}
                      onChange={(e) => handleSaveAssignedAgent(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg p-2 text-white font-medium outline-none focus:border-white/25 text-xs"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Naiem Shaikh">Naiem Shaikh</option>
                      <option value="Audio Engineer">Audio Engineer</option>
                      <option value="Support Desk">Support Desk</option>
                    </select>
                  </div>

                  {/* INTERNAL PRIVATE NOTES */}
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 font-bold text-[9px] uppercase">Internal Staff Notes</label>
                    <textarea
                      value={internalNote}
                      onChange={(e) => handleSaveInternalNote(e.target.value)}
                      placeholder="Draft private notes, diagnostic checklist..."
                      rows={3}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-zinc-300 font-medium text-xs leading-relaxed outline-none focus:border-white/25 resize-none"
                    />
                    <span className="text-[8px] text-zinc-500">Only visible to admin staff</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="w-full bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold uppercase py-2.5 border border-white/15 text-xs rounded-xl cursor-pointer font-sans transition-colors"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
