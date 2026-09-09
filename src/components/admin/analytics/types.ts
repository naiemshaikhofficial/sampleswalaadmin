export interface VaultSale {
  id?: string
  pack_name: string
  user_id?: string
  item_id?: string
  pack_id?: string
  buyer_email?: string
  buyer_name?: string
  buyer_phone?: string
  buyer_city?: string
  buyer_state?: string
  buyer_country?: string
  buyer_address?: string
  created_at: string
  amount: number
  is_usd?: boolean
  original_amount?: number
  converted_amount_inr?: number
  razorpay_order_id?: string
  razorpay_payment_id?: string
  payment_method?: string
  coupon?: {
    code?: string
    discount_percent?: number
  } | null
}

export interface AnalyticsStats {
  totalRevenueINR: number
  totalUsers: number
  recentVaultSales: VaultSale[]
  totalDownloads: number
  wishlistCount: number
  openTickets: number
  pendingKYCs: number
  samplePacksCount: number
  exchangeRate?: number
}

export interface FilteredMetrics {
  revenue: number
  count: number
  aov: number
  uniqueBuyersCount: number
}

export interface FinancialData {
  grossRevenue: number
  netRevenue: number
  gatewayFees: number
  domesticINR: number
  domesticFees: number
  internationalUSD: number
  internationalUSDConverted: number
  internationalFees: number
  aov: number
  paidOrdersCount: number
  freeOrdersCount: number
  totalOrdersCount: number
  rawGrowth: number
  formattedGrowth: string
  isGrowthPositive: boolean
}

export interface CustomerProfile {
  userId: string
  name: string
  email: string
  city: string
  state: string
  country: string
  paidOrdersCount: number
  freeClaimsCount: number
  totalSpendINR: number
  totalSpendUSD: number
  isUsdBuyer: boolean
  packs: string[]
}

export interface CustomerAnalytics {
  totalRegisteredUsers: number
  activeVaultUsersCount: number
  uniquePayingBuyers: number
  repeatBuyersCount: number
  repeatRevenueTotal: number
  freeClaimersCount: number
  freeToPaidCount: number
  overallBuyerConversion: string
  repeatBuyerRate: string
  freeToPaidRate: string
  ltv: number
  allVaultUsers: CustomerProfile[]
  topSpenders: CustomerProfile[]
}

export interface ProductMetric {
  name: string
  revenueINR: number
  revenueUSD: number
  paidSales: number
  freeDownloads: number
  price: number
  cover: string
  totalActivity: number
  conversionRate: string
  share: number
  asp: number
}

export interface AttributionSource {
  id: string
  name: string
  channelType: string
  share: number
  revenue: number
  orders: number
  conversionRate: string
  topPack: string
  products: {
    name: string
    revenue: number
    orders: number
  }[]
}

export interface AbandonmentData {
  addedToCart: number
  checkoutStarted: number
  completedOrders: number
  cartDropoffs: number
  checkoutDropoffs: number
  cartAbandonmentRate: number
  checkoutAbandonmentRate: number
  overallDropoffRate: number
  avgAbandonedCartValue: number
  potentialLostRevenue: number
  frictionReasons: {
    reason: string
    share: string
    sessions: number
    detail: string
  }[]
}

export interface SalesRecommendation {
  id: string
  badge: string
  title: string
  metric: string
  insight: string
  action: string
}

export interface GeographyItem {
  name: string
  revenue: number
  orders: number
  share: number
}

export interface GeographyData {
  states: GeographyItem[]
  countries: GeographyItem[]
}
