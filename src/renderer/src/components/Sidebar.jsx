import sidebarBgUrl from '../assets/sidebar-bg.png'

export const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashIcon /> },
  { key: 'users', label: 'User Management', icon: <UsersIcon />, adminOnly: true },
  { key: 'employees', label: 'Employees', icon: <FolderIcon /> },
  { key: 'categories', label: 'File Categories', icon: <LayersIcon /> },
  { key: 'offices', label: 'Offices', icon: <BuildingIcon />, adminOnly: true },
  { key: 'salaryGrades', label: 'Salary Grades', icon: <MoneyIcon />, adminOnly: true }
]

export default function Sidebar({ user, view, onNavigate, version }) {
  const nav = NAV.filter(
    (item) =>
      (!item.adminOnly || user.role === 'admin') && (!item.staffOnly || user.role !== 'admin')
  )

  return (
    <aside className="relative flex w-[260px] shrink-0 flex-col overflow-hidden bg-navy-900 text-white">
      {/* Designer background: navy gradient + City Hall + swoosh at the bottom */}
      <img
        src={sidebarBgUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full"
      />

      <nav className="relative z-10 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-4">
        {nav.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-[10px] px-5 text-left text-[15px] transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-r from-accent to-accent-dark font-semibold text-white shadow-[0_4px_14px_rgba(247,134,30,0.45)]'
                  : 'font-normal text-white/90 hover:bg-white/10'
              } h-[50px]`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer text over the building photo (last ~100px) */}
      <div className="relative z-10 px-5 pb-3 pt-16 text-center">
        <div className="text-[14px] font-bold uppercase tracking-wide text-white">
          City Council Office
        </div>
        <div className="text-[14px] font-bold uppercase tracking-wide text-white">
          Ozamiz City
        </div>
        <div className="mt-1.5 text-[9px] uppercase tracking-[2px] text-white/70">
          People • Service • Good Governance
        </div>
      </div>
      <div className="relative z-10 px-5 pb-3 text-center text-[10px] tracking-[1.5px] text-white/35">
        V{version || '…'} • AUTO-UPDATE
      </div>
    </aside>
  )
}

function DashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1.5" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="10" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="6" x2="16" y2="6" />
      <line x1="14" y1="10" x2="16" y2="10" />
      <line x1="14" y1="14" x2="16" y2="14" />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c0-.83-1.34-1.5-3-1.5s-3 .67-3 1.5 1.34 1.5 3 1.5 3 .67 3 1.5-1.34 1.5-3 1.5-3-.67-3-1.5" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
