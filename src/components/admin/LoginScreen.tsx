'use client'

import React, { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { AlertTriangle, RefreshCw, Lock, LogOut } from 'lucide-react'

interface LoginScreenProps {
  session: any
  isAdmin: boolean
  onLogin: (email: string, password: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
  onLogout: () => Promise<void>
  loginLoading: boolean
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
  onTurnstileToken: (token: string | null) => void
}

export function LoginScreen({
  session,
  isAdmin,
  onLogin,
  onGoogleLogin,
  onLogout,
  loginLoading,
  showToast,
  onTurnstileToken
}: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    await onLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-6 relative">
      <div className="absolute top-0 right-0 p-8 flex items-center gap-4 text-xs font-black text-studio-pink">
        <div className="w-2.5 h-2.5 bg-studio-pink animate-ping rounded-full" />
        SYSTEM LIVE
      </div>

      <div className="w-full max-w-md">
        {session && !isAdmin ? (
          /* ACCESS DENIED CARD */
          <div className="border-4 border-black bg-[#121212] p-8 shadow-premium relative">
            <div className="absolute -top-5 left-6 bg-studio-red text-black font-black uppercase text-xs border-4 border-black px-3 py-1 shadow-md">
              ❌ ACCESS DENIED!
            </div>

            <div className="text-center my-6">
              <AlertTriangle className="w-16 h-16 text-studio-red mx-auto mb-4" />
              <h2 className="font-luckiest-guy text-4xl uppercase tracking-tighter mb-4">RESTRICTED DOMAIN</h2>
              <div className="bg-black/50 border border-zinc-800 p-4 font-mono text-xs text-left mb-6 text-zinc-300 leading-relaxed">
                Your logged account <span className="text-white font-bold">{session.user.email}</span> is not registered in the system&apos;s authorized Admin Table. Only verified DB administrators are granted access to this command center.
              </div>
              <button
                onClick={onLogout}
                className="studio-button w-full bg-studio-red hover:bg-studio-red/80 text-white font-black"
              >
                <LogOut className="w-4 h-4" /> SIGN OUT / BACK TO LOGIN
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN CARD */
          <form onSubmit={handleSubmit} className="border-4 border-black bg-[#121212] p-8 shadow-premium relative">
            <div className="absolute -top-5 left-6 bg-studio-yellow text-black font-black uppercase text-xs border-4 border-black px-3 py-1 shadow-md">
              🔒 ADMIN LOGIN
            </div>

            <div className="text-center mb-8 mt-4 flex flex-col items-center justify-center">
              <a href="https://sampleswala.vercel.app" target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-85 transition-opacity">
                <img
                  src="/Logo.png"
                  alt="SamplesWala Logo"
                  className="w-16 h-16 object-contain border-4 border-black bg-black/50 p-2 mb-3 shadow-[0_0_12px_rgba(0,255,148,0.2)] rounded-lg animate-pulse"
                />
              </a>
              <h1 className="font-luckiest-guy text-5xl uppercase tracking-tighter text-white">
                SAMPLES<span className="text-studio-pink">WALA</span>
              </h1>
              <p className="text-xs uppercase font-black text-studio-neon tracking-widest mt-1">ADMIN PORTAL v1.5</p>
            </div>

            <div className="space-y-5 font-mono">
              <div>
                <label className="block text-xs uppercase font-black tracking-widest text-zinc-400 mb-2">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sampleswala.com"
                  className="w-full bg-black border-3 border-black p-3 text-white text-xs outline-none focus:border-studio-pink font-bold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-black tracking-widest text-zinc-400 mb-2">PASSWORD</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black border-3 border-black p-3 text-white text-xs outline-none focus:border-studio-pink font-bold"
                />
              </div>

              {/* Cloudflare Turnstile CAPTCHA component */}
              <div className="flex justify-center py-2 bg-black border-3 border-black p-2.5">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={token => onTurnstileToken(token)}
                  onError={() => {
                    showToast('Turnstile validation failed', 'error')
                    onTurnstileToken(null)
                  }}
                  onExpire={() => onTurnstileToken(null)}
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="studio-button w-full mt-2 font-black py-4 bg-studio-pink text-black"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> VERIFY ACCESS CREDENTIALS
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 py-2 font-mono">
                <div className="flex-1 h-0.5 bg-zinc-800" />
                <span className="text-[10px] text-zinc-500 font-black">OR SECURITY SSO</span>
                <div className="flex-1 h-0.5 bg-zinc-800" />
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="studio-button w-full bg-white hover:bg-studio-yellow text-black font-black py-4 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                SSO AUTH WITH GOOGLE
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
