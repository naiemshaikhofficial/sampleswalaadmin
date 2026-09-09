'use client'

/**
 * ProducerToy-grade Client-Side High-Speed LocalStorage Cache Engine
 * Provides 0ms instant client rendering, zero duplicate network requests, and auto-cleanup.
 */

const CACHE_PREFIX = 'sw_admin_v2_'
const DEFAULT_TTL_MS = 10 * 60 * 1000 // 10 Minutes default

export interface CacheEnvelope<T = any> {
  data: T
  expiry: number
}

export const clientCache = {
  set: <T = any>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void => {
    if (typeof window === 'undefined') return
    try {
      const item: CacheEnvelope<T> = {
        data,
        expiry: Date.now() + ttlMs,
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (e) {
      console.warn('clientCache.set error (localStorage full or restricted):', e)
    }
  },

  get: <T = any>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key)
      if (!raw) return null

      const item: CacheEnvelope<T> = JSON.parse(raw)
      if (Date.now() > item.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return item.data
    } catch (e) {
      return null
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(CACHE_PREFIX + key)
    } catch (e) {
      console.warn('clientCache.remove error:', e)
    }
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(CACHE_PREFIX) || key.startsWith('sw_admin_v1_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('clientCache.clearAll error:', e)
    }
  },

  clearExpired: (): void => {
    if (typeof window === 'undefined') return
    try {
      const now = Date.now()
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const raw = localStorage.getItem(key)
            if (raw) {
              const item: CacheEnvelope = JSON.parse(raw)
              if (now > item.expiry) {
                localStorage.removeItem(key)
              }
            }
          } catch {
            localStorage.removeItem(key)
          }
        }
      })
    } catch (e) {
      console.warn('clientCache.clearExpired error:', e)
    }
  },
}
