'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Turnstile } from '@marsidev/react-turnstile'
import {
  checkIsAdmin,
  getDashboardStats,
  getSamplePacks,
  saveSamplePack,
  deleteSamplePack,
  getSamples,
  saveSample,
  deleteSample,
  getArtistsKYC,
  updateKYCStatus,
  getArtistPayouts,
  triggerArtistPayout,
  getCoupons,
  saveCoupon,
  deleteCoupon,
  getSupportTickets,
  replyToTicket,
  getRankedPacks,
  verifyTurnstile,
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAllVaultSales
} from './actions'

import {
  LayoutDashboard,
  Music,
  Library,
  CreditCard,
  Ticket,
  BadgeAlert,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  Filter,
  TrendingUp,
  DollarSign,
  Download,
  Users,
  RefreshCw,
  MessageSquare,
  ArrowUpRight,
  Send,
  AlertTriangle,
  Play,
  Pause,
  LogOut,
  Lock,
  UserCheck,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Calendar,
  ExternalLink,
  Ban,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Layers,
  Coins
} from 'lucide-react'

// Custom Toast Component for UI notifications
interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function AdminDashboard() {
  // Authentication & Authorization States
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'packs' | 'samples' | 'kyc' | 'coupons' | 'tickets' | 'rankings' | 'users' | 'sales'>('analytics')

  // Client-side Memory Cache Manager for extremely fast & scalable page rendering
  const cacheRef = useRef<Record<string, { data: any; timestamp: number }>>({})
  const CACHE_DURATION_MS = 60 * 1000 // 60 seconds cache expiry

  // Notification Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  // Data Stores
  const [stats, setStats] = useState<any>(null)
  const [packs, setPacks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [samples, setSamples] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [rankedPacks, setRankedPacks] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [vaultSalesList, setVaultSalesList] = useState<any[]>([])

  // Loadings
  const [dataLoading, setDataLoading] = useState(false)

  // Search & Filter States
  const [packFilter, setPackFilter] = useState('all')
  const [sampleSearch, setSampleSearch] = useState('')
  const [packSearch, setPackSearch] = useState('')

  // User list search/filter states
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned' | 'subscribed'>('all')

  // Vault sales search state
  const [salesSearch, setSalesSearch] = useState('')

  // Modals & Active Edit Entities
  const [showPackModal, setShowPackModal] = useState(false)
  const [activePack, setActivePack] = useState<any>(null)

  const [showSampleModal, setShowSampleModal] = useState(false)
  const [activeSample, setActiveSample] = useState<any>(null)

  const [showKycModal, setShowKycModal] = useState(false)
  const [activeArtist, setActiveArtist] = useState<any>(null)

  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutArtist, setPayoutArtist] = useState<any>(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMonth, setPayoutMonth] = useState('')
  const [payoutNotes, setPayoutNotes] = useState('')
  const [payoutUtr, setPayoutUtr] = useState('')

  const [showCouponModal, setShowCouponModal] = useState(false)
  const [activeCoupon, setActiveCoupon] = useState<any>(null)

  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [ticketReply, setTicketReply] = useState('')

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [activeOrder, setActiveOrder] = useState<any>(null)

  const [showUserModal, setShowUserModal] = useState(false)
  const [activeUser, setActiveUser] = useState<any>(null)

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<any>({
    show: false,
    title: '',
    message: '',
    confirmText: 'CONFIRM',
    isDanger: false,
    onConfirm: () => {},
    onCancel: () => {},
  })

  const askConfirmation = (title: string, message: string, isDanger = false, confirmText = 'CONFIRM') => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({
        show: true,
        title,
        message,
        confirmText,
        isDanger,
        onConfirm: () => {
          setConfirmDialog((prev: any) => ({ ...prev, show: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog((prev: any) => ({ ...prev, show: false }))
          resolve(false)
        }
      })
    })
  }

  // Custom Audio Player State
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  // Trigger Toast Notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  // --- INITIAL SECURITY CHECKS & SESSION MANAGEMENTS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
        verifyAdmin(session.user.id)
      } else {
        setCheckingAdmin(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
        verifyAdmin(session.user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
        setCheckingAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const verifyAdmin = async (uid: string) => {
    setCheckingAdmin(true)
    const verified = await checkIsAdmin(uid)
    setIsAdmin(verified)
    setCheckingAdmin(false)
    if (verified) {
      showToast('Admin access verified successfully!', 'success')
      loadTabContext('analytics')
    } else {
      showToast('Unauthorized account credentials.', 'error')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    // Cloudflare Turnstile token validation check
    if (!turnstileToken) {
      showToast('Please complete the security check CAPTCHA.', 'warning')
      return
    }

    setLoginLoading(true)
    try {
      const verified = await verifyTurnstile(turnstileToken)
      if (!verified) {
        showToast('Security verification failed. Please try again.', 'error')
        setLoginLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        showToast(error.message, 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const currentOrigin = window.location.origin
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentOrigin}/`,
        }
      })
      if (error) {
        showToast(error.message, 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Google Auth initiation failed', 'error')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    showToast('Logged out successfully', 'success')
  }

  // Helper to apply cached data to specific tab state
  const applyCachedData = (tab: string, data: any) => {
    if (tab === 'analytics') {
      setStats(data)
    } else if (tab === 'packs') {
      setPacks(data.packs)
      setCategories(data.categories)
    } else if (tab === 'samples') {
      setSamples(data)
    } else if (tab === 'kyc') {
      setArtists(data.artists)
      setPayouts(data.payouts)
    } else if (tab === 'coupons') {
      setCoupons(data)
    } else if (tab === 'tickets') {
      setTickets(data)
    } else if (tab === 'rankings') {
      setRankedPacks(data)
    } else if (tab === 'users') {
      setUsersList(data)
    } else if (tab === 'sales') {
      setVaultSalesList(data)
    }
  }

  // --- FETCH CONTEXT DATA WITH ADVANCED SWR CACHING ---
  const loadTabContext = async (tab: typeof activeTab, forceBypassCache = false) => {
    const cachedEntry = cacheRef.current[tab]
    const now = Date.now()

    // SWR Pattern: Instantly render cached data while validating in the background
    if (cachedEntry && !forceBypassCache) {
      applyCachedData(tab, cachedEntry.data)

      // If the cache is fresh (< 60s), do not fetch again
      if (now - cachedEntry.timestamp < CACHE_DURATION_MS) {
        return
      }
    }

    // Render loading spinner only for full initial load or manually forced reload
    if (!cachedEntry || forceBypassCache) {
      setDataLoading(true)
    }

    try {
      let freshData: any = null
      if (tab === 'analytics') {
        freshData = await getDashboardStats()
        setStats(freshData)
      } else if (tab === 'packs') {
        const result = await getSamplePacks()
        freshData = result
        setPacks(result.packs)
        setCategories(result.categories)
      } else if (tab === 'samples') {
        const { packs: packsData } = await getSamplePacks()
        setPacks(packsData)
        freshData = await getSamples(packFilter, sampleSearch)
        setSamples(freshData)
      } else if (tab === 'kyc') {
        const artistsData = await getArtistsKYC()
        const payoutsData = await getArtistPayouts()
        freshData = { artists: artistsData, payouts: payoutsData }
        setArtists(artistsData)
        setPayouts(payoutsData)
      } else if (tab === 'coupons') {
        freshData = await getCoupons()
        setCoupons(freshData)
      } else if (tab === 'tickets') {
        freshData = await getSupportTickets()
        setTickets(freshData)
      } else if (tab === 'rankings') {
        freshData = await getRankedPacks()
        setRankedPacks(freshData)
      } else if (tab === 'users') {
        freshData = await getAllUsers()
        setUsersList(freshData)
      } else if (tab === 'sales') {
        freshData = await getAllVaultSales()
        setVaultSalesList(freshData)
      }

      // Store in memory cache
      if (freshData) {
        cacheRef.current[tab] = {
          data: freshData,
          timestamp: Date.now()
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch data', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  // Force invalidate memory cache and load fresh data (e.g. after mutating CRUD operations)
  const invalidateCacheAndReload = (tab: typeof activeTab) => {
    delete cacheRef.current[tab]
    loadTabContext(tab, true)
  }

  // Reload current tab content bypassing the cache completely
  const handleReload = () => {
    invalidateCacheAndReload(activeTab)
  }

  // Trigger reloading on filter or tab change
  useEffect(() => {
    if (isAdmin) {
      loadTabContext(activeTab)
    }
  }, [activeTab, packFilter])

  const handleBanUser = async (userId: string, email: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM USER ACCESS LOCK',
      `Are you absolutely sure you want to BAN and lock user "${email}" from accessing SamplesWala? They will not be able to log in or download samples.`,
      true,
      'LOCK USER ACCOUNT'
    )
    if (!approved) return
    try {
      setDataLoading(true)
      await banUser(userId)
      showToast('User has been banned successfully!', 'success')
      const allUsers = await getAllUsers()
      setUsersList(allUsers)
      cacheRef.current['users'] = { data: allUsers, timestamp: Date.now() }
      if (activeUser && activeUser.id === userId) {
        setActiveUser((prev: any) => ({ ...prev, is_banned: true }))
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to ban user', 'error')
    } finally {
      setDataLoading(false)
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
    try {
      setDataLoading(true)
      await unbanUser(userId)
      showToast('User has been unbanned successfully!', 'success')
      const allUsers = await getAllUsers()
      setUsersList(allUsers)
      cacheRef.current['users'] = { data: allUsers, timestamp: Date.now() }
      if (activeUser && activeUser.id === userId) {
        setActiveUser((prev: any) => ({ ...prev, is_banned: false }))
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to unban user', 'error')
    } finally {
      setDataLoading(false)
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
    try {
      setDataLoading(true)
      await deleteUser(userId)
      showToast('User account deleted permanently!', 'success')
      const allUsers = await getAllUsers()
      setUsersList(allUsers)
      cacheRef.current['users'] = { data: allUsers, timestamp: Date.now() }
      setShowUserModal(false)
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  // Custom audio previews handling
  const playSamplePreview = (sId: string, url: string) => {
    if (!url) {
      showToast('Audio URL is empty!', 'error')
      return
    }

    if (playingSampleId === sId) {
      audioPlayerRef.current?.pause()
      setPlayingSampleId(null)
    } else {
      setAudioUrl(url)
      setPlayingSampleId(sId)
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load()
          audioPlayerRef.current.play().catch(e => {
            console.error('Audio play failed:', e)
            showToast('Preview playback blocked by browser security', 'warning')
            setPlayingSampleId(null)
          })
        }
      }, 50)
    }
  }

  // --- CRUD DISPATCH ACTION SAVES ---

  // 1. Pack Save
  const handlePackSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePack.name || !activePack.slug) {
      showToast('Name and Slug are required!', 'error')
      return
    }

    try {
      const saved = await saveSamplePack(activePack)
      showToast(`Pack "${saved.name}" saved successfully!`, 'success')
      setShowPackModal(false)
      invalidateCacheAndReload('packs')
    } catch (err: any) {
      showToast(err.message || 'Failed to save pack', 'error')
    }
  }

  const handlePackDelete = async (id: string, name: string) => {
    const approved = await askConfirmation(
      '🚨 DANGER - PACK INVENTORY REMOVAL',
      `You are about to permanently delete the sample pack "${name}" and all associated audio samples contained within it. This action CANNOT BE UNDONE.`,
      true,
      'REMOVE PACK INVENTORY'
    )
    if (!approved) return
    try {
      await deleteSamplePack(id)
      showToast(`Pack "${name}" deleted!`, 'success')
      invalidateCacheAndReload('packs')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete pack', 'error')
    }
  }

  // 2. Sample Save
  const handleSampleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSample.name || !activeSample.pack_id) {
      showToast('Name and Pack are required!', 'error')
      return
    }

    try {
      const saved = await saveSample(activeSample)
      showToast(`Sample "${saved.name}" saved successfully!`, 'success')
      setShowSampleModal(false)
      invalidateCacheAndReload('samples')
    } catch (err: any) {
      showToast(err.message || 'Failed to save sample', 'error')
    }
  }

  const handleSampleDelete = async (id: string, name: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM AUDIO REMOVAL',
      `Are you sure you want to permanently delete the audio sample "${name}" from the system library? This will remove it from the customer search catalog immediately.`,
      true,
      'DELETE AUDIO SAMPLE'
    )
    if (!approved) return
    try {
      await deleteSample(id)
      showToast(`Sample "${name}" deleted!`, 'success')
      invalidateCacheAndReload('samples')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete sample', 'error')
    }
  }

  // 3. KYC Actions
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
      setShowKycModal(false)
      invalidateCacheAndReload('kyc')
    } catch (err: any) {
      showToast(err.message || 'Failed to update KYC', 'error')
    }
  }

  // Payout trigger
  const handlePayoutTrigger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payoutAmount || !payoutMonth || !payoutUtr) {
      showToast('Amount, Payout Month, and UTR reference number are required!', 'error')
      return
    }

    try {
      await triggerArtistPayout({
        artist_id: payoutArtist.user_id,
        amount: Number(payoutAmount),
        payout_month: payoutMonth,
        notes: payoutNotes,
        utr_number: payoutUtr
      })
      showToast(`Simulated payout of ₹${payoutAmount} registered successfully!`, 'success')
      setShowPayoutModal(false)
      setPayoutAmount('')
      setPayoutMonth('')
      setPayoutNotes('')
      setPayoutUtr('')
      invalidateCacheAndReload('kyc')
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger payout', 'error')
    }
  }

  // 4. Coupon Save
  const handleCouponSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCoupon.code || !activeCoupon.discount_percent) {
      showToast('Coupon code and discount percentage are required!', 'error')
      return
    }

    try {
      const saved = await saveCoupon(activeCoupon)
      showToast(`Coupon "${saved.code}" saved!`, 'success')
      setShowCouponModal(false)
      invalidateCacheAndReload('coupons')
    } catch (err: any) {
      showToast(err.message || 'Failed to save coupon', 'error')
    }
  }

  const handleCouponDelete = async (id: string, code: string) => {
    const approved = await askConfirmation(
      '⚠️ CONFIRM DISCOUNT COUPON DELETION',
      `Are you sure you want to permanently delete coupon "${code}"? This discount code will instantly stop working for all active customers.`,
      true,
      'DELETE COUPON'
    )
    if (!approved) return
    try {
      await deleteCoupon(id)
      showToast(`Coupon "${code}" deleted`, 'success')
      invalidateCacheAndReload('coupons')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete coupon', 'error')
    }
  }

  // 5. Support Ticket Actions
  const handleTicketReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketReply) return
    try {
      await replyToTicket(activeTicket.id, ticketReply)
      showToast('Reply submitted and ticket resolved!', 'success')
      setShowTicketModal(false)
      setTicketReply('')
      invalidateCacheAndReload('tickets')
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve ticket', 'error')
    }
  }

  // Quick Rank update in Rankings Engine
  const updatePackRankInline = async (pack: any, rankVal: string) => {
    const parsedRank = parseInt(rankVal)
    if (isNaN(parsedRank)) {
      showToast('Please specify a valid rank number', 'error')
      return
    }

    try {
      await saveSamplePack({ ...pack, display_rank: parsedRank })
      showToast(`Rank for "${pack.name}" updated to ${parsedRank}!`, 'success')
      invalidateCacheAndReload('rankings')
    } catch (err: any) {
      showToast(err.message || 'Failed to update priority rank', 'error')
    }
  }

  // Generate automatically slugs for packs
  const handlePackNameChange = (nameStr: string) => {
    const slugged = nameStr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setActivePack((prev: any) => ({ ...prev, name: nameStr, slug: slugged }))
  }

  // --- RENDERING ROUTINES ---

  // Loading Indicator
  if (checkingAdmin) {
    return null
  }

  // Non-Logged In or Unauthorized Screen
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-6 relative">
        <div className="absolute top-0 right-0 p-8 flex items-center gap-4 text-xs font-black text-studio-pink">
          <div className="w-2.5 h-2.5 bg-studio-pink animate-ping rounded-full" />
          SYSTEM LIVE
        </div>

        <div className="w-full max-w-md">
          {session && !isAdmin ? (
            /* ACCESS DENIED CARD */
            <div className="border-4 border-black bg-[#121212] p-8 shadow-premium relative">
              <div className="absolute -top-5 left-6 bg-studio-red text-black font-black uppercase text-xs border-4 border-black px-3 py-1 shadow-md">
                ❌ ACCESS DENIED!
              </div>

              <div className="text-center my-6">
                <AlertTriangle className="w-16 h-16 text-studio-red mx-auto mb-4" />
                <h2 className="font-luckiest-guy text-4xl uppercase tracking-tighter mb-4">RESTRICTED DOMAIN</h2>
                <div className="bg-black/50 border border-zinc-800 p-4 font-mono text-xs text-left mb-6 text-zinc-300 leading-relaxed">
                  Your logged account <span className="text-white font-bold">{session.user.email}</span> is not registered in the system's authorized Admin Table. Only verified DB administrators are granted access to this command center.
                </div>
                <button
                  onClick={handleLogout}
                  className="studio-button w-full bg-studio-red hover:bg-studio-red/80 text-white font-black"
                >
                  <LogOut className="w-4 h-4" /> SIGN OUT / BACK TO LOGIN
                </button>
              </div>
            </div>
          ) : (
            /* LOGIN CARD */
            <form onSubmit={handleLogin} className="border-4 border-black bg-[#121212] p-8 shadow-premium relative">
              <div className="absolute -top-5 left-6 bg-studio-yellow text-black font-black uppercase text-xs border-4 border-black px-3 py-1 shadow-md">
                🔒 ADMIN LOGIN
              </div>

              <div className="text-center mb-8 mt-4">
                <h1 className="font-luckiest-guy text-5xl uppercase tracking-tighter text-white">
                  SAMPLES<span className="text-studio-pink">WALA</span>
                </h1>
                <p className="text-xs uppercase font-black text-studio-neon tracking-widest mt-1">ADMIN PORTAL v1.5</p>
              </div>

              <div className="space-y-5 font-mono">
                <div>
                  <label className="block text-xs uppercase font-black tracking-widest text-zinc-400 mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@sampleswala.com"
                    className="w-full bg-black border-3 border-black p-3 text-white text-xs outline-none focus:border-studio-pink font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-black tracking-widest text-zinc-400 mb-2">PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black border-3 border-black p-3 text-white text-xs outline-none focus:border-studio-pink font-bold"
                  />
                </div>

                {/* Cloudflare Turnstile CAPTCHA component */}
                <div className="flex justify-center py-2 bg-black border-3 border-black p-2.5">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={token => setTurnstileToken(token)}
                    onError={() => {
                      showToast('Turnstile validation failed', 'error')
                      setTurnstileToken(null)
                    }}
                    onExpire={() => setTurnstileToken(null)}
                  />
                </div>

                 <button
                  type="submit"
                  disabled={loginLoading}
                  className="studio-button w-full mt-2 font-black py-4 bg-studio-pink text-black"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> VERIFY ACCESS CREDENTIALS
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 py-2 font-mono">
                  <div className="flex-1 h-0.5 bg-zinc-800" />
                  <span className="text-[10px] text-zinc-500 font-black">OR SECURITY SSO</span>
                  <div className="flex-1 h-0.5 bg-zinc-800" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="studio-button w-full bg-white hover:bg-studio-yellow text-black font-black py-4 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  SSO AUTH WITH GOOGLE
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // --- CORE AUTHORIZED ADMIN INTERFACE ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0c0c0c] text-white">
      {/* Hidden audio element for preview players */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setPlayingSampleId(null)}
          className="hidden"
        />
      )}

      {/* STATE NOTIFICATION TOAST */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 border-4 border-black p-4 shadow-premium transition-transform duration-300 font-mono text-xs uppercase font-black flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-studio-neon text-black' : toast.type === 'error' ? 'bg-studio-red text-white' : 'bg-studio-yellow text-black'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION BAR */}
      <aside className="w-full md:w-64 border-b-4 md:border-b-0 md:border-r-4 border-black bg-[#121212] flex flex-col flex-shrink-0 z-10">
        <div className="p-6 border-b-4 border-black bg-black flex flex-row items-center justify-between md:flex-col md:items-stretch">
          <div>
            <h1 className="font-luckiest-guy text-3xl tracking-tighter uppercase leading-none">
              SAMPLES<span className="text-studio-pink">WALA</span>
            </h1>
            <span className="text-[9px] uppercase font-mono tracking-widest text-studio-neon font-black block mt-1">
              🛠️ SYSTEM CONTROL
            </span>
          </div>
          
          <button
            onClick={handleReload}
            className="md:hidden p-2 bg-[#222] border-2 border-black hover:bg-studio-pink hover:text-black transition-colors"
            title="Force refresh current tab data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* MENU TABS GRID */}
        <nav className="flex-1 p-4 space-y-2.5 font-sans text-xs font-bold uppercase overflow-y-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'analytics' ? 'bg-studio-pink text-black shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>📈 Performance Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('packs')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'packs' ? 'bg-studio-yellow text-black shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Library className="w-4.5 h-4.5" />
            <span>📦 Sample Packs</span>
          </button>



          <button
            onClick={() => setActiveTab('kyc')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'kyc' ? 'bg-studio-orange text-white shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <UserCheck className="w-4.5 h-4.5" />
            <span>🎨 KYC & Payouts</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'coupons' ? 'bg-studio-blue text-white shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Ticket className="w-4.5 h-4.5" />
            <span>🎟️ Discount Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'tickets' ? 'bg-studio-purple text-white shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span>🎫 Support Tickets</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'users' ? 'bg-studio-pink text-black shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>👥 Users Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center gap-3 px-4 py-3 border-3 border-black text-left transition-all ${
              activeTab === 'sales' ? 'bg-studio-neon text-black shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span>💰 Orders</span>
          </button>
        </nav>

        {/* SIDEBAR FOOTER (USER & LOGOUT) */}
        <div className="p-4 border-t-4 border-black bg-black space-y-3 font-mono">
          <div className="flex items-center gap-3 bg-[#111] p-2.5 border border-zinc-800">
            <div className="w-8 h-8 rounded-none bg-studio-pink text-black flex items-center justify-center font-black uppercase text-sm border-2 border-black">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">AUTHORIZED ADMIN</p>
              <p className="text-[11px] font-bold text-white truncate mt-1">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-studio-red/10 border-2 border-studio-red text-studio-red hover:bg-studio-red hover:text-white transition-all text-xs font-black uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT SESSION</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* SUB HEADER ROW */}
        <header className="border-b-4 border-black bg-[#121212] px-6 py-4 flex items-center justify-between flex-shrink-0 z-0">
          <div className="flex items-center gap-3">
            <span className="text-xl uppercase font-black tracking-tighter">
              {activeTab === 'analytics' && '📈 Dashboard Stats & Revenue'}
              {activeTab === 'packs' && '📦 Sample Packs Inventory'}
              {activeTab === 'samples' && '🎵 Audio Sample Library'}
              {activeTab === 'kyc' && '🎨 Artist KYCs & Payout Register'}
              {activeTab === 'coupons' && '🎟️ Discount Coupon Register'}
              {activeTab === 'tickets' && '🎫 Support Ticket Command'}
              {activeTab === 'rankings' && '🌟 Global Ranking Engine'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {dataLoading && (
              <div className="flex items-center gap-2 text-[10px] uppercase font-black text-studio-neon">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> LOADING DB DATA...
              </div>
            )}
            <button
              onClick={handleReload}
              className="p-2 border-3 border-black bg-white hover:bg-studio-pink text-black transition-colors"
              title="Refresh database collections"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: PERFORMANCE ANALYTICS & STATS                     */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-6 animate-fadeIn">
              {/* STATS HEADER GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. REVENUE CARD */}
                <div className="comic-panel border-4 border-black p-5 yellow-border flex items-center gap-4">
                  <div className="w-12 h-12 bg-studio-yellow border-3 border-black flex items-center justify-center text-black">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-400">TOTAL COMBINED SALES</h3>
                    <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
                      ₹{stats.totalRevenueINR.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 2. USERS REGISTERED */}
                <div className="comic-panel border-4 border-black p-5 pink-border flex items-center gap-4">
                  <div className="w-12 h-12 bg-studio-pink border-3 border-black flex items-center justify-center text-black">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-400">REGISTERED CUSTOMERS</h3>
                    <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
                      {stats.totalUsers} USERS
                    </p>
                  </div>
                </div>

                {/* 3. DOWNLOADS COMPLETED */}
                <div className="comic-panel border-4 border-black p-5 neon-border flex items-center gap-4">
                  <div className="w-12 h-12 bg-studio-neon border-3 border-black flex items-center justify-center text-black">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-400">SECURE AUDIO DOWNLOADS</h3>
                    <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
                      {stats.totalDownloads} HITS
                    </p>
                  </div>
                </div>

                {/* 4. PENDING ISSUES */}
                <div className="comic-panel border-4 border-black p-5 orange-border flex items-center gap-4">
                  <div className="w-12 h-12 bg-studio-orange border-3 border-black flex items-center justify-center text-black">
                    <BadgeAlert className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-zinc-400">OPEN CASES / PENDING KYC</h3>
                    <p className="font-sans font-bold text-xl tracking-normal text-white mt-1">
                      {stats.openTickets} TC / {stats.pendingKYCs} KYC
                    </p>
                  </div>
                </div>
              </div>

              {/* RECENT SALES GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SAMPLE PACK SALES (VAULT) */}
                <div className="studio-panel p-6 border-4 border-black">
                  <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
                    <h3 className="font-sans font-bold text-lg uppercase text-studio-neon flex items-center gap-2">
                      📦 SAMPLE PACK SALES
                    </h3>
                    <span className="text-[10px] uppercase font-mono font-black bg-zinc-800 border border-zinc-700 px-2 py-0.5">
                      LATEST 5
                    </span>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {!stats.recentVaultSales || stats.recentVaultSales.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 uppercase font-black">
                        No sample pack sales from vault.
                      </div>
                    ) : (
                      stats.recentVaultSales.map((sale: any, idx: number) => (
                        <div key={idx} className="bg-black/50 border border-zinc-800 p-3.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white uppercase text-[11px] truncate max-w-[180px]" title={sale.pack_name}>
                              {sale.pack_name}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              BUYER: <span className="text-zinc-500 font-bold">{sale.user_id ? `${sale.user_id.slice(0, 8)}...` : 'Customer'}</span>
                            </p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              {new Date(sale.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-black text-white text-[13px]">₹{sale.amount || 0}</p>
                            <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 mt-1 border border-black bg-studio-pink text-black">
                              VAULTED
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SOFTWARE ORDERS */}
                <div className="studio-panel p-6 border-4 border-black">
                  <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
                    <h3 className="font-sans font-bold text-lg uppercase text-studio-yellow flex items-center gap-2">
                      💿 SOFTWARE LICENSES
                    </h3>
                    <span className="text-[10px] uppercase font-mono font-black bg-zinc-800 border border-zinc-700 px-2 py-0.5">
                      LATEST 5
                    </span>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {stats.recentSoftwares.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 uppercase font-black">
                        No software products purchased yet.
                      </div>
                    ) : (
                      stats.recentSoftwares.map((order: any) => (
                        <div key={order.id} className="bg-black/50 border border-zinc-800 p-3.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white uppercase text-[11px] truncate max-w-[180px]">
                              {order.user_email}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              PRODUCT: <span className="text-studio-yellow font-black">{order.software_name}</span>
                            </p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-black text-white text-[13px]">₹{order.amount_paid || 0}</p>
                            <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 mt-1 border border-black ${
                              order.status === 'complete' ? 'bg-studio-neon text-black' : 'bg-studio-yellow text-black'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SAMPLE PACKS INVENTORY CRUD                       */}
          {/* ======================================================== */}
          {activeTab === 'packs' && (
            <div className="space-y-6 animate-fadeIn font-mono">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121212] p-4 border-4 border-black">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={packSearch}
                    onChange={e => setPackSearch(e.target.value)}
                    placeholder="SEARCH PACKS BY TITLE..."
                    className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-bold"
                  />
                </div>

                <button
                  onClick={() => {
                    setActivePack({
                      name: '',
                      slug: '',
                      description: '',
                      price_inr: 999,
                      price_usd: 12.99,
                      bundle_credit_cost: 50,
                      cover_url: '',
                      category_id: categories[0]?.id || '',
                      is_featured: false,
                      is_bundle_only: false,
                      video_url: '',
                      melody_count: 0,
                      loop_count: 0,
                      one_shot_count: 0,
                      preset_count: 0,
                      total_credits: 0,
                      mrp_inr: 1999
                    })
                    setShowPackModal(true)
                  }}
                  className="comic-button bg-studio-neon hover:bg-studio-neon"
                >
                  <Plus className="w-4 h-4 text-black" /> NEW PACK INVENTORY
                </button>
              </div>

              {/* LIST TABLE OF PACKS */}
              <div className="border-4 border-black bg-black overflow-x-auto font-sans text-xs">
                <table className="w-full text-left uppercase font-bold border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
                      <th className="p-4 w-16">COVER</th>
                      <th className="p-4">PACK DETAILS</th>
                      <th className="p-4">CATEGORY</th>
                      <th className="p-4 text-right">PRICES (INR / USD)</th>
                      <th className="p-4 text-center">CREDITS</th>
                      <th className="p-4 text-center">RANKING (PRIO)</th>
                      <th className="p-4 text-center">FEATURED</th>
                      <th className="p-4 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black font-sans text-xs">
                    {packs
                      .filter(p => p.name.toLowerCase().includes(packSearch.toLowerCase()))
                      .map((pack: any) => {
                        const cat = categories.find(c => c.id === pack.category_id)
                        return (
                          <tr key={pack.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                            <td className="p-4">
                              <div className="w-12 h-12 bg-zinc-900 border-2 border-black flex-shrink-0 relative overflow-hidden">
                                {pack.cover_url ? (
                                  <img src={pack.cover_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-zinc-500">NO IMG</div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-sans font-bold text-sm text-zinc-100 normal-case leading-tight">{pack.name}</p>
                              <p className="text-[9px] text-studio-pink mt-1 lowercase font-mono font-medium">{pack.slug}</p>
                            </td>
                            <td className="p-4">
                              <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 text-[9px] font-bold">
                                {cat?.name || 'No category'}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-medium">
                              <p className="text-white text-xs">₹{pack.price_inr} <span className="text-[9px] text-zinc-500 line-through">₹{pack.mrp_inr}</span></p>
                              <p className="text-studio-neon mt-0.5 text-[10px]">${pack.price_usd}</p>
                            </td>
                            <td className="p-4 text-center font-mono text-xs text-white font-medium">
                              {pack.bundle_credit_cost} CR
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-studio-pink">
                              {pack.display_rank || 0}
                            </td>
                            <td className="p-4 text-center">
                              {pack.is_featured ? (
                                <span className="bg-studio-neon/20 border border-studio-neon text-studio-neon text-[8px] px-2 py-0.5 font-bold">FEATURED</span>
                              ) : (
                                <span className="text-zinc-600 text-[8px] font-bold">STANDARD</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setActivePack(pack)
                                    setShowPackModal(true)
                                  }}
                                  className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePackDelete(pack.id, pack.name)}
                                  className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SAMPLES LIBRARY CRUD                              */}
          {/* ======================================================== */}
          {activeTab === 'samples' && (
            <div className="space-y-6 animate-fadeIn font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#121212] p-4 border-4 border-black">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={sampleSearch}
                    onChange={e => setSampleSearch(e.target.value)}
                    placeholder="SEARCH BY SAMPLE NAME..."
                    className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-bold animate-none"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <select
                    value={packFilter}
                    onChange={e => setPackFilter(e.target.value)}
                    className="w-full bg-black border-2 border-black p-2.5 pl-10 text-white text-xs outline-none focus:border-studio-pink font-black uppercase appearance-none"
                  >
                    <option value="all">ALL SAMPLE PACKS</option>
                    {packs.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Create */}
                <button
                  onClick={() => {
                    setActiveSample({
                      name: '',
                      pack_id: packFilter !== 'all' ? packFilter : packs[0]?.id || '',
                      audio_url: '',
                      download_url: '',
                      bpm: 120,
                      key: 'C Min',
                      credit_cost: 10,
                      tags: '',
                      is_preview_only: false,
                      type: 'loop',
                      time_signature: '4/4',
                      ai_mood: 'Chill',
                      ai_genre: 'Hip Hop',
                      ai_description: '',
                      ai_vibe_score: 5.0,
                      ai_is_processed: false
                    })
                    setShowSampleModal(true)
                  }}
                  className="comic-button bg-studio-neon hover:bg-studio-neon py-2.5"
                >
                  <Plus className="w-4 h-4 text-black" /> NEW AUDIO SAMPLE
                </button>
              </div>

              {/* LIST TABLE OF SAMPLES */}
              <div className="border-4 border-black bg-black overflow-x-auto">
                <table className="w-full text-left text-xs uppercase font-black border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b-4 border-black">
                      <th className="p-4 w-12 text-center">PLAY</th>
                      <th className="p-4">SAMPLE NAME</th>
                      <th className="p-4">PACK SOURCE</th>
                      <th className="p-4 text-center">TYPE</th>
                      <th className="p-4 text-center">KEY / BPM</th>
                      <th className="p-4 text-center">CREDIT COST</th>
                      <th className="p-4 text-center">AI VIBE</th>
                      <th className="p-4 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black">
                    {samples.map((sample: any) => (
                      <tr key={sample.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                        <td className="p-4 text-center">
                          <button
                            onClick={() => playSamplePreview(sample.id, sample.audio_url)}
                            className={`p-2 border-2 border-black rounded-none transition-colors ${
                              playingSampleId === sample.id ? 'bg-studio-pink text-black' : 'bg-white text-black hover:bg-studio-neon'
                            }`}
                          >
                            {playingSampleId === sample.id ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                          </button>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white text-sm normal-case">{sample.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {sample.tags?.map((t: string) => (
                              <span key={t} className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 py-0.5 lowercase">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400 font-bold">
                          {sample.sample_packs?.name || 'No pack'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[9px] px-2 py-0.5 border border-black ${
                            sample.type === 'loop' ? 'bg-studio-pink/20 text-studio-pink' : 'bg-studio-neon/20 text-studio-neon'
                          }`}>
                            {sample.type}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-zinc-300">
                          {sample.key || 'N/A'} / {sample.bpm || 0} BPM
                        </td>
                        <td className="p-4 text-center text-white font-mono">
                          {sample.credit_cost} CR
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-studio-yellow font-black text-xs font-mono">
                            ★ {sample.ai_vibe_score || '0.0'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setActiveSample({
                                  ...sample,
                                  tags: sample.tags?.join(', ') || ''
                                })
                                setShowSampleModal(true)
                              }}
                              className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSampleDelete(sample.id, sample.name)}
                              className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80"
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
          )}

          {/* ======================================================== */}
          {/* TAB 4: ARTIST PORTAL KYCS & PAYOUTS MANAGEMENT           */}
          {/* ======================================================== */}
          {activeTab === 'kyc' && (
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
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: COUPONS & DISCOUNTS MANAGEMENT                    */}
          {/* ======================================================== */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-fadeIn font-mono">
              <div className="bg-[#121212] p-4 border-4 border-black flex justify-between items-center">
                <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-blue">
                  🎟️ COUPON DISCOUNTS
                </h3>
                <button
                  onClick={() => {
                    setActiveCoupon({
                      code: '',
                      discount_percent: 15,
                      is_active: true,
                      expires_at: ''
                    })
                    setShowCouponModal(true)
                  }}
                  className="comic-button bg-studio-blue hover:bg-studio-blue text-white"
                >
                  <Plus className="w-4 h-4" /> ADD DISCOUNT COUPON
                </button>
              </div>

              {/* LIST TABLE OF COUPONS */}
              <div className="border-4 border-black bg-black overflow-x-auto">
                <table className="w-full text-left text-xs uppercase font-black border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b-4 border-black">
                      <th className="p-4">COUPON CODE</th>
                      <th className="p-4 text-center">DISCOUNT PERCENTAGE</th>
                      <th className="p-4 text-center">STATUS</th>
                      <th className="p-4 text-center">EXPIRATION DATE</th>
                      <th className="p-4 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500 uppercase font-black">
                          No coupons created yet.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon: any) => (
                        <tr key={coupon.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                          <td className="p-4 text-white font-black text-sm tracking-wider">
                            {coupon.code}
                          </td>
                          <td className="p-4 text-center font-mono font-black text-studio-blue text-lg">
                            {coupon.discount_percent}% OFF
                          </td>
                          <td className="p-4 text-center">
                            {coupon.is_active ? (
                              <span className="bg-studio-neon/20 border border-studio-neon text-studio-neon text-[8px] px-2 py-0.5">ACTIVE</span>
                            ) : (
                              <span className="bg-studio-red/20 border border-studio-red text-studio-red text-[8px] px-2 py-0.5">EXPIRED/INACTIVE</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono text-zinc-400 font-bold">
                            {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'INFINITE / NO EXPIRY'}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveCoupon(coupon)
                                  setShowCouponModal(true)
                                }}
                                className="p-1.5 border-2 border-black bg-studio-yellow text-black hover:bg-studio-yellow-hover"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCouponDelete(coupon.id, coupon.code)}
                                className="p-1.5 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          )}

          {/* ======================================================== */}
          {/* TAB 6: SUPPORT TICKETS LIST                              */}
          {/* ======================================================== */}
          {activeTab === 'tickets' && (
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
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: RANKING & POPULARITY ENGINE                       */}
          {/* ======================================================== */}
          {activeTab === 'rankings' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs leading-relaxed">
              
              {/* ALGORITHMIC FORMULA CARD */}
              <div className="border-4 border-black bg-studio-charcoal p-6 yellow-border relative">
                <div className="absolute top-0 right-0 bg-studio-yellow text-black text-[9px] font-black uppercase px-2.5 py-1 border-l-4 border-b-4 border-black">
                  POPULARITY FORMULA
                </div>
                <h3 className="font-luckiest-guy text-2xl uppercase tracking-wider text-studio-yellow mb-2">
                  🌟 algometric compound scoring
                </h3>
                <p className="text-zinc-300 text-xs font-mono max-w-3xl mb-4 leading-relaxed">
                  Store display ordering uses a weighted compound algorithm. Standard featured flags boost ranking scores by 50, manual display priorities inject high multipliers (+10 per rank value), and real customer interactions provide dynamic trending telemetry.
                </p>
                <div className="bg-black border border-zinc-800 p-4 font-mono text-studio-neon font-black text-center text-sm tracking-wider">
                  SCORE = (DOWNLOADS * 2) + (WISHLISTS * 5) + (FEATURED ? 50 : 0) + (PRIORITY_RANK * 10)
                </div>
              </div>

              {/* GLOBAL LEADERBOARD */}
              <div className="bg-[#121212] p-4 border-4 border-black">
                <h3 className="font-luckiest-guy text-2xl uppercase tracking-wider text-white">
                  🏆 STORE LEADERBOARD RANKINGS
                </h3>
              </div>

              <div className="border-4 border-black bg-black overflow-x-auto">
                <table className="w-full text-left uppercase font-black border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b-4 border-black">
                      <th className="p-4 w-12 text-center">RANK</th>
                      <th className="p-4">PACK NAME</th>
                      <th className="p-4 text-center">TELEMETRY DOWNLOADS</th>
                      <th className="p-4 text-center">WISHLIST SAVES</th>
                      <th className="p-4 text-center">FEATURED BOOST</th>
                      <th className="p-4 text-center">MANUAL PRIORITY RANK</th>
                      <th className="p-4 text-center text-studio-neon">COMPOUND SCORE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black">
                    {rankedPacks.map((pack: any, idx: number) => {
                      // Inline local rank value tracker
                      return (
                        <tr key={pack.id} className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors">
                          <td className="p-4 text-center">
                            <span className={`w-8 h-8 rounded-none flex items-center justify-center font-luckiest-guy text-lg border-2 border-black mx-auto ${
                              idx === 0 ? 'bg-studio-yellow text-black' : idx === 1 ? 'bg-studio-pink text-black' : idx === 2 ? 'bg-studio-neon text-black' : 'bg-black text-zinc-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-luckiest-guy text-lg normal-case text-white">{pack.name}</p>
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5 lowercase">{pack.slug}</p>
                          </td>
                          <td className="p-4 text-center font-mono font-black text-zinc-300">
                            {pack.downloads} HITS
                          </td>
                          <td className="p-4 text-center font-mono font-black text-zinc-300">
                            {pack.wishlists} SAVES
                          </td>
                          <td className="p-4 text-center font-mono font-black">
                            {pack.is_featured ? (
                              <span className="text-studio-neon bg-studio-neon/10 border border-studio-neon px-2 py-0.5 text-[9px]">+50 BOOST</span>
                            ) : (
                              <span className="text-zinc-600">0</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                defaultValue={pack.display_rank || 0}
                                onBlur={(e) => updatePackRankInline(pack, e.target.value)}
                                className="w-16 bg-black border-2 border-black p-1 text-center font-bold font-mono text-white text-xs outline-none focus:border-studio-pink"
                              />
                            </div>
                          </td>
                          <td className="p-4 text-center font-luckiest-guy text-xl text-studio-neon tracking-wider">
                            {pack.popularityScore} PTS
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: USERS HUB & BAN SYSTEM                            */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
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
                                {u.full_name.charAt(0)}
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
                                      onClick={(e) => { e.stopPropagation(); handleUnbanUser(u.id); }}
                                      className="px-2 py-1 border border-black bg-studio-neon hover:bg-studio-neon-hover text-black font-bold uppercase text-[8px] tracking-wider transition-all cursor-pointer"
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
                                      onClick={(e) => { e.stopPropagation(); handleBanUser(u.id); }}
                                      className="px-2 py-1 border border-black bg-studio-red text-white hover:bg-studio-red/80 font-bold uppercase text-[8px] tracking-wider transition-all cursor-pointer"
                                    >
                                      BAN USER
                                    </button>
                                  </>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                                className="p-2 border-2 border-black bg-studio-red text-white hover:bg-studio-red/80 transition-all cursor-pointer inline-flex items-center justify-center"
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
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: DETAILED VAULT PURCHASES LOG                      */}
          {/* ======================================================== */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              <div className="bg-[#121212] p-4 border-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-studio-neon">
                    💰 ORDERS LOG
                  </h3>
                  <p className="text-zinc-400 mt-1 uppercase text-[10px] font-bold">
                    Complete breakdown of cash sales, customer delivery addresses, and Razorpay settlements.
                  </p>
                </div>
                <div className="relative font-sans">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="SEARCH ORDERS BY PACK/BUYER/PAYMENT..."
                    value={salesSearch}
                    onChange={e => setSalesSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-black border-2 border-black text-white font-bold placeholder-zinc-600 outline-none focus:border-studio-neon w-64 md:w-80 uppercase text-xs"
                  />
                </div>
              </div>

              {/* SALES DATA GRID */}
              <div className="border-4 border-black bg-black overflow-x-auto">
                <table className="w-full text-left uppercase font-bold border-collapse">
                  <thead>
                    <tr className="bg-[#121212] border-b-4 border-black text-zinc-400">
                      <th className="p-4">PRODUCT PURCHASED</th>
                      <th className="p-4">BUYER PROFILE & METADATA</th>
                      <th className="p-4">SHIPPING & BILLING ADDRESS</th>
                      <th className="p-4 text-center">GATEWAY SETTLEMENT</th>
                      <th className="p-4 text-center">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-3 divide-black font-sans text-xs">
                    {(() => {
                      const filtered = vaultSalesList.filter(s => {
                        const searchLower = salesSearch.toLowerCase()
                        return (
                          (s.pack_name || '').toLowerCase().includes(searchLower) ||
                          (s.buyer_name || '').toLowerCase().includes(searchLower) ||
                          (s.buyer_email || '').toLowerCase().includes(searchLower) ||
                          (s.buyer_address || '').toLowerCase().includes(searchLower) ||
                          (s.razorpay_order_id || '').toLowerCase().includes(searchLower) ||
                          (s.razorpay_payment_id || '').toLowerCase().includes(searchLower)
                        )
                      })

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500 uppercase font-bold">
                              No sales transactions logged.
                            </td>
                          </tr>
                        )
                      }

                      return filtered.map((s: any) => (
                        <tr
                          key={s.id}
                          onClick={() => {
                            setActiveOrder(s)
                            setShowOrderModal(true)
                          }}
                          className="hover:bg-[#121212] bg-[#0c0c0c] transition-colors cursor-pointer"
                          title="Click to view full detailed order transaction"
                        >
                          <td className="p-4">
                            <div className="bg-[#151515] border border-zinc-800 p-3 font-sans">
                              <p className="font-sans font-bold text-sm text-zinc-100 normal-case leading-tight">{s.pack_name}</p>
                              <span className="inline-block text-[8px] bg-studio-pink/20 text-studio-pink border border-studio-pink px-2 py-0.5 mt-2 font-bold uppercase">VAULTED ACQUISITION</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-sans font-bold text-sm tracking-wide text-zinc-100 leading-none">{s.buyer_name}</p>
                            <p className="text-[10px] text-zinc-400 lowercase font-mono mt-1.5 flex items-center gap-1 normal-case font-medium">
                              <Mail className="w-3.5 h-3.5 text-studio-neon" /> {s.buyer_email}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1 font-medium">
                              <Phone className="w-3.5 h-3.5 text-zinc-500" /> {s.buyer_phone}
                            </p>
                          </td>
                          <td className="p-4 normal-case text-zinc-400 font-medium max-w-xs text-[10px] leading-normal font-mono">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-studio-neon flex-shrink-0 mt-0.5" />
                              <span>{s.buyer_address}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-block bg-black border border-zinc-800 p-2.5 font-mono text-left font-medium">
                              <p className="text-[10px] text-zinc-500 font-sans">PAYMENT TOTAL:</p>
                              <p className="text-base font-bold text-zinc-100 mt-0.5">₹{s.amount.toLocaleString()}</p>
                              <div className="mt-2 border-t border-zinc-900 pt-1.5 space-y-0.5 font-medium font-mono text-[8px] tracking-tight uppercase text-zinc-400">
                                <p>ORD: <span className="text-studio-neon">{s.razorpay_order_id}</span></p>
                                <p>PAY: <span className="text-studio-pink">{s.razorpay_payment_id}</span></p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-mono text-[10px] font-medium text-zinc-500">
                            {new Date(s.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL DRAWER: PACK CRUD DETAILS                          */}
      {/* ======================================================== */}
      {showPackModal && activePack && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handlePackSave}
            className="w-full max-w-2xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowPackModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-yellow mb-6">
              {activePack.id ? '📦 edit pack inventory' : '📦 create pack inventory'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PACK TITLE</label>
                <input
                  type="text"
                  required
                  value={activePack.name}
                  onChange={e => handlePackNameChange(e.target.value)}
                  placeholder="e.g. Sitar Masters Volume 1"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SLUG / URL PATH</label>
                <input
                  type="text"
                  required
                  value={activePack.slug}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, slug: e.target.value }))}
                  placeholder="sitar-masters-vol-1"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold lowercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DESCRIPTION</label>
                <textarea
                  value={activePack.description || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about samples counts, recording styles..."
                  rows={3}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PRICE INR (₹)</label>
                <input
                  type="number"
                  required
                  value={activePack.price_inr}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_inr: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">MRP INR (STRIKE-THROUGH)</label>
                <input
                  type="number"
                  value={activePack.mrp_inr || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, mrp_inr: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PRICE USD ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={activePack.price_usd}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, price_usd: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">BUNDLE CREDIT COST</label>
                <input
                  type="number"
                  required
                  value={activePack.bundle_credit_cost}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, bundle_credit_cost: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">COVER COVER_URL</label>
                <input
                  type="text"
                  value={activePack.cover_url || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, cover_url: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">CATEGORY BINDING</label>
                <select
                  value={activePack.category_id || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, category_id: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                >
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DISPLAY PRIORITY RANK (MANUAL)</label>
                <input
                  type="number"
                  value={activePack.display_rank || 0}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, display_rank: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">FULL PACK DOWNLOAD URL (DRIVE/CDN)</label>
                <input
                  type="text"
                  value={activePack.full_pack_download_url || ''}
                  onChange={e => setActivePack((prev: any) => ({ ...prev, full_pack_download_url: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-yellow font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_featured}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_featured: e.target.checked }))}
                    className="accent-studio-yellow"
                  />
                  IS FEATURED BOOST
                </label>

                <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                  <input
                    type="checkbox"
                    checked={activePack.is_bundle_only}
                    onChange={e => setActivePack((prev: any) => ({ ...prev, is_bundle_only: e.target.checked }))}
                    className="accent-studio-yellow"
                  />
                  IS BUNDLE ONLY
                </label>
              </div>

              <div className="grid grid-cols-4 gap-2 md:col-span-2">
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">MELODIES</label>
                  <input type="number" value={activePack.melody_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, melody_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">LOOPS</label>
                  <input type="number" value={activePack.loop_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, loop_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">ONE-SHOTS</label>
                  <input type="number" value={activePack.one_shot_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, one_shot_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
                <div>
                  <label className="block text-[8px] text-zinc-500 mb-1">PRESETS</label>
                  <input type="number" value={activePack.preset_count || 0} onChange={e => setActivePack((prev: any) => ({ ...prev, preset_count: Number(e.target.value) }))} className="w-full bg-black border border-black p-1 text-center font-bold" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="studio-button w-full mt-6 bg-studio-yellow text-black font-black"
            >
              <Check className="w-4 h-4" /> COMMIT PACK DATA TO STORAGE
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DRAWER: SAMPLE CRUD DETAILS                        */}
      {/* ======================================================== */}
      {showSampleModal && activeSample && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSampleSave}
            className="w-full max-w-2xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowSampleModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-neon mb-6">
              {activeSample.id ? '🎵 edit sample properties' : '🎵 upload sample properties'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SAMPLE TITLE</label>
                <input
                  type="text"
                  required
                  value={activeSample.name}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sitar Melody Cmin 120"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PARENT SAMPLE PACK</label>
                <select
                  value={activeSample.pack_id}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, pack_id: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                >
                  {packs.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">PREVIEW AUDIO URL</label>
                <input
                  type="text"
                  required
                  value={activeSample.audio_url}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, audio_url: e.target.value }))}
                  placeholder="https://drive.google.com/...mp3"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">FULL WAV DOWNLOAD URL (DRIVE/CDN)</label>
                <input
                  type="text"
                  required
                  value={activeSample.download_url}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, download_url: e.target.value }))}
                  placeholder="https://drive.google.com/...wav"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">BPM</label>
                <input
                  type="number"
                  value={activeSample.bpm || ''}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, bpm: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SCALE KEY (e.g. C Min)</label>
                <input
                  type="text"
                  value={activeSample.key || ''}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, key: e.target.value }))}
                  placeholder="C Min"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SAMPLE BINDING TYPE</label>
                <select
                  value={activeSample.type}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                >
                  <option value="loop">Loop (Melody/Drums)</option>
                  <option value="one-shot">One-Shot (Single Hit)</option>
                  <option value="preset">Software Patch/Preset</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">SINGLE CREDIT COST</label>
                <input
                  type="number"
                  value={activeSample.credit_cost}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, credit_cost: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={activeSample.tags}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, tags: e.target.value }))}
                  placeholder="sitar, indian, acoustic, Bollywood"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-neon font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI ENGINE MOOD</label>
                <input type="text" value={activeSample.ai_mood || ''} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_mood: e.target.value }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI ENGINE GENRE</label>
                <input type="text" value={activeSample.ai_genre || ''} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_genre: e.target.value }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">AI VIBE VALUE SCORE (0-10)</label>
                <input type="number" step="0.1" value={activeSample.ai_vibe_score || 0} onChange={e => setActiveSample((prev: any) => ({ ...prev, ai_vibe_score: Number(e.target.value) }))} className="w-full bg-black border-2 border-black p-2.5" />
              </div>

              <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                <input
                  type="checkbox"
                  checked={activeSample.is_preview_only}
                  onChange={e => setActiveSample((prev: any) => ({ ...prev, is_preview_only: e.target.checked }))}
                  className="accent-studio-neon"
                />
                IS PREVIEW ONLY (NO DOWNLOAD ALLOWED)
              </label>
            </div>

            <button
              type="submit"
              className="studio-button w-full mt-6 bg-studio-neon text-black font-black"
            >
              <Check className="w-4 h-4" /> SAVE AUDIO FILE PROPERTIES
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DRAWER: KYC REVIEW & DOCUMENT DETAILS              */}
      {/* ======================================================== */}
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

      {/* ======================================================== */}
      {/* MODAL DRAWER: TRIGGER PAYOUT FORM                        */}
      {/* ======================================================== */}
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
                className="studio-button w-full mt-4 bg-studio-neon text-black font-black uppercase"
              >
                <Check className="w-4 h-4" /> EMIT TRANSACTION SETTLEMENT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DRAWER: COUPON CRUD DETAILS                        */}
      {/* ======================================================== */}
      {showCouponModal && activeCoupon && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCouponSave}
            className="w-full max-w-md border-4 border-black bg-[#121212] p-6 shadow-premium relative font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-luckiest-guy text-2xl uppercase text-studio-blue mb-6">
              {activeCoupon.id ? '🎟️ edit coupon details' : '🎟️ create discount coupon'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">COUPON CODE CODE</label>
                <input
                  type="text"
                  required
                  value={activeCoupon.code}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. MAURYA30"
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-black uppercase text-sm tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">DISCOUNT PERCENTAGE (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={activeCoupon.discount_percent}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, discount_percent: Number(e.target.value) }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">EXPIRATION TIMESTAMP (OPTIONAL)</label>
                <input
                  type="datetime-local"
                  value={activeCoupon.expires_at ? activeCoupon.expires_at.slice(0, 16) : ''}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                  className="w-full bg-black border-2 border-black p-2.5 text-white outline-none focus:border-studio-blue font-bold"
                />
              </div>

              <label className="border-2 border-black bg-black p-3 flex items-center gap-2 cursor-pointer font-bold text-[10px]">
                <input
                  type="checkbox"
                  checked={activeCoupon.is_active}
                  onChange={e => setActiveCoupon((prev: any) => ({ ...prev, is_active: e.target.checked }))}
                  className="accent-studio-blue"
                />
                IS ACTIVE & ENABLED FOR CHECKOUT
              </label>

              <button
                type="submit"
                className="studio-button w-full mt-4 bg-studio-blue text-white font-black"
              >
                <Check className="w-4 h-4" /> SAVE DISCOUNT COUPON REGISTER
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DRAWER: SUPPORT TICKET DETAILS                     */}
      {/* ======================================================== */}
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
                  className="studio-button w-full bg-studio-purple text-white font-bold uppercase py-2 text-xs"
                >
                  <Send className="w-3.5 h-3.5 inline mr-1" /> EMIT TICKET RESOLUTION REPLY
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

      {/* ======================================================== */}
      {/* MODAL DRAWER: DETAILED ORDER DESCRIPTION                 */}
      {/* ======================================================== */}
      {showOrderModal && activeOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl border-4 border-black bg-[#121212] p-6 shadow-premium relative max-h-[90vh] overflow-y-auto font-sans text-xs">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black border-2 border-black hover:bg-studio-red hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-sans font-bold text-xl uppercase text-studio-neon mb-6">
              📦 Detailed Order Acquisition Receipt
            </h3>

            {/* ORDER TRANSACTION METADATA */}
            <div className="bg-black border border-zinc-800 p-4 space-y-3.5 mb-6 text-zinc-300 font-sans">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">ORDER ID (INTERNAL)</span>
                <span className="text-white font-mono font-bold">{activeOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">PRODUCT PURCHASED</span>
                <span className="text-white font-bold text-sm normal-case text-right">{activeOrder.pack_name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER LEGAL NAME</span>
                <span className="text-zinc-100 font-bold normal-case">{activeOrder.buyer_name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER EMAIL ADDRESS</span>
                <span className="text-zinc-100 font-mono font-medium lowercase select-all">{activeOrder.buyer_email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">BUYER PHONE NUMBER</span>
                <span className="text-zinc-100 font-mono font-medium select-all">{activeOrder.buyer_phone || 'N/A'}</span>
              </div>
              <div className="flex flex-col space-y-1.5 border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">SHIPPING & BILLING ADDRESS</span>
                <span className="text-zinc-300 font-mono leading-normal bg-[#0c0c0c] border border-zinc-900 p-2.5 rounded-none text-[10px] normal-case select-all">
                  {activeOrder.buyer_address || 'No physical delivery address provided for this order.'}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">TOTAL VALUE PAID</span>
                <span className="text-studio-neon font-bold text-sm">₹{activeOrder.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">RAZORPAY ORDER ID</span>
                <span className="text-white font-mono font-bold tracking-tight text-[10px] select-all">{activeOrder.razorpay_order_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">RAZORPAY PAYMENT ID</span>
                <span className="text-white font-mono font-bold tracking-tight text-[10px] select-all">{activeOrder.razorpay_payment_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">ORDER TIMESTAMP</span>
                <span className="text-zinc-400 font-mono text-[10px]">{new Date(activeOrder.created_at).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="studio-button w-full bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2.5 text-xs font-sans"
            >
              CLOSE RECEIPT DRAWER
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED USER PROFILE MODAL DRAWER                       */}
      {/* ======================================================== */}
      {showUserModal && activeUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn font-sans text-xs">
          <div className="bg-[#121212] border-4 border-black p-6 w-full max-w-lg relative text-left shadow-premium">
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
                    onClick={() => handleUnbanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-studio-neon text-black border-2 border-black font-bold uppercase hover:bg-studio-neon/80 py-2 text-xs cursor-pointer font-sans"
                  >
                    ACTIVATE & UNBAN
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanUser(activeUser.id, activeUser.email)}
                    className="flex-1 studio-button bg-studio-red text-white border-2 border-black font-bold uppercase hover:bg-studio-red/80 py-2 text-xs cursor-pointer font-sans"
                  >
                    BAN ACCOUNT
                  </button>
                )}

                <button
                  onClick={() => handleDeleteUser(activeUser.id, activeUser.email)}
                  className="flex-1 studio-button bg-studio-red text-white border-2 border-black font-bold uppercase hover:bg-studio-red-hover py-2 text-xs cursor-pointer font-sans"
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

      {/* ======================================================== */}
      {/* CUSTOM COMIC-BRUTALIST SYSTEM CONFIRMATION DIALOG MODAL  */}
      {/* ======================================================== */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/92 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121212] border-4 border-black p-6 w-full max-w-md relative text-left shadow-premium">
            {/* Header Banner */}
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-4">
              <div className={`w-10 h-10 rounded-none border-2 border-black flex items-center justify-center flex-shrink-0 ${
                confirmDialog.isDanger ? 'bg-studio-red text-white' : 'bg-studio-yellow text-black'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-sans font-bold text-sm uppercase tracking-wide leading-none ${
                  confirmDialog.isDanger ? 'text-studio-red' : 'text-studio-yellow'
                }`}>
                  {confirmDialog.title}
                </h4>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold block mt-1.5">
                  SYSTEM SECURITY SAFEGUARD
                </span>
              </div>
            </div>

            {/* Description Text */}
            <div className="text-zinc-200 font-sans text-xs leading-relaxed mb-6 font-medium normal-case">
              {confirmDialog.message}
            </div>

            {/* Actions Grid */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="flex-1 studio-button bg-zinc-800 text-white border-2 border-black font-bold uppercase hover:bg-zinc-700 py-2.5 text-xs cursor-pointer font-sans"
              >
                CANCEL / BACK
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 studio-button font-bold uppercase py-2.5 text-xs cursor-pointer font-sans ${
                  confirmDialog.isDanger 
                    ? 'bg-studio-red text-white hover:bg-studio-red/80' 
                    : 'bg-studio-neon text-black hover:bg-studio-neon-hover'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
