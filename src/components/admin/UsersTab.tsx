'use client'

import React, { useState, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, Ban, ShieldCheck, Trash2, X, Download } from 'lucide-react'
import { banUser, unbanUser, deleteUser, updateUserRole } from '@/app/actions'

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Reset pagination on search query or filter criteria change
  useEffect(() => {
    setCurrentPage(1)
  }, [userSearch, userFilter])

  useEffect(() => {
    if (paletteSelection && paletteSelection.type === 'user') {
      setActiveUser(paletteSelection.data)
      setShowUserModal(true)
      if (setPaletteSelection) setPaletteSelection(null)
    }
  }, [paletteSelection, setPaletteSelection])

  const handleBanUser = async (userId: string, email: string) => {
    const approved = await askConfirmation(
      'Confirm User Lock',
      `Are you sure you want to ban user "${email}" from accessing SamplesWala? They will not be able to log in or download samples.`,
      true,
      'Lock User Account'
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
      'Confirm User Activation',
      `Are you sure you want to unban and restore active access for user "${email}"?`,
      false,
      'Activate Account'
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
      'Permanent User Deletion',
      `You are about to permanently delete user "${email}". This removes their profile, order histories, credits, and credentials. This action cannot be undone.`,
      true,
      'Delete Permanently'
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

  const handleUpdateUserRole = async (userId: string, email: string, newRole: string) => {
    setActionLoading(true)
    try {
      await updateUserRole(userId, newRole)
      showToast(`User role updated to ${newRole}!`, 'success')
      addAuditLog('ROLE_CHANGE', `Changed user role for ${email} to ${newRole}`, 'info')
      invalidateCacheAndReload('users')
      if (activeUser && activeUser.id === userId) {
        setActiveUser((prev: any) => ({ ...prev, role: newRole }))
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to change role', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (usersList.length === 0) return

    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Address', 'Credits', 'Subscription Status', 'Subscription Tier', 'Auth Provider', 'Banned Status', 'Registered Date']
    
    const rows = usersList.map(u => [
      u.id || '',
      u.full_name || '',
      u.email || '',
      u.phone_number || '',
      `"${(u.address || '').replace(/"/g, '""')}"`,
      u.credits ?? 0,
      u.subscription_status || 'INACTIVE',
      u.subscription_tier || 'NONE',
      u.provider || 'email',
      u.is_banned ? 'BANNED' : 'ACTIVE',
      new Date(u.created_at).toLocaleString()
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `sampleswala_users_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      {/* HEADER CONTROLS BAR */}
      <div className="bg-[#18181c] p-4 sm:p-5 border border-white/10 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">
            Users & Registrations
          </h3>
          <p className="text-zinc-400 mt-0.5 text-xs">
            Manage user accounts, monitor credits balance, manage addresses, and handle access locks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="studio-button bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export CSV
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-500 outline-none focus:border-blue-500 text-xs transition-colors"
            />
          </div>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value as any)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 text-xs cursor-pointer transition-colors"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
            <option value="subscribed">Subscribers Only</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="border border-white/10 bg-[#18181c] rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-4">User Profile</th>
                <th className="p-4">Contact & Location</th>
                <th className="p-4 text-center">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
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
                      <td colSpan={3} className="p-10 text-center text-zinc-500 font-medium">
                        No registered users match your filter criteria.
                      </td>
                    </tr>
                  )
                }

                // Compute paginated subset
                const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
                const paginatedUsers = filtered.slice(
                  (currentPage - 1) * ITEMS_PER_PAGE,
                  currentPage * ITEMS_PER_PAGE
                )

                return (
                  <>
                    {paginatedUsers.map((u: any) => (
                      <tr
                        key={u.id}
                        onClick={() => {
                          setActiveUser(u)
                          setShowUserModal(true)
                        }}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                        title="Click to view full user profile"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-zinc-100 leading-snug">
                                  {u.full_name || 'Anonymous User'}
                                </p>
                                {u.provider === 'google' ? (
                                  <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    Google SSO
                                  </span>
                                ) : (
                                  <span className="bg-white/5 text-zinc-400 border border-white/10 text-[9px] font-medium px-1.5 py-0.5 rounded">
                                    Email/Pass
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 font-mono mt-0.5 select-all flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-zinc-500" />
                                {u.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] bg-white/[0.06] text-zinc-300 px-2 py-0.5 rounded font-mono font-medium">
                                  {u.credits ?? 0} Credits
                                </span>
                                {u.subscription_status === 'ACTIVE' && (
                                  <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                                    {u.subscription_tier}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-300">
                          <div className="text-[11px] font-mono flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{u.phone_number || 'No phone number'}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1.5 flex items-start gap-1.5 max-w-sm">
                            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{u.address || 'No physical address provided'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {u.is_banned ? (
                                <>
                                  <span className="bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <Ban className="w-2.5 h-2.5 text-red-400" /> Banned
                                  </span>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={(e) => { e.stopPropagation(); handleUnbanUser(u.id, u.email); }}
                                    className="px-2 py-1 border border-white/10 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-medium text-[9px] transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Activate
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Active
                                  </span>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={(e) => { e.stopPropagation(); handleBanUser(u.id, u.email); }}
                                    className="px-2 py-1 border border-white/10 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 font-medium text-[9px] transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Ban User
                                  </button>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                              title="Permanently Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Pagination Controller Row */}
                    {totalPages > 1 && (
                      <tr>
                        <td colSpan={3} className="p-4 bg-[#141418] border-t border-white/10">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
                            <div className="text-zinc-400">
                              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-3 py-1.5 border border-white/10 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              >
                                Previous
                              </button>
                              
                              {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, idx, arr) => {
                                  const elements = []
                                  if (idx > 0 && p - arr[idx - 1] > 1) {
                                    elements.push(<span key={`dot-${p}`} className="text-zinc-500 px-1">...</span>)
                                  }
                                  elements.push(
                                    <button
                                      key={p}
                                      onClick={() => setCurrentPage(p)}
                                      className={`w-7 h-7 rounded-lg border font-bold transition-all cursor-pointer ${
                                        currentPage === p 
                                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
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
                                className="px-3 py-1.5 border border-white/10 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              >
                                Next
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

      {/* DETAILED USER PROFILE MODAL DRAWER */}
      {showUserModal && activeUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-[#18181c] border border-white/15 rounded-2xl p-6 sm:p-7 w-full max-w-lg relative text-left shadow-2xl">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              User Profile & Details
            </h3>

            {/* USER PROFILE METADATA */}
            <div className="bg-[#141418] border border-white/10 rounded-xl p-4 space-y-3 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">User ID</span>
                <span className="text-white font-mono font-bold select-all">{activeUser.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Full Name</span>
                <span className="text-white font-bold text-sm">{activeUser.full_name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Email Address</span>
                <span className="text-white font-mono select-all">{activeUser.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Phone Number</span>
                <span className="text-white font-mono select-all">{activeUser.phone_number || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Physical Address</span>
                <span className="text-zinc-300 font-mono leading-normal bg-black/40 border border-white/10 p-2.5 rounded-lg text-[10px] select-all">
                  {activeUser.address || 'No physical delivery address provided.'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Credits Balance</span>
                <span className="text-[#00FF94] font-bold text-sm">{activeUser.credits} CR</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Subscription Tier</span>
                <span className="text-amber-400 font-bold uppercase">{activeUser.subscription_tier || 'NONE'} ({activeUser.subscription_status || 'INACTIVE'})</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Auth Provider</span>
                <span className="text-white font-bold uppercase flex items-center gap-1.5">
                  {activeUser.provider === 'google' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Google SSO
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Email & Password
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Device Fingerprint</span>
                <span className="text-zinc-400 font-mono text-[10px] select-all">{activeUser.device_fingerprint || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Registered Date</span>
                <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeUser.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Admin Role</span>
                <select
                  value={activeUser.role || 'Super Admin'}
                  onChange={e => handleUpdateUserRole(activeUser.id, activeUser.email, e.target.value)}
                  disabled={actionLoading}
                  className="bg-black/50 border border-white/10 rounded-lg p-1.5 text-white font-medium outline-none focus:border-white/25 text-xs cursor-pointer"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Billing Manager">Billing Manager</option>
                </select>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Account Status</span>
                <div>
                  {activeUser.is_banned ? (
                    <span className="bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase text-[9px] px-2.5 py-1 rounded-full inline-flex items-center gap-1 animate-pulse">
                      <Ban className="w-2.5 h-2.5 text-red-400" /> Banned
                    </span>
                  ) : (
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[9px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Active
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
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleUnbanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-[#00FF94] hover:bg-[#00FF94]/90 text-black font-bold uppercase py-2.5 text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Activate & Unban
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleBanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase py-2.5 text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Ban Account
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDeleteUser(activeUser.id, activeUser.email)}
                  className="flex-1 studio-button bg-red-600 hover:bg-red-500 text-white font-bold uppercase py-2.5 text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Delete Account
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="studio-button w-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 font-bold uppercase py-2.5 text-xs rounded-xl cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
