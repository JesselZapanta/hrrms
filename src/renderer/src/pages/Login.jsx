import { useState } from 'react'
import Toast from '../components/Toast.jsx'
import Swoosh from '../components/Swoosh.jsx'
import sealUrl from '../assets/logo.webp'
import headerBgUrl from '../assets/header-bg.png'
import loginBgUrl from '../assets/login-hero-bg.png'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setToast(null)
    const res = await window.api.auth.login(username, password)
    setBusy(false)
    if (!res.ok) {
      setToast(res.error || 'Login failed')
      return
    }
    onLogin(res.data)
  }

  return (
    <div className="flex h-full">
      {toast && <Toast message={toast} tone="error" onClose={() => setToast(null)} />}
      {/* Brand panel — full-bleed login artwork, never cropped */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy-900 lg:flex lg:px-12 lg:py-10">
        <img
          src={loginBgUrl}
          alt="Ozamiz City Hall — Mayor Fernando T. Bernad Memorial Hall"
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-900/60 via-transparent to-navy-900/70" />

        <div className="relative z-10 flex items-center gap-4 animate-rise">
          <img
            src={sealUrl}
            alt="Official Seal of the City of Ozamiz"
            className="h-[76px] w-[76px] shrink-0 rounded-full object-cover ring-2 ring-white/80"
          />
          <div className="min-w-0">
            <div className="font-heading text-[22px] font-bold uppercase leading-tight text-white">
              Human Resource
            </div>
            <div className="truncate text-[15px] font-medium uppercase leading-tight text-white/90">
              Digital Records Management System
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[2px] text-white/60">
              City Council Office · LGU Ozamiz
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-rise" style={{ animationDelay: '0.15s' }}>
          <p className="max-w-md text-[15px] italic leading-relaxed text-white">
            “Secure records. Organized people. Better service.”
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">
              Asenso Ozamiz
            </span>
            <span className="h-[3px] w-10 rounded-full bg-accent" />
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-paper px-6 py-10">
        <div className="glow-paper" />
        <Swoosh className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-[0.07]" />
        <img
          src={sealUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full object-cover opacity-[0.05]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-transparent" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src={sealUrl}
              alt="Official Seal of the City of Ozamiz"
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-navy-900/10"
            />
            <div>
              <div className="font-heading text-base font-bold uppercase leading-tight text-navy-900">Human Resource</div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-text-muted">
                Digital Records Management System
              </div>
            </div>
          </div>

          <div className="gov-card overflow-hidden animate-rise" style={{ animationDelay: '0.05s' }}>
          {/* Branded image header — same artwork as the app header */}
          <div className="relative h-40 overflow-hidden bg-navy-900 lg:h-44">
            <img
              src={headerBgUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/70 to-navy-900/10" />
            <div className="relative z-10 flex h-full items-center gap-4 px-6 lg:px-7">
              <img
                src={sealUrl}
                alt="Official Seal of the City of Ozamiz"
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white/80"
              />
              <div className="min-w-0">
                <div className="font-heading text-xl font-bold uppercase leading-tight text-white">
                  Human Resource
                </div>
                <div className="truncate text-xs font-medium uppercase leading-tight text-white/85">
                  Digital Records Management System
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[2px] text-white/60">
                  City Council Office · LGU Ozamiz
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 lg:p-7">
          <p className="text-sm text-text-secondary">Sign in to your records management account.</p>

          <form onSubmit={submit} className="mt-6 space-y-4 animate-rise" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">Username</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <UserIcon />
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-11 pr-3.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <LockIcon />
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-border bg-white py-2.5 pl-11 pr-11 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wide text-text-muted transition-colors hover:text-accent"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-dark active:scale-[.99] disabled:opacity-60 disabled:shadow-none"
            >
              {busy ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
