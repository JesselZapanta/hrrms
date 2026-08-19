const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'employees', label: 'Employees', icon: '▤' },
  { key: 'categories', label: 'Categories', icon: '▣' },
  { key: 'users', label: 'User Management', icon: '◉', adminOnly: true }
]

export default function Layout({ user, view, onNavigate, children, onLogout }) {
  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col bg-navy text-paper">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-orange font-heading text-lg font-bold text-white">
            A
          </div>
          <div>
            <div className="font-heading text-base font-bold leading-tight">HRRMS</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-paper/50">
              LGU Ozamiz · CCO
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.filter((item) => !item.adminOnly || user.role === 'admin').map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-colors ${
                view === item.key
                  ? 'bg-orange font-semibold text-white'
                  : 'text-paper/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="text-sm font-medium">{user.full_name}</div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-orange">
            {user.role}
          </div>
          <button
            onClick={onLogout}
            className="w-full rounded border border-white/20 px-3 py-1.5 text-xs text-paper/80 transition-colors hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
