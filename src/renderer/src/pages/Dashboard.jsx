import { useEffect, useState } from 'react'
import welcomeBannerUrl from '../assets/welcome-banner-bg.png'

const TILE_COLORS = [
  'bg-tile-blue',
  'bg-tile-orange',
  'bg-tile-green',
  'bg-tile-purple',
  'bg-tile-red',
  'bg-tile-yellow',
  'bg-tile-slate'
]

export default function Dashboard({ user, onNavigate }) {
  const isAdmin = user.role === 'admin'
  const [stats, setStats] = useState({ employees: 0, files: 0, categories: 0, subcategories: 0, offices: 0 })
  const [recent, setRecent] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [staffTab, setStaffTab] = useState('all')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [empRes, catRes, offRes] = await Promise.all([
        window.api.employees.list({}),
        window.api.categories.listAll(),
        window.api.offices.list({})
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
        const subTotal = catRes.data.reduce((n, c) => n + c.subcategories.length, 0)
        setStats((s) => ({ ...s, categories: catRes.data.length, subcategories: subTotal }))
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
      if (offRes.ok && mounted) {
        setStats((s) => ({ ...s, offices: offRes.data.length }))
      }
    })()
    return () => {
      mounted = false
    }
  }, [isAdmin])

  return (
    <div className="mx-auto max-w-6xl px-5 py-5">
      <WelcomeCard user={user} isAdmin={isAdmin} onNavigate={onNavigate} />

      {/* Stat cards */}
      {isAdmin ? (
        <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            tile="bg-tile-blue"
            icon={<UserIcon />}
            value={stats.employees}
            label="Employee Records"
            sublabel="Total registered employees"
            onClick={() => onNavigate('employees')}
          />
          <StatCard
            tile="bg-tile-orange"
            icon={<FileIcon />}
            value={stats.categories}
            label="File Categories"
            sublabel="Across the filing structure"
            onClick={() => onNavigate('categories')}
          />
          <StatCard
            tile="bg-tile-purple"
            icon={<LayersIcon />}
            value={stats.subcategories}
            label="Subcategories"
            sublabel={`Across ${stats.categories} categories`}
            onClick={() => onNavigate('categories')}
          />
          <StatCard
            tile="bg-tile-slate"
            icon={<BuildingIcon />}
            value={stats.offices}
            label="Offices"
            sublabel="City offices directory"
            onClick={() => onNavigate('offices')}
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            tile="bg-tile-blue"
            icon={<FileIcon />}
            value={stats.files}
            label="My Documents"
            sublabel="Uploaded in my 201 File"
            onClick={() => onNavigate('employees')}
          />
          <StatCard
            tile="bg-tile-green"
            icon={<CheckCircleIcon />}
            value={stats.categories}
            label="Complete Categories"
            sublabel={`Out of ${stats.categories} required categories`}
            onClick={() => onNavigate('categories')}
          />
          <StatCard
            tile="bg-tile-orange"
            icon={<ClockIcon />}
            value={0}
            label="For Updating"
            sublabel="No documents need updating"
          />
          <StatCard
            tile="bg-tile-red"
            icon={<DocMinusIcon />}
            value={0}
            label="Pending Requests"
            sublabel="No pending document requests"
          />
        </div>
      )}

      {/* Admin: filing structure + assistance */}
      {isAdmin && (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <section className="gov-card animate-rise p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-text-primary">Filing Structure</h2>
              <button
                onClick={() => onNavigate('categories')}
                className="text-sm font-semibold text-tile-blue transition-colors hover:text-navy-800"
              >
                View All
              </button>
            </div>
            <ul className="divide-y divide-border">
              {categoryStats.map((c, i) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNavigate('categories')}
                    className="group flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-white ${TILE_COLORS[i % TILE_COLORS.length]}`}>
                      <FolderIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">
                        {c.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-text-muted">
                        {c.subs} subcategor{c.subs === 1 ? 'y' : 'ies'}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-text-muted">
                      {c.subs}
                    </span>
                    <span className="text-text-muted transition-transform group-hover:translate-x-0.5">
                      <ChevronRightIcon />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <AssistCard
            title="Need Assistance?"
            text="For document-related concerns, please coordinate with the HR Unit."
            buttonLabel="User Management"
            onClick={() => onNavigate('users')}
          />
        </div>
      )}

      {/* Staff: documents + assistance */}
      {!isAdmin && (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <section className="gov-card animate-rise p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold text-text-primary">My 201 File</h2>
                <p className="mt-0.5 text-[13px] text-text-secondary">
                  View and manage the documents in your personal 201 file.
                </p>
              </div>
              <button
                onClick={() => onNavigate('employees')}
                className="flex items-center gap-1.5 rounded-[8px] bg-navy-btn px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110"
              >
                <PlusIcon /> Upload Document
              </button>
            </div>

            <div className="mt-3 flex gap-1 border-b border-border">
              {[
                { key: 'all', label: 'All Documents' },
                { key: 'updating', label: 'For Updating' }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStaffTab(t.key)}
                  className={`relative px-3 py-2 text-[13px] font-semibold transition-colors ${
                    staffTab === t.key ? 'text-navy-800' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t.label}
                  {staffTab === t.key && (
                    <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {staffTab === 'updating' ? (
              <div className="rounded-b-xl border border-t-0 border-border bg-white px-5 py-10 text-center text-sm text-text-muted">
                No documents need updating.
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-b-xl border border-t-0 border-border bg-white px-5 py-10 text-center text-sm text-text-muted">
                No files filed yet. Open an employee folder to begin filing documents.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-xl border border-t-0 border-border">
                <table className="gov-table w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="font-semibold text-text-primary">
                      <th className="w-10 px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">Document Name</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Date Uploaded</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {recent.map((f, i) => (
                      <tr key={f.id} className="transition-colors">
                        <td className="px-4 py-2.5 font-mono text-text-muted">{i + 1}</td>
                        <td className="max-w-52 truncate px-4 py-2.5 font-medium text-text-primary">
                          {f.file_name}
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">{f.subcategory_name}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-text-secondary">
                          {String(f.created_at).slice(0, 10)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-text">
                            Complete
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => window.api.files.openPath(f.id)}
                              title="View document"
                              className="rounded-lg p-1.5 text-tile-blue transition-colors hover:bg-info-bg"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => window.api.files.openPath(f.id)}
                              title="Download document"
                              className="rounded-lg p-1.5 text-tile-blue transition-colors hover:bg-info-bg"
                            >
                              <DownloadIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <AssistCard
            title="Need Assistance?"
            text="For document-related concerns, please coordinate with the HR Unit."
            buttonLabel="Send a Document Request"
            onClick={() => onNavigate('employees')}
          />
        </div>
      )}
    </div>
  )
}

function WelcomeCard({ user, isAdmin, onNavigate }) {
  return (
    <section className="gov-card animate-rise relative overflow-hidden">
      {/* Designer banner: whole image always visible (contain), anchored right-center */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${welcomeBannerUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: 'contain'
        }}
      />
      <div className="relative z-10 grid gap-5 p-5 lg:grid-cols-[1.25fr_1fr_0.8fr]">
        {/* Profile */}
        <div className="flex min-w-0 items-center gap-4">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="text-[16px] text-text-secondary">Good day,</p>
            <h2 className="truncate text-[26px] font-bold leading-tight text-text-primary">
              {user.full_name}
            </h2>
            <p className="mt-0.5 truncate text-[15px] font-medium capitalize text-text-secondary">
              {isAdmin ? 'Administrator' : user.role} · City Council Office
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => onNavigate('categories')}
                    className="rounded-[8px] bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-accent-dark"
                  >
                    Manage Categories
                  </button>
                  <button
                    onClick={() => onNavigate('users')}
                    className="rounded-[8px] border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-row-hover"
                  >
                    User Management
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('employees')}
                    className="rounded-[8px] bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-accent-dark"
                  >
                    Open Employees
                  </button>
                  <button
                    onClick={() => onNavigate('categories')}
                    className="rounded-[8px] border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-row-hover"
                  >
                    View Categories
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="flex flex-col justify-center gap-2 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <MiniStat label="Employee ID" value={`#${user.id}`} />
          <MiniStat label="Department" value="City Council Office" />
          <span className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase text-text-muted">Employment Status</span>
            <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold capitalize text-success-text">
              {user.status || 'active'}
            </span>
          </span>
        </div>

        {/* Quote */}
        <div className="hidden flex-col items-end justify-center text-right lg:flex">
          <p className="text-[15px] italic leading-relaxed text-text-primary">
            “Organized Records for a More Efficient Public Service.”
          </p>
          <span className="mt-2 inline-block h-[3px] w-10 rounded-full bg-accent" />
        </div>
      </div>
    </section>
  )
}

function AssistCard({ title, text, buttonLabel, onClick }) {
  return (
    <aside className="animate-rise rounded-2xl border border-border bg-gradient-to-br from-info-bg to-white p-5">
      <h2 className="text-[20px] font-bold text-text-primary">{title}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{text}</p>
      <button
        onClick={onClick}
        className="mt-4 flex items-center gap-2 rounded-[8px] bg-navy-btn px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110"
      >
        <DocIcon /> {buttonLabel}
      </button>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        Asenso Ozamiz
      </p>
    </aside>
  )
}

function MiniStat({ label, value }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-[11px] uppercase text-text-muted">{label}</span>
      <span className="text-[13px] font-semibold text-text-primary">{value}</span>
    </span>
  )
}

function Avatar({ user }) {
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className="h-[100px] w-[100px] shrink-0 rounded-full border-4 border-border object-cover"
      />
    )
  }
  return (
    <span className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full bg-[#D7E6F7] text-3xl font-bold text-navy-800">
      {initials(user?.full_name)}
    </span>
  )
}

function StatCard({ tile, icon, value, label, sublabel, onClick }) {
  const cls = 'gov-card group flex items-center gap-4 p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg'
  const inner = (
    <>
      <span className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[14px] text-white ${tile}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[36px] font-bold leading-none text-text-primary">{value}</span>
        <span className="mt-1 block truncate text-[15px] font-semibold text-text-primary">{label}</span>
        <span className="block truncate text-[12px] text-text-muted">{sublabel}</span>
      </span>
    </>
  )
  if (onClick) {
    return (
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function UserIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DocMinusIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
