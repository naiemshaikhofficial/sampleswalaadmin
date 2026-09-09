'use client'

import React, { useState } from 'react'
import { Eye, Check, X, ExternalLink, UserCheck, ShieldCheck, Clock, AlertCircle } from 'lucide-react'
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
    const promptTitle = status === 'approved' ? 'Confirm KYC Approval' : 'Confirm KYC Rejection'
    const promptMsg = status === 'approved'
      ? `Are you sure you want to approve the artist verification document for "${artistName}"? This grants them verified artist status and payout access.`
      : `Are you sure you want to reject the artist verification document for "${artistName}"? They will be notified to re-upload.`;
    
    const approved = await askConfirmation(promptTitle, promptMsg, status === 'rejected', status === 'approved' ? 'Approve KYC' : 'Reject KYC')
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
      showToast(`Payout of ₹${payoutAmount} registered successfully!`, 'success')
      addAuditLog('TRIGGER_PAYOUT', `Triggered payout of ₹${payoutAmount} to artist: ${payoutArtist.full_name}`, 'success')
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
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. ARTIST LIST (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#18181c] p-4 sm:p-5 border border-white/10 rounded-2xl flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-sans font-bold text-lg text-white">
                Artist KYC Verification
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Review legal identity documents, PAN / Aadhaar records, and approve artist publishing rights.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-white/5 border border-white/10 text-zinc-300 px-3 py-1 rounded-full">
              {artists.length} Artists
            </span>
          </div>

          <div className="border border-white/10 bg-[#18181c] rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="p-4">Artist</th>
                    <th className="p-4">PAN / Aadhaar</th>
                    <th className="p-4">KYC State</th>
                    <th className="p-4 text-center">Document</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {artists.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-zinc-500 font-medium">
                        No artist KYC submissions pending review.
                      </td>
                    </tr>
                  ) : (
                    artists.map((artist: any) => (
                      <tr key={artist.user_id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-4">
                          <p className="text-white font-bold text-sm">{artist.full_name || 'Anonymous'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 select-all">{artist.user_id}</p>
                        </td>
                        <td className="p-4 font-mono text-zinc-300">
                          <p className="text-xs">PAN: <span className="text-white font-semibold">{artist.pan_number || 'N/A'}</span></p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">UIDAI: {artist.aadhaar_number || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            artist.verification_status === 'approved' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : artist.verification_status === 'rejected' 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {artist.verification_status === 'approved' && <ShieldCheck className="w-3 h-3" />}
                            {artist.verification_status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                            {artist.verification_status === 'pending' && <Clock className="w-3 h-3" />}
                            {artist.verification_status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {artist.kyc_document_id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveArtist(artist)
                                setShowKycModal(true)
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-blue-400 hover:text-white transition-all inline-flex items-center gap-1.5 font-medium text-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview File
                            </button>
                          ) : (
                            <span className="text-zinc-600 font-mono text-xs">No File</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPayoutArtist(artist)
                                setShowPayoutModal(true)
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#00FF94]/15 hover:bg-[#00FF94]/25 text-[#00FF94] border border-[#00FF94]/30 font-bold text-xs transition-all cursor-pointer"
                            >
                              ₹ Payout
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. RECENT PAYOUTS (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-[#18181c] p-4 sm:p-5 border border-white/10 rounded-2xl shadow-md">
            <h3 className="font-sans font-bold text-lg text-white">
              Payout Records
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Historical settlements issued to verified producers.
            </p>
          </div>

          <div className="border border-white/10 bg-[#18181c] rounded-2xl p-4 space-y-3.5 max-h-[500px] overflow-y-auto shadow-md">
            {payouts.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 font-medium">
                No payouts registered yet.
              </div>
            ) : (
              payouts.map((pay: any) => (
                <div key={pay.id} className="bg-black/40 border border-white/[0.08] rounded-xl p-3.5 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2">
                    <span className="font-bold text-white text-xs">{pay.artist_name}</span>
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">{pay.status}</span>
                  </div>
                  <p className="text-[#00FF94] font-bold text-base">₹{pay.amount.toLocaleString()}</p>
                  <p className="text-zinc-400 mt-1 font-mono text-[11px]">Period: <span className="text-white">{pay.payout_month}</span></p>
                  <p className="text-zinc-400 font-mono text-[11px]">UTR: <span className="text-zinc-200 select-all">{pay.utr_number}</span></p>
                  {pay.notes && <p className="text-zinc-500 mt-1 italic text-[11px]">"{pay.notes}"</p>}
                  <p className="text-[10px] text-zinc-500 mt-2 font-mono">{new Date(pay.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL DRAWER: KYC REVIEW & DOCUMENT DETAILS */}
      {showKycModal && activeArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl border border-white/15 bg-[#18181c] rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans text-xs">
            <button
              type="button"
              onClick={() => setShowKycModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              Artist KYC Details & Document Review
            </h3>

            {/* ARTIST METADATA */}
            <div className="bg-[#141418] border border-white/10 rounded-xl p-4 space-y-3 mb-6 font-sans">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Legal Name</span>
                <span className="text-white font-bold">{activeArtist.legal_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Bank Name</span>
                <span className="text-white font-medium">{activeArtist.bank_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Account Holder</span>
                <span className="text-white font-medium">{activeArtist.account_holder_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Account Number</span>
                <span className="text-[#00FF94] font-mono font-bold select-all">{activeArtist.account_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">IFSC Code</span>
                <span className="text-white font-mono font-bold select-all">{activeArtist.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">PAN Card</span>
                <span className="text-white font-mono font-bold select-all">{activeArtist.pan_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Aadhaar Number</span>
                <span className="text-white font-mono select-all">{activeArtist.aadhaar_number || 'N/A'}</span>
              </div>
            </div>

            {/* SECURE KYC UPLOAD VISUAL PREVIEW */}
            <div className="space-y-2 mb-6">
              <span className="block text-[11px] font-semibold text-zinc-400">KYC Verification Document Link</span>

              {activeArtist.kyc_document_id ? (
                <div className="border border-white/10 bg-black/40 rounded-xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl mx-auto flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">KYC Document Uploaded</p>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate max-w-sm mx-auto font-mono">{activeArtist.kyc_document_id}</p>
                  </div>
                  <a
                    href={activeArtist.kyc_document_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="studio-button px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold inline-flex items-center gap-1.5 text-xs rounded-xl cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Document
                  </a>
                </div>
              ) : (
                <div className="border border-white/10 rounded-xl p-6 text-center text-zinc-500 font-medium">
                  No KYC document link provided yet.
                </div>
              )}
            </div>

            {/* ACTION TRIGGERS */}
            {activeArtist.verification_status !== 'approved' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleKycApproval(activeArtist.user_id, 'approved', activeArtist.full_name)}
                  className="studio-button py-2.5 bg-[#00FF94] hover:bg-[#00FF94]/90 text-black font-bold uppercase text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Approve KYC
                </button>
                <button
                  type="button"
                  onClick={() => handleKycApproval(activeArtist.user_id, 'rejected', activeArtist.full_name)}
                  className="studio-button py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Reject KYC
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DRAWER: TRIGGER PAYOUT FORM */}
      {showPayoutModal && payoutArtist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handlePayoutTrigger}
            className="w-full max-w-md border border-white/15 bg-[#18181c] rounded-2xl p-6 sm:p-7 shadow-2xl relative font-sans text-xs"
          >
            <button
              type="button"
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF94]" />
              Register Artist Payout
            </h3>

            <div className="space-y-4">
              <div className="bg-black/40 p-3.5 border border-white/10 rounded-xl">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Target Artist</p>
                <p className="text-sm font-bold text-white mt-1">{payoutArtist.full_name}</p>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{payoutArtist.user_id}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Payout Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Target Month / Period</label>
                <input
                  type="text"
                  required
                  value={payoutMonth}
                  onChange={e => setPayoutMonth(e.target.value)}
                  placeholder="e.g. May 2026"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Bank UTR / Transaction ID</label>
                <input
                  type="text"
                  required
                  value={payoutUtr}
                  onChange={e => setPayoutUtr(e.target.value)}
                  placeholder="e.g. UTRN056123490"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">Notes / Memo (Optional)</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  placeholder="Standard sales payout split share..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="studio-button w-full mt-2 bg-[#00FF94] hover:bg-[#00FF94]/90 text-black font-bold uppercase py-3 rounded-xl cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
              >
                {saveLoading ? 'Registering...' : (
                  <>
                    <Check className="w-4 h-4" /> Save Payout Settlement
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
