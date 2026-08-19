import { useEffect, useState } from 'react'

export default function Dashboard({ user, onNavigate }) {
  const isAdmin = user.role === 'admin'
  const [stats, setStats] = useState({ employees: 0, files: 0, categories: 0 })
  const [recent, setRecent] = useState([])
  const [categoryStats, setCategoryStats] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [empRes, catRes] = await Promise.all([
        window.api.employees.list({}),
        window.api.categories.listAll()
      ])
      if (!mounted) return

      if (empRes.ok) {
        setStats((s) => ({ ...s, employees: empRes.data.length }))
        if (!isAdmin) {
          const fileLists = await Promise.all(
            empRes.data.slice(0, 5).map(async (e) => {
              const f = await window.api.files.list(e.id)
              return (f.ok ? f.data : []).map((file) => ({ ...file, employee: e }))
            })
          )
          const all = fileLists.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6)
          setStats((s) => ({ ...s, files: all.length }))
          setRecent(all)
        }
      }
      if (catRes.ok) {
        setStats((s) => ({ ...s, categories: catRes.data.length }))
        if (isAdmin) {
          setCategoryStats(
            catRes.data.map((c) => ({
              id: c.id,
              name: c.name,
              subs: c.subcategories.length
            }))
          )
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [isAdmin])

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-2xl bg-navy px-8 py-8 text-paper shadow-lg shadow-navy/10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[3px] text-orange">
              City Council Office · LGU Ozamiz
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold">Welcome back, {firstName(user.full_name)}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-paper/60">
              {isAdmin
                ? 'Your filing structure and access controls are ready to manage.'
                : 'Your 201-file registry is ready — file, update, and retrieve employee documents.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {!isAdmin && (
                <button
                  onClick={() => onNavigate('employees')}
                  className="rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange/30 transition-all hover:bg-orange/90"
                >
                  Open Employees
                </button>
              )}
              <button
                onClick={() => onNavigate('categories')}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-paper transition-colors hover:bg-white/10"
              >
                {isAdmin ? 'Manage Categories' : 'View Categories'}
              </button>
              {isAdmin && (
                <button
                  onClick={() => onNavigate('users')}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-paper transition-colors hover:bg-white/10"
                >
                  User Management
                </button>
              )}
            </div>
          </div>
          <div className="hidden font-mono text-[11px] uppercase tracking-wider text-paper/35 md:block">
            Asenso Ozamiz
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard
          label="Employee Records"
          value={stats.employees}
          icon={<UserIcon />}
          tone="navy"
          onClick={!isAdmin ? () => onNavigate('employees') : undefined}
        />
        <StatCard
          label={isAdmin ? 'File Categories' : 'Documents on File'}
          value={isAdmin ? stats.categories : stats.files}
          icon={<FileIcon />}
          tone="orange"
          onClick={() => onNavigate('categories')}
        />
        <StatCard
          label="Subcategories"
          value={isAdmin ? categoryStats.reduce((n, c) => n + c.subs, 0) : stats.categories}
          icon={<LayersIcon />}
          tone="paper"
          onClick={!isAdmin ? () => onNavigate('categories') : undefined}
        />
      </div>

      {/* Admin: category overview */}
      {isAdmin && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-navy">Filing Structure</h2>
            <button
              onClick={() => onNavigate('categories')}
              className="text-sm font-medium text-orange transition-colors hover:text-orange/80"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categoryStats.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate('categories')}
                className="group flex items-center gap-4 rounded-xl border border-hairline bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-md hover:shadow-navy/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-soft text-orange transition-colors group-hover:bg-orange group-hover:text-white">
                  <FolderIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{c.name}</span>
                  <span className="font-mono text-[11px] text-ink/40">{c.subs} subcategories</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Staff: recent filings */}
      {!isAdmin && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-navy">Recent filings</h2>
            <button
              onClick={() => onNavigate('employees')}
              className="text-sm font-medium text-orange transition-colors hover:text-orange/80"
            >
              All employees →
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline bg-white px-5 py-12 text-center text-sm text-ink/40">
              No files filed yet. Open an employee folder to begin filing documents.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-hairline bg-white">
              {recent.map((f, i) => (
                <div
                  key={f.id}
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-paper ${
                    i !== recent.length - 1 ? 'border-b border-hairline' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{f.file_name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink/40">
                      {f.employee.complete_name} · {f.subcategory_name}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-ink/40">{f.created_at}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function firstName(name) {
  return String(name || '').split(/\s+/)[0] || 'there'
}

function StatCard({ label, value, icon, tone, onClick }) {
  const tones = {
    navy: 'bg-navy text-paper',
    orange: 'bg-orange text-white',
    paper: 'bg-white text-navy border border-hairline'
  }
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl p-5 text-left transition-all ${
        onClick ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''
      } ${tones[tone]}`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          tone === 'paper' ? 'bg-orange-soft text-orange' : 'bg-white/15 text-white'
        }`}
      >
        {icon}
      </span>
      <span>
        <span className="block font-mono text-2xl font-medium leading-tight">{value}</span>
        <span className={`mt-0.5 block text-xs ${tone === 'paper' ? 'text-ink/50' : 'opacity-70'}`}>
          {label}
        </span>
      </span>
    </Wrapper>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
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

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
