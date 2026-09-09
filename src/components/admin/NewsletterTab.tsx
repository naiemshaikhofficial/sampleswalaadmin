'use client'

import React, { useState, useEffect } from 'react'
import { Mail, ShieldCheck, Ban, Search, Plus, Send, X, RefreshCw, Users, Check } from 'lucide-react'
import { subscribeEmailToBrevo, unsubscribeEmailFromBrevo, sendBrevoCampaign } from '@/app/actions'

interface NewsletterTabProps {
  subscribersList: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
}

export function NewsletterTab({
  subscribersList,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation
}: NewsletterTabProps) {
  // Search & Filter States
  const [newsletterSearch, setNewsletterSearch] = useState('')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  
  // Modals & Active Edit Entities
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [newsletterEmailInput, setNewsletterEmailInput] = useState('')
  
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignContent, setCampaignContent] = useState('')
  const [campaignSending, setCampaignSending] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'split'>('split')
  const [previewHtml, setPreviewHtml] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewHtml(getPreviewHtml())
    }, 150)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignContent, previewMode, showCampaignModal])

  const injectHtmlElement = (type: string) => {
    let snippet = ''
    if (type === 'heading') {
      snippet = `\n<h2 style="color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; letter-spacing: -0.02em;">New Sound Pack Available Now</h2>\n`
    } else if (type === 'paragraph') {
      snippet = `\n<p style="color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">This brand new sound kit delivers elite, studio-grade audio elements recorded by top-tier Indian instrumentalists. Infuse authentic acoustic textures directly into your electronic music productions today.</p>\n`
    } else if (type === 'button') {
      snippet = `\n<div style="margin: 28px 0; text-align: center;">\n  <a href="https://sampleswala.com" style="display: inline-block; padding: 12px 28px; background-color: #00BFFF; color: #000000; text-decoration: none; font-weight: 700; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase;">Download Sample Pack</a>\n</div>\n`
    } else if (type === 'image') {
      snippet = `\n<img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop" style="width: 100%; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);" alt="Sound drop cover" />\n`
    } else if (type === 'pack-card') {
      snippet = `\n<div style="background-color: #111115; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n  <span style="display: inline-block; background-color: #FFE600; color: #000000; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px;">Premium Release</span>\n  <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #ffffff;">🔥 Quantum Melodies & One-Shots</h4>\n  <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">Includes 120+ Melody loops, 80 high-impact drum one-shots, custom Serum synthesizer presets, and professional MIDI structures.</p>\n</div>\n`
    }
    setCampaignContent(prev => prev + snippet)
  }

  const getPreviewHtml = () => {
    if (!campaignContent) {
      return `
        <!DOCTYPE html>
        <html>
          <body style="background: transparent; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; color: #888;">
            <div style="text-align: center; text-transform: uppercase; font-weight: bold; font-size: 11px; letter-spacing: 2px;">
              HTML COMPOSE LOADING...
            </div>
          </body>
        </html>
      `;
    }

    const isFullHtml = /<html|<!DOCTYPE/i.test(campaignContent);
    const unsubscribeUrl = '#';

    // Premium dark-mode unsubscribe footer aligned with Brand Theme
    const footerHtml = `
      <!-- UN-SUBSCRIBE FOOTER BY DEFAULT -->
      <div style="margin-top: 40px; padding: 24px; border-top: 1px solid #1e293b; background-color: #0c0c0e; font-size: 11px; color: #94a3b8; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">You received this email because you subscribed to our newsletter at <a href="https://sampleswala.com" style="color: #00BFFF; text-decoration: none; font-weight: bold;">sampleswala.com</a>.</p>
        <p style="margin: 0;">
          Want to stop receiving these? <a href="${unsubscribeUrl}" onclick="event.preventDefault();" style="color: #ef4444; font-weight: 600; text-decoration: underline; margin-left: 4px;">Unsubscribe here</a>
        </p>
        <p style="font-weight: 600; margin: 12px 0 0 0; color: #f8fafc;">&copy; 2026 SamplesWala. All rights reserved.</p>
      </div>
    `;

    if (isFullHtml) {
      let html = campaignContent
        .replace(/{{unsubscribe_url}}/g, unsubscribeUrl)
        .replace(/{{unsubscribe}}/g, unsubscribeUrl);

      // Enforce the default unsubscribe footer if not explicitly present in external/pasted code
      const hasUnsubscribe = /unsubscribe/i.test(campaignContent);
      if (!hasUnsubscribe) {
        if (/<\/body>/i.test(html)) {
          html = html.replace(/<\/body>/i, `${footerHtml}</body>`);
        } else {
          html = html + footerHtml;
        }
      }
      return html;
    }

    // Wrap partial content in SamplesWala Dark Industrial Brand Theme
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #030303;
              color: #f1f5f9;
              -webkit-font-smoothing: antialiased;
            }
            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #0c0c0c;
              border: 1px solid #1e293b;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.8);
            }
            .email-body {
              padding: 40px 32px;
            }
            a {
              color: #00BFFF;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                margin: 0;
                border-radius: 0;
                border: none;
                width: 100% !important;
              }
              .email-body {
                padding: 24px 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-body">
              ${campaignContent.replace(/\\n/g, '<br/>').replace(/{{unsubscribe_url}}/g, unsubscribeUrl).replace(/{{unsubscribe}}/g, unsubscribeUrl)}
            </div>
            ${footerHtml}
          </div>
        </body>
      </html>
    `;
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmailInput) return

    setActionLoading(true)
    try {
      await subscribeEmailToBrevo(newsletterEmailInput)
      showToast(`Successfully subscribed "${newsletterEmailInput}" to Brevo list!`, 'success')
      addAuditLog('NEWSLETTER_SUBSCRIBE', `Manually subscribed email to newsletter: ${newsletterEmailInput}`, 'success')
      setNewsletterEmailInput('')
      setShowSubscribeModal(false)
      invalidateCacheAndReload('newsletter')
    } catch (err: any) {
      showToast(err.message || 'Failed to subscribe email', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleNewsletterUnsubscribe = async (email: string) => {
    const approved = await askConfirmation(
      '⚠️ UNSUBSCRIBE NEWSLETTER VISITOR',
      `Are you sure you want to UNSUBSCRIBE and blacklist "${email}" from receiving any newsletter campaigns?`,
      true,
      'UNSUBSCRIBE EMAIL'
    )
    if (!approved) return

    setActionLoading(true)
    try {
      await unsubscribeEmailFromBrevo(email)
      showToast(`Successfully unsubscribed "${email}"!`, 'success')
      addAuditLog('NEWSLETTER_UNSUBSCRIBE', `Manually unsubscribed/blacklisted newsletter visitor: ${email}`, 'warning')
      invalidateCacheAndReload('newsletter')
    } catch (err: any) {
      showToast(err.message || 'Failed to unsubscribe email', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleNewsletterResubscribe = async (email: string) => {
    setActionLoading(true)
    try {
      await subscribeEmailToBrevo(email)
      showToast(`Successfully restored newsletter subscription for "${email}"!`, 'success')
      addAuditLog('NEWSLETTER_SUBSCRIBE', `Restored active newsletter subscription: ${email}`, 'success')
      invalidateCacheAndReload('newsletter')
    } catch (err: any) {
      showToast(err.message || 'Failed to subscribe email', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignSubject || !campaignContent) {
      showToast('Subject and HTML Content are required!', 'error')
      return
    }

    if (selectedRecipients.length === 0) {
      showToast('Please select at least 1 recipient to send the campaign to!', 'error')
      return
    }

    const allActiveEmails = subscribersList.filter((s: any) => s.subscribed && s.email && s.email !== 'N/A').map((s: any) => s.email)
    const isSendingToAll = selectedRecipients.length === allActiveEmails.length

    const approved = await askConfirmation(
      '🚀 SEND LIVE NEWSLETTER CAMPAIGN',
      isSendingToAll
        ? `You are about to send this newsletter to ALL ${selectedRecipients.length} active subscribers. Are you absolutely ready?`
        : `You are about to send this newsletter to ${selectedRecipients.length} selected recipient${selectedRecipients.length > 1 ? 's' : ''}. Are you ready to send?`,
      false,
      'SEND NEWSLETTER'
    )
    if (!approved) return

    setCampaignSending(true)
    try {
      const res = await sendBrevoCampaign({
        subject: campaignSubject,
        title: campaignTitle || '',
        htmlContent: campaignContent,
        targetEmails: selectedRecipients
      })
      showToast(`Newsletter sent successfully to ${res.recipientsCount} subscribers!`, 'success')
      addAuditLog('NEWSLETTER_DISPATCH', `Dispatched newsletter campaign: "${campaignSubject}" to ${res.recipientsCount} users`, 'success')
      setShowCampaignModal(false)
      setCampaignSubject('')
      setCampaignTitle('')
      setCampaignContent('')
      setSelectedRecipients([])
      setRecipientSearch('')
      invalidateCacheAndReload('newsletter')
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch newsletter campaign', 'error')
    } finally {
      setCampaignSending(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      {/* STATS HEADER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. TOTAL SUBSCRIBERS */}
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#333333] transition-all">
          <div className="w-12 h-12 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-white">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-zinc-400">Total Subscribers</h3>
            <p className="font-sans font-bold text-2xl text-white mt-0.5">
              {subscribersList.length}
            </p>
          </div>
        </div>

        {/* 2. ACTIVE CONTACTS */}
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#333333] transition-all">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-zinc-400">Active Listing</h3>
            <p className="font-sans font-bold text-2xl text-white mt-0.5">
              {subscribersList.filter((s: any) => s.subscribed).length}
            </p>
          </div>
        </div>

        {/* 3. BLACKLISTED CONTACTS */}
        <div className="bg-[#181818] border border-[#222222] rounded-xl p-5 flex items-center gap-4 shadow-sm hover:border-[#333333] transition-all">
          <div className="w-12 h-12 bg-[#222222] border border-zinc-750 rounded-xl flex items-center justify-center text-zinc-400">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-zinc-400">Unsubscribed</h3>
            <p className="font-sans font-bold text-2xl text-white mt-0.5">
              {subscribersList.filter((s: any) => !s.subscribed).length}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION COMMAND BAR */}
      <div className="bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 relative font-sans">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search contacts by email..."
            value={newsletterSearch}
            onChange={e => setNewsletterSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full max-w-md bg-[#121212] border border-[#262626] rounded-lg text-white placeholder-zinc-500 outline-none focus:border-white text-xs transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowSubscribeModal(true)}
            className="studio-button px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            Add Subscriber
          </button>

          <button
            type="button"
            onClick={() => {
              setCampaignSubject('')
              setCampaignTitle('')
              setCampaignContent(
                `<h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em;">Fresh Sound Drops inside the Vault</h1>\n<p style="font-size: 14px; color: #94a3b8; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 20px;">Hey Producer,</p>\n<p style="font-size: 14px; color: #94a3b8; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 20px;">We've just expanded our catalog with a range of premium, studio-recorded acoustic elements. These new sample packs contain authentic instruments and loops designed to add pure, live-sounding textures to your modern beats.</p>\n\n<div style="background-color: #111115; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n  <span style="display: inline-block; background-color: #FFE600; color: #000000; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em;">New Release</span>\n  <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #ffffff;">🎶 Sitar Legends Vol. 1</h4>\n  <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">Over 150 authentic sitar loops, drone samples, and expressive ornaments recorded live in professional studios. Tailored perfectly for Trap, Lofi, and Cinematic production.</p>\n</div>\n\n<div style="margin: 28px 0; text-align: center;">\n  <a href="https://sampleswala.com" style="display: inline-block; padding: 12px 28px; background-color: #00BFFF; color: #000000; text-decoration: none; font-weight: 700; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase;">Explore Sample Packs</a>\n</div>\n\n<p style="font-size: 14px; color: #94a3b8; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Happy Producing,<br/><strong>The SamplesWala Team</strong></p>`
              )
              // Pre-select all active subscribers
              const activeEmails = subscribersList
                .filter((s: any) => s.subscribed && s.email && s.email !== 'N/A')
                .map((s: any) => s.email)
              setSelectedRecipients(activeEmails)
              setRecipientSearch('')
              setShowCampaignModal(true)
            }}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            Broadcast Campaign
          </button>
        </div>
      </div>

      {/* NEWSLETTER SUBSCRIBERS DISPLAY */}
      {(() => {
        const filtered = subscribersList.filter(s => {
          const searchLower = newsletterSearch.toLowerCase()
          return (s.email || '').toLowerCase().includes(searchLower)
        })

        if (filtered.length === 0) {
          return (
            <div className="border border-[#222222] bg-[#181818] rounded-xl p-10 text-center text-zinc-500 font-medium text-xs">
              No subscribers found in newsletter lists.
            </div>
          )
        }

        return (
          <>
            {/* MOBILE VIEW: SUBSCRIBER CARDS (NO HORIZONTAL SCROLLBAR) */}
            <div className="md:hidden space-y-2.5">
              {filtered.map((s: any) => (
                <div
                  key={s.id}
                  className="border border-[#222222] bg-[#181818] rounded-xl p-3.5 space-y-2.5 hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-zinc-100 font-medium truncate flex-1 select-all" title={s.email}>
                      {s.email}
                    </span>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.subscribed ? 'bg-white/10 text-white border border-white/20' : 'bg-[#222222] text-zinc-400 border border-zinc-700'
                    }`}>
                      {s.subscribed ? 'Active' : 'Unsubscribed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-[#222222]">
                    <span>#{s.id} • {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}</span>
                    <div>
                      {s.subscribed ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleNewsletterUnsubscribe(s.email)}
                          className="px-2.5 py-1 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-400 hover:text-white border border-[#333333] text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Unsubscribe
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleNewsletterResubscribe(s.email)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Resubscribe
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: DATA TABLE */}
            <div className="hidden md:block border border-[#222222] bg-[#181818] rounded-xl overflow-hidden shadow-sm font-sans text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="p-4">Member ID</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4 text-center">Subscription Status</th>
                      <th className="p-4 text-center">Creation Date</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] font-sans text-xs">
                    {filtered.map((s: any) => (
                      <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-4 font-mono font-medium text-zinc-500">
                          #{s.id}
                        </td>
                        <td className="p-4 font-mono text-zinc-100 select-all text-xs">
                          {s.email}
                        </td>
                        <td className="p-4 text-center">
                          {s.subscribed ? (
                            <span className="bg-white/10 text-white border border-white/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                              Active Subscriber
                            </span>
                          ) : (
                            <span className="bg-[#222222] text-zinc-400 border border-zinc-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                              Unsubscribed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-zinc-400 font-mono text-xs">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {s.subscribed ? (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleNewsletterUnsubscribe(s.email)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-300 hover:text-white border border-[#333333] font-medium text-[11px] transition-all cursor-pointer disabled:opacity-50"
                              >
                                Unsubscribe
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleNewsletterResubscribe(s.email)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-[11px] transition-all cursor-pointer disabled:opacity-50"
                              >
                                Resubscribe
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      })()}

      {/* MODAL DRAWER: MANUAL NEWSLETTER EMAIL SUBSCRIBE */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleNewsletterSubscribe}
            className="w-full max-w-md border border-[#2a2a2a] bg-[#181818] rounded-xl p-6 sm:p-7 shadow-2xl relative font-sans text-xs animate-scaleIn"
          >
            <button
              type="button"
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              Add Subscriber
            </h3>

            <p className="text-zinc-400 text-xs mb-6">
              Manually register a contact directly to the newsletter contacts list.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newsletterEmailInput}
                  onChange={e => setNewsletterEmailInput(e.target.value)}
                  placeholder="e.g. producer@gmail.com"
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg p-2.5 text-white outline-none focus:border-white text-xs transition-colors"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubscribeModal(false)}
                  className="flex-1 py-2.5 bg-[#202020] hover:bg-[#282828] text-zinc-300 border border-[#333333] font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {actionLoading ? 'Processing...' : 'Subscribe Email'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DRAWER: COMPOSE & SEND NEWSLETTER CAMPAIGN */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
          <form
            onSubmit={handleSendCampaign}
            className="w-full max-w-[95vw] lg:max-w-7xl h-[90vh] border border-zinc-800 bg-[#090a0f] shadow-2xl relative flex flex-col font-sans text-xs rounded-xl overflow-hidden animate-scaleIn"
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 px-6 py-4 bg-[#0d0d12] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100 uppercase tracking-tight font-sans">
                    Newsletter Workspace Composer
                  </h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mt-0.5 font-mono">
                    Draft, Sandbox Previews (PC & Mobile), and Direct Brevo Broadcast
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editor body */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#06070a]">
              {/* COMPOSER FORM (5/12 cols) */}
              <div className="lg:col-span-5 border-r border-zinc-850 p-6 overflow-y-auto space-y-5 h-full scrollbar">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2 font-mono">Campaign Subject Line</label>
                  <input
                    type="text"
                    required
                    value={campaignSubject}
                    onChange={e => setCampaignSubject(e.target.value)}
                    placeholder="e.g. 🎵 WEEKLY DROP: Claim 3 New Sample Packs inside the Vault!"
                    className="w-full bg-zinc-950 border border-zinc-850 p-3 text-zinc-100 rounded-lg outline-none focus:border-zinc-700 font-sans text-xs placeholder-zinc-750 leading-relaxed transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-2 font-mono">Hero Main Title (For Standard Templates)</label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={e => setCampaignTitle(e.target.value)}
                    placeholder="e.g. FRESH VAULT RELEASES"
                    className="w-full bg-zinc-950 border border-zinc-850 p-3 text-zinc-100 rounded-lg outline-none focus:border-zinc-700 font-sans text-xs placeholder-zinc-750 leading-relaxed transition-all"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider font-mono">HTML/Text Body Content</label>

                    {/* HTML TOOLBAR */}
                    <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 border border-zinc-850 rounded-md">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase self-center px-1.5 font-mono">Insert:</span>
                      <button
                        type="button"
                        onClick={() => injectHtmlElement('heading')}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[9px] font-bold uppercase tracking-wider text-zinc-300 rounded transition-all"
                      >
                        🔤 Title
                      </button>
                      <button
                        type="button"
                        onClick={() => injectHtmlElement('paragraph')}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[9px] font-bold uppercase tracking-wider text-zinc-300 rounded transition-all"
                      >
                        📝 Text
                      </button>
                      <button
                        type="button"
                        onClick={() => injectHtmlElement('button')}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[9px] font-bold uppercase tracking-wider text-zinc-300 rounded transition-all"
                      >
                        🔘 Button
                      </button>
                      <button
                        type="button"
                        onClick={() => injectHtmlElement('image')}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[9px] font-bold uppercase tracking-wider text-zinc-300 rounded transition-all"
                      >
                        🖼️ Img
                      </button>
                      <button
                        type="button"
                        onClick={() => injectHtmlElement('pack-card')}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-[9px] font-bold uppercase tracking-wider text-zinc-300 rounded transition-all"
                      >
                        📦 Card
                      </button>
                    </div>
                  </div>

                  <textarea
                    required
                    rows={12}
                    value={campaignContent}
                    onChange={e => setCampaignContent(e.target.value)}
                    placeholder="Paste HTML or snippets..."
                    className="w-full min-h-[250px] bg-zinc-950 border border-zinc-850 p-3 text-zinc-200 rounded-lg outline-none focus:border-zinc-700 font-mono text-xs leading-relaxed"
                  />
                </div>

                {/* RECIPIENT PICKER */}
                <div className="border border-zinc-850 bg-zinc-950/50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-850 bg-zinc-950">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider font-mono">Recipients</label>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-mono bg-white/10 text-white border border-white/20">
                        {selectedRecipients.length} SELECTED
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const activeEmails = subscribersList
                            .filter((s: any) => s.subscribed && s.email && s.email !== 'N/A')
                            .map((s: any) => s.email)
                          setSelectedRecipients(activeEmails)
                        }}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-white hover:text-white text-[8px] font-bold uppercase text-zinc-400 rounded transition-all"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipients([])}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-650 hover:text-zinc-200 text-[8px] font-bold uppercase text-zinc-400 rounded transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-b border-zinc-900">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3 h-3 text-zinc-600" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={e => setRecipientSearch(e.target.value)}
                        placeholder="Filter emails..."
                        className="w-full bg-zinc-950 border border-zinc-850 pl-7 pr-3 py-1.5 text-zinc-200 rounded outline-none focus:border-zinc-700 font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="max-h-[150px] overflow-y-auto scrollbar">
                    {(() => {
                      const activeSubscribers = subscribersList
                        .filter((s: any) => s.subscribed && s.email && s.email !== 'N/A')
                        .filter((s: any) => !recipientSearch || s.email.toLowerCase().includes(recipientSearch.toLowerCase()))

                      if (activeSubscribers.length === 0) {
                        return <div className="p-4 text-center text-zinc-600 text-[9px] font-mono uppercase">No active subscribers</div>
                      }

                      return activeSubscribers.map((sub: any) => {
                        const isChecked = selectedRecipients.includes(sub.email)
                        return (
                          <label
                            key={sub.id || sub.email}
                            className={`flex items-center gap-2.5 px-4 py-2 border-b border-zinc-900/50 cursor-pointer transition-colors hover:bg-zinc-900/40 ${
                              isChecked ? 'bg-white/5' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedRecipients(prev => [...prev, sub.email])
                                } else {
                                  setSelectedRecipients(prev => prev.filter(em => em !== sub.email))
                                }
                              }}
                              className="accent-white w-3.5 h-3.5 flex-shrink-0"
                            />
                            <span className="font-mono text-[10px] text-zinc-400 truncate">{sub.email}</span>
                          </label>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* LIVE CAMPAIGN PREVIEW CANVAS */}
              <div className="lg:col-span-7 bg-[#050508] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] p-6 overflow-y-auto h-full flex flex-col space-y-4 scrollbar">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-855/80 pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider font-mono">Sandbox Viewport Previewer</label>
                  </div>

                  <div className="flex border border-zinc-800 p-0.5 bg-zinc-950 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('split')}
                      className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                        previewMode === 'split' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      ⚔️ Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                        previewMode === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🖥️ PC
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                        previewMode === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      📱 Phone
                    </button>
                  </div>
                </div>

                <div className="flex-grow w-full flex items-center justify-center min-h-[400px] mt-4">
                  <div className={`w-full flex items-start justify-center gap-6 ${
                    previewMode === 'split' ? 'flex-col xl:flex-row' : 'flex-col items-center'
                  }`}>
                    {/* Simulated PC Frame */}
                    <div className={`${
                      previewMode === 'desktop' ? 'w-full max-w-[650px] h-[450px] flex flex-col' : previewMode === 'split' ? 'flex-1 w-full max-w-[420px] h-[400px] flex flex-col' : 'hidden'
                    } border border-zinc-800 bg-[#0c0c0e] rounded-xl overflow-hidden shadow-2xl`}>
                      <div className="bg-[#121216] border-b border-zinc-850 px-4 py-2 flex items-center justify-between select-none">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-zinc-700" />
                          <span className="w-2 h-2 rounded-full bg-zinc-700" />
                          <span className="w-2 h-2 rounded-full bg-zinc-700" />
                        </div>
                        <span className="text-[8px] font-mono text-zinc-500">https://sampleswala.com/newsletter/preview</span>
                      </div>
                      <div className="flex-grow bg-[#050508] p-3 overflow-hidden">
                        <iframe title="PC Preview" srcDoc={previewHtml} className="bg-[#030303] border border-zinc-800 w-full h-full rounded" />
                      </div>
                    </div>

                    {/* Simulated Mobile Frame */}
                    <div className={`${
                      previewMode === 'mobile' ? 'w-[280px] h-[450px] flex flex-col' : previewMode === 'split' ? 'w-[220px] h-[400px] flex flex-col' : 'hidden'
                    } border-[8px] border-zinc-900 bg-zinc-950 rounded-[30px] shadow-2xl overflow-hidden relative flex-shrink-0`}>
                      <div className="flex-grow overflow-hidden bg-[#030303]">
                        <iframe title="Mobile Preview" srcDoc={previewHtml} className="w-full h-full border-0 bg-[#030303]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="flex items-center justify-between border-t border-zinc-850 px-6 py-4 bg-[#0d0d12] flex-shrink-0">
              <div className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider hidden sm:block">
                Direct Brevo Broadcast System • Auto-Unsubscribe Footer Enabled
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 font-semibold uppercase text-[10px] rounded-lg transition-all active:scale-95 font-mono"
                >
                  CANCEL / CLOSE
                </button>

                <button
                  type="submit"
                  disabled={campaignSending}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black border border-zinc-200 font-bold uppercase text-[10px] disabled:opacity-50 flex items-center gap-2 rounded-lg transition-all shadow-md active:scale-95 font-mono"
                >
                  {campaignSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> DISPATCHING...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> DISPATCH LIVE CAMPAIGN
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
