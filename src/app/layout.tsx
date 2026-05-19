import { Luckiest_Guy, Kalam, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from "next";
import "./globals.css";

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-luckiest-guy',
})

const kalam = Kalam({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-kalam',
})

const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: "SamplesWala Admin | Command Center",
  description: "Advanced analytics, ranking engine, operations tracking, and payouts portal for SamplesWala.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${luckiestGuy.variable} ${kalam.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col bg-[#0c0c0c] text-white`}>
        {children}
      </body>
    </html>
  );
}
