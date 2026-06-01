'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Turnstile } from '@marsidev/react-turnstile'
import {
  checkIsAdmin,
  getDashboardStats,
  getSamplePacks,
  getSamples,
  getArtistsKYC,
  getArtistPayouts,
  getCoupons,
  getSupportTickets,
  getRankedPacks,
  verifyTurnstile,
  getAllUsers,
  getAllVaultSales,
  getBrevoSubscribers,
  getLaunchOfferStatus,
  toggleLaunchOffer
} from './actions'

import {
  LayoutDashboard,
  Music,
  Library,
  CreditCard,
  Ticket,
  BadgeAlert,
  Plus,
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
  Coins,
  Activity,
  Terminal,
  Menu
} from 'lucide-react'

// Modular Components
import { SettingsTab } from '@/components/admin/SettingsTab'
import { LogsTab } from '@/components/admin/LogsTab'
import { RankingsTab } from '@/components/admin/RankingsTab'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import { DateFilterPanel } from '@/components/admin/DateFilterPanel'
import { PacksTab } from '@/components/admin/PacksTab'
import { SamplesTab } from '@/components/admin/SamplesTab'
import { KycTab } from '@/components/admin/KycTab'
import { CouponsTab } from '@/components/admin/CouponsTab'
import { TicketsTab } from '@/components/admin/TicketsTab'
import { UsersTab } from '@/components/admin/UsersTab'
import { SalesTab } from '@/components/admin/SalesTab'
import { NewsletterTab } from '@/components/admin/NewsletterTab'
import { clientCache } from '@/lib/clientCache'


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
  const [activeTab, setActiveTab] = useState<'analytics' | 'packs' | 'samples' | 'kyc' | 'coupons' | 'tickets' | 'rankings' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'>('analytics')

  // Global settings toggles states
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [bannerPending, setBannerPending] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Universal Command Palette Redirect Target Selection State
  const [paletteSelection, setPaletteSelection] = useState<{ type: string; data: any } | null>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeTab])

  // Client-side Caching Manager using localStorage for instant page loads and SWR revalidation
  const verifiedAdminIdRef = useRef<string | null>(null)
  const CACHE_DURATION_MS = 60 * 1000 // 60 seconds threshold for background revalidation


  // Accent Switcher
  const [accent, setAccent] = useState<'pink' | 'blue' | 'neon' | 'orange' | 'yellow' | 'purple'>('pink')

  const accentDetails = {
    pink: { label: 'Neon Pink', hex: '#FF0080', borderClass: 'shadow-[6px_6px_0px_#FF0080]' },
    blue: { label: 'Electric Blue', hex: '#00BFFF', borderClass: 'shadow-[6px_6px_0px_#00BFFF]' },
    neon: { label: 'Cyber Green', hex: '#00FF94', borderClass: 'shadow-[6px_6px_0px_#00FF94]' },
    orange: { label: 'Volcanic Orange', hex: '#FF5C00', borderClass: 'shadow-[6px_6px_0px_#FF5C00]' },
    yellow: { label: 'Tokyo Yellow', hex: '#FFE600', borderClass: 'shadow-[6px_6px_0px_#FFE600]' },
    purple: { label: 'Neon Purple', hex: '#BF00FF', borderClass: 'shadow-[6px_6px_0px_#BF00FF]' },
  }

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string
    timestamp: string
    action: string
    type: 'danger' | 'warning' | 'success' | 'info'
    target: string
    admin: string
  }>>([])

  const [showPalette, setShowPalette] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')

  // Notification Toast State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })

  // Detailed Date-Time Filter States
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterStartTime, setFilterStartTime] = useState<string>('00:00')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [filterEndTime, setFilterEndTime] = useState<string>('23:59')
  const [showDateFilter, setShowDateFilter] = useState<boolean>(true)

  const isDateWithinRange = (dateInput: any) => {
    if (!dateInput) return true
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return true

    if (filterStartDate) {
      const startLimit = new Date(`${filterStartDate}T${filterStartTime || '00:00'}`)
      if (d < startLimit) return false
    }
    if (filterEndDate) {
      const endLimit = new Date(`${filterEndDate}T${filterEndTime || '23:59'}`)
      if (d > endLimit) return false
    }
    return true
  }

  const setQuickRange = (range: 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month') => {
    const today = new Date()
    const getISODateStr = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${date}`
    }

    if (range === 'all') {
      setFilterStartDate('')
      setFilterStartTime('00:00')
      setFilterEndDate('')
      setFilterEndTime('23:59')
    } else if (range === 'today') {
      const dateStr = getISODateStr(today)
      setFilterStartDate(dateStr)
      setFilterStartTime('00:00')
      setFilterEndDate(dateStr)
      setFilterEndTime('23:59')
    } else if (range === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const dateStr = getISODateStr(yesterday)
      setFilterStartDate(dateStr)
      setFilterStartTime('00:00')
      setFilterEndDate(dateStr)
      setFilterEndTime('23:59')
    } else if (range === '7days') {
      const past = new Date()
      past.setDate(today.getDate() - 7)
      setFilterStartDate(getISODateStr(past))
      setFilterStartTime('00:00')
      setFilterEndDate(getISODateStr(today))
      setFilterEndTime('23:59')
    } else if (range === '30days') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      setFilterStartDate(getISODateStr(past))
      setFilterStartTime('00:00')
      setFilterEndDate(getISODateStr(today))
      setFilterEndTime('23:59')
    } else if (range === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setFilterStartDate(getISODateStr(startOfMonth))
      setFilterStartTime('00:00')
      setFilterEndDate(getISODateStr(today))
      setFilterEndTime('23:59')
    }
    showToast(`Range set to: ${range.toUpperCase()}`, 'success')
  }

  const getFilteredMetrics = () => {
    let revenue = 0
    let count = 0
    let uniqueBuyers = new Set<string>()

    const filtered = vaultSalesList.filter(s => isDateWithinRange(s.created_at))
    count = filtered.length
    filtered.forEach(s => {
      revenue += Number(s.amount || 0)
      if (s.buyer_email) {
        uniqueBuyers.add(s.buyer_email)
      }
    })

    const aov = count > 0 ? Math.round(revenue / count) : 0
    return {
      revenue,
      count,
      uniqueBuyersCount: uniqueBuyers.size,
      aov
    }
  }

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
  const [subscribersList, setSubscribersList] = useState<any[]>([])

  // Loadings
  const [dataLoading, setDataLoading] = useState(false)

  // Search & Filter States (Shared by SWR triggers)
  const [packFilter, setPackFilter] = useState('all')
  const [sampleSearch, setSampleSearch] = useState('')
  const [debouncedSampleSearch, setDebouncedSampleSearch] = useState('')

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<any>({
    show: false,
    title: '',
    message: '',
    confirmText: 'CONFIRM',
    isDanger: false,
    onConfirm: () => { },
    onCancel: () => { },
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

  // Load / Save Audit Logs in current local session
  useEffect(() => {
    const saved = localStorage.getItem('sw_audit_logs')
    if (saved) {
      try {
        setAuditLogs(JSON.parse(saved))
      } catch (e) {
        // Fallback
      }
    } else {
      const initialLogs = [
        {
          id: 'log-initial',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toLocaleString(),
          action: 'SYSTEM_START',
          type: 'success' as const,
          target: 'Admin Panel Opened & Started.',
          admin: 'System'
        },
        {
          id: 'log-sso',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleString(),
          action: 'SECURITY_OK',
          type: 'info' as const,
          target: 'Google Login & Security Checks are active.',
          admin: 'Security'
        }
      ]
      setAuditLogs(initialLogs)
      localStorage.setItem('sw_audit_logs', JSON.stringify(initialLogs))
    }
  }, [])

  const addAuditLog = (action: string, target: string, type: 'danger' | 'warning' | 'success' | 'info' = 'info') => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action,
      type,
      target,
      admin: session?.user?.email || user?.email || 'Admin'
    }
    setAuditLogs(prev => {
      const updated = [newLog, ...prev]
      localStorage.setItem('sw_audit_logs', JSON.stringify(updated))
      return updated
    })
  }

  // Listen for Ctrl+K / Cmd+K Command Palette Trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // --- INITIAL SECURITY CHECKS & SESSION MANAGEMENTS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUser(session.user)
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
        verifiedAdminIdRef.current = null // Reset on logout
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const verifyAdmin = async (uid: string) => {
    if (verifiedAdminIdRef.current === uid) {
      return
    }

    // Client-side cache check to prevent redundant checkIsAdmin Supabase DB hits on every mount
    const cachedAdminVerification = clientCache.get('admin_verified_' + uid)
    if (cachedAdminVerification === true) {
      setIsAdmin(true)
      setCheckingAdmin(false)
      verifiedAdminIdRef.current = uid
      loadTabContext(activeTab)
      return
    }

    setCheckingAdmin(true)
    const verified = await checkIsAdmin(uid)
    setIsAdmin(verified)
    setCheckingAdmin(false)
    if (verified) {
      verifiedAdminIdRef.current = uid // Mark as verified
      clientCache.set('admin_verified_' + uid, true, 1000 * 60 * 30) // Cache verification for 30 minutes
      showToast('Admin access verified successfully!', 'success')
      loadTabContext(activeTab)
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
    if (user?.id) {
      clientCache.remove('admin_verified_' + user.id)
    }
    clientCache.clearAll() // Clear all cached dashboard tabs data on logout
    await supabase.auth.signOut()
    showToast('Logged out successfully', 'success')
  }

  // Helper to apply cached data to specific tab state
  const applyCachedData = (tab: string, data: any) => {
    if (tab === 'analytics') {
      if (data && typeof data === 'object' && 'stats' in data) {
        setStats(data.stats)
        setVaultSalesList(data.salesList || [])
      } else {
        setStats(data)
      }
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
    } else if (tab === 'newsletter') {
      setSubscribersList(data)
    } else if (tab === 'settings') {
      setBannerEnabled(data)
    }
  }

  // --- FETCH CONTEXT DATA WITH ADVANCED SWR CACHING ---
  const loadTabContext = async (tab: typeof activeTab, forceBypassCache = false) => {
    const cachedEntry = clientCache.get(tab)
    const now = Date.now()

    const isSearchingOrFilteringSamples = tab === 'samples' && (packFilter !== 'all' || debouncedSampleSearch !== '')
    const shouldBypassCache = forceBypassCache || isSearchingOrFilteringSamples

    // SWR Pattern: Instantly render cached data while validating in the background
    if (cachedEntry && !shouldBypassCache) {
      applyCachedData(tab, cachedEntry.data)

      // If the cache is fresh (< 60s), do not fetch again
      if (now - cachedEntry.timestamp < CACHE_DURATION_MS) {
        return
      }
    }

    if (!cachedEntry || shouldBypassCache) {
      setDataLoading(true)
    }

    try {
      let freshData: any = null
      if (tab === 'analytics') {
        const statsData = await getDashboardStats()
        setStats(statsData)
        let salesData: any[] = []
        try {
          salesData = await getAllVaultSales()
          setVaultSalesList(salesData)
        } catch (e) {
          console.error("Failed to load detailed sales list for period analytics", e)
        }
        freshData = { stats: statsData, salesList: salesData }
      } else if (tab === 'packs') {
        const result = await getSamplePacks()
        freshData = result
        setPacks(result.packs)
        setCategories(result.categories)
      } else if (tab === 'samples') {
        if (packs.length === 0) {
          const result = await getSamplePacks()
          setPacks(result.packs)
          setCategories(result.categories)
        }
        freshData = await getSamples(packFilter, debouncedSampleSearch)
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
      } else if (tab === 'newsletter') {
        freshData = await getBrevoSubscribers()
        setSubscribersList(freshData)
      } else if (tab === 'settings') {
        freshData = await getLaunchOfferStatus()
        setBannerEnabled(freshData)
      }

      if (freshData !== null && freshData !== undefined) {
        clientCache.set(tab, {
          data: freshData,
          timestamp: Date.now()
        })
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch data', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  const invalidateCacheAndReload = (tab: typeof activeTab) => {
    clientCache.remove(tab)
    loadTabContext(tab, true)
  }

  const handleReload = () => {
    invalidateCacheAndReload(activeTab)
  }

  // Debounce the samples search to prevent redundant database hits on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSampleSearch(sampleSearch)
    }, 400)
    return () => clearTimeout(timer)
  }, [sampleSearch])

  // Trigger reloading on filter, tab or debounced search term change
  useEffect(() => {
    if (isAdmin) {
      loadTabContext(activeTab)
    }
  }, [activeTab, packFilter, debouncedSampleSearch])

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

  const handleToggleLaunchOffer = async () => {
    setBannerPending(true)
    const newValue = !bannerEnabled
    try {
      const result = await toggleLaunchOffer(newValue)
      if (result.success) {
        setBannerEnabled(newValue)
        showToast(`Launch offer banner successfully ${newValue ? 'activated' : 'deactivated'}!`, 'success')
        addAuditLog(newValue ? 'BANNER_ACTIVE' : 'BANNER_HIDE', `${newValue ? 'Activated' : 'Deactivated'} the launch offer announcement banner`, 'info')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle banner', 'error')
    } finally {
      setBannerPending(false)
    }
  }

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

              <div className="text-center mb-8 mt-4 flex flex-col items-center justify-center">
                <img 
                  src="/icon.png?v=5" 
                  alt="SamplesWala Logo" 
                  className="w-16 h-16 object-contain border-4 border-black bg-black/50 p-2 mb-3 shadow-[0_0_12px_rgba(0,255,148,0.2)] rounded-lg animate-pulse"
                />
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
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
    <div
      className="h-screen flex flex-col md:flex-row bg-[#0c0c0c] text-white overflow-hidden"
      style={{
        ['--color-studio-pink' as any]: accentDetails[accent].hex,
      }}
    >
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

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION BAR */}
      <aside className={`fixed inset-y-0 left-0 w-72 md:w-64 bg-[#121212] border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:flex flex-shrink-0`}>
        <div className="p-6 border-b border-zinc-800 bg-[#0d0d0d] flex flex-row items-center justify-between md:flex-col md:items-center">
          <img 
            src="/icon.png?v=5" 
            alt="SamplesWala Logo" 
            className="w-16 h-16 md:w-28 md:h-28 object-contain"
          />

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENU TABS GRID */}
        <nav className="flex-1 p-4 space-y-1.5 font-sans text-xs font-bold uppercase overflow-y-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'analytics'
                ? 'bg-studio-pink text-white border-studio-pink/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>📈 Overview & Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('packs')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'packs'
                ? 'bg-studio-yellow text-black border-studio-yellow/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Library className="w-4 h-4" />
            <span>📦 Manage Audio Packs</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'samples'
                ? 'bg-studio-neon text-black border-studio-neon/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>🎵 Individual Samples</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'kyc'
                ? 'bg-studio-orange text-white border-studio-orange/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>🎨 Artist Verification & KYC</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'coupons'
                ? 'bg-studio-blue text-white border-studio-blue/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>🎟️ Promo Codes & Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'tickets'
                ? 'bg-studio-purple text-white border-studio-purple/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>🎫 Customer Support Help</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'users'
                ? 'bg-studio-pink text-white border-studio-pink/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Registered Users</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'sales'
                ? 'bg-studio-neon text-black border-studio-neon/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>💰 Orders & Sales Receipts</span>
          </button>

          <button
            onClick={() => setActiveTab('newsletter')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'newsletter'
                ? 'bg-[#FF0080] text-white border-[#FF0080]/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>📧 Newsletter Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'rankings'
                ? 'bg-studio-yellow text-black border-studio-yellow/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>🌟 Display Rankings</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'logs'
                ? 'bg-studio-purple text-white border-studio-purple/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>🛠️ Admin Activity Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded transition-all text-left ${
              activeTab === 'settings'
                ? 'bg-[#FF5C00] text-white border-[#FF5C00]/30 shadow-sm'
                : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>⚙️ Global Site Settings</span>
          </button>
        </nav>

        {/* ACCENT SWITCHER WIDGET */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#0d0d0d] font-mono">
          <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mb-2 leading-none">
            🎨 INTERFACE ACCENT
          </span>
          <div className="grid grid-cols-6 gap-1">
            {Object.entries(accentDetails).map(([key, item]) => (
              <button
                key={key}
                onClick={() => {
                  setAccent(key as any)
                  showToast(`Accent set to ${item.label}!`, 'success')
                }}
                style={{ backgroundColor: item.hex }}
                className={`h-4 w-full border border-black hover:scale-110 active:scale-95 transition-all cursor-pointer rounded ${
                  accent === key ? 'ring-1 ring-white scale-105 opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
                title={`Accent: ${item.label}`}
              />
            ))}
          </div>
        </div>

        {/* SIDEBAR FOOTER (USER & LOGOUT) */}
        <div className="p-4 border-t border-zinc-800 bg-[#0d0d0d] space-y-2.5 font-mono">
          <div className="flex items-center gap-3 bg-[#111] p-2 border border-zinc-800 rounded">
            <div className="w-7 h-7 rounded bg-studio-pink text-white flex items-center justify-center font-black uppercase text-xs border border-zinc-700">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase text-zinc-500 leading-none">AUTHORIZED ADMIN</p>
              <p className="text-[10px] font-bold text-white truncate mt-1">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-studio-red/10 border border-studio-red/30 text-studio-red hover:bg-studio-red hover:text-white transition-all text-xs font-black uppercase rounded"
          >
            <LogOut className="w-3 h-3" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* MOBILE HEADER BAR */}
        <header className="flex md:hidden items-center justify-between bg-[#121212] border-b border-zinc-800 px-4 py-3 flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-black tracking-wider uppercase text-zinc-200">
              {activeTab === 'analytics' && '📈 OVERVIEW'}
              {activeTab === 'packs' && '📦 AUDIO PACKS'}
              {activeTab === 'samples' && '🎵 SAMPLES'}
              {activeTab === 'kyc' && '🎨 KYC & PAYOUTS'}
              {activeTab === 'coupons' && '🎟️ COUPONS'}
              {activeTab === 'tickets' && '🎫 TICKETS'}
              {activeTab === 'users' && '👥 USERS'}
              {activeTab === 'sales' && '💰 SALES'}
              {activeTab === 'logs' && '🛠️ LOGS'}
              {activeTab === 'rankings' && '🌟 RANKINGS'}
              {activeTab === 'newsletter' && '📧 NEWSLETTER'}
              {activeTab === 'settings' && '⚙️ SETTINGS'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPalette(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Search / Commands"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleReload}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Reload Data"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* SUB HEADER ROW (DESKTOP) */}
        <header className="hidden md:flex border-b border-zinc-800 bg-[#121212] px-6 py-4 items-center justify-between flex-shrink-0 z-0">
          <div className="flex items-center gap-3">
            <span className="text-xl uppercase font-black tracking-tighter">
              {activeTab === 'analytics' && '📈 Overview & Earnings Statistics'}
              {activeTab === 'packs' && '📦 Manage Audio Sample Packs'}
              {activeTab === 'samples' && '🎵 Individual Audio Track Samples'}
              {activeTab === 'kyc' && '🎨 Artist Verification & KYC Payouts'}
              {activeTab === 'coupons' && '🎟️ Discount Codes & Promo Coupons'}
              {activeTab === 'tickets' && '🎫 Customer Support Help Tickets'}
              {activeTab === 'users' && '👥 Registered User Accounts'}
              {activeTab === 'sales' && '💰 Sales Receipts & Orders Log'}
              {activeTab === 'logs' && '🛠️ Admin Activity Logs'}
              {activeTab === 'rankings' && '🌟 Global Ranking List Engine'}
              {activeTab === 'newsletter' && '📧 Newsletter Hub & Campaign Manager'}
              {activeTab === 'settings' && '⚙️ Global Site Settings & Configuration'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPalette(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 rounded bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-mono text-[10px] cursor-pointer"
              title="Open Command Palette & Entity Search"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">SEARCH / COMMANDS</span>
              <kbd className="bg-black px-1.5 py-0.5 border border-zinc-800 rounded text-[8px] font-black tracking-widest text-zinc-500">Ctrl+K</kbd>
            </button>

            {dataLoading && (
              <div className="flex items-center gap-2 text-[10px] uppercase font-black text-studio-neon">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> LOADING DB DATA...
              </div>
            )}
            <button
              onClick={handleReload}
              className="p-2 border-3 border-black bg-white hover:bg-studio-pink text-black transition-colors cursor-pointer"
              title="Refresh database collections"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-6 space-y-6">

          {['analytics', 'sales', 'logs'].includes(activeTab) && (
            <DateFilterPanel
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterStartTime={filterStartTime}
              setFilterStartTime={setFilterStartTime}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              filterEndTime={filterEndTime}
              setFilterEndTime={setFilterEndTime}
              showDateFilter={showDateFilter}
              setShowDateFilter={setShowDateFilter}
              setQuickRange={setQuickRange}
              showToast={showToast}
            />
          )}

          {/* TAB 1: PERFORMANCE ANALYTICS & STATS */}
          {activeTab === 'analytics' && stats && (
            <AnalyticsTab
              stats={stats}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
              filteredMetrics={getFilteredMetrics()}
            />
          )}

          {/* TAB 2: SAMPLE PACKS INVENTORY CRUD */}
          {activeTab === 'packs' && (
            <PacksTab
              packs={packs}
              categories={categories}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 3: SAMPLES LIBRARY CRUD */}
          {activeTab === 'samples' && (
            <SamplesTab
              packs={packs}
              samples={samples}
              playingSampleId={playingSampleId}
              playSamplePreview={playSamplePreview}
              packFilter={packFilter}
              setPackFilter={setPackFilter}
              sampleSearch={sampleSearch}
              setSampleSearch={setSampleSearch}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
            />
          )}

          {/* TAB 4: ARTIST PORTAL KYCS & PAYOUTS MANAGEMENT */}
          {activeTab === 'kyc' && (
            <KycTab
              artists={artists}
              payouts={payouts}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
            />
          )}

          {/* TAB 5: COUPONS & DISCOUNTS MANAGEMENT */}
          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 6: SUPPORT TICKETS LIST */}
          {activeTab === 'tickets' && (
            <TicketsTab
              tickets={tickets}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 7: RANKING & POPULARITY ENGINE */}
          {activeTab === 'rankings' && (
            <RankingsTab
              rankedPacks={rankedPacks}
              updatePackRankInline={async (pack, rankVal) => {
                const parsedRank = parseInt(rankVal)
                if (isNaN(parsedRank)) {
                  showToast('Please specify a valid rank number', 'error')
                  return
                }
                const { saveSamplePack } = await import('./actions')
                try {
                  await saveSamplePack({ ...pack, display_rank: parsedRank })
                  showToast(`Rank for "${pack.name}" updated to ${parsedRank}!`, 'success')
                  addAuditLog('UPDATE_RANK', `Updated priority rank for pack "${pack.name}" to #${parsedRank}`, 'info')
                  invalidateCacheAndReload('rankings')
                } catch (err: any) {
                  showToast(err.message || 'Failed to update priority rank', 'error')
                }
              }}
            />
          )}

          {/* TAB 8: USERS HUB & BAN SYSTEM */}
          {activeTab === 'users' && (
            <UsersTab
              usersList={usersList}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 9: DETAILED VAULT PURCHASES LOG */}
          {activeTab === 'sales' && (
            <SalesTab
              vaultSalesList={vaultSalesList}
              isDateWithinRange={isDateWithinRange}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 10: SYSTEM AUDIT TRAILS LOG */}
          {activeTab === 'logs' && (
            <LogsTab
              isDateWithinRange={isDateWithinRange}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              session={session}
              showToast={showToast}
            />
          )}

          {/* TAB 11: NEWSLETTER INTEGRATION PANEL */}
          {activeTab === 'newsletter' && (
            <NewsletterTab
              subscribersList={subscribersList}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
            />
          )}

          {/* TAB 12: GLOBAL SITE SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsTab
              bannerEnabled={bannerEnabled}
              bannerPending={bannerPending}
              handleToggleLaunchOffer={handleToggleLaunchOffer}
            />
          )}

        </div>
      </main>

      {/* UNIVERSAL COMMAND PALETTE & ENTITY SEARCH OVERLAY */}
      {showPalette && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-start justify-center p-4 pt-[10vh] animate-fadeIn"
          onClick={() => setShowPalette(false)}
        >
          <div
            className="bg-[#121212] border-4 border-black p-6 w-full max-w-2xl relative text-left shadow-premium"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4 font-mono">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-studio-pink" />
                <div>
                  <h4 className="font-sans font-bold text-sm uppercase tracking-wide leading-none">
                    UNIVERSAL COMMAND CENTER
                  </h4>
                  <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block mt-1.5">
                    Search users, packs, orders, or run terminal slash commands
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPalette(false)}
                className="p-1 bg-black border-2 border-black hover:border-studio-pink text-zinc-400 hover:text-white transition-all cursor-pointer text-[10px] font-bold px-2 py-1"
              >
                ESC
              </button>
            </div>

            {/* Input Box */}
            <div className="relative mb-4">
              <input
                autoFocus
                type="text"
                placeholder="Type / for commands or search anything..."
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
                className="w-full bg-black border-4 border-black p-4 text-white outline-none focus:border-studio-pink font-mono text-sm placeholder-zinc-700 uppercase"
              />
            </div>

            {/* List Results */}
            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 scrollbar">
              {(() => {
                const query = paletteSearch.trim().toLowerCase()

                // 1. SLASH COMMANDS
                if (query.startsWith('/') || query === '') {
                  const allCommands = [
                    { path: '/analytics', label: 'Go to Performance Analytics', action: () => { setActiveTab('analytics'); setShowPalette(false); } },
                    { path: '/packs', label: 'Go to Sample Packs Inventory', action: () => { setActiveTab('packs'); setShowPalette(false); } },
                    { path: '/samples', label: 'Go to Audio Sample Library', action: () => { setActiveTab('samples'); setShowPalette(false); } },
                    { path: '/kyc', label: 'Go to Artist KYCs & Payouts', action: () => { setActiveTab('kyc'); setShowPalette(false); } },
                    { path: '/coupons', label: 'Go to Discount Coupons Register', action: () => { setActiveTab('coupons'); setShowPalette(false); } },
                    { path: '/tickets', label: 'Go to Support Ticket Hub', action: () => { setActiveTab('tickets'); setShowPalette(false); } },
                    { path: '/rankings', label: 'Go to Global Rankings Engine', action: () => { setActiveTab('rankings'); setShowPalette(false); } },
                    { path: '/users', label: 'Go to Users Management Hub', action: () => { setActiveTab('users'); setShowPalette(false); } },
                    { path: '/sales', label: 'Go to Vault Orders Logs', action: () => { setActiveTab('sales'); setShowPalette(false); } },
                    { path: '/logs', label: 'Go to System Audit Trails', action: () => { setActiveTab('logs'); setShowPalette(false); } },
                    { path: '/refresh', label: 'Bypass cache & force reload database', action: () => { handleReload(); setShowPalette(false); showToast('Database revalidated!', 'success'); } },
                  ]

                  const filteredCmds = allCommands.filter(c => c.path.includes(query))

                  if (filteredCmds.length > 0) {
                    return (
                      <div className="space-y-1.5 font-mono">
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
                          📟 SYSTEM SLASH COMMANDS
                        </span>
                        {filteredCmds.map(c => (
                          <div
                            key={c.path}
                            onClick={c.action}
                            className="bg-[#181818] hover:bg-studio-pink/10 border-2 border-black hover:border-studio-pink p-2.5 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <span className="text-studio-pink font-bold">{c.path}</span>
                            <span className="text-zinc-400 text-[10px] uppercase font-bold">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                }

                // 2. LIVE DATABASE COLLECTION SEARCH
                if (query !== '') {
                  const matchedUsers = usersList.filter(u =>
                    (u.full_name || '').toLowerCase().includes(query) ||
                    (u.email || '').toLowerCase().includes(query)
                  ).slice(0, 5)

                  const matchedPacks = packs.filter(p =>
                    (p.name || '').toLowerCase().includes(query) ||
                    (p.slug || '').toLowerCase().includes(query)
                  ).slice(0, 5)

                  const matchedOrders = vaultSalesList.filter(s =>
                    (s.pack_name || '').toLowerCase().includes(query) ||
                    (s.buyer_name || '').toLowerCase().includes(query) ||
                    (s.buyer_email || '').toLowerCase().includes(query)
                  ).slice(0, 5)

                  const matchedTickets = tickets.filter(t =>
                    (t.user_name || '').toLowerCase().includes(query) ||
                    (t.user_email || '').toLowerCase().includes(query) ||
                    (t.subject || '').toLowerCase().includes(query)
                  ).slice(0, 5)

                  const matchedCoupons = coupons.filter(c =>
                    (c.code || '').toLowerCase().includes(query)
                  ).slice(0, 5)

                  const totalMatches = matchedUsers.length + matchedPacks.length + matchedOrders.length + matchedTickets.length + matchedCoupons.length

                  if (totalMatches === 0) {
                    return (
                      <div className="p-8 text-center border-2 border-black bg-black text-zinc-500 font-mono font-bold uppercase text-[10px]">
                        No matching entities found in database.
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {/* Users */}
                      {matchedUsers.length > 0 && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                            👥 USERS ({matchedUsers.length})
                          </span>
                          {matchedUsers.map(u => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setActiveTab('users');
                                setPaletteSelection({ type: 'user', data: u });
                                setShowPalette(false);
                              }}
                              className="bg-[#151515] hover:bg-studio-pink/10 border-2 border-black hover:border-studio-pink p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                            >
                              <div className="font-sans font-bold text-zinc-100 normal-case">{u.full_name}</div>
                              <div className="font-mono text-zinc-500 text-[10px] lowercase">{u.email}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Packs */}
                      {matchedPacks.length > 0 && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                            📦 SAMPLE PACKS ({matchedPacks.length})
                          </span>
                          {matchedPacks.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setActiveTab('packs');
                                setPaletteSelection({ type: 'pack', data: p });
                                setShowPalette(false);
                              }}
                              className="bg-[#151515] hover:bg-studio-yellow/10 border-2 border-black hover:border-studio-yellow p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                            >
                              <div className="font-sans font-bold text-zinc-100 normal-case">{p.name}</div>
                              <div className="font-mono text-studio-yellow text-[10px]">₹{p.price_inr}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Orders */}
                      {matchedOrders.length > 0 && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                            💰 SALES & ORDERS ({matchedOrders.length})
                          </span>
                          {matchedOrders.map(o => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setActiveTab('sales');
                                setPaletteSelection({ type: 'order', data: o });
                                setShowPalette(false);
                              }}
                              className="bg-[#151515] hover:bg-studio-neon/10 border-2 border-black hover:border-studio-neon p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                            >
                              <div className="font-sans font-bold text-zinc-100 normal-case">{o.pack_name}</div>
                              <div className="font-mono text-studio-neon text-[10px] font-bold">₹{o.amount}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tickets */}
                      {matchedTickets.length > 0 && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                            🎫 SUPPORT TICKETS ({matchedTickets.length})
                          </span>
                          {matchedTickets.map(t => (
                            <div
                              key={t.id}
                              onClick={() => {
                                setActiveTab('tickets');
                                setPaletteSelection({ type: 'ticket', data: t });
                                setShowPalette(false);
                              }}
                              className="bg-[#151515] hover:bg-studio-purple/10 border-2 border-black hover:border-studio-purple p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                            >
                              <div className="font-sans font-bold text-zinc-100 normal-case">{t.subject}</div>
                              <div className="font-mono text-studio-purple text-[10px] uppercase font-bold">{t.status}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Coupons */}
                      {matchedCoupons.length > 0 && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">
                            🎟️ COUPONS ({matchedCoupons.length})
                          </span>
                          {matchedCoupons.map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setActiveTab('coupons');
                                setPaletteSelection({ type: 'coupon', data: c });
                                setShowPalette(false);
                              }}
                              className="bg-[#151515] hover:bg-studio-blue/10 border-2 border-black hover:border-studio-blue p-2 flex items-center justify-between cursor-pointer transition-all text-[11px]"
                            >
                              <div className="font-mono font-bold text-zinc-100">{c.code}</div>
                              <div className="font-mono text-studio-blue text-[10px] font-bold">{c.discount_percent}% OFF</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return null
              })()}
            </div>

            {/* Hint Footer */}
            <div className="border-t border-zinc-900 pt-3 mt-4 text-[9px] text-zinc-600 font-mono flex items-center justify-between leading-none">
              <span>TIP: CHOOSE COMMANDS OR CLICK DIRECTLY</span>
              <span>PRESS ESC TO DISMISS COMMAND MODAL</span>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
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
                  confirmDialog.isDanger ? 'bg-studio-red text-white hover:bg-studio-red/80' : 'bg-studio-neon text-black hover:bg-studio-neon-hover'
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
