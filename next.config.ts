import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable dev indicators overlay in development
  devIndicators: false,

  // PERFORMANCE: Enable gzip compression to save Vercel bandwidth
  compress: true,

  // SECURITY: Hide X-Powered-By header
  poweredByHeader: false,

  // CDN CACHING: Force browser/CDN caching for all local static assets to save Vercel transfer bytes
  async headers() {
    return [
      {
        // Static local files (SVGs, PNGs, Icons, Fonts, Manifests)
        source: '/:path*.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // No-index API routes from search engines
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
