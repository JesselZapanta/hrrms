import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await window.api.auth.login(username, password)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || 'Login failed')
      return
    }
    onLogin(res.data)
  }

  return (
    <div className="flex h-full">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-navy text-paper lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <div className="glow-orange" />
        <div className="glow-white" />

        {/* Manila-folder tab decorations */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end">
          {['PDS', '201', 'TOR', 'IPCR'].map((t, i) => (
            <div
              key={t}
              className="folder-tab-panel ml-2 text-center font-mono text-[10px] tracking-wider text-paper/30"
              style={{ width: `${92 - i * 8}px`, padding: '8px 0 26px', background: 'rgba(250,248,244,.05)' }}
            >
              {t}
            </div>
          ))}
          <div className="ml-2 h-1 flex-1" />
        </div>

        <div className="relative z-10 flex items-center gap-3 animate-rise">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange font-heading text-xl font-bold text-white shadow-lg shadow-orange/30">
            A
          </div>
          <div>
            <div className="font-heading text-lg font-bold leading-tight">HRRMS</div>
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-paper/50">
              City Council Office
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-orange animate-rise" style={{ animationDelay: '0.08s' }}>
            LGU Ozamiz · Official Records
          </p>
          <h1
            className="mt-4 font-heading text-4xl font-bold leading-tight text-paper animate-rise"
            style={{ animationDelay: '0.16s' }}
          >
            Human Resource
            <br />
            Records Management
          </h1>
          <p
            className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60 animate-rise"
            style={{ animationDelay: '0.24s' }}
          >
            The centralized 201-file registry — every employee record and
            supporting document, filed by category, ready when you are.
          </p>
        </div>

        <div className="relative z-10 font-mono text-[11px] uppercase tracking-wider text-paper/35 animate-rise" style={{ animationDelay: '0.32s' }}>
          Asenso Ozamiz
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-paper px-6 py-10">
        <div className="glow-paper" />

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy font-heading text-xl font-bold text-white">
              A
            </div>
            <div>
              <div className="font-heading text-lg font-bold text-navy">HRRMS</div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-ink/50">
                City Council Office · LGU Ozamiz
              </div>
            </div>
          </div>

          <div className="animate-rise">
            <h2 className="font-heading text-2xl font-bold text-navy">Welcome back</h2>
            <p className="mt-1 text-sm text-ink/60">Sign in to your records management account.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5 animate-rise" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Username</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                  <UserIcon />
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  className="w-full rounded-lg border border-hairline bg-white py-2.5 pl-11 pr-3.5 text-sm text-ink outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                  <LockIcon />
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-hairline bg-white py-2.5 pl-11 pr-11 text-sm text-ink outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-wide text-ink/40 transition-colors hover:text-orange"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-status-red/25 bg-status-red/5 px-3.5 py-2.5 text-sm text-status-red animate-rise">
                <span className="mt-0.5">
                  <AlertIcon />
                </span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange py-3 font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.99] disabled:opacity-60 disabled:shadow-none"
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

          <p className="mt-8 text-center font-mono text-[11px] text-ink/35 animate-rise" style={{ animationDelay: '0.18s' }}>
            Default admin · <span className="text-ink/50">admin / admin123</span>
          </p>
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

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
