import { useEffect, useRef, useState } from 'react'
import headerBgUrl from '../assets/header-bg.png'
import sealUrl from '../assets/logo.webp'

export default function AppHeader({ user, onNavigate, onLogoutRequest }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const displayName = user.role === 'admin' ? 'Administrator' : user.full_name

  return (
    <header className="relative z-40 h-[68px] w-full shrink-0 bg-navy-900 lg:h-[92px]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={headerBgUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
      </div>
      {/* Content */}
      <div className="relative z-20 flex h-full items-center justify-between gap-3 px-4 lg:gap-4 lg:px-6">
        {/* Left block */}
        <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
          <img
            src={sealUrl}
            alt="Official Seal of the City of Ozamiz"
            className="h-[44px] w-[44px] shrink-0 rounded-full object-cover ring-2 ring-white/80 lg:h-[60px] lg:w-[60px]"
          />
          <div className="min-w-0">
            <div className="truncate text-[17px] font-bold uppercase leading-tight tracking-[0.5px] text-white lg:text-[22px]">
              City Council Office
            </div>
            <div className="hidden truncate text-[11px] uppercase tracking-[0.5px] text-white/90 sm:block lg:text-[13px]">
              Local Government Unit of Ozamiz City
            </div>
          </div>
        </div>

        {/* Right block */}
        <div className="flex min-w-0 shrink-0 items-center gap-3 lg:gap-5">
          <div className="hidden min-w-0 text-right md:block">
            <div className="truncate text-[15px] font-bold uppercase leading-tight text-text-primary lg:text-[20px]">
              Human Resource
            </div>
            <div className="hidden truncate text-[12px] font-medium uppercase leading-tight text-text-primary lg:block lg:text-[15px]">
              201 Files Management System
            </div>
            <div className="mt-0.5 hidden truncate text-[11px] italic text-text-muted lg:block">
              Secure records. Organized people. Better service.
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2.5 shadow-sm transition-shadow hover:shadow lg:gap-2.5 lg:py-1.5 lg:pr-3"
              >
                <AvatarChip user={user} />
                <span className="hidden max-w-32 truncate text-sm font-semibold text-text-primary sm:block">
                  {displayName}
                </span>
                <span className="text-text-muted">
                  <ChevronDownIcon />
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-[70] mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl shadow-navy-900/10"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      onNavigate('profile')
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-row-hover"
                  >
                    <ProfileIcon /> Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      onLogoutRequest()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-text transition-colors hover:bg-danger-bg/40"
                  >
                    <LogoutIcon /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function AvatarChip({ user }) {
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className="h-8 w-8 shrink-0 rounded-full bg-navy-800 object-cover"
      />
    )
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">
      {initials(user?.role === 'admin' ? 'Administrator' : user?.full_name)}
    </span>
  )
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
