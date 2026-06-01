'use client'

import React, { useState } from 'react'
import { Eye, Check, X, ExternalLink, UserCheck } from 'lucide-react'
import { updateKYCStatus, triggerArtistPayout } from '@/app/actions'

interface KycTabProps {
  artists: any[]
  payouts: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
}

export function KycTab({
  artists,
  payouts,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation
}: KycTabProps) {
  // Modal states
  const [showKycModal, setShowKycModal] = useState(false)
  const [activeArtist, setActiveArtist] = useState<any>(null)

  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutArtist, setPayoutArtist] = useState<any>(null)
  
  // Payout form states
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMonth, setPayoutMonth] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')
  const [payoutUtr, setPayoutUtr] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  const handleKycApproval = async (artistId: string, status: 'approved' | 'rejected', artistName: string = 'this artist') => {
    const promptTitle = status === 'approved' ? '🎨 CONFIRM KYC APPROVAL' : '⚠️ CONFIRM KYC REJECTION'
    const promptMsg = status === 'approved'
      ? `Are you absolutely sure you want to APPROVE the artist verification document for "${artistName}"? This grants them full publishing rights and live payouts.`
      : `Are you sure you want to REJECT the artist verification document for "${artistName}"? They will be prompted to re-upload.`;
    
    const approved = await askConfirmation(promptTitle, promptMsg, status === 'rejected', status === 'approved' ? 'APPROVE KYC' : 'REJECT KYC')
    if (!approved) return

    try {
      await updateKYCStatus(artistId, status)
      showToast(`Artist KYC status updated to ${status}!`, 'success')
      addAuditLog(status === 'approved' ? 'KYC_APPROVE' : 'KYC_REJECT', `Artist KYC ${status === 'approved' ? 'approved' : 'rejected'} for: ${artistName}`, status === 'approved' ? 'success' : 'warning')
      setShowKycModal(false)
      invalidateCacheAndReload('kyc')
    } catch (err: any) {
      showToast(err.message || 'Failed to update KYC', 'error')
    }
  }

  const handlePayoutTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutAmount || !payoutMonth || !payoutUtr) {
      showToast('Amount, Payout Month, and UTR reference number are required!', 'error')
      return
    }

    setSaveLoading(true)
    try {
      await triggerArtistPayout({
        artist_id: payoutArtist.user_id,
        amount: Number(payoutAmount),
        payout_month: payoutMonth,
        notes: payoutNotes,
        utr_number: payoutUtr
      })
      showToast(`Simulated payout of ₹${payoutAmount} registered successfully!`, 'success')
      addAuditLog('TRIGGER_PAYOUT', `Triggered simulated payout of ₹${payoutAmount} to artist: ${payoutArtist.full_name}`, 'success')
      setShowPayoutModal(false)
      setPayoutAmount('')
      setPayoutMonth('')
      setPayoutNotes('')
      setPayoutUtr('')
      invalidateCacheAndReload('kyc')
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger payout', 'error')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. ARTIST LIST (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121212] p-4 border-4 border-black flex justify-between items-center">
            <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-orange">
              🎨 KYC PORTAL VERIFICATION
            </h3>
          </div>

          <div className="border-4 border-black bg-black overflow-x-auto">
            <table className="w-full text-left uppercase font-bold border-collapse">
              <thead>
                <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
                  <th className="p-4">ARTIST</th>
                  <th className="p-4">PAN / AADHAAR</th>
                  <th className="p-4">KYC STATE</th>
                  <th className="p-4 text-center">KYC DOCUMENT</th>
                  <th className="p-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y-3 divide-black font-sans text-xs">
                {artists.map((artist: any) => (
                  <tr key={artist.user_id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                    <td className="p-4">
                      <p className="text-white font-bold text-sm normal-case">{artist.full_name}</p>
                      <p className="text-[10px] text-zinc-500 leading-none mt-1 lowercase font-mono">{artist.user_id}</p>
                    </td>
                    <td className="p-4 font-mono font-medium text-zinc-300">
                      <p>PAN: {artist.pan_number || 'N/A'}</p>
                      <p className="mt-0.5">UIDAI: {artist.aadhaar_number || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[8px] font-bold tracking-widest px-2.5 py-1 border border-black uppercase ${
                        artist.verification_status === 'approved' ? 'bg-studio-neon text-black' : artist.verification_status === 'rejected' ? 'bg-studio-red text-white' : 'bg-studio-yellow text-black'
                      }`}>
                        {artist.verification_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {artist.kyc_document_id ? (
                        <button
                          onClick={() => {
                            setActiveArtist(artist)
                            setShowKycModal(true)
                          }}
                          className="px-3 py-1.5 bg-black border-2 border-black hover:border-studio-orange text-studio-orange hover:text-white transition-all inline-flex items-center gap-1.5 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" /> PREVIEW FILE
                        </button>
                      ) : (
                        <span className="text-zinc-600 font-bold">NO FILE</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setPayoutArtist(artist)
                            setShowPayoutModal(true)
                          }}
                          className="px-2.5 py-1.5 border-2 border-black bg-studio-neon hover:bg-studio-neon/80 text-black font-bold uppercase text-[10px]"
                        >
                          ₹ PAYOUT
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. RECENT PAYOUTS (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-[#121212] p-4 border-4 border-black">
            <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-neon">
              💹 PAYOUT LOGS
            </h3>
          </div>

          <div className="border-4 border-black bg-black p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 uppercase font-black">
                No payouts registered yet.
              </div>
            ) : (
              payouts.map((pay: any) => (
                <div key={pay.id} className="bg-black/50 border border-zinc-800 p-3.5 font-mono text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                    <span className="font-black text-white normal-case text-xs">{pay.artist_name}</span>
                    <span className="bg-studio-neon/20 text-studio-neon border border-studio-neon px-1.5 text-[8px] uppercase">{pay.status}</span>
                  </div>
                  <p className="text-white font-black text-sm">₹{pay.amount.toLocaleString()}</p>
                  <p className="text-zinc-400 mt-1">MONTH: <span className="text-white">{pay.payout_month}</span></p>
                  <p className="text-zinc-400">UTR: <span className="text-white text-[10px] uppercase font-bold">{pay.utr_number}</span></p>
                  {pay.notes && <p className="text-zinc-500 mt-1 italic font-mono lowercase">"{pay.notes}"</p>}
                  <p className="text-[9px] text-zinc-500 mt-1.5">{new Date(pay.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL DRAWER: KYC REVIEW & DOCUMENT DETAILS */}
      {showKycModal && activeArtist && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs">
            <button
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-luckiest-guy text-2xl uppercase text-studio-orange mb-6">
              🔍 kyc document verification drawer
            </h3>

            {/* ARTIST METADATA */}
            <div className="bg-black border border-zinc-800 p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">ARTIST LEGAL NAME</span>
                <span className="text-white font-black">{activeArtist.legal_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">IFSC BRANCH CODE</span>
                <span className="text-white font-black">{activeArtist.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">ACCOUNT HOLDER</span>
                <span className="text-white font-black">{activeArtist.account_holder_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">ACCOUNT NUMBER</span>
                <span className="text-studio-neon font-black text-sm tracking-wider">{activeArtist.account_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">BANK NAME</span>
                <span className="text-white font-black">{activeArtist.bank_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">PAN NUMBER CARD</span>
                <span className="text-white font-black">{activeArtist.pan_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase">AADHAAR ID</span>
                <span className="text-white font-black">{activeArtist.aadhaar_number || 'N/A'}</span>
              </div>
            </div>

            {/* SECURE KYC UPLOAD VISUAL PREVIEW */}
            <div className="space-y-2 mb-6">
              <span className="block text-[10px] font-black uppercase text-zinc-400">KYC VERIFICATION DOCUMENT (GOOGLE DRIVE LINK)</span>

              {activeArtist.kyc_document_id ? (
                <div className="border-4 border-black bg-black p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-studio-orange/10 border-2 border-studio-orange text-studio-orange mx-auto flex items-center justify-center">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-white uppercase text-[11px]">Secure KYC File Uploaded</p>
                    <p className="text-[9px] text-zinc-500 mt-1 truncate max-w-[400px]">{activeArtist.kyc_document_id}</p>
                  </div>
                  <a
                    href={activeArtist.kyc_document_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-studio-orange hover:bg-studio-orange/80 text-black font-black uppercase inline-flex items-center gap-1 text-[10px] border-2 border-black"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> OPEN SECURE UPLOAD
                  </a>
                </div>
              ) : (
                <div className="border border-zinc-800 p-4 text-center text-zinc-500 uppercase font-black">
                  No KYC document link uploaded yet.
                </div>
              )}
            </div>

            {/* ACTION TRIGGERS */}
            {activeArtist.verification_status !== 'approved' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleKycApproval(activeArtist.user_id, 'approved', activeArtist.full_name)}
                  className="px-4 py-3 bg-studio-neon hover:bg-studio-neon/80 text-black border-3 border-black font-black uppercase text-[11px]"
                >
                  <Check className="w-4 h-4 inline mr-1" /> VERIFY & APPROVE
                </button>
                <button
                  onClick={() => handleKycApproval(activeArtist.user_id, 'rejected', activeArtist.full_name)}
                  className="px-4 py-3 bg-studio-red hover:bg-studio-red/80 text-white border-3 border-black font-black uppercase text-[11px]"
                >
                  <X className="w-4 h-4 inline mr-1" /> REJECT kyc
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DRAWER: TRIGGER PAYOUT FORM */}
      {showPayoutModal && payoutArtist && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handlePayoutTrigger}
            className="w-full max-w-md border-4 border-black bg-[#121212] p-6 shadow-premium relative font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-luckiest-guy text-2xl uppercase text-studio-neon mb-6">
              💸 register artist payout
            </h3>

            <div className="space-y-4">
              <div className="bg-black p-3.5 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase leading-none font-bold">ARTIST TARGET</p>
                <p className="text-sm font-black text-white mt-1.5 normal-case">{payoutArtist.full_name}</p>
                <p className="text-[10px] text-zinc-400 mt-1 lowercase truncate">{payoutArtist.user_id}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PAYOUT VALUE AMOUNT (₹)</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">TARGET MONTH / YEAR</label>
                <input
                  type="text"
                  required
                  value={payoutMonth}
                  onChange={e => setPayoutMonth(e.target.value)}
                  placeholder="e.g. May 2026"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">BANK TRANSACTION ID (UTR / RECEIPT)</label>
                <input
                  type="text"
                  required
                  value={payoutUtr}
                  onChange={e => setPayoutUtr(e.target.value)}
                  placeholder="e.g. UTRN056123490"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">NOTES (MEMO)</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  placeholder="Standard sales payout split share..."
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="studio-button w-full mt-4 bg-studio-neon text-black font-black uppercase"
              >
                {saveLoading ? 'EMITTING...' : (
                  <>
                    <Check className="w-4 h-4" /> EMIT TRANSACTION SETTLEMENT
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
