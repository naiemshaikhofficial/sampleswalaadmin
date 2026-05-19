'use server'

import { supabaseAdmin } from '@/lib/supabase'

// Helper to get an admin instance of Supabase
function getDB() {
  return supabaseAdmin
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
export async function getDashboardStats() {
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
      db.from('user_vault').select('amount')
    ])

    // Calculate revenue
    let totalRevenueINR = 0
    if (softwareOrdersRes.data) {
      softwareOrdersRes.data.forEach((order: any) => {
        totalRevenueINR += Number(order.amount_paid || 0)
      })
    }
    if (vaultSalesRes.data) {
      vaultSalesRes.data.forEach((sale: any) => {
        totalRevenueINR += Number(sale.amount || 0)
      })
    }

    // Recent orders
    const [recentSoftwares, recentVaultSales] = await Promise.all([
      db.from('software_orders').select('id, user_email, software_name, amount_paid, status, created_at').order('created_at', { ascending: false }).limit(5),
      db.from('user_vault').select('user_id, item_id, amount, created_at').order('created_at', { ascending: false }).limit(5)
    ])

    // Enrich recent vault sales with sample pack names
    const enrichedVaultSales = (recentVaultSales.data || []).map((sale: any) => {
      const pack = (samplePacksRes.data || []).find((p: any) => p.id === sale.item_id)
      return {
        ...sale,
        pack_name: pack?.name || 'Sample Pack Purchase'
      }
    })

    return {
      totalUsers: usersCountRes.count || 0,
      totalDownloads: downloadsCountRes.count || 0,
      openTickets: openTicketsRes.count || 0,
      pendingKYCs: pendingKycRes.count || 0,
      totalRevenueINR,
      recentSoftwares: recentSoftwares.data || [],
      recentVaultSales: enrichedVaultSales,
      samplePacksCount: samplePacksRes.data?.length || 0,
      wishlistCount: wishlistRes.count || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * 3. Sample Packs CRUD
 */
export async function getSamplePacks() {
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
    return true
  } catch (error) {
    console.error('Error deleting sample pack:', error)
    throw error
  }
}

/**
 * 4. Samples CRUD
 */
export async function getSamples(packId?: string, search?: string) {
  try {
    const db = getDB()
    let query = db.from('samples').select('*, sample_packs(name)')

    if (packId && packId !== 'all') {
      query = query.eq('pack_id', packId)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
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
    return true
  } catch (error) {
    console.error('Error deleting sample:', error)
    throw error
  }
}

/**
 * 5. Artist KYC & Payouts
 */
export async function getArtistsKYC() {
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

export async function updateKYCStatus(userId: string, status: string) {
  try {
    const db = getDB()
    const { error } = await db
      .from('artist_payout_settings')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating KYC status:', error)
    throw error
  }
}

export async function getArtistPayouts() {
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
    return true
  } catch (error) {
    console.error('Error triggering artist payout:', error)
    throw error
  }
}

/**
 * 6. Coupons CRUD
 */
export async function getCoupons() {
  try {
    const db = getDB()
    const { data, error } = await db
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting coupons:', error)
    throw error
  }
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
    return true
  } catch (error) {
    console.error('Error deleting coupon:', error)
    throw error
  }
}

/**
 * 7. Support Tickets Hub
 */
export async function getSupportTickets() {
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
    return true
  } catch (error) {
    console.error('Error replying to support ticket:', error)
    throw error
  }
}

/**
 * 8. Rankings Engine Details
 */
export async function getRankedPacks() {
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

/**
 * 9. Users Management Hub & Detailed Sales
 */
export async function getAllUsers() {
  try {
    const db = getDB()

    // 1. Fetch auth users using admin API
    const { data: { users }, error: authErr } = await db.auth.admin.listUsers()
    if (authErr) throw authErr

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
        provider: u.app_metadata?.provider || (u.app_metadata?.providers && u.app_metadata.providers[0]) || 'email'
      }
    })

    return enrichedUsers
  } catch (error) {
    console.error('Error fetching all users:', error)
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
    return true
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw error
  }
}

export async function getAllVaultSales() {
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

    // 3. Fetch only user accounts that correspond to these sales
    const userIds = Array.from(new Set((sales || []).map((s: any) => s.user_id).filter(Boolean)))
    let userAccounts: any[] = []
    if (userIds.length > 0) {
      const { data } = await db
        .from('user_accounts')
        .select('*')
        .in('user_id', userIds)
      userAccounts = data || []
    }

    // 4. Fetch auth users for email addresses
    const { data: { users } } = await db.auth.admin.listUsers()

    const enrichedSales = (sales || []).map((sale: any) => {
      const pack = (packs || []).find((p: any) => p.id === sale.item_id)
      const account = (userAccounts || []).find((a: any) => a.user_id === sale.user_id)
      const authUser = (users || []).find((u: any) => u.id === sale.user_id)

      return {
        id: sale.id,
        amount: sale.amount || 0,
        created_at: sale.created_at,
        razorpay_order_id: sale.razorpay_order_id || 'N/A',
        razorpay_payment_id: sale.razorpay_payment_id || 'N/A',
        pack_name: pack?.name || sale.item_name || 'Sample Pack Purchase',
        buyer_name: account?.full_name || 'Anonymous Buyer',
        buyer_email: authUser?.email || 'N/A',
        buyer_phone: account?.phone_number || 'N/A',
        buyer_address: [
          account?.address_line1,
          account?.city,
          account?.state,
          account?.postal_code,
          account?.country
        ].filter(Boolean).join(', ') || 'No address provided'
      }
    })

    return enrichedSales
  } catch (error) {
    console.error('Error fetching vault sales:', error)
    throw error
  }
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

export async function getBrevoSubscribers() {
  try {
    const db = getDB()

    // 1. Fetch all registered users from database
    const { data: { users }, error: authErr } = await db.auth.admin.listUsers()
    if (authErr) throw authErr

    const { data: userAccounts, error: dbErr } = await db.from('user_accounts').select('user_id, newsletter')
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

    return true
  } catch (error: any) {
    console.error('Error in unsubscribeEmailFromBrevo:', error)
    throw error
  }
}

export async function sendBrevoCampaign(campaign: {
  subject: string
  title: string
  htmlContent: string
}) {
  try {
    // 1. Fetch active subscribers from our robust hybrid function
    const subscribers = await getBrevoSubscribers()
    const activeRecipients = subscribers
      .filter((s: any) => s.subscribed && s.email && s.email !== 'N/A')
      .map((s: any) => ({ email: s.email }))

    if (activeRecipients.length === 0) {
      throw new Error('No active (subscribed) contacts found to send this newsletter to.')
    }

    const headers = getBrevoHeaders()

    // Send transactional SMTP mail for each recipient individually to guarantee privacy and support custom unsubscribe links
    const sendPromises = activeRecipients.map(async (recipient: any) => {
      const email = recipient.email
      const unsubscribeUrl = `https://sampleswala.com/unsubscribe?email=${encodeURIComponent(email)}`

      const emailRes = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sender: { name: 'SamplesWala News', email: 'newsletter@sampleswala.com' },
          to: [{ email }],
          subject: campaign.subject,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; border-radius: 0px; background-color: #ffffff;">
              <div style="background-color: #000000; padding: 25px; text-align: center; border: 3px solid #000000;">
                <h1 style="color: #FFE600; margin: 0; font-size: 28px; text-transform: uppercase; font-family: 'Arial Black', sans-serif; letter-spacing: 3px;">SAMPLESWALA</h1>
                <p style="color: #00BFFF; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">PREMIUM SOUNDS NEWSLETTER</p>
              </div>
              <div style="padding: 25px 15px; line-height: 1.7; color: #111111;">
                <h2 style="color: #FF0080; margin-top: 0; font-size: 20px; font-family: 'Arial Black', sans-serif; text-transform: uppercase; border-bottom: 2px solid #FF0080; padding-bottom: 5px;">${campaign.title}</h2>
                <div style="font-size: 14px;">
                  ${campaign.htmlContent}
                </div>
              </div>
              <div style="margin-top: 40px; padding: 20px; border-top: 3px solid #000000; background-color: #f9f9f9; font-size: 11px; color: #555; text-align: center;">
                <p style="margin: 0;">You received this email because you subscribed to our newsletter at <a href="https://sampleswala.com" style="color: #00BFFF; text-decoration: none; font-weight: bold;">sampleswala.com</a>.</p>
                <p style="margin: 12px 0 0 0; font-size: 12px; font-weight: bold; color: #555;">
                  Want to stop receiving these sounds drops? 
                  <a href="${unsubscribeUrl}" style="color: #FF0080; text-decoration: underline; font-weight: bold; margin-left: 5px;">
                    Unsubscribe here
                  </a>
                </p>
                <p style="font-weight: bold; margin-top: 15px; color: #000;">&copy; ${new Date().getFullYear()} SamplesWala. All rights reserved.</p>
              </div>
            </div>
          `
        })
      })

      if (!emailRes.ok) {
        const errData = await emailRes.json().catch(() => ({}))
        console.error(`Failed to send email to ${email}:`, errData.message)
      }
      return emailRes.ok
    })

    const results = await Promise.all(sendPromises)
    const successfulSends = results.filter(r => r).length

    if (successfulSends === 0) {
      throw new Error('Failed to dispatch campaign to any active recipients via Brevo SMTP.')
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

