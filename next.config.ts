import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable dev indicators overlay in development
  devIndicators: false,

  // PERFORMANCE: Enable gzip compression to save Vercel bandwidth
  compress: true,

  // SECURITY: Hide X-Powered-By header
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];

    const cdnCacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
      {
        key: 'CDN-Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
      {
        key: 'Vercel-CDN-Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ];

    return [
      // 1. Static local files (SVGs, PNGs, Icons, Fonts, Manifests, Audio)
      {
        source: '/:path*.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|ttf|eot|mp3|wav|ogg|json)',
        headers: cdnCacheHeaders,
      },
      // 2. Security Headers for all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // 4. No-index API routes from search engines
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;

