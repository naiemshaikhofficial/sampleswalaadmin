let cachedRate: number | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour in-memory cache

export interface ExchangeRateInfo {
  rate: number
  base: string
  target: string
  lastUpdated: string
  isFallback?: boolean
}

/**
 * Fetch live USD to INR exchange rate with multi-layer free API fallbacks
 */
export async function getUsdToInrRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRate
  }

  // 1. Primary Free API: exchangerate-api.com v4 (No API key, highly reliable)
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.rates?.INR && typeof data.rates.INR === 'number') {
        cachedRate = Math.round(data.rates.INR * 100) / 100
        cacheTimestamp = now
        return cachedRate
      }
    }
  } catch (err) {
    console.warn('[EXCHANGE_RATE] Primary API failed, trying fallback...', err)
  }

  // 2. Secondary Free API: open.er-api.com v6 (No API key)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store'
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.rates?.INR && typeof data.rates.INR === 'number') {
        cachedRate = Math.round(data.rates.INR * 100) / 100
        cacheTimestamp = now
        return cachedRate
      }
    }
  } catch (err) {
    console.warn('[EXCHANGE_RATE] Fallback API failed...', err)
  }

  // 3. Robust fallback rate if offline / rate limited
  return cachedRate || 90.0
}

/**
 * Get detailed exchange rate metadata for UI display
 */
export async function getExchangeRateInfo(): Promise<ExchangeRateInfo> {
  const rate = await getUsdToInrRate()
  return {
    rate,
    base: 'USD',
    target: 'INR',
    lastUpdated: new Date().toISOString(),
    isFallback: !cachedRate
  }
}

/**
 * Convert USD to INR
 */
export function convertUsdToInr(usdAmount: number, rate: number): number {
  if (!usdAmount || usdAmount <= 0) return 0
  return Math.round(usdAmount * rate)
}

/**
 * Convert INR to USD (rounded to 2 decimal places)
 */
export function convertInrToUsd(inrAmount: number, rate: number): number {
  if (!inrAmount || inrAmount <= 0) return 0
  return Math.round((inrAmount / rate) * 100) / 100
}

/**
 * Intelligently detect if an order in user_vault was charged in USD (PayPal)
 */
export function isUsdOrder(sale: {
  amount?: number
  razorpay_order_id?: string
  razorpay_payment_id?: string
  currency?: string
  payment_gateway?: string
}): boolean {
  // Explicit currency takes highest priority
  if (sale.currency === 'USD') return true
  if (sale.currency === 'INR') return false

  // Explicit payment gateway takes next priority
  if (sale.payment_gateway === 'paypal') return true
  if (sale.payment_gateway === 'razorpay' || sale.payment_gateway === 'cashfree' || sale.payment_gateway === 'free') return false

  const orderId = sale.razorpay_order_id || ''
  const paymentId = sale.razorpay_payment_id || ''
  const amount = Number(sale.amount || 0)

  // Free orders are 0 or start with SW_FREE
  if (amount === 0 || orderId.startsWith('SW_FREE') || paymentId.startsWith('SW_PAY_FREE')) return false

  // Cashfree orders start with sw_ or CF_
  if (orderId.startsWith('sw_') || orderId.startsWith('CF_') || paymentId.startsWith('CF_')) {
    return false
  }

  // Razorpay orders start with order_ or payment starts with pay_
  if (orderId.startsWith('order_') || paymentId.startsWith('pay_') || orderId.startsWith('Manual_')) {
    return false
  }

  // Explicit PayPal order ID prefixes
  if (orderId.startsWith('PAYPAL_') || orderId.startsWith('PP_') || paymentId.startsWith('PAY_PP_')) return true

  // Standard PayPal order ID is 17 uppercase alphanumeric characters without underscores
  const isPaypalIdFormat = /^[A-Z0-9]{17}$/.test(orderId)
  if (isPaypalIdFormat) return true

  return false
}

/**
 * Identify payment gateway for user_vault sale entry
 */
export function getOrderGateway(sale: {
  currency?: string
  payment_gateway?: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  amount?: number
}): 'cashfree' | 'razorpay' | 'paypal' | 'free' {
  if (sale.payment_gateway) {
    return sale.payment_gateway as 'cashfree' | 'razorpay' | 'paypal' | 'free'
  }
  const orderId = sale.razorpay_order_id || ''
  const paymentId = sale.razorpay_payment_id || ''
  const amount = Number(sale.amount || 0)

  if (amount === 0 || orderId.startsWith('SW_FREE') || paymentId.startsWith('SW_PAY_FREE')) return 'free'
  if (orderId.startsWith('sw_') || orderId.startsWith('CF_') || paymentId.startsWith('CF_')) return 'cashfree'
  if (orderId.startsWith('order_') || paymentId.startsWith('pay_') || orderId.startsWith('Manual_')) return 'razorpay'
  if (orderId.startsWith('PAYPAL_') || orderId.startsWith('PP_') || paymentId.startsWith('PAY_PP_') || /^[A-Z0-9]{17}$/.test(orderId)) return 'paypal'
  return 'razorpay'
}

/**
 * Format clean human-readable payment method name
 */
export function getPaymentMethodLabel(gateway: string, isUsd: boolean): string {
  switch (gateway) {
    case 'cashfree':
      return 'Cashfree (UPI/Cards/NetBanking)'
    case 'razorpay':
      return 'Razorpay (UPI/Card/NetBanking)'
    case 'paypal':
      return 'PayPal (International/USD)'
    case 'free':
      return 'Free Claim'
    default:
      return isUsd ? 'PayPal (International/USD)' : 'Razorpay (UPI/Card/NetBanking)'
  }
}
