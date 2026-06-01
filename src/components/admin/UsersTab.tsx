'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, Ban, ShieldCheck, Trash2, X } from 'lucide-react'
import { banUser, unbanUser, deleteUser } from '@/app/actions'

interface UsersTabProps {
  usersList: any[]
  invalidateCacheAndReload: (tab: any) => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
  addAuditLog: (action: string, target: string, type?: 'danger' | 'warning' | 'success' | 'info') => void
  askConfirmation: (title: string, message: string, isDanger?: boolean, confirmText?: string) => Promise<boolean>
  paletteSelection?: { type: string; data: any } | null
  setPaletteSelection?: (val: any) => void
}

export function UsersTab({
  usersList,
  invalidateCacheAndReload,
  showToast,
  addAuditLog,
  askConfirmation,
  paletteSelection,
  setPaletteSelection
}: UsersTabProps) {
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned' | 'subscribed'>('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [activeUser, setActiveUser] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'user') {
      setActiveUser(paletteSelection.data)
      setShowUserModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const handleBanUser = async (userId: string, email: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM USER ACCESS LOCK',
      `Are you absolutely sure you want to BAN and lock user "${email}" from accessing SamplesWala? They will not be able to log in or download samples.`,
      true,
      'LOCK USER ACCOUNT'
    )
    if (!approved) return
    setActionLoading(true)
    try {
      await banUser(userId)
      showToast('User has been banned successfully!', 'success')
      addAuditLog('BAN_USER', `Account lock applied to user: ${email}`, 'danger')
      invalidateCacheAndReload('users')
      if (activeUser && activeUser.id === userId) {
        setActiveUser((prev: any) => ({ ...prev, is_banned: true }))
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to ban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnbanUser = async (userId: string, email: string) => {
    const approved = await askConfirmation(
      '✅ CONFIRM USER ACTIVATION',
      `Are you sure you want to UNBAN and restore active command access for user "${email}"?`,
      false,
      'ACTIVATE ACCOUNT'
    )
    if (!approved) return
    setActionLoading(true)
    try {
      await unbanUser(userId)
      showToast('User has been unbanned successfully!', 'success')
      addAuditLog('UNBAN_USER', `Account access restored for user: ${email}`, 'success')
      invalidateCacheAndReload('users')
      if (activeUser && activeUser.id === userId) {
        setActiveUser((prev: any) => ({ ...prev, is_banned: false }))
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to unban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    const approved = await askConfirmation(
      '🚨 DANGER - PERMANENT USER DELETION',
      `You are about to permanently DELETE user "${email}" from the entire database. This destroys their profile, download histories, credit packages, billing tokens, and auth credentials FOREVER. This action CANNOT BE UNDONE.`,
      true,
      'DELETE FOREVER'
    )
    if (!approved) return
    setActionLoading(true)
    try {
      await deleteUser(userId)
      showToast('User account deleted permanently!', 'success')
      addAuditLog('DELETE_USER', `Permanently deleted user account: ${email}`, 'danger')
      invalidateCacheAndReload('users')
      setShowUserModal(false)
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      <div className="bg-[#121212] p-4 border-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-pink">
            👥 USERS HUB & ACCESS CONTROL
          </h3>
          <p className="text-zinc-400 mt-1 uppercase text-[10px] font-black">
            Manage accounts, track billing details, view addresses, and issue bans.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="SEARCH BY NAME/EMAIL/ADDR..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-black border-2 border-black text-white font-bold placeholder-zinc-600 outline-none focus:border-studio-pink uppercase"
            />
          </div>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value as any)}
            className="bg-black border-2 border-black px-3 py-2 text-white font-bold outline-none focus:border-studio-pink"
          >
            <option value="all">ALL REGISTRATIONS</option>
            <option value="active">ACTIVE USERS</option>
            <option value="banned">BANNED ONLY</option>
            <option value="subscribed">ACTIVE SUBSCRIBERS</option>
          </select>
        </div>
      </div>

      <div className="border-4 border-black bg-black overflow-x-auto">
        <table className="w-full text-left uppercase font-bold border-collapse">
          <thead>
            <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
              <th className="p-4">USER PROFILE</th>
              <th className="p-4">CONTACT & ADDRESS</th>
              <th className="p-4 text-center">ACCESS LOCK</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-black">
            {(() => {
              const filtered = usersList.filter(u => {
                const searchLower = userSearch.toLowerCase()
                const matchQuery =
                  (u.email || '').toLowerCase().includes(searchLower) ||
                  (u.full_name || '').toLowerCase().includes(searchLower) ||
                  (u.address || '').toLowerCase().includes(searchLower) ||
                  (u.phone_number || '').includes(searchLower)

                if (!matchQuery) return false

                if (userFilter === 'banned') return u.is_banned
                if (userFilter === 'active') return !u.is_banned
                if (userFilter === 'subscribed') return u.subscription_status === 'ACTIVE' || u.subscription_tier !== 'NONE'
                return true
              })

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500 uppercase font-black">
                      No matching users found.
                    </td>
                  </tr>
                )
              }

              return filtered.map((u: any) => (
                <tr
                  key={u.id}
                  onClick={() => {
                    setActiveUser(u)
                    setShowUserModal(true)
                  }}
                  className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors cursor-pointer"
                  title="Click to view full detailed user profile, credits, and device fingerprints"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-studio-pink border-2 border-black text-black font-sans font-black text-sm flex items-center justify-center flex-shrink-0">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-sans font-bold text-sm tracking-wide text-zinc-100 leading-none">{u.full_name}</p>
                          {u.provider === 'google' ? (
                            <span className="bg-studio-pink/15 text-studio-pink border border-studio-pink/30 font-bold uppercase text-[7px] px-1.5 py-0.5 tracking-wider" title="Authenticated via Google SSO">
                              GOOGLE SSO
                            </span>
                          ) : (
                            <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 font-bold uppercase text-[7px] px-1.5 py-0.5 tracking-wider" title="Authenticated via Email & Password">
                              EMAIL PASS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 lowercase font-mono mt-1 flex items-center gap-1 normal-case font-medium">
                          <Mail className="w-3.5 h-3.5 inline text-studio-pink" /> {u.email}
                        </p>
                        <p className="text-[9px] text-zinc-600 mt-0.5 font-medium">REGISTERED: {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 normal-case text-zinc-300 font-medium leading-normal max-w-xs">
                    <p className="flex items-center gap-1.5 text-[10px] normal-case">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 inline flex-shrink-0" /> {u.phone_number || 'N/A'}
                    </p>
                    <div className="flex items-start gap-1.5 mt-1.5 text-[10px] font-mono leading-tight normal-case">
                      <MapPin className="w-3.5 h-3.5 text-studio-pink inline flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-400 leading-normal">{u.address || 'NO ADDRESS PROVIDED'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {u.is_banned ? (
                          <>
                            <span className="bg-studio-red text-white border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 flex items-center gap-1 animate-pulse">
                              <Ban className="w-2.5 h-2.5 text-white" /> BANNED LOCK
                            </span>
                            <button
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleUnbanUser(u.id, u.email); }}
                              className="px-2 py-1 border border-black bg-studio-neon hover:bg-studio-neon-hover text-black font-bold uppercase text-[8px] tracking-wider transition-all cursor-pointer disabled:opacity-50"
                            >
                              ACTIVATE
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="bg-studio-neon/10 text-studio-neon border border-studio-neon font-black uppercase text-[8px] px-2 py-0.5 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-studio-neon" /> ACCESS OK
                            </span>
                            <button
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleBanUser(u.id, u.email); }}
                              className="px-2 py-1 border border-black bg-studio-red text-white hover:bg-studio-red/80 font-bold uppercase text-[8px] tracking-wider transition-all cursor-pointer disabled:opacity-50"
                            >
                              BAN USER
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        disabled={actionLoading}
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                        className="p-2 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80 transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                        title="Permanently Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            })()}
          </tbody>
        </table>
      </div>

      {/* DETAILED USER PROFILE MODAL DRAWER */}
      {showUserModal && activeUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn font-sans text-xs">
          <div className="bg-[#121212] border-4 border-black p-6 w-full max-w-lg relative text-left shadow-premium animate-scaleIn">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 p-1 bg-black border-2 border-black hover:border-studio-pink text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-pink mb-6">
              👥 DETAILED USER ACCESS & PROFILE
            </h3>

            {/* USER PROFILE METADATA */}
            <div className="bg-black border border-zinc-800 p-4 space-y-3.5 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">USER ID (AUTH ID)</span>
                <span className="text-white font-mono font-bold select-all">{activeUser.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">FULL NAME</span>
                <span className="text-white font-bold text-sm normal-case">{activeUser.full_name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">EMAIL ADDRESS</span>
                <span className="text-white font-mono font-medium lowercase select-all">{activeUser.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">PHONE NUMBER</span>
                <span className="text-white font-mono font-medium select-all">{activeUser.phone_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">PHYSICAL ADDRESS</span>
                <span className="text-zinc-300 font-mono leading-normal bg-[#0c0c0c] border border-zinc-900 p-2.5 rounded-none text-[10px] normal-case select-all">
                  {activeUser.address || 'No physical delivery address provided.'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">CREDITS BALANCE</span>
                <span className="text-studio-neon font-bold text-sm">{activeUser.credits} CR</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">SUBSCRIPTION TIER</span>
                <span className="text-studio-pink font-bold uppercase">{activeUser.subscription_tier || 'NONE'} ({activeUser.subscription_status || 'INACTIVE'})</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">AUTH PROVIDER</span>
                <span className="text-white font-bold uppercase flex items-center gap-1.5">
                  {activeUser.provider === 'google' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-studio-pink" /> GOOGLE SSO
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-studio-yellow" /> EMAIL & PASSWORD
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">DEVICE FINGERPRINT</span>
                <span className="text-zinc-400 font-mono font-medium text-[10px] select-all">{activeUser.device_fingerprint || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">REGISTRATION TIMESTAMP</span>
                <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeUser.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">ACCOUNT STATUS</span>
                <div>
                  {activeUser.is_banned ? (
                    <span className="bg-studio-red text-white border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 inline-flex items-center gap-1 animate-pulse">
                      <Ban className="w-2.5 h-2.5 text-white" /> BANNED LOCK
                    </span>
                  ) : (
                    <span className="bg-studio-neon/10 text-studio-neon border border-studio-neon font-black uppercase text-[8px] px-2 py-0.5 inline-flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-studio-neon" /> ACCESS ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="space-y-3">
              <div className="flex gap-3">
                {activeUser.is_banned ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUnbanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-studio-neon text-black border-2 border-black font-bold uppercase hover:bg-studio-neon/80 py-2 text-xs cursor-pointer font-sans disabled:opacity-50"
                  >
                    ACTIVATE & UNBAN
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleBanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-studio-red text-white border-2 border-black font-bold uppercase hover:bg-studio-red/80 py-2 text-xs cursor-pointer font-sans disabled:opacity-50"
                  >
                    BAN ACCOUNT
                  </button>
                )}

                <button
                  disabled={actionLoading}
                  onClick={() => handleDeleteUser(activeUser.id, activeUser.email)}
                  className="flex-1 studio-button bg-studio-red text-white border-2 border-black font-bold uppercase hover:bg-studio-red-hover py-2 text-xs cursor-pointer font-sans disabled:opacity-50"
                >
                  ❌ DELETE FOREVER
                </button>
              </div>

              <button
                onClick={() => setShowUserModal(false)}
                className="studio-button w-full bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2 text-xs cursor-pointer font-sans"
              >
                CLOSE DETAIL DRAWER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
