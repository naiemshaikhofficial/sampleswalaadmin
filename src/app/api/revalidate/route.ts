import { NextRequest, NextResponse } from 'next/server'
import { safeRevalidateTag, safeRevalidatePath, notifyMainSiteRevalidate } from '@/lib/revalidateHelper'

/**
 * On-Demand Cache Revalidation & Supabase Database Webhook Endpoint
 * Allows instant, zero-downtime cache invalidation for the Admin Dashboard.
 *
 * Supported Triggers:
 * 1. Supabase Database Webhooks (table change events via pg_net or webhook integrations)
 * 2. Manual HTTP Query or Header Purge (e.g. GET/POST /api/revalidate?secret=...&tag=admin-packs)
 */

export async function GET(req: NextRequest) {
  return handleRevalidation(req)
}

export async function POST(req: NextRequest) {
  return handleRevalidation(req)
}

async function handleRevalidation(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tag = searchParams.get('tag')
    const path = searchParams.get('path')
    const secretParam = searchParams.get('secret') || searchParams.get('token')

    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const headerSecret =
      req.headers.get('x-revalidation-token') ||
      req.headers.get('x-revalidate-secret') ||
      bearerToken

    const incomingSecret = secretParam || headerSecret

    const configuredSecret =
      process.env.REVALIDATION_TOKEN ||
      process.env.REVALIDATE_SECRET ||
      'sampleswala_cache_bypass_token_2026'

    let isSupabaseWebhook = false
    let webhookBody: any = null

    // 1. Inspect for Supabase Database Webhook payload
    if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          webhookBody = await req.json().catch(() => null)
          if (webhookBody && (webhookBody.table || webhookBody.type)) {
            isSupabaseWebhook = true
          }
        }
      } catch (jsonErr: any) {
        console.warn('[Admin Revalidate Webhook] JSON parse warning:', jsonErr.message)
      }
    }

    // 2. Authentication Check:
    // If incoming request is a manual call, require valid secret token.
    // If it's a Supabase Webhook, verify token if provided in header or URL.
    if (!isSupabaseWebhook) {
      if (!incomingSecret || incomingSecret !== configuredSecret) {
        console.warn('[ADMIN_REVALIDATE_AUTH_ERROR] Unauthorized revalidation attempt')
        return NextResponse.json({ error: 'Unauthorized: Invalid revalidation token' }, { status: 401 })
      }
    } else if (incomingSecret && incomingSecret !== configuredSecret) {
      console.warn('[ADMIN_REVALIDATE_WEBHOOK_AUTH_WARNING] Mismatched webhook secret')
    }

    const revalidatedItems: string[] = []

    // 3. Process Supabase Database Webhook Payload
    if (isSupabaseWebhook && webhookBody?.table) {
      const table = webhookBody.table
      const eventType = webhookBody.type || 'UNKNOWN'
      console.log(`[Admin Revalidate Webhook] Received Supabase ${eventType} event for table: "${table}"`)

      switch (table) {
        case 'sample_packs':
          safeRevalidateTag('admin-packs')
          safeRevalidateTag('admin-stats')
          safeRevalidatePath('/')
          revalidatedItems.push('tag:admin-packs', 'tag:admin-stats', 'path:/')
          // Cross-sync with customer site
          notifyMainSiteRevalidate({ tag: 'packs' })
          break

        case 'samples':
          safeRevalidateTag('admin-samples')
          safeRevalidateTag('admin-stats')
          revalidatedItems.push('tag:admin-samples', 'tag:admin-stats')
          notifyMainSiteRevalidate({ tag: 'packs' })
          break

        case 'user_vault':
          safeRevalidateTag('admin-sales')
          safeRevalidateTag('admin-stats')
          safeRevalidatePath('/')
          revalidatedItems.push('tag:admin-sales', 'tag:admin-stats', 'path:/')
          break

        case 'user_accounts':
        case 'profiles':
          safeRevalidateTag('admin-users')
          safeRevalidateTag('admin-stats')
          safeRevalidatePath('/')
          revalidatedItems.push('tag:admin-users', 'tag:admin-stats', 'path:/')
          break

        case 'support_tickets':
          safeRevalidateTag('admin-tickets')
          safeRevalidateTag('admin-stats')
          revalidatedItems.push('tag:admin-tickets', 'tag:admin-stats')
          break

        case 'artist_payout_settings':
        case 'artist_collaborations':
        case 'artist_payouts':
        case 'artist_agreements':
          safeRevalidateTag('admin-kyc')
          safeRevalidateTag('admin-stats')
          revalidatedItems.push('tag:admin-kyc', 'tag:admin-stats')
          break

        case 'coupons':
        case 'coupon_usages':
          safeRevalidateTag('admin-coupons')
          revalidatedItems.push('tag:admin-coupons')
          notifyMainSiteRevalidate({ tag: 'coupons' })
          break

        case 'app_metadata':
          safeRevalidateTag('admin-settings')
          revalidatedItems.push('tag:admin-settings')
          notifyMainSiteRevalidate({ path: '/' })
          break

        case 'software_products':
        case 'software_orders':
          safeRevalidateTag('admin-stats')
          revalidatedItems.push('tag:admin-stats')
          notifyMainSiteRevalidate({ path: '/' })
          break

        case 'categories':
          safeRevalidateTag('admin-packs')
          revalidatedItems.push('tag:admin-packs')
          notifyMainSiteRevalidate({ tag: 'categories' })
          break

        default:
          // Invalidate generic stats as a fallback for other tables
          safeRevalidateTag('admin-stats')
          revalidatedItems.push(`fallback:admin-stats for ${table}`)
          break
      }
    }

    // 4. Handle Direct Tag Invalidation
    if (tag) {
      safeRevalidateTag(tag)
      revalidatedItems.push(`tag:${tag}`)
    }

    // 5. Handle Direct Path Invalidation
    if (path) {
      safeRevalidatePath(path)
      revalidatedItems.push(`path:${path}`)
    }

    // 6. Handle Global Purge if no specific params supplied
    if (!tag && !path && revalidatedItems.length === 0) {
      const allAdminTags = [
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

      allAdminTags.forEach(t => safeRevalidateTag(t))
      safeRevalidatePath('/')
      revalidatedItems.push('all_admin_tags', 'path:/')
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      items: revalidatedItems,
      timestamp: Date.now(),
    })
  } catch (err: any) {
    console.error('[ADMIN_REVALIDATE_ERROR]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
