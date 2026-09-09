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
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-6 relative font-sans">
      <div className="absolute top-0 right-0 p-6 flex items-center gap-2.5 text-xs font-mono text-zinc-400">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
        System Online
      </div>

      <div className="w-full max-w-md">
        {session && !isAdmin ? (
          /* ACCESS DENIED CARD */
          <div className="border border-[#2a2a2a] bg-[#181818] rounded-xl p-8 shadow-2xl relative text-center">
            <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center mx-auto mb-5 text-white">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="font-bold text-xl text-white mb-2">Restricted Access</h2>
            <p className="text-zinc-400 text-xs leading-relaxed mb-6">
              Your account <span className="text-white font-medium">{session.user.email}</span> is not authorized for Admin Console access. Please contact the system administrator.
            </p>

            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-[#222222] hover:bg-[#282828] text-white border border-[#333333] font-semibold py-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out & Return
            </button>
          </div>
        ) : (
          /* LOGIN CARD */
          <form onSubmit={handleSubmit} className="border border-[#2a2a2a] bg-[#181818] rounded-xl p-7 sm:p-8 shadow-2xl relative">
            <div className="text-center mb-7 flex flex-col items-center justify-center">
              <a href="https://sampleswala.vercel.app" target="_blank" rel="noopener noreferrer" className="block cursor-pointer hover:opacity-85 transition-opacity">
                <img
                  src="/Logo.png"
                  alt="SamplesWala Logo"
                  className="w-16 h-16 object-contain mb-3 rounded-xl p-2 bg-[#121212] border border-[#2a2a2a]"
                />
              </a>
              <h1 className="font-bold text-2xl tracking-tight text-white">
                Samples<span className="text-zinc-400">Wala</span> Admin
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">Producer Studio Management Console</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sampleswala.com"
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg p-3 text-white text-xs outline-none focus:border-white transition-colors placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg p-3 text-white text-xs outline-none focus:border-white transition-colors placeholder-zinc-500"
                />
              </div>

              {/* Cloudflare Turnstile CAPTCHA component */}
              <div className="flex justify-center py-2 bg-[#121212] border border-[#2a2a2a] rounded-lg p-2">
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
                className="w-full mt-2 font-bold py-3.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
              >
                {loginLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In to Console
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[#2a2a2a]" />
                <span className="text-[11px] text-zinc-500 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-[#2a2a2a]" />
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full bg-[#202020] hover:bg-[#282828] text-white border border-[#333333] font-semibold py-3 rounded-lg flex items-center justify-center gap-2.5 text-xs cursor-pointer transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google SSO
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
