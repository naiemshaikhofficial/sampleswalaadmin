'use client'

const CACHE_PREFIX = 'sw_admin_v1_'
const DEFAULT_EXPIRY = 1000 * 60 * 10 // 10 Minutes default for admin dashboard

export const clientCache = {
  set: (key: string, data: any, ttl = DEFAULT_EXPIRY) => {
    if (typeof window === 'undefined') return
    try {
      const item = {
        data,
        expiry: Date.now() + ttl,
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
    } catch (e) {
      console.warn('Failed to write to localStorage clientCache:', e)
    }
  },

  get: (key: string) => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null

    try {
      const item = JSON.parse(raw)
      if (Date.now() > item.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return item.data
    } catch (e) {
      return null
    }
  },

  remove: (key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(CACHE_PREFIX + key)
  },

  clearAll: () => {
    if (typeof window === 'undefined') return
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('Failed to clear clientCache:', e)
    }
  }
}
