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
      <div className="bg-[#181818] p-4 sm:p-5 border border-[#222222] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
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
            className="bg-[#202020] hover:bg-[#282828] text-white border border-[#2e2e2e] text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" />
            Export CSV
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#121212] border border-[#262626] rounded-lg text-white placeholder-zinc-500 outline-none focus:border-white text-xs transition-colors"
            />
          </div>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value as any)}
            className="bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-white outline-none focus:border-white text-xs cursor-pointer transition-colors"
          >
            <option value="all">All Users</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
            <option value="subscribed">Subscribers Only</option>
          </select>
        </div>
      </div>

      {/* USERS DISPLAY */}
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
            <div className="border border-[#222222] bg-[#181818] rounded-xl p-10 text-center text-zinc-500 font-medium text-xs">
              No registered users match your filter criteria.
            </div>
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
            {/* MOBILE VIEW: USER CARDS (NO HORIZONTAL SCROLLBAR) */}
            <div className="md:hidden space-y-2.5">
              {paginatedUsers.map((u: any) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setActiveUser(u)
                    setShowUserModal(true)
                  }}
                  className="border border-[#222222] bg-[#181818] rounded-xl p-3.5 space-y-3 cursor-pointer hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-[#202020] text-white border border-white/10 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                        {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-zinc-100 truncate leading-snug">
                          {u.full_name || 'Anonymous User'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      u.is_banned ? 'bg-[#222222] text-zinc-400 border border-zinc-700' : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#222222]">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/[0.06] text-zinc-300 px-1.5 py-0.5 rounded border border-white/10">
                        {u.credits ?? 0} CR
                      </span>
                      {u.subscription_status === 'ACTIVE' && (
                        <span className="bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase text-[9px] border border-white/20">
                          {u.subscription_tier}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      {u.is_banned ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleUnbanUser(u.id, u.email)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleBanUser(u.id, u.email)}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Ban
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60 cursor-pointer transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 p-3 bg-[#181818] border border-[#222222] rounded-xl text-[10px] font-mono">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Prev
                  </button>
                  <span className="text-zinc-400">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP VIEW: DATA TABLE */}
            <div className="hidden md:block border border-[#222222] bg-[#181818] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[#141414] border-b border-[#242424] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="p-4">User Profile</th>
                      <th className="p-4">Contact & Location</th>
                      <th className="p-4 text-center">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
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
                            <div className="w-10 h-10 rounded-xl bg-[#202020] text-white border border-white/10 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-zinc-100 leading-snug">
                                  {u.full_name || 'Anonymous User'}
                                </p>
                                {u.provider === 'google' ? (
                                  <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-1.5 py-0.5 rounded">
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
                                <span className="text-[10px] bg-white/[0.06] text-zinc-300 border border-white/10 px-2 py-0.5 rounded font-mono font-medium">
                                  {u.credits ?? 0} Credits
                                </span>
                                {u.subscription_status === 'ACTIVE' && (
                                  <span className="text-[10px] bg-white/10 border border-white/20 text-zinc-200 px-2 py-0.5 rounded font-bold uppercase">
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
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{u.address || 'No physical address provided'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {u.is_banned ? (
                                <>
                                  <span className="bg-[#222222] text-zinc-400 border border-zinc-700 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Ban className="w-2.5 h-2.5 text-zinc-400" /> Banned
                                  </span>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={(e) => { e.stopPropagation(); handleUnbanUser(u.id, u.email); }}
                                    className="px-2 py-1 border border-white/15 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[9px] transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Activate
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="bg-white/10 text-white border border-white/20 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-2.5 h-2.5 text-white" /> Active
                                  </span>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={(e) => { e.stopPropagation(); handleBanUser(u.id, u.email); }}
                                    className="px-2 py-1 border border-zinc-700 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-[9px] transition-all cursor-pointer disabled:opacity-50"
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
                              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60 transition-all cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                              title="Permanently Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* DETAILED USER PROFILE MODAL DRAWER */}
      {showUserModal && activeUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-xs">
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6 sm:p-7 w-full max-w-lg relative text-left shadow-2xl">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-lg text-white mb-6 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              User Profile & Details
            </h3>

            {/* USER PROFILE METADATA */}
            <div className="bg-[#121212] border border-[#222222] rounded-lg p-4 space-y-3 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-[#222222] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">User ID</span>
                <span className="text-white font-mono font-bold select-all">{activeUser.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#222222] pb-2">
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
                <span className="text-white font-bold text-sm">{activeUser.credits} CR</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Subscription Tier</span>
                <span className="text-zinc-200 font-bold uppercase">{activeUser.subscription_tier || 'NONE'} ({activeUser.subscription_status || 'INACTIVE'})</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Auth Provider</span>
                <span className="text-white font-bold uppercase flex items-center gap-1.5">
                  {activeUser.provider === 'google' ? (
                    <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded">
                      Google OAuth
                    </span>
                  ) : (
                    <span className="bg-white/5 text-zinc-400 border border-white/10 text-[9px] font-medium px-2 py-0.5 rounded">
                      Email & Password
                    </span>
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
                    <span className="bg-[#222222] text-zinc-400 border border-zinc-700 font-bold uppercase text-[9px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <Ban className="w-2.5 h-2.5 text-zinc-400" /> Banned
                    </span>
                  ) : (
                    <span className="bg-white/10 text-white border border-white/20 font-bold uppercase text-[9px] px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" /> Active
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
                    className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold uppercase py-2.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Activate & Unban
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleBanUser(activeUser.id, activeUser.email)}
                    className="flex-1 bg-[#252525] hover:bg-[#303030] text-zinc-200 border border-[#383838] font-bold uppercase py-2.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                  >
                    Ban Account
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDeleteUser(activeUser.id, activeUser.email)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold uppercase py-2.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all"
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
