import { useState } from 'react'
import { Modal } from './Modal.jsx'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashIcon /> },
  { key: 'employees', label: 'Employees', icon: <FolderIcon />, staffOnly: true },
  { key: 'categories', label: 'File Categories', icon: <LayersIcon /> },
  { key: 'users', label: 'User Management', icon: <UsersIcon />, adminOnly: true }
]

const META = {
  dashboard: { title: 'Dashboard', subtitle: 'Registry Overview' },
  employees: { title: 'Employees', subtitle: '201-File Management' },
  folder: { title: 'Employee Folder', subtitle: 'Filing Documents' },
  categories: { title: 'File Categories', subtitle: 'Filing Structure' },
  users: { title: 'User Management', subtitle: 'Access Control' },
  profile: { title: 'Profile', subtitle: 'Account Settings' }
}

export default function Layout({ user, view, onNavigate, children, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const nav = NAV.filter(
    (item) =>
      (!item.adminOnly || user.role === 'admin') && (!item.staffOnly || user.role !== 'admin')
  )
  const meta = META[view] || META.dashboard

  return (
    <div className="flex h-full bg-paper">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-navy text-paper">
        <div className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-orange font-heading text-xl font-bold text-white shadow-lg shadow-orange/30">
              A
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy bg-status-green" />
            </div>
            <div>
              <div className="font-heading text-lg font-bold leading-none">HRRMS</div>
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[2px] text-paper/45">
                City Council Office
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = view === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                  active
                    ? 'bg-white/[0.08] font-semibold text-white'
                    : 'text-paper/60 hover:bg-white/[0.05] hover:text-paper'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-orange" />
                )}
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    active ? 'bg-orange text-white' : 'bg-white/[0.06] text-paper/70'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4">
          <div
            role="button"
            onClick={() => onNavigate('profile')}
            title="Edit profile"
            className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white/[0.06] p-3 transition-colors hover:bg-white/[0.1]"
          >
            <AvatarChip user={user} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.full_name}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-orange">{user.role}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setConfirmLogout(true)
              }}
              title="Sign out"
              className="rounded-lg p-2 text-paper/50 transition-colors hover:bg-white/10 hover:text-paper"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-hairline bg-paper/80 px-8 py-4 backdrop-blur">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-ink/40">
              HRRMS / {meta.subtitle}
            </div>
            <h1 className="mt-0.5 font-heading text-2xl font-bold text-navy">{meta.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('profile')}
              title="Edit profile"
              className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-right transition-colors hover:bg-paper-dark"
            >
              <div>
                <div className="text-sm font-medium text-ink">{user.full_name}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink/40">{user.role}</div>
              </div>
              <AvatarChip user={user} />
              <span className="text-ink/30 opacity-0 transition-opacity group-hover:opacity-100">
                <EditIcon />
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {confirmLogout && (
        <Modal title="Sign out" onClose={() => setConfirmLogout(false)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange">
              <LogoutIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink">Log out of HRRMS?</div>
              <p className="mt-0.5 text-xs text-ink/50">
                You will need to sign in again to continue.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
            <button
              onClick={() => setConfirmLogout(false)}
              className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 transition-colors hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmLogout(false)
                onLogout()
              }}
              className="rounded-lg bg-status-red px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[.98]"
            >
              Sign Out
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function AvatarChip({ user, size = 'sm' }) {
  const cls = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-10 w-10 text-sm'
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className={`${cls} shrink-0 rounded-full border border-white/15 object-cover`}
      />
    )
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-orange-soft font-heading font-bold text-orange`}
    >
      {initials(user.full_name)}
    </span>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
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

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
