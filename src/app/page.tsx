'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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
  toggleLaunchOffer,
  getFlashSaleStatus,
  toggleFlashSale,
  getMaintenanceStatus,
  toggleMaintenanceMode,
  revalidateAdminTag
} from './actions'
import { getAnalyticsData } from './actions/analytics'

import {
  LayoutDashboard,
  Library,
  Ticket,
  X,
  Search,
  Users,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  LogOut,
  Lock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Coins,
  Activity,
  Terminal,
  Menu
} from 'lucide-react'

// Modular Components
import { LoginScreen } from '@/components/admin/LoginScreen'
import { Sidebar } from '@/components/admin/Sidebar'
import { Toast } from '@/components/admin/Toast'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { MobileHeader, DesktopHeader } from '@/components/admin/HeaderBars'
import { CommandPalette } from '@/components/admin/CommandPalette'
import { SettingsTab } from '@/components/admin/SettingsTab'
import { LogsTab } from '@/components/admin/LogsTab'
import { AnalyticsTab } from '@/components/admin/AnalyticsTab'
import { DateFilterPanel } from '@/components/admin/DateFilterPanel'
import { PacksTab } from '@/components/admin/PacksTab'
import { KycTab } from '@/components/admin/KycTab'
import { CouponsTab } from '@/components/admin/CouponsTab'
import { TicketsTab } from '@/components/admin/TicketsTab'
import { UsersTab } from '@/components/admin/UsersTab'
import { SalesTab } from '@/components/admin/SalesTab'
import { NewsletterTab } from '@/components/admin/NewsletterTab'
import { clientCache } from '@/lib/clientCache'
import { StoreCache } from '@/lib/storeCache'


interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function AdminDashboard() {
  // Authentication & Authorization States
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'packs' | 'kyc' | 'coupons' | 'tickets' | 'users' | 'sales' | 'logs' | 'newsletter' | 'settings'>('analytics')

  // Global settings toggles states
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenancePending, setMaintenancePending] = useState(false)
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [bannerPending, setBannerPending] = useState(false)
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(false)
  const [flashSalePending, setFlashSalePending] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Universal Command Palette Redirect Target Selection State
  const [paletteSelection, setPaletteSelection] = useState<{ type: string; data: any } | null>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [activeTab])

  // Client-side Caching Manager using localStorage for instant page loads and SWR revalidation
  const verifiedAdminIdRef = useRef<string | null>(null)
  const CACHE_DURATION_MS = 60 * 1000 // 60 seconds threshold for background revalidation


  // Collapsible Sidebar State (Persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)

  // Dark / White Theme Mode State (Persisted in localStorage)
  const [themeMode, setThemeMode] = useState<'dark' | 'white'>('dark')

  // Restore collapsed & themeMode state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('admin_sidebar_collapsed')
      if (savedCollapsed === 'true') {
        setSidebarCollapsed(true)
      }
      const savedTheme = localStorage.getItem('admin_theme_mode') as 'dark' | 'white'
      if (savedTheme === 'white' || savedTheme === 'dark') {
        setThemeMode(savedTheme)
        document.documentElement.setAttribute('data-theme', savedTheme)
      }
    }
  }, [])

  const handleSetSidebarCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setSidebarCollapsed(prev => {
      const nextVal = typeof val === 'function' ? val(prev) : val
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_sidebar_collapsed', String(nextVal))
      }
      return nextVal
    })
  }

  const handleToggleThemeMode = () => {
    const nextMode = themeMode === 'dark' ? 'white' : 'dark'
    setThemeMode(nextMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_theme_mode', nextMode)
      document.documentElement.setAttribute('data-theme', nextMode)
    }
    showToast(`Switched to ${nextMode === 'white' ? 'White' : 'Dark'} Mode`, 'success')
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
      const amt = s.converted_amount_inr !== undefined ? Number(s.converted_amount_inr) : Number(s.amount || 0)
      revenue += amt
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

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)
        
        gain.gain.setValueAtTime(0.001, start)
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(start)
        osc.stop(start + duration)
      }

      const now = ctx.currentTime
      playNote(587.33, now, 0.3) // D5
      playNote(880.00, now + 0.1, 0.4) // A5
    } catch (e) {
      console.error('Failed to play synthesized chime sound:', e)
    }
  }

  // Hook up Supabase Realtime live subscriptions for live operations alerts
  useEffect(() => {
    if (!isAdmin || !session?.user) return

    const vaultChannel = supabase
      .channel('realtime-vault-sales')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_vault' },
        async (payload) => {
          playNotificationSound()
          clientCache.remove('analytics')
          clientCache.remove('sales')
          await revalidateAdminTag('admin-sales').catch(() => null)
          await revalidateAdminTag('admin-stats').catch(() => null)
          const statsData = await getDashboardStats()
          setStats(statsData)
          showToast(`🚨 REALTIME ORDER: A user vaulted a pack for ₹${payload.new.amount || 'N/A'}!`, 'success')
          addAuditLog('REALTIME_SALE', `Real-time Order: Vault purchase of ₹${payload.new.amount || 'N/A'} by user ID ${payload.new.user_id?.slice(0,8)}`, 'success')
        }
      )
      .subscribe()

    const userChannel = supabase
      .channel('realtime-user-signups')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_accounts' },
        async (payload) => {
          playNotificationSound()
          clientCache.remove('analytics')
          clientCache.remove('users')
          await revalidateAdminTag('admin-users').catch(() => null)
          await revalidateAdminTag('admin-stats').catch(() => null)
          const statsData = await getDashboardStats()
          setStats(statsData)
          showToast(`👥 REALTIME USER: New user "${payload.new.full_name || 'Anonymous'}" registered!`, 'success')
          addAuditLog('REALTIME_SIGNUP', `Real-time Registration: ${payload.new.full_name || 'Anonymous'} joined platform`, 'info')
        }
      )
      .subscribe()

    const ticketChannel = supabase
      .channel('realtime-support-tickets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        async (payload) => {
          playNotificationSound()
          clientCache.remove('analytics')
          clientCache.remove('tickets')
          await revalidateAdminTag('admin-tickets').catch(() => null)
          await revalidateAdminTag('admin-stats').catch(() => null)
          const statsData = await getDashboardStats()
          setStats(statsData)
          showToast(`🎫 REALTIME TICKET: "${payload.new.subject || 'Inquiry'}" has been submitted!`, 'warning')
          addAuditLog('REALTIME_TICKET', `Real-time Ticket: "${payload.new.subject || 'Inquiry'}" submitted`, 'warning')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(vaultChannel)
      supabase.removeChannel(userChannel)
      supabase.removeChannel(ticketChannel)
    }
  }, [isAdmin, session])

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

  const handleLogin = async (emailInput: string, passwordInput: string) => {
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

      const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput })
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
        if (data.usersList) setUsersList(data.usersList)
        if (data.ticketsList) setTickets(data.ticketsList)
        if (data.packsList) setPacks(data.packsList)
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
      if (data && typeof data === 'object') {
        setBannerEnabled(data.launchOffer !== false)
        setFlashSaleEnabled(data.flashSale === true)
      } else {
        setBannerEnabled(data !== false)
        setFlashSaleEnabled(false)
      }
    }
  }

  // --- FETCH CONTEXT DATA WITH PRODUCERTOY DUAL-LAYER STORECACHE (0ms CLICK & LOAD) ---
  const loadTabContext = async (tab: typeof activeTab, forceBypassCache = false) => {
    // 1. Check in-memory 0ms StoreCache first for instantaneous click-and-load
    const memoryCached = StoreCache.get(tab)
    if (memoryCached && !forceBypassCache) {
      applyCachedData(tab, memoryCached)
      return
    }

    // 2. Check localStorage envelope cache
    const cachedEntry = clientCache.get(tab)
    const now = Date.now()

    const shouldBypassCache = forceBypassCache

    // SWR Pattern: Instantly render cached data while validating in the background
    if (cachedEntry && !shouldBypassCache) {
      applyCachedData(tab, cachedEntry.data)
      StoreCache.set(tab, cachedEntry.data)

      // If the cache is fresh (< 60s), do not fetch again
      if (now - cachedEntry.timestamp < CACHE_DURATION_MS) {
        return
      }
    }

    if (!cachedEntry || shouldBypassCache) {
      setDataLoading(true)
    }

    if (shouldBypassCache) {
      try {
        const tabToTagMap: Record<string, string> = {
          analytics: 'admin-stats',
          packs: 'admin-packs',
          samples: 'admin-samples',
          kyc: 'admin-kyc',
          coupons: 'admin-coupons',
          tickets: 'admin-tickets',
          users: 'admin-users',
          sales: 'admin-sales',
          newsletter: 'admin-newsletter',
          settings: 'admin-settings'
        }
        await revalidateAdminTag(tabToTagMap[tab] || 'all')
      } catch (e) {
        console.warn('Failed to revalidate server cache tag on bypass:', e)
      }
    }

    try {
      let freshData: any = null
      if (tab === 'analytics') {
        const payload = await getAnalyticsData()
        if (payload.stats) setStats(payload.stats)
        setVaultSalesList(payload.salesList || [])
        setUsersList(payload.usersList || [])
        setTickets(payload.ticketsList || [])
        setPacks(payload.packsList || [])
        if (payload.categoriesList && payload.categoriesList.length > 0) {
          setCategories(payload.categoriesList)
        }
        freshData = payload
      } else if (tab === 'packs') {
        const result = await getSamplePacks()
        freshData = result
        setPacks(result.packs)
        setCategories(result.categories)

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
        const [maintenance, launchOffer, flashSale] = await Promise.all([
          getMaintenanceStatus(),
          getLaunchOfferStatus(),
          getFlashSaleStatus()
        ])
        freshData = { maintenance, launchOffer, flashSale }
        setMaintenanceEnabled(maintenance)
        setBannerEnabled(launchOffer)
        setFlashSaleEnabled(flashSale)
      }

      if (freshData !== null && freshData !== undefined) {
        StoreCache.set(tab, freshData)
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

  const invalidateCacheAndReload = async (tab: typeof activeTab) => {
    StoreCache.remove(tab)
    clientCache.remove(tab)
    await loadTabContext(tab, true)
  }

  const handleReload = async () => {
    await invalidateCacheAndReload(activeTab)
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

  const handleToggleMaintenance = async () => {
    setMaintenancePending(true)
    const newValue = !maintenanceEnabled
    try {
      const result = await toggleMaintenanceMode(newValue)
      if (result.success) {
        setMaintenanceEnabled(newValue)
        showToast(
          newValue
            ? 'Maintenance mode is now ACTIVE! Visitors will be redirected to /maintenance'
            : 'Maintenance mode is now OFF! Storefront is live and public.',
          newValue ? 'warning' : 'success'
        )
        addAuditLog(
          newValue ? 'MAINTENANCE_ACTIVE' : 'MAINTENANCE_OFF',
          `${newValue ? 'Activated' : 'Deactivated'} maintenance mode redirection to /maintenance`,
          newValue ? 'warning' : 'info'
        )
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle maintenance mode', 'error')
    } finally {
      setMaintenancePending(false)
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

  const handleToggleFlashSale = async () => {
    setFlashSalePending(true)
    const newValue = !flashSaleEnabled
    try {
      const result = await toggleFlashSale(newValue)
      if (result.success) {
        setFlashSaleEnabled(newValue)
        showToast(`Flash sale promo box successfully ${newValue ? 'activated' : 'deactivated'}!`, 'success')
        addAuditLog(newValue ? 'FLASH_SALE_ACTIVE' : 'FLASH_SALE_HIDE', `${newValue ? 'Activated' : 'Deactivated'} the flash sale promotion box`, 'info')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle flash sale', 'error')
    } finally {
      setFlashSalePending(false)
    }
  }

  if (checkingAdmin) {
    return null
  }

  // Non-Logged In or Unauthorized Screen
  if (!session || !isAdmin) {
    return (
      <LoginScreen
        session={session}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        loginLoading={loginLoading}
        showToast={showToast}
        onTurnstileToken={setTurnstileToken}
      />
    )
  }

  // --- CORE AUTHORIZED ADMIN INTERFACE ---
  return (
    <div
      data-theme={themeMode}
      className="h-screen flex flex-col md:flex-row bg-[#121212] text-white overflow-hidden transition-colors duration-200"
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
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION BAR (SEAMLESS & COLLAPSIBLE) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={handleSetSidebarCollapsed}
        user={user}
        onLogout={handleLogout}
        showToast={showToast}
      />

      {/* MAIN VIEWPORT BODY (SEAMLESS CONTINUATION OF WORKSPACE) */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#121212]">
        {/* MOBILE HEADER BAR */}
        <MobileHeader
          activeTab={activeTab}
          dataLoading={dataLoading}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onPaletteOpen={() => setShowPalette(true)}
          onReload={handleReload}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
        />

        {/* SUB HEADER ROW (DESKTOP) */}
        <DesktopHeader
          activeTab={activeTab}
          dataLoading={dataLoading}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onPaletteOpen={() => setShowPalette(true)}
          onReload={handleReload}
          isCollapsed={sidebarCollapsed}
          onToggleSidebar={() => handleSetSidebarCollapsed(p => !p)}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
        />

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-6 space-y-4 sm:space-y-6">

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
              vaultSalesList={vaultSalesList}
              usersList={usersList}
              tickets={tickets}
              packs={packs}
              coupons={coupons}
              setActiveTab={setActiveTab}
              themeMode={themeMode}
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



          {/* TAB 7: USERS HUB & BAN SYSTEM */}
          {activeTab === 'users' && (
            <UsersTab
              usersList={usersList}
              vaultSalesList={vaultSalesList}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 8: VAULT SALES AUDIT & REVENUE */}
          {activeTab === 'sales' && (
            <SalesTab
              vaultSalesList={vaultSalesList}
              isDateWithinRange={isDateWithinRange}
              paletteSelection={paletteSelection}
              setPaletteSelection={setPaletteSelection}
            />
          )}

          {/* TAB 9: SYSTEM AUDIT TRAILS LOG */}
          {activeTab === 'logs' && (
            <LogsTab
              isDateWithinRange={isDateWithinRange}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              session={session}
              showToast={showToast}
            />
          )}

          {/* TAB 10: NEWSLETTER INTEGRATION PANEL */}
          {activeTab === 'newsletter' && (
            <NewsletterTab
              subscribersList={subscribersList}
              invalidateCacheAndReload={invalidateCacheAndReload}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
            />
          )}

          {/* TAB 3: PLATFORM & SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsTab
              maintenanceEnabled={maintenanceEnabled}
              maintenancePending={maintenancePending}
              handleToggleMaintenance={handleToggleMaintenance}
              user={user}
              showToast={showToast}
              addAuditLog={addAuditLog}
              askConfirmation={askConfirmation}
            />
          )}

        </div>
      </main>

      {/* MOBILE BOTTOM QUICK NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 z-30 flex items-center justify-around px-2 py-2 safe-bottom">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-white font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-4.5 h-4.5 ${activeTab === 'analytics' ? 'text-white' : ''}`} />
            {activeTab === 'analytics' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('packs')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'packs'
              ? 'text-white font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Library className={`w-4.5 h-4.5 ${activeTab === 'packs' ? 'text-white' : ''}`} />
            {activeTab === 'packs' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Packs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'text-white font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Coins className={`w-4.5 h-4.5 ${activeTab === 'sales' ? 'text-white' : ''}`} />
            {activeTab === 'sales' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'text-white font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-4.5 h-4.5 ${activeTab === 'tickets' ? 'text-white' : ''}`} />
            {activeTab === 'tickets' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Support</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* UNIVERSAL COMMAND PALETTE & ENTITY SEARCH OVERLAY */}
      <CommandPalette
        showPalette={showPalette}
        setShowPalette={setShowPalette}
        paletteSearch={paletteSearch}
        setPaletteSearch={setPaletteSearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleReload={handleReload}
        showToast={showToast}
        setPaletteSelection={setPaletteSelection}
        usersList={usersList}
        packs={packs}
        vaultSalesList={vaultSalesList}
        tickets={tickets}
        coupons={coupons}
      />

      {/* CONFIRMATION DIALOG MODAL */}
      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />

    </div>
  )
}
