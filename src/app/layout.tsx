import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { ImageProtection } from '@/components/ImageProtection'
import { ContentProtection } from '@/components/ContentProtection'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SamplesWala Admin | Command Center',
  description: 'Enterprise operations, analytics, catalog management, and artist portal.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} bg-[#121212] text-white h-full`}>
      <head>
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="icon" href="/icon.png?v=5" type="image/png" sizes="192x192" />
        <link rel="preconnect" href="https://zaocvqsslxopdchnxgbi.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://zaocvqsslxopdchnxgbi.supabase.co" />
      </head>
      <body className="bg-[#121212] text-white min-h-screen flex flex-col font-sans antialiased selection:bg-white selection:text-black">
        <ImageProtection />
        <ContentProtection />
        {children}
      </body>
    </html>
  )
}
