import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Next.js 16 compliant tag revalidation helper.
 * Uses { expire: 0 } to immediately purge stale cache entries across server actions and webhooks.
 */
export function safeRevalidateTag(tagName: string) {
  try {
    // Next.js 16 signature: revalidateTag(tag, { expire: 0 })
    (revalidateTag as any)(tagName, { expire: 0 })
  } catch {
    try {
      (revalidateTag as any)(tagName, 'max')
    } catch {
      try {
        (revalidateTag as any)(tagName)
      } catch (err) {
        console.warn(`[REVALIDATE_TAG_ERROR] Failed to revalidate tag "${tagName}":`, err)
      }
    }
  }
}

/**
 * Next.js path revalidation helper.
 */
export function safeRevalidatePath(path: string, type?: 'page' | 'layout') {
  try {
    if (type) {
      revalidatePath(path, type)
    } else {
      revalidatePath(path)
    }
  } catch (err) {
    console.warn(`[REVALIDATE_PATH_ERROR] Failed to revalidate path "${path}":`, err)
  }
}

/**
 * Cross-Site Cache Invalidation:
 * Notifies the main customer-facing website (SamplesWala2) when changes occur in the Admin panel.
 */
export async function notifyMainSiteRevalidate(params: { tag?: string; path?: string }) {
  try {
    const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://sampleswala.com'
    const secret = process.env.REVALIDATION_TOKEN || 'sampleswala_cache_bypass_token_2026'

    const query = new URLSearchParams()
    query.set('secret', secret)
    if (params.tag) query.set('tag', params.tag)
    if (params.path) query.set('path', params.path)

    const targetUrl = `${mainSiteUrl.replace(/\/$/, '')}/api/revalidate?${query.toString()}`

    // Non-blocking fire-and-forget ping with 4s timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-revalidation-token': secret
      },
      signal: controller.signal
    })
      .then(res => res.json().catch(() => null))
      .then(data => {
        if (data?.success) {
          console.log(`[MAIN_SITE_SYNC] Successfully revalidated SamplesWala2:`, params)
        }
      })
      .catch(err => {
        // Silently log warning so admin action is never blocked
        console.warn(`[MAIN_SITE_SYNC_WARNING] Could not sync with main site at ${mainSiteUrl}:`, err?.message || err)
      })
      .finally(() => clearTimeout(timer))
  } catch (e: any) {
    console.warn(`[MAIN_SITE_SYNC_ERROR]`, e?.message || e)
  }
}
