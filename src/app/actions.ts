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
      db.from('support_tickets').select('id', { count: 'exact' }).eq('status', 'open'),
      db.from('artist_payout_settings').select('user_id', { count: 'exact' }).eq('verification_status', 'pending'),
      db.from('software_orders').select('amount_paid, status'),
      db.from('sample_packs').select('id, name, is_featured, display_rank'),
      db.from('wishlist').select('id, sample_id'),
      db.from('user_vault').select('amount, created_at, item_id, user_id')
    ])

    // Calculate revenue
    let totalRevenueINR = 0
    if (softwareOrdersRes.data) {
      softwareOrdersRes.data.forEach((order: any) => {
        if (order.status === 'complete' || order.status === 'paid') {
          totalRevenueINR += Number(order.amount_paid || 0)
        }
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
      openTickets: openTicketsRes.data?.length || 0,
      pendingKYCs: pendingKycRes.data?.length || 0,
      totalRevenueINR,
      recentSoftwares: recentSoftwares.data || [],
      recentVaultSales: enrichedVaultSales,
      samplePacksCount: samplePacksRes.data?.length || 0,
      wishlistCount: wishlistRes.data?.length || 0
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

    // Fetch matching profiles
    const { data: profiles } = await db.from('profiles').select('id, full_name, avatar_url')

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

    const { data: profiles } = await db.from('profiles').select('id, full_name')

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

    const { data: profiles } = await db.from('profiles').select('id, full_name')

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

    // 3. Fetch all user accounts for billing info
    const { data: userAccounts } = await db.from('user_accounts').select('*')
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
