'use server'

import { createClient } from '@supabase/supabase-js'
import { getUsdToInrRate, getExchangeRateInfo, convertUsdToInr, isUsdOrder, getOrderGateway, getPaymentMethodLabel } from '@/lib/exchangeRate'
import { unstable_cache } from 'next/cache'
import { safeRevalidateTag, safeRevalidatePath, notifyMainSiteRevalidate } from '@/lib/revalidateHelper'
import fs from 'fs'
import path from 'path'
import type { GlobalSiteSettings, SystemTelemetry } from '@/types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '@/types/siteSettings'

function getLiveEnvVar(key: string): string {
  if (process.env[key]) return process.env[key]!
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const lines = content.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
        const [k, ...rest] = trimmed.split('=')
        if (k.trim() === key) {
          return rest.join('=').trim().replace(/^["']|["']$/g, '')
        }
      }
    }
  } catch {}
  return ''
}

let cachedDb: any = null

// Server-side In-memory cache stores for Vercel/Supabase optimizations
let cachedAuthUsers: any[] | null = null
let cachedAuthUsersTimestamp = 0
const AUTH_USERS_CACHE_TTL = 3 * 60 * 1000 // 3 minutes

let cachedDashboardStats: any = null
let cachedDashboardStatsTimestamp = 0
const DASHBOARD_STATS_CACHE_TTL = 30 * 1000 // 30 seconds

// Cache invalidation helpers
export async function clearServerCache(scope: 'all' | 'users' | 'stats' = 'all') {
  if (scope === 'all' || scope === 'users') {
    cachedAuthUsers = null
    cachedAuthUsersTimestamp = 0
  }
  if (scope === 'all' || scope === 'stats') {
    cachedDashboardStats = null
    cachedDashboardStatsTimestamp = 0
  }
}

/**
 * Revalidate Admin Cache Tags on-demand
 */
export async function revalidateAdminTag(tag?: string) {
  if (!tag || tag === 'all') {
    const allTags = [
      'admin-stats',
      'admin-packs',
      'admin-samples',
      'admin-kyc',
      'admin-coupons',
      'admin-tickets',
      'admin-users',
      'admin-sales',
      'admin-newsletter',
      'admin-settings'
    ]
    allTags.forEach(t => safeRevalidateTag(t))
    safeRevalidatePath('/')
  } else {
    safeRevalidateTag(tag)
  }
  await clearServerCache('all')
  return { success: true, revalidated: tag || 'all', timestamp: Date.now() }
}

async function getAuthUsers(db: any, forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && cachedAuthUsers && (now - cachedAuthUsersTimestamp < AUTH_USERS_CACHE_TTL)) {
    return cachedAuthUsers
  }

  let allUsers: any[] = []
  let page = 1
  const perPage = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage
    })

    if (error) {
      console.error('Error listing auth users in cached utility:', error)
      if (allUsers.length > 0) {
        break // Fallback to what we successfully loaded so far
      }
      throw error
    }

    const users = data?.users || []
    allUsers = [...allUsers, ...users]

    if (users.length < perPage) {
      hasMore = false
    } else {
      page++
    }
  }

  cachedAuthUsers = allUsers
  cachedAuthUsersTimestamp = now
  return allUsers
}


function getDB() {
  if (cachedDb) return cachedDb

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin credentials are not fully configured in environment variables.')
  }

  cachedDb = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  return cachedDb
}

/**
 * Cloudflare Turnstile token verification server action
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!token) return false
  const secretKey = process.env.TURNSTILE_SECRET_KEY!
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    })
    const data = await response.json()
    return data.success === true
  } catch (e) {
    console.error('Turnstile verification error:', e)
    return false
  }
}

/**
 * 1. Admin Verification
 */
export async function getLiveExchangeRate() {
  return await getExchangeRateInfo()
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1)

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Error verifying admin status:', error)
    return false
  }
}

/**
 * 2. Get Dashboard Stats
 */
async function fetchDashboardStats() {
  const now = Date.now()
  if (cachedDashboardStats && (now - cachedDashboardStatsTimestamp < DASHBOARD_STATS_CACHE_TTL)) {
    return cachedDashboardStats
  }

  try {
    const db = getDB()

    const [
      usersCountRes,
      downloadsCountRes,
      openTicketsRes,
      pendingKycRes,
      softwareOrdersRes,
      samplePacksRes,
      wishlistRes,
      vaultSalesRes
    ] = await Promise.all([
      db.from('user_accounts').select('user_id', { count: 'exact', head: true }),
      db.from('secure_download_tokens').select('id', { count: 'exact', head: true }),
      db.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      db.from('artist_payout_settings').select('user_id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      db.from('software_orders').select('amount_paid').in('status', ['complete', 'paid']),
      db.from('sample_packs').select('id, name, is_featured, display_rank'),
      db.from('wishlist').select('id', { count: 'exact', head: true }),
      db.from('user_vault').select('amount, currency, payment_gateway, razorpay_order_id, razorpay_payment_id')
    ])

    const liveRate = await getUsdToInrRate()

    // Calculate revenue converting USD orders to INR accurately
    let totalRevenueINR = 0
    if (softwareOrdersRes.data) {
      softwareOrdersRes.data.forEach((order: any) => {
        totalRevenueINR += Number(order.amount_paid || 0)
      })
    }
    if (vaultSalesRes.data) {
      vaultSalesRes.data.forEach((sale: any) => {
        const rawAmt = Number(sale.amount || 0)
        if (isUsdOrder(sale)) {
          totalRevenueINR += convertUsdToInr(rawAmt, liveRate)
        } else {
          totalRevenueINR += rawAmt
        }
      })
    }

    // Recent orders
    const [recentSoftwares, recentVaultSales] = await Promise.all([
      db.from('software_orders').select('id, user_email, software_name, amount_paid, status, created_at').order('created_at', { ascending: false }).limit(5),
      db.from('user_vault').select('user_id, item_id, amount, currency, payment_gateway, razorpay_order_id, razorpay_payment_id, created_at').order('created_at', { ascending: false }).limit(5)
    ])

    // Enrich recent vault sales with sample pack names and converted INR
    const enrichedVaultSales = (recentVaultSales.data || []).map((sale: any) => {
      const pack = (samplePacksRes.data || []).find((p: any) => p.id === sale.item_id)
      const isUsd = isUsdOrder(sale)
      const gateway = getOrderGateway(sale)
      const rawAmt = Number(sale.amount || 0)
      const convertedAmt = isUsd ? convertUsdToInr(rawAmt, liveRate) : rawAmt
      return {
        ...sale,
        pack_name: pack?.name || 'Sample Pack Purchase',
        is_usd: isUsd,
        currency: isUsd ? 'USD' : 'INR',
        payment_gateway: gateway,
        payment_method: getPaymentMethodLabel(gateway, isUsd),
        original_amount: rawAmt,
        converted_amount_inr: convertedAmt
      }
    })

    const stats = {
      totalUsers: usersCountRes.count || 0,
      totalDownloads: downloadsCountRes.count || 0,
      openTickets: openTicketsRes.count || 0,
      pendingKYCs: pendingKycRes.count || 0,
      totalRevenueINR,
      recentSoftwares: recentSoftwares.data || [],
      recentVaultSales: enrichedVaultSales,
      samplePacksCount: samplePacksRes.data?.length || 0,
      wishlistCount: wishlistRes.count || 0,
      exchangeRate: liveRate
    }

    cachedDashboardStats = stats
    cachedDashboardStatsTimestamp = now
    return stats
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

export async function getDashboardStats() {
  return unstable_cache(
    async () => fetchDashboardStats(),
    ['admin-dashboard-stats-v1'],
    { tags: ['admin-stats'] }
  )()
}

/**
 * 3. Sample Packs CRUD
 */
async function fetchSamplePacks() {
  try {
    const db = getDB()
    const { data: packs, error } = await db
      .from('sample_packs')
      .select('*')
      .order('display_rank', { ascending: true })

    if (error) throw error

    // Fetch categories to bind
    const { data: categories } = await db.from('categories').select('id, name')

    return {
      packs: packs || [],
      categories: categories || []
    }
  } catch (error) {
    console.error('Error getting sample packs:', error)
    throw error
  }
}

export async function getSamplePacks() {
  return unstable_cache(
    async () => fetchSamplePacks(),
    ['admin-sample-packs-v1'],
    { tags: ['admin-packs'] }
  )()
}

export async function saveSamplePack(pack: any) {
  try {
    const db = getDB()
    const { id, ...packData } = pack

    let result
    if (id) {
      // Update
      result = await db
        .from('sample_packs')
        .update(packData)
        .eq('id', id)
        .select()
    } else {
      // Insert
      result = await db
        .from('sample_packs')
        .insert(packData)
        .select()
    }

    if (result.error) throw result.error
    safeRevalidateTag('admin-packs')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'packs' })
    return result.data[0]
  } catch (error) {
    console.error('Error saving sample pack:', error)
    throw error
  }
}

export async function deleteSamplePack(id: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('sample_packs')
      .delete()
      .eq('id', id)

    if (error) throw error
    safeRevalidateTag('admin-packs')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'packs' })
    return true
  } catch (error) {
    console.error('Error deleting sample pack:', error)
    throw error
  }
}

/**
 * 4. Samples CRUD
 */
async function fetchSamples(packId?: string, search?: string) {
  try {
    const db = getDB()
    let query = db.from('samples').select('*, sample_packs(name)')

    if (packId && packId !== 'all') {
      query = query.eq('pack_id', packId)
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting samples:', error)
    throw error
  }
}

export async function getSamples(packId?: string, search?: string) {
  const p = packId || 'all'
  const s = search ? search.trim().toLowerCase() : 'all'
  return unstable_cache(
    async () => fetchSamples(p, s),
    ['admin-samples-list-v1', p, s],
    { tags: ['admin-samples'] }
  )()
}

export async function saveSample(sample: any) {
  try {
    const db = getDB()
    const { id, ...sampleData } = sample

    // Clean tags array if it is passed as a comma string
    if (typeof sampleData.tags === 'string') {
      sampleData.tags = sampleData.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0)
    }

    let result
    if (id) {
      result = await db
        .from('samples')
        .update(sampleData)
        .eq('id', id)
        .select()
    } else {
      result = await db
        .from('samples')
        .insert(sampleData)
        .select()
    }

    if (result.error) throw result.error
    safeRevalidateTag('admin-samples')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'packs' })
    return result.data[0]
  } catch (error) {
    console.error('Error saving sample:', error)
    throw error
  }
}

export async function deleteSample(id: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('samples')
      .delete()
      .eq('id', id)

    if (error) throw error
    safeRevalidateTag('admin-samples')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'packs' })
    return true
  } catch (error) {
    console.error('Error deleting sample:', error)
    throw error
  }
}

/**
 * 5. Artist KYC & Payouts
 */
async function fetchArtistsKYC() {
  try {
    const db = getDB()
    // Fetch kyc settings
    const { data: kycSettings, error } = await db
      .from('artist_payout_settings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch matching profiles selectively
    const userIds = Array.from(new Set((kycSettings || []).map((s: any) => s.user_id).filter(Boolean)))
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profData } = await db
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)
      profiles = profData || []
    }

    const artists = (kycSettings || []).map((setting: any) => {
      const profile = (profiles || []).find((p: any) => p.id === setting.user_id)
      return {
        ...setting,
        full_name: profile?.full_name || setting.legal_name || 'Anonymous Artist',
        avatar_url: profile?.avatar_url || ''
      }
    })

    return artists
  } catch (error) {
    console.error('Error getting artist settings:', error)
    throw error
  }
}

export async function getArtistsKYC() {
  return unstable_cache(
    async () => fetchArtistsKYC(),
    ['admin-artists-kyc-v1'],
    { tags: ['admin-kyc'] }
  )()
}

export async function updateKYCStatus(userId: string, status: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('artist_payout_settings')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) throw error
    safeRevalidateTag('admin-kyc')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    return true
  } catch (error) {
    console.error('Error updating KYC status:', error)
    throw error
  }
}

async function fetchArtistPayouts() {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('artist_payouts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const artistIds = Array.from(new Set((data || []).map((p: any) => p.artist_id).filter(Boolean)))
    let profiles: any[] = []
    if (artistIds.length > 0) {
      const { data: profData } = await db
        .from('profiles')
        .select('id, full_name')
        .in('id', artistIds)
      profiles = profData || []
    }

    const payouts = (data || []).map((payout: any) => {
      const profile = (profiles || []).find((p: any) => p.id === payout.artist_id)
      return {
        ...payout,
        artist_name: profile?.full_name || 'Unknown Artist'
      }
    })

    return payouts
  } catch (error) {
    console.error('Error getting artist payouts:', error)
    throw error
  }
}

export async function getArtistPayouts() {
  return unstable_cache(
    async () => fetchArtistPayouts(),
    ['admin-artist-payouts-v1'],
    { tags: ['admin-kyc'] }
  )()
}

export async function triggerArtistPayout(payout: {
  artist_id: string
  amount: number
  payout_month: string
  notes?: string
  utr_number: string
}) {
  try {
    const db = getDB()
    const { error } = await db
      .from('artist_payouts')
      .insert({
        artist_id: payout.artist_id,
        amount: payout.amount,
        payout_month: payout.payout_month,
        notes: payout.notes || '',
        utr_number: payout.utr_number,
        status: 'paid',
        processed_at: new Date().toISOString()
      })

    if (error) throw error
    safeRevalidateTag('admin-kyc')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    return true
  } catch (error) {
    console.error('Error triggering artist payout:', error)
    throw error
  }
}

/**
 * 6. Coupons CRUD
 */
async function fetchCoupons() {
  try {
    const db = getDB()
    const { data: coupons, error } = await db
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const { data: usages, error: usagesErr } = await db
      .from('coupon_usages')
      .select('coupon_id')

    if (usagesErr) throw usagesErr

    const enriched = (coupons || []).map((coupon: any) => {
      const uses = (usages || []).filter((u: any) => u.coupon_id === coupon.id).length
      return {
        ...coupon,
        uses_count: uses
      }
    })

    return enriched
  } catch (error) {
    console.error('Error getting coupons:', error)
    throw error
  }
}

export async function getCoupons() {
  return unstable_cache(
    async () => fetchCoupons(),
    ['admin-coupons-list-v1'],
    { tags: ['admin-coupons'] }
  )()
}

export async function saveCoupon(coupon: any) {
  try {
    const db = getDB()
    const { id, ...couponData } = coupon

    let result
    if (id) {
      result = await db
        .from('coupons')
        .update(couponData)
        .eq('id', id)
        .select()
    } else {
      result = await db
        .from('coupons')
        .insert(couponData)
        .select()
    }

    if (result.error) throw result.error
    safeRevalidateTag('admin-coupons')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'coupons' })
    return result.data[0]
  } catch (error) {
    console.error('Error saving coupon:', error)
    throw error
  }
}

export async function deleteCoupon(id: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error
    safeRevalidateTag('admin-coupons')
    await clearServerCache('stats')
    notifyMainSiteRevalidate({ tag: 'coupons' })
    return true
  } catch (error) {
    console.error('Error deleting coupon:', error)
    throw error
  }
}

/**
 * 7. Support Tickets Hub
 */
async function fetchSupportTickets() {
  try {
    const db = getDB()
    const { data: tickets, error } = await db
      .from('support_tickets')
      .select('*')
      .order('status', { ascending: true }) // open first
      .order('created_at', { ascending: false })

    if (error) throw error

    const userIds = Array.from(new Set((tickets || []).map((t: any) => t.user_id).filter(Boolean)))
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profData } = await db
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      profiles = profData || []
    }

    const mappedTickets = (tickets || []).map((ticket: any) => {
      const profile = (profiles || []).find((p: any) => p.id === ticket.user_id)
      return {
        ...ticket,
        user_name: profile?.full_name || 'Customer'
      }
    })

    return mappedTickets
  } catch (error) {
    console.error('Error getting support tickets:', error)
    throw error
  }
}

export async function getSupportTickets() {
  return unstable_cache(
    async () => fetchSupportTickets(),
    ['admin-support-tickets-v1'],
    { tags: ['admin-tickets'] }
  )()
}

export async function replyToTicket(ticketId: string, reply: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('support_tickets')
      .update({
        admin_reply: reply,
        status: 'resolved',
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (error) throw error
    safeRevalidateTag('admin-tickets')
    safeRevalidateTag('admin-stats')
    await clearServerCache('stats')
    return true
  } catch (error) {
    console.error('Error replying to support ticket:', error)
    throw error
  }
}

/**
 * 8. Rankings Engine Details
 */
async function fetchRankedPacks() {
  try {
    const db = getDB()

    // Fetch all sample packs
    const { data: packs, error: packErr } = await db.from('sample_packs').select('*')
    if (packErr) throw packErr

    // Fetch wishlist counts
    const { data: wishlists, error: wishErr } = await db.from('wishlist').select('sample_id')
    if (wishErr) throw wishErr

    // Fetch download tokens for these packs
    const { data: downloads, error: downErr } = await db.from('secure_download_tokens').select('item_id, item_type')
    if (downErr) throw downErr

    // Get samples list to count wishlists/downloads per pack
    const { data: samples, error: sampleErr } = await db.from('samples').select('id, pack_id')
    if (sampleErr) throw sampleErr

    // Calculate downloads and wishlists per pack
    const packStats = (packs || []).map((pack: any) => {
      const packSamples = (samples || []).filter((s: any) => s.pack_id === pack.id).map((s: any) => s.id)

      // Downloads of this pack directly OR of samples inside this pack
      const directPackDownloads = (downloads || []).filter((d: any) => d.item_id === pack.id && d.item_type === 'pack').length
      const sampleDownloads = (downloads || []).filter((d: any) => d.item_type === 'sample' && packSamples.includes(d.item_id)).length
      const totalDownloads = directPackDownloads + sampleDownloads

      // Wishlists of samples inside this pack
      const totalWishlists = (wishlists || []).filter((w: any) => packSamples.includes(w.sample_id)).length

      // Compound Score Formula: (Downloads * 2) + (Wishlists * 5) + (Featured ? 50 : 0) + (DisplayRank * 10)
      const popularityScore = (totalDownloads * 2) + (totalWishlists * 5) + (pack.is_featured ? 50 : 0) + (Number(pack.display_rank || 0) * 10)

      return {
        ...pack,
        downloads: totalDownloads,
        wishlists: totalWishlists,
        popularityScore
      }
    })

    // Sort by compound score descending
    packStats.sort((a: any, b: any) => b.popularityScore - a.popularityScore)

    return packStats
  } catch (error) {
    console.error('Error calculating ranked packs:', error)
    throw error
  }
}

export async function getRankedPacks() {
  return unstable_cache(
    async () => fetchRankedPacks(),
    ['admin-ranked-packs-v1'],
    { tags: ['admin-packs'] }
  )()
}

/**
 * 9. Users Management Hub & Detailed Sales
 */
async function fetchAllUsers() {
  try {
    const db = getDB()

    // 1. Fetch auth users using admin API
    const users = await getAuthUsers(db)

    // 2. Fetch public user accounts details
    const { data: userAccounts, error: dbErr } = await db.from('user_accounts').select('*')
    if (dbErr) throw dbErr

    // 3. Fetch profiles details
    const { data: profiles, error: profErr } = await db.from('profiles').select('*')
    if (profErr) throw profErr

    // 4. Map them together
    const enrichedUsers = (users || []).map((u: any) => {
      const account = (userAccounts || []).find((a: any) => a.user_id === u.id)
      const profile = (profiles || []).find((p: any) => p.id === u.id)

      const isBanned = u.banned_until ? new Date(u.banned_until).getTime() > Date.now() : false

      return {
        id: u.id,
        email: u.email || 'N/A',
        created_at: u.created_at,
        banned_until: u.banned_until || null,
        is_banned: isBanned,
        full_name: account?.full_name || profile?.full_name || 'Anonymous User',
        phone_number: account?.phone_number || 'N/A',
        address: [
          account?.address_line1,
          account?.city,
          account?.state,
          account?.postal_code,
          account?.country
        ].filter(Boolean).join(', ') || 'No address provided',
         credits: account?.credits ?? 0,
         subscription_status: account?.subscription_status || 'INACTIVE',
         subscription_tier: account?.subscription_tier || 'NONE',
         device_fingerprint: account?.device_fingerprint || 'N/A',
         provider: u.app_metadata?.provider || (u.app_metadata?.providers && u.app_metadata.providers[0]) || 'email',
         role: u.app_metadata?.role || 'Super Admin'
       }
     })
 
     return enrichedUsers
   } catch (error) {
     console.error('Error fetching all users:', error)
     throw error
   }
 }

export async function getAllUsers() {
  return unstable_cache(
    async () => fetchAllUsers(),
    ['admin-all-users-v1'],
    { tags: ['admin-users'] }
  )()
}
 
 export async function updateUserRole(userId: string, role: string) {
   try {
     const db = getDB()
     const { error } = await db.auth.admin.updateUserById(userId, {
       app_metadata: { role }
     })
     if (error) throw error
     safeRevalidateTag('admin-users')
     safeRevalidateTag('admin-stats')
     await clearServerCache('users')
     return true
   } catch (error) {
     console.error('Error updating admin user role:', error)
     throw error
   }
 }
 
 export async function banUser(userId: string) {
   try {
     const db = getDB()
     // Ban for 100 years (876600 hours)
     const { error } = await db.auth.admin.updateUserById(userId, {
       ban_duration: '876600h'
     })
     if (error) throw error
     safeRevalidateTag('admin-users')
     safeRevalidateTag('admin-stats')
     await clearServerCache('users')
     return true
  } catch (error) {
    console.error('Error banning user:', error)
    throw error
  }
}

export async function unbanUser(userId: string) {
  try {
    const db = getDB()
    const { error } = await db.auth.admin.updateUserById(userId, {
      ban_duration: 'none'
    })
    if (error) throw error
    safeRevalidateTag('admin-users')
    safeRevalidateTag('admin-stats')
    await clearServerCache('users')
    return true
  } catch (error) {
    console.error('Error unbanning user:', error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    const db = getDB()
    // Delete public user profiles and accounts first to avoid foreign key violations
    await db.from('user_accounts').delete().eq('user_id', userId)
    await db.from('profiles').delete().eq('id', userId)

    // Delete from auth.users
    const { error } = await db.auth.admin.deleteUser(userId)
    if (error) throw error
    safeRevalidateTag('admin-users')
    safeRevalidateTag('admin-stats')
    await clearServerCache('all')
    return true
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw error
  }
}

async function fetchAllVaultSales() {
  try {
    const db = getDB()

    // 1. Fetch all sales from vault
    const { data: sales, error: salesErr } = await db
      .from('user_vault')
      .select('*')
      .order('created_at', { ascending: false })
    if (salesErr) throw salesErr

    // 2. Fetch all sample packs
    const { data: packs, error: packErr } = await db.from('sample_packs').select('id, name')
    if (packErr) throw packErr

    // 3. Fetch user accounts and profiles that correspond to these sales
    const userIds = Array.from(new Set((sales || []).map((s: any) => s.user_id).filter(Boolean)))
    let userAccounts: any[] = []
    let userProfiles: any[] = []
    if (userIds.length > 0) {
      const [accRes, profRes] = await Promise.all([
        db.from('user_accounts').select('*').in('user_id', userIds),
        db.from('profiles').select('*').in('id', userIds)
      ])
      userAccounts = accRes.data || []
      userProfiles = profRes.data || []
    }

    // 4. Fetch auth users for email addresses
    const users = await getAuthUsers(db)

    // 5. Fetch coupon usages and order sessions for deep transaction & discount metadata
    const orderIds = Array.from(new Set((sales || []).map((s: any) => s.razorpay_order_id).filter(Boolean)))
    const [couponUsagesRes, orderSessionsRes] = await Promise.all([
      db.from('coupon_usages').select('order_id, coupons(code, discount_percent)'),
      orderIds.length > 0 ? db.from('order_sessions').select('order_id, coupon_code, amount, billing_details, gateway').in('order_id', orderIds) : { data: [] }
    ])
    const couponUsages = couponUsagesRes.data || []
    const orderSessions = orderSessionsRes.data || []

    const liveRate = await getUsdToInrRate()

    const enrichedSales = (sales || []).map((sale: any) => {
      const pack = (packs || []).find((p: any) => p.id === sale.item_id)
      const account = (userAccounts || []).find((a: any) => a.user_id === sale.user_id)
      const profile = (userProfiles || []).find((p: any) => p.id === sale.user_id)
      const authUser = (users || []).find((u: any) => u.id === sale.user_id)
      const session = (orderSessions || []).find((os: any) => os.order_id === sale.razorpay_order_id)
      const sessionBilling = session?.billing_details

      const isUsd = isUsdOrder(sale)
      const gateway = getOrderGateway(sale)
      const rawAmt = Number(sale.amount || 0)
      const convertedAmt = isUsd ? convertUsdToInr(rawAmt, liveRate) : rawAmt

      // Original price resolution (from vault or sample_pack)
      const origPrice = Number(
        sale.original_price ?? 
        (isUsd ? (pack?.price_usd || 14.99) : (pack?.price_inr || rawAmt))
      )
      const discountAmt = Number(
        sale.discount_amount ?? 
        Math.max(0, origPrice - rawAmt)
      )

      // Coupon resolution: 1. user_vault -> 2. order_sessions -> 3. coupon_usages
      const usage = (couponUsages || []).find((u: any) => u.order_id === sale.razorpay_order_id)
      const rawCouponCode = sale.coupon_code || session?.coupon_code || usage?.coupons?.code || null
      const detectedCouponCode = rawCouponCode ? String(rawCouponCode).toUpperCase().trim() : null

      let couponDiscountPercent = usage?.coupons?.discount_percent || 0
      if (!couponDiscountPercent && origPrice > 0 && discountAmt > 0) {
        couponDiscountPercent = Math.min(100, Math.round((discountAmt / origPrice) * 100))
      }

      const couponInfo = detectedCouponCode ? {
        code: detectedCouponCode,
        discount_percent: couponDiscountPercent,
        discount_amount: discountAmt
      } : null

      return {
        id: sale.id,
        user_id: sale.user_id,
        item_id: sale.item_id,
        pack_id: sale.item_id,
        amount: sale.amount || 0,
        original_price: origPrice,
        discount_amount: discountAmt,
        coupon_code: detectedCouponCode,
        is_usd: isUsd,
        currency: isUsd ? 'USD' : 'INR',
        payment_gateway: gateway,
        original_amount: rawAmt,
        converted_amount_inr: convertedAmt,
        exchange_rate: liveRate,
        created_at: sale.created_at,
        razorpay_order_id: sale.razorpay_order_id || 'N/A',
        razorpay_payment_id: sale.razorpay_payment_id || 'N/A',
        payment_method: getPaymentMethodLabel(gateway, isUsd),
        pack_name: pack?.name || sale.item_name || 'Sample Pack Purchase',
        buyer_name: account?.full_name || profile?.full_name || sessionBilling?.fullName || authUser?.user_metadata?.full_name || 'Customer',
        buyer_email: authUser?.email || (sessionBilling?.address?.includes('@') ? sessionBilling.address : 'N/A'),
        buyer_phone: account?.phone_number || sessionBilling?.phone || 'N/A',
        buyer_city: account?.city || sessionBilling?.city || '',
        buyer_state: account?.state || sessionBilling?.state || '',
        buyer_country: account?.country || sessionBilling?.country || (isUsd ? 'United States' : 'India'),
        buyer_address: [
          account?.address_line1 || sessionBilling?.address,
          account?.city || sessionBilling?.city,
          account?.state || sessionBilling?.state,
          account?.postal_code || sessionBilling?.zip,
          account?.country || sessionBilling?.country
        ].filter(Boolean).join(', ') || 'No address provided',
        coupon: couponInfo
      }
    })

    return enrichedSales
  } catch (error) {
    console.error('Error fetching vault sales:', error)
    throw error
  }
}

export async function getAllVaultSales() {
  return unstable_cache(
    async () => fetchAllVaultSales(),
    ['admin-vault-sales-v2'],
    { tags: ['admin-sales'] }
  )()
}

/**
 * 10. Brevo Newsletter Integration Actions
 */
const BREVO_API_URL = 'https://api.brevo.com/v3'

function getBrevoHeaders() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not defined in environment variables. Please add it to your .env.local file.')
  }
  return {
    'accept': 'application/json',
    'api-key': apiKey,
    'content-type': 'application/json'
  }
}

async function fetchBrevoSubscribers() {
  try {
    const db = getDB()

    // 1. Fetch all registered users from database
    const users = await getAuthUsers(db)

    const { data: userAccounts, error: dbErr } = await db.from('user_accounts').select('user_id, newsletter')
    console.log('userAccounts error:', dbErr)
    console.log('userAccounts count:', userAccounts?.length)
    if (dbErr) throw dbErr

    // Map database users
    const dbSubscribers = (users || []).map((u: any) => {
      const account = (userAccounts || []).find((a: any) => a.user_id === u.id)
      // default is true if account has no newsletter field, or if account.newsletter is true
      const isSubscribed = account ? (account.newsletter !== false) : true
      return {
        id: u.id,
        email: u.email || 'N/A',
        subscribed: isSubscribed,
        created_at: u.created_at || new Date().toISOString()
      }
    })

    // 2. Fetch external contacts from Brevo if API key is configured
    let brevoContacts: any[] = []
    try {
      const headers = getBrevoHeaders()
      const response = await fetch(`${BREVO_API_URL}/contacts?limit=50&offset=0`, {
        method: 'GET',
        headers
      })
      if (response.ok) {
        const data = await response.json()
        brevoContacts = data.contacts || []
      }
    } catch (e) {
      console.warn('Brevo API fetch ignored, using database subscribers primary:', e)
    }

    // Merge database users and Brevo contacts by email (prioritizing database values)
    const mergedList: any[] = [...dbSubscribers]

    brevoContacts.forEach((bc: any) => {
      const exists = mergedList.find(x => x.email.toLowerCase() === bc.email.toLowerCase())
      if (!exists) {
        // Add manual external contact
        mergedList.push({
          id: bc.id,
          email: bc.email,
          subscribed: !bc.emailBlacklisted,
          created_at: bc.createdAt || new Date().toISOString()
        })
      } else {
        // Sync subscriber status if Brevo has different blacklisted value
        if (bc.emailBlacklisted && exists.subscribed) {
          exists.subscribed = false
        }
      }
    })

    return mergedList
  } catch (error: any) {
    console.error('Error in getBrevoSubscribers:', error)
    throw new Error(error.message || 'Failed to fetch subscribers')
  }
}

export async function getBrevoSubscribers() {
  return unstable_cache(
    async () => fetchBrevoSubscribers(),
    ['admin-brevo-subscribers-v1'],
    { tags: ['admin-newsletter'] }
  )()
}

export async function subscribeEmailToBrevo(email: string) {
  try {
    const db = getDB()

    // 1. Update database local newsletter status to true
    // Find auth user ID first
    const { data: { users }, error: authErr } = await db.auth.admin.listUsers()
    if (!authErr && users) {
      const targetUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (targetUser) {
        await db
          .from('user_accounts')
          .update({ newsletter: true })
          .eq('user_id', targetUser.id)
      }
    }

    // 2. Sync to Brevo
    try {
      const headers = getBrevoHeaders()
      const checkRes = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers
      })

      if (checkRes.ok) {
        await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ emailBlacklisted: false })
        })
      } else {
        await fetch(`${BREVO_API_URL}/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email,
            emailBlacklisted: false,
            updateEnabled: true
          })
        })
      }
    } catch (e) {
      console.warn('Brevo subscribe sync failed/skipped:', e)
    }

    safeRevalidateTag('admin-newsletter')
    safeRevalidateTag('admin-users')
    return true
  } catch (error: any) {
    console.error('Error in subscribeEmailToBrevo:', error)
    throw error
  }
}

export async function unsubscribeEmailFromBrevo(email: string) {
  try {
    const db = getDB()

    // 1. Update database local newsletter status to false
    const { data: { users }, error: authErr } = await db.auth.admin.listUsers()
    if (!authErr && users) {
      const targetUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (targetUser) {
        await db
          .from('user_accounts')
          .update({ newsletter: false })
          .eq('user_id', targetUser.id)
      }
    }

    // 2. Sync to Brevo
    try {
      const headers = getBrevoHeaders()
      await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ emailBlacklisted: true })
      })
    } catch (e) {
      console.warn('Brevo unsubscribe sync failed/skipped:', e)
    }

    safeRevalidateTag('admin-newsletter')
    safeRevalidateTag('admin-users')
    return true
  } catch (error: any) {
    console.error('Error in unsubscribeEmailFromBrevo:', error)
    throw error
  }
}

export async function sendBrevoCampaign(campaign: {
  subject: string
  title?: string
  htmlContent: string
  targetEmails?: string[]
}) {
  try {
    // 1. Fetch active subscribers from our robust hybrid function
    const subscribers = await getBrevoSubscribers()
    let activeRecipients: { email: string }[]

    if (campaign.targetEmails && campaign.targetEmails.length > 0) {
      // Send only to specifically selected recipients
      activeRecipients = campaign.targetEmails.map(email => ({ email }))
    } else {
      // Send to all active subscribers
      activeRecipients = subscribers
        .filter((s: any) => s.subscribed && s.email && s.email !== 'N/A')
        .map((s: any) => ({ email: s.email }))
    }

    if (activeRecipients.length === 0) {
      throw new Error('No active (subscribed) contacts found to send this newsletter to.')
    }

    const headers = getBrevoHeaders()
    let lastError: string | null = null

    // Send transactional SMTP mail for each recipient individually to guarantee privacy and support custom unsubscribe links
    const sendPromises = activeRecipients.map(async (recipient: any) => {
      const email = recipient.email
      const unsubscribeUrl = `https://sampleswala.com/unsubscribe?email=${encodeURIComponent(email)}`

      // Check if campaignContent is a full HTML page
      const isFullHtml = /<html|<!DOCTYPE/i.test(campaign.htmlContent);
      let finalHtml = '';

      // Clean default unsubscribe footer HTML aligned with brand theme
      const footerHtml = `
        <!-- UN-SUBSCRIBE FOOTER BY DEFAULT -->
        <div style="margin-top: 40px; padding: 24px; border-top: 1px solid #1e293b; background-color: #0c0c0e; font-size: 11px; color: #94a3b8; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">You received this email because you subscribed to our newsletter at <a href="https://sampleswala.com" style="color: #00BFFF; text-decoration: none; font-weight: bold;">sampleswala.com</a>.</p>
          <p style="margin: 0;">
            Want to stop receiving these? <a href="${unsubscribeUrl}" style="color: #ef4444; font-weight: 600; text-decoration: underline; margin-left: 4px;">Unsubscribe here</a>
          </p>
          <p style="font-weight: 600; margin: 12px 0 0 0; color: #f8fafc;">&copy; 2026 SamplesWala. All rights reserved.</p>
        </div>
      `;

      if (isFullHtml) {
        // If it's a full HTML template, replace unsubscribe placeholders
        let html = campaign.htmlContent
          .replace(/{{unsubscribe_url}}/g, unsubscribeUrl)
          .replace(/{{unsubscribe}}/g, unsubscribeUrl);

        // Check if there is an unsubscribe trigger, if not, append the default footer automatically
        const hasUnsubscribe = /unsubscribe/i.test(campaign.htmlContent);
        if (!hasUnsubscribe) {
          if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, `${footerHtml}</body>`);
          } else {
            html = html + footerHtml;
          }
        }
        finalHtml = html;
      } else {
        // If it's partial, wrap it in our default responsive email container aligned with SamplesWala Dark Industrial brand theme
        const replacedSnippet = campaign.htmlContent
          .replace(/{{unsubscribe_url}}/g, unsubscribeUrl)
          .replace(/{{unsubscribe}}/g, unsubscribeUrl);

        finalHtml = `
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
                  ${replacedSnippet}
                </div>
                ${footerHtml}
              </div>
            </body>
          </html>
        `;
      }

      try {
        const emailRes = await fetch(`${BREVO_API_URL}/smtp/email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sender: { name: 'Samples Wala', email: 'news@sampleswala.com' },
            to: [{ email }],
            subject: campaign.subject,
            htmlContent: finalHtml
          })
        })

        if (!emailRes.ok) {
          const errData = await emailRes.json().catch(() => ({}))
          lastError = errData.message || `Brevo returned status code ${emailRes.status}`
          console.error(`Failed to send email to ${email}:`, lastError)
          return false
        }
        return true
      } catch (e: any) {
        lastError = e.message || 'Unknown network error'
        console.error(`Exception sending email to ${email}:`, lastError)
        return false
      }
    })

    const results = await Promise.all(sendPromises)
    const successfulSends = results.filter(r => r).length

    if (successfulSends === 0) {
      throw new Error(`Failed to dispatch campaign: ${lastError || 'No active recipients'}`)
    }

    return {
      success: true,
      recipientsCount: successfulSends
    }
  } catch (error: any) {
    console.error('Error in sendBrevoCampaign:', error)
    throw error
  }
}

/**
 * 11. Launch Offer Banner Toggle Settings
 */
async function fetchLaunchOfferStatus() {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('app_metadata')
      .select('value')
      .eq('key', 'show_launch_offer')
      .maybeSingle()

    if (error || !data) {
      return true // default to true
    }
    return data.value !== 'false'
  } catch (error) {
    console.error('Error getting launch offer status:', error)
    return true
  }
}

export async function getLaunchOfferStatus() {
  return unstable_cache(
    async () => fetchLaunchOfferStatus(),
    ['admin-launch-offer-status-v1'],
    { tags: ['admin-settings'] }
  )()
}

export async function toggleLaunchOffer(value: boolean) {
  try {
    const db = getDB()
    const { error } = await db
      .from('app_metadata')
      .upsert({
        key: 'show_launch_offer',
        value: String(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error
    safeRevalidateTag('admin-settings')
    notifyMainSiteRevalidate({ path: '/' })
    return { success: true }
  } catch (error) {
    console.error('Error toggling launch offer status:', error)
    throw error
  }
}

/**
 * 12. Flash Sale Promo Toggle Settings
 */
async function fetchFlashSaleStatus() {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('app_metadata')
      .select('value')
      .eq('key', 'show_flash_sale')
      .maybeSingle()

    if (error || !data) {
      return false // default to false
    }
    return data.value !== 'false'
  } catch (error) {
    console.error('Error getting flash sale status:', error)
    return false
  }
}

export async function getFlashSaleStatus() {
  return unstable_cache(
    async () => fetchFlashSaleStatus(),
    ['admin-flash-sale-status-v1'],
    { tags: ['admin-settings'] }
  )()
}

export async function toggleFlashSale(value: boolean) {
  try {
    const db = getDB()
    const { error } = await db
      .from('app_metadata')
      .upsert({
        key: 'show_flash_sale',
        value: String(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error
    safeRevalidateTag('admin-settings')
    notifyMainSiteRevalidate({ path: '/' })
    return { success: true }
  } catch (error) {
    console.error('Error toggling flash sale status:', error)
    throw error
  }
}

/**
 * 13. Maintenance Mode Toggle Settings
 */
async function fetchMaintenanceStatus() {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('app_metadata')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()

    if (error || !data) {
      return false
    }
    return data.value === 'true'
  } catch (error) {
    console.error('Error getting maintenance status:', error)
    return false
  }
}

export async function getMaintenanceStatus() {
  return unstable_cache(
    async () => fetchMaintenanceStatus(),
    ['admin-maintenance-status-v1'],
    { tags: ['admin-settings'] }
  )()
}

export async function toggleMaintenanceMode(value: boolean) {
  try {
    const db = getDB()
    const { error } = await db
      .from('app_metadata')
      .upsert({
        key: 'maintenance_mode',
        value: String(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error
    safeRevalidateTag('admin-settings')
    notifyMainSiteRevalidate({ path: '/', tag: 'maintenance' })
    return { success: true }
  } catch (error) {
    console.error('Error toggling maintenance mode:', error)
    throw error
  }
}

/**
 * ============================================================================
 * 13. GLOBAL SITE SETTINGS & TELEMETRY
 * ============================================================================
 */


function maskApiKey(key?: string): string {
  if (!key || key.trim().length === 0) return 'Not Configured'
  const trimmed = key.trim()
  if (trimmed.length < 8) return '••••••••'
  const start = trimmed.slice(0, Math.min(8, Math.floor(trimmed.length / 2)))
  const end = trimmed.slice(-4)
  return `${start}••••••••${end}`
}

export async function getGlobalSiteSettings(): Promise<{ settings: GlobalSiteSettings; telemetry: SystemTelemetry }> {
  try {
    const db = getDB()
    const startTime = Date.now()

    const [
      metaRes,
      rateInfo,
      packsCountRes,
      samplesCountRes,
      usersCountRes,
      ordersCountRes,
      couponsCountRes,
      ticketsCountRes
    ] = await Promise.all([
      db.from('app_metadata').select('key, value').in('key', ['site_settings', 'maintenance_mode', 'show_launch_offer', 'show_flash_sale']),
      getExchangeRateInfo().catch(() => ({ rate: 87.2, source: 'fallback', lastUpdated: new Date().toISOString() })),
      db.from('sample_packs').select('*', { count: 'exact', head: true }),
      db.from('samples').select('*', { count: 'exact', head: true }),
      db.from('user_accounts').select('*', { count: 'exact', head: true }),
      db.from('order_sessions').select('*', { count: 'exact', head: true }),
      db.from('coupons').select('*', { count: 'exact', head: true }),
      db.from('support_tickets').select('*', { count: 'exact', head: true }),
    ])

    const latencyMs = Math.max(1, Date.now() - startTime)

    const metaMap: Record<string, string> = {}
    if (metaRes.data) {
      for (const row of metaRes.data) {
        metaMap[row.key] = row.value
      }
    }

    let parsedSettings: Partial<GlobalSiteSettings> = {}
    if (metaMap['site_settings']) {
      try {
        parsedSettings = JSON.parse(metaMap['site_settings'])
      } catch (err) {
        console.error('Failed to parse site_settings JSON:', err)
      }
    }

    const mergedSettings: GlobalSiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...parsedSettings,
      maintenance_mode: parsedSettings.maintenance_mode !== undefined 
        ? Boolean(parsedSettings.maintenance_mode) 
        : (metaMap['maintenance_mode'] === 'true'),
    }

    const rzpKey = getLiveEnvVar('RAZORPAY_KEY_ID') || getLiveEnvVar('NEXT_PUBLIC_RAZORPAY_KEY_ID')
    const paypalClient = getLiveEnvVar('NEXT_PUBLIC_PAYPAL_CLIENT_ID') || getLiveEnvVar('PAYPAL_CLIENT_ID')
    const cashfreeAppId = getLiveEnvVar('CASHFREE_APP_ID')
    const resendKey = getLiveEnvVar('RESEND_API_KEY')
    const brevoKey = getLiveEnvVar('BREVO_API_KEY')
    const turnstileKey = getLiveEnvVar('TURNSTILE_SECRET_KEY')

    const telemetry: SystemTelemetry = {
      database_status: metaRes.error ? 'error' : 'connected',
      database_latency_ms: latencyMs,
      total_sample_packs: packsCountRes.count ?? 0,
      total_samples: samplesCountRes.count ?? 0,
      total_registered_users: usersCountRes.count ?? 0,
      total_orders: ordersCountRes.count ?? 0,
      total_coupons: couponsCountRes.count ?? 0,
      total_support_tickets: ticketsCountRes.count ?? 0,
      current_live_usd_rate: rateInfo?.rate || 87.2,
      razorpay_configured: Boolean(rzpKey),
      razorpay_masked_key: maskApiKey(rzpKey),
      paypal_configured: Boolean(paypalClient),
      paypal_masked_key: maskApiKey(paypalClient),
      cashfree_configured: Boolean(cashfreeAppId),
      cashfree_masked_key: maskApiKey(cashfreeAppId),
      resend_configured: Boolean(resendKey),
      brevo_configured: Boolean(brevoKey),
      turnstile_configured: Boolean(turnstileKey),
      server_environment: process.env.NODE_ENV || 'production',
      last_checked_at: new Date().toISOString()
    }

    return { settings: mergedSettings, telemetry }
  } catch (error: any) {
    console.error('Error fetching global site settings:', error)
    return {
      settings: DEFAULT_SITE_SETTINGS,
      telemetry: {
        database_status: 'error',
        database_latency_ms: 0,
        total_sample_packs: 0,
        total_samples: 0,
        total_registered_users: 0,
        total_orders: 0,
        total_coupons: 0,
        total_support_tickets: 0,
        current_live_usd_rate: 87.2,
        razorpay_configured: false,
        razorpay_masked_key: 'Not Configured',
        paypal_configured: false,
        paypal_masked_key: 'Not Configured',
        cashfree_configured: false,
        cashfree_masked_key: 'Not Configured',
        resend_configured: false,
        brevo_configured: false,
        turnstile_configured: false,
        server_environment: 'production',
        last_checked_at: new Date().toISOString()
      }
    }
  }
}

export async function updateGlobalSiteSettings(newSettings: Partial<GlobalSiteSettings>, adminEmail?: string) {
  try {
    const db = getDB()

    const { data: existingRow } = await db
      .from('app_metadata')
      .select('value')
      .eq('key', 'site_settings')
      .maybeSingle()

    let current: GlobalSiteSettings = { ...DEFAULT_SITE_SETTINGS }
    if (existingRow?.value) {
      try {
        current = { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(existingRow.value) }
      } catch (e) {
        console.error('Could not parse existing site_settings, using defaults', e)
      }
    }

    const merged: GlobalSiteSettings = {
      ...current,
      ...newSettings,
      updated_at: new Date().toISOString(),
      updated_by: adminEmail || 'Admin'
    }

    const { error: upsertErr } = await db
      .from('app_metadata')
      .upsert({
        key: 'site_settings',
        value: JSON.stringify(merged),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (upsertErr) throw upsertErr

    // Synchronize maintenance_mode dedicated key if provided
    if (newSettings.maintenance_mode !== undefined) {
      await db
        .from('app_metadata')
        .upsert({
          key: 'maintenance_mode',
          value: String(newSettings.maintenance_mode),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
    }

    safeRevalidateTag('admin-settings')
    notifyMainSiteRevalidate({ path: '/', tag: 'maintenance' })

    return { success: true, settings: merged }
  } catch (error: any) {
    console.error('Error updating global site settings:', error)
    throw new Error(error.message || 'Failed to update global site settings')
  }
}

export async function resetGlobalSiteSettings(adminEmail?: string) {
  try {
    const db = getDB()
    const resetData: GlobalSiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      updated_at: new Date().toISOString(),
      updated_by: adminEmail || 'Admin'
    }

    const { error } = await db
      .from('app_metadata')
      .upsert({
        key: 'site_settings',
        value: JSON.stringify(resetData),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) throw error

    await db
      .from('app_metadata')
      .upsert({
        key: 'maintenance_mode',
        value: String(resetData.maintenance_mode),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    safeRevalidateTag('admin-settings')
    notifyMainSiteRevalidate({ path: '/' })

    return { success: true, settings: resetData }
  } catch (error: any) {
    console.error('Error resetting site settings:', error)
    throw new Error(error.message || 'Failed to reset site settings')
  }
}

