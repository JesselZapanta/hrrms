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
    <aside
      className="flex w-[220px] shrink-0 flex-col bg-navy-900 text-white lg:w-[260px]"
      style={{ background: `#0B2A5B url('${sidebarBgUrl}') center 75% / 100% auto no-repeat` }}
    >
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-4">
        {nav.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[12px] transition-all duration-150 lg:px-4 lg:text-[13px] ${
                active
                  ? 'bg-gradient-to-r from-accent to-accent-dark font-semibold text-white shadow-[0_4px_14px_rgba(247,134,30,0.45)]'
                  : 'font-normal text-white/90 hover:bg-white/10'
              } h-[38px] lg:h-[44px]`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer text over the bg's building zone */}
      <div className="relative z-10 mx-2.5 mb-2 lg:mx-3">
        <div className="rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-center backdrop-blur-sm lg:px-3">
          <div className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white lg:text-[11px]">
            City Council Office
          </div>
          <div className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white lg:text-[11px]">
            Ozamiz City
          </div>
          <div className="mt-1 text-[7px] uppercase tracking-[1.5px] text-white/70 lg:text-[8px]">
            People • Service • Good Governance
          </div>
        </div>
      </div>
      <div className="px-4 pb-2 text-[9px] tracking-[1.5px] text-white/35 lg:px-5 lg:pb-3 lg:text-[10px]">
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
