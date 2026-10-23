import { useEffect, useMemo, useState } from 'react'
import WelcomeCard from '../components/WelcomeCard.jsx'

const PASTELS = [
  'bg-info-bg text-info-text',
  'bg-success-bg text-success-text',
  'bg-[#FFF6DB] text-[#9A6B00]',
  'bg-accent-soft text-accent-dark',
  'bg-danger-bg text-danger-text',
  'bg-[#EFE7FB] text-tile-purple',
  'bg-slate-100 text-tile-slate',
  'bg-[#D9F5F0] text-[#0E7C6B]'
]

const PAGE_SIZE = 5

export default function Dashboard({ user, onNavigate, onOpenFolder }) {
  const isAdmin = user.role === 'admin'
  const [stats, setStats] = useState({ employees: 0, files: 0, categories: 0, subcategories: 0 })
  const [recent, setRecent] = useState([])
  const [staffTab, setStaffTab] = useState('all')

  // Admin state (derived from existing endpoints only)
  const [emps, setEmps] = useState([])
  const [cats, setCats] = useState([])
  const [coverage, setCoverage] = useState(new Map())
  const [uploads, setUploads] = useState([])
  const [hires, setHires] = useState([])
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [activityExpanded, setActivityExpanded] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [empRes, catRes] = await Promise.all([
        window.api.employees.list({}),
        window.api.categories.listAll()
      ])
      if (!mounted) return

      if (empRes.ok) {
        const all = empRes.data
        const active = all.filter((e) => e.status !== 'inactive')
        setStats((s) => ({ ...s, employees: active.length }))
        if (!isAdmin) {
          const fileLists = await Promise.all(
            active.slice(0, 5).map(async (e) => {
              const f = await window.api.files.list(e.id)
              return (f.ok ? f.data : []).map((file) => ({ ...file, employee: e }))
            })
          )
          const list = fileLists.flat().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6)
          if (!mounted) return
          setStats((s) => ({ ...s, files: list.length }))
          setRecent(list)
        } else {
          setEmps(active)
          // Coverage matrix + uploads feed from existing files endpoint
          const fileLists = await Promise.all(
            active.map(async (e) => {
              const f = await window.api.files.list(e.id)
              return (f.ok ? f.data : []).map((file) => ({ ...file, employee: e }))
            })
          )
          if (!mounted) return
          const allFiles = fileLists.flat()
          setUploads(allFiles.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)))
          setHires([...active].sort((a, b) => (String(a.created_at) < String(b.created_at) ? 1 : -1)))
          setStats((s) => ({ ...s, files: allFiles.length }))
        }
      }
      if (catRes.ok) {
        const subTotal = catRes.data.reduce((n, c) => n + c.subcategories.length, 0)
        setStats((s) => ({ ...s, categories: catRes.data.length, subcategories: subTotal }))
        if (isAdmin && mounted) setCats(catRes.data)
      }
    })()
    return () => {
      mounted = false
    }
  }, [isAdmin])

  useEffect(() => {
    setTablePage(1)
  }, [tableSearch])

  // ---- Admin derived data (no new endpoints) ----
  const subToCat = useMemo(() => {
    const m = new Map()
    for (const c of cats) for (const s of c.subcategories || []) m.set(s.id, c.id)
    return m
  }, [cats])

  const empCats = useMemo(() => {
    // employee id -> Set(categoryId) built from already-fetched uploads
    const m = new Map()
    for (const f of uploads) {
      const cid = subToCat.get(f.subcategory_id)
      if (cid == null) continue
      if (!m.has(f.employee_id)) m.set(f.employee_id, new Set())
      m.get(f.employee_id).add(cid)
    }
    return m
  }, [uploads, subToCat])

  // Keep a lightweight coverage map in sync for table/preview use
  useEffect(() => {
    setCoverage(empCats)
  }, [empCats])

  const catIds = useMemo(() => cats.map((c) => c.id), [cats])
  const isComplete = (emp) => {
    if (catIds.length === 0) return false
    const set = coverage.get(emp.id)
    if (!set) return false
    return catIds.every((id) => set.has(id))
  }

  const filteredEmps = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return emps
    return emps.filter((e) =>
      `${e.complete_name} ${e.position} ${e.office || ''} ${e.record_no || ''}`.toLowerCase().includes(q)
    )
  }, [emps, tableSearch])

  const completeCount = useMemo(() => emps.filter(isComplete).length, [emps, coverage, catIds])
  const incompleteCount = emps.length - completeCount
  const completePct = emps.length ? Math.round((completeCount / emps.length) * 100) : 0

  // ---- Report-style analytics (all derived client-side, no new endpoints) ----
  const docsByCat = useMemo(() => {
    return [...cats].sort((a, b) => (Number(b.file_count) || 0) - (Number(a.file_count) || 0))
  }, [cats])
  const maxCatFiles = useMemo(
    () => docsByCat.reduce((n, c) => Math.max(n, Number(c.file_count) || 0), 0),
    [docsByCat]
  )

  const trend = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en', { month: 'short' }),
        count: 0
      })
    }
    const map = new Map(months.map((m) => [m.key, m]))
    for (const f of uploads) {
      const k = String(f.created_at || '').slice(0, 7)
      if (map.has(k)) map.get(k).count += 1
    }
    return months
  }, [uploads])
  const maxTrend = useMemo(() => trend.reduce((n, m) => Math.max(n, m.count), 0), [trend])

  const officeTops = useMemo(() => {
    const m = new Map()
    for (const e of emps) {
      const k = (e.office || '').trim() || 'Unassigned'
      m.set(k, (m.get(k) || 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [emps])
  const maxOffice = useMemo(() => officeTops.reduce((n, [, c]) => Math.max(n, c), 0), [officeTops])

  // File-type breakdown for the donut (PDF / Word / Excel / PowerPoint / Images / Other)
  const fileTypes = useMemo(() => {
    const groups = [
      { key: 'pdf', label: 'PDF Documents', hex: '#E5383B', match: ['pdf'] },
      { key: 'word', label: 'Word', hex: '#1E6BE6', match: ['doc', 'docx'] },
      { key: 'excel', label: 'Excel', hex: '#19A55A', match: ['xls', 'xlsx'] },
      { key: 'ppt', label: 'PowerPoint', hex: '#F7861E', match: ['ppt', 'pptx'] },
      { key: 'img', label: 'Images', hex: '#7B3FE4', match: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
    const counts = groups.map((g) => ({ ...g, value: 0 }))
    let other = 0
    for (const f of uploads) {
      const ext = String(f.file_name || '').split('.').pop()?.toLowerCase() || ''
      const g = counts.find((x) => x.match.includes(ext))
      if (g) g.value += 1
      else other += 1
    }
    const out = counts.filter((g) => g.value > 0)
    if (other > 0) out.push({ key: 'other', label: 'Other', hex: '#6B7C99', match: [], value: other })
    return out
  }, [uploads])

  // Employees with zero filed documents (uses existing file_count)
  const noFiles = useMemo(() => emps.filter((e) => (e.file_count || 0) === 0), [emps])

  const avgDocs = emps.length ? (stats.files / emps.length).toFixed(1) : '0'
  const totalSize = useMemo(
    () => uploads.reduce((n, f) => n + (Number(f.file_size) || 0), 0),
    [uploads]
  )

  const catCounts = useMemo(() => {
    return cats.map((c) => {
      let n = 0
      for (const e of emps) {
        const set = coverage.get(e.id)
        if (set && set.has(c.id)) n += 1
      }
      return { ...c, count: n }
    })
  }, [cats, emps, coverage])

  const selected = useMemo(() => {
    if (!emps.length) return null
    return emps.find((e) => e.id === selectedId) || filteredEmps[0] || emps[0]
  }, [emps, filteredEmps, selectedId])

  const selectedCats = useMemo(() => {
    if (!selected) return new Set()
    return coverage.get(selected.id) || new Set()
  }, [selected, coverage])

  const activityFeed = useMemo(() => {
    const items = [
      ...uploads.map((f) => ({
        key: `u-${f.id}`,
        type: 'upload',
        title: 'Document uploaded',
        detail: `${f.file_name} (${f.employee?.complete_name || 'Unknown'})`,
        at: f.created_at
      })),
      ...hires.map((e) => ({
        key: `h-${e.id}`,
        type: 'add',
        title: 'New employee added',
        detail: e.complete_name,
        at: e.created_at
      }))
    ]
    return items
      .sort((a, b) => (String(a.at) < String(b.at) ? 1 : -1))
      .slice(0, 12)
  }, [uploads, hires])

  const totalPages = Math.max(1, Math.ceil(filteredEmps.length / PAGE_SIZE))
  const safePage = Math.min(tablePage, totalPages)
  const pageRows = filteredEmps.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="mx-auto w-full">
      <WelcomeCard user={user} isAdmin={isAdmin} />

      {/* Row 1: stat cards */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <StatCard
            tile="bg-tile-orange"
            icon={<FolderIcon />}
            value={emps.length}
            label="Total Employees"
            sublabel="Active Employees"
          />
          <StatCard
            tile="bg-tile-blue"
            icon={<FileIcon />}
            value={stats.files.toLocaleString()}
            label="Total Documents"
            sublabel="Across all 201 files"
          />
          <StatCard
            tile="bg-tile-green"
            icon={<CheckCircleIcon />}
            value={completeCount}
            label="Complete Files"
            sublabel={`${completePct}% complete`}
          />
          <StatCard
            tile="bg-tile-red"
            icon={<AlertIcon />}
            value={incompleteCount}
            label="Incomplete Files"
            sublabel={`${100 - completePct}% incomplete`}
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
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

      {/* Row 2: admin table + categories */}
      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          {/* Employee Records table (8 cols) */}
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Employee Records</h2>
              <button
                onClick={() => onNavigate('employees')}
                className="flex items-center gap-1.5 rounded-[8px] bg-navy-btn px-3 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110 lg:px-4 lg:py-2.5 lg:text-sm"
              >
                <PlusIcon /> Add Employee
              </button>
            </div>
            <div className="relative mb-3">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                <SearchIcon />
              </span>
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search employee name, position, or department..."
                className="h-10 w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="gov-table w-full min-w-[720px] text-left text-[12px] lg:text-[13px]">
                <thead>
                  <tr className="font-semibold text-text-primary">
                    <th className="w-10 px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Employee Name</th>
                    <th className="px-4 py-2.5">Position</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">201 File Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {pageRows.map((emp, i) => {
                    const done = isComplete(emp)
                    const active = selected?.id === emp.id
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedId(emp.id)}
                        className={`cursor-pointer transition-colors ${active ? 'bg-info-bg/40' : ''}`}
                      >
                        <td className="px-4 py-2.5 font-mono text-text-muted">
                          {(safePage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="max-w-52 truncate px-4 py-2.5 font-medium text-text-primary">
                          {emp.complete_name}
                        </td>
                        <td className="max-w-44 truncate px-4 py-2.5 text-text-secondary">{emp.position}</td>
                        <td className="max-w-44 truncate px-4 py-2.5 text-text-secondary">{emp.office || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${done ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                            {done ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenFolder && onOpenFolder(emp)}
                              title="Open 201 folder"
                              className="rounded-lg p-1.5 text-tile-blue transition-colors hover:bg-info-bg hover:text-navy-800"
                            >
                              <FolderIconSm />
                            </button>
                            <button
                              onClick={() => setSelectedId(emp.id)}
                              title="View in preview"
                              className="rounded-lg p-1.5 text-tile-blue transition-colors hover:bg-info-bg hover:text-navy-800"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => onNavigate('employees')}
                              title="Edit record"
                              className="rounded-lg p-1.5 text-tile-blue transition-colors hover:bg-info-bg hover:text-navy-800"
                            >
                              <EditIconSm />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                        No employees match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary transition-colors hover:bg-row-hover disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setTablePage(n)}
                  className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs transition-colors ${
                    n === safePage
                      ? 'bg-navy-900 font-semibold text-white'
                      : 'border border-border bg-white text-text-secondary hover:bg-row-hover'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary transition-colors hover:bg-row-hover disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </section>

          {/* Document Categories (4 cols) */}
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-text-primary lg:text-[16px]">Document Categories</h2>
              <button
                onClick={() => onNavigate('categories')}
                className="text-[12px] font-semibold text-tile-blue transition-colors hover:text-navy-800 lg:text-[13px]"
              >
                View All
              </button>
            </div>
            <ul className="space-y-2">
              {catCounts.map((c, i) => {
                const tone = PASTELS[i % PASTELS.length]
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onNavigate('categories')}
                      className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-150 hover:shadow-sm ${tone.split(' ')[0]}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                        <FolderIcon />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold lg:text-[13px]">
                        {c.name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] font-bold lg:text-[12px]">
                        {c.count} / {emps.length}
                      </span>
                      <span className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5">
                        <ChevronRightIcon />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      {/* Row 3: admin preview + recent activities */}
      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          {/* 201 File Preview (8 cols) */}
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Employee 201 File Preview</h2>
              <button
                onClick={() => selected && onOpenFolder && onOpenFolder(selected)}
                className="text-[12px] font-semibold text-tile-blue transition-colors hover:text-navy-800 lg:text-[13px]"
              >
                View Full File
              </button>
            </div>
            {selected ? (
              <>
                <div className="rounded-xl bg-row-hover/60 p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar emp={selected} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-text-primary lg:text-[17px]">
                          {selected.complete_name}
                        </div>
                        <div className="truncate text-[12px] text-text-secondary">{selected.position}</div>
                        <div className="truncate text-[11px] text-text-muted">
                          {selected.office ? `${selected.office} Department` : '—'}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] text-text-muted">
                            Employee ID: {selected.record_no}
                          </span>
                          <StatusPill done={isComplete(selected)} />
                        </div>
                      </div>
                    </div>
                    <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-2 text-[11px] lg:text-[12px]">
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-text-muted">Date Hired</dt>
                        <dd className="font-medium text-text-primary">{fmtDate(selected.date_hired)}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-text-muted">Employment Status</dt>
                        <dd className="font-medium capitalize text-text-primary">{String(selected.status || '').replace(/_/g, ' ')}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-text-muted">Position</dt>
                        <dd className="truncate font-medium text-text-primary">{selected.position}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase text-text-muted">Department</dt>
                        <dd className="truncate font-medium text-text-primary">{selected.office || '—'}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-mono text-[10px] uppercase text-text-muted">Email</dt>
                        <dd className="truncate font-medium text-text-primary">{selected.email || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-text-primary lg:text-[14px]">Document Checklist</h3>
                    <span className="font-mono text-[11px] text-text-muted">
                      {selectedCats.size} / {catIds.length} completed
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-row-hover">
                    <span
                      className="animate-progress block h-full rounded-full bg-success-bar"
                      style={{ width: `${catIds.length ? Math.round((selectedCats.size / catIds.length) * 100) : 0}%` }}
                    />
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                    {cats.map((c) => {
                      const has = selectedCats.has(c.id)
                      return (
                        <li key={c.id} className="flex items-center gap-2 text-[12px] lg:text-[13px]">
                          {has ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-success-bar text-white">
                              <CheckSmIcon />
                            </span>
                          ) : (
                            <span className="h-5 w-5 shrink-0 rounded-md border-2 border-border bg-white" />
                          )}
                          <span className={has ? 'text-text-primary' : 'text-text-muted'}>{c.name}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-text-muted">
                No employees on record yet.
              </div>
            )}
          </section>

          {/* Recent Activities (4 cols) */}
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-text-primary lg:text-[16px]">Recent Activities</h2>
              {activityFeed.length > 5 && (
                <button
                  onClick={() => setActivityExpanded((v) => !v)}
                  className="text-[12px] font-semibold text-tile-blue transition-colors hover:text-navy-800 lg:text-[13px]"
                >
                  {activityExpanded ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>
            {activityFeed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-[13px] text-text-muted">
                No activity yet. Uploads and new employees will appear here.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(activityExpanded ? activityFeed : activityFeed.slice(0, 5)).map((a) => (
                  <li key={a.key} className="flex items-start gap-2.5 py-2.5">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${a.type === 'upload' ? 'bg-tile-green' : 'bg-tile-orange'}`}>
                      {a.type === 'upload' ? <UploadSmIcon /> : <UserPlusSmIcon />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold text-text-primary lg:text-[13px]">{a.title}</span>
                      <span className="block truncate text-[11px] text-text-muted">{a.detail}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-text-muted">
                      {timeAgo(a.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Reports & analytics eyebrow */}
      {isAdmin && (
        <div className="mb-3 mt-6 flex items-center gap-3 lg:mb-4">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[2px] text-text-muted lg:text-[11px]">
            Reports & Analytics
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] text-text-muted">live from system data</span>
        </div>
      )}

      {/* Row 4 (admin): analytics — documents by category + completion donut */}
      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Documents by Category</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
                  Filed documents per category across all employees
                </p>
              </div>
              <span className="rounded-full bg-row-hover px-2.5 py-1 font-mono text-[11px] font-semibold text-text-primary">
                {stats.files.toLocaleString()} total
              </span>
            </div>
            <ul className="mt-2 space-y-2.5">
              {docsByCat.map((c, i) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3 text-[12px] lg:text-[13px]">
                    <span className="min-w-0 flex-1 truncate font-medium text-text-primary">{c.name}</span>
                    <span className="shrink-0 font-mono text-[11px] text-text-muted">
                      {(Number(c.file_count) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-row-hover">
                    <span
                      className={`animate-progress block h-full rounded-full ${['bg-tile-blue', 'bg-tile-green', 'bg-tile-yellow', 'bg-accent', 'bg-tile-red', 'bg-tile-purple', 'bg-slate-400', 'bg-teal-500'][i % 8]}`}
                      style={{ width: `${maxCatFiles ? Math.round(((Number(c.file_count) || 0) / maxCatFiles) * 100) : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="gov-card animate-rise flex flex-col items-center p-4 text-center lg:p-5">
            <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Completion Rate</h2>
            <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
              Employees with all {catIds.length} categories filed
            </p>
            <div className="relative mt-3 h-36 w-36 lg:h-40 lg:w-40">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="stroke-row-hover" />
                <circle
                  cx="60" cy="60" r="54" fill="none" strokeWidth="12" strokeLinecap="round"
                  className="stroke-success-bar"
                  strokeDasharray={`${(completePct / 100) * 339.29} 339.29`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-bold leading-none text-text-primary lg:text-[32px]">{completePct}%</span>
                <span className="mt-1 font-mono text-[10px] uppercase text-text-muted">complete</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 font-medium text-text-primary">
                <span className="h-2.5 w-2.5 rounded-sm bg-success-bar" /> {completeCount} complete
              </span>
              <span className="flex items-center gap-1.5 font-medium text-text-primary">
                <span className="h-2.5 w-2.5 rounded-sm bg-danger-bg" /> {incompleteCount} incomplete
              </span>
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 border-t border-border pt-3 text-left">
              <div className="rounded-xl bg-row-hover/70 px-3 py-2">
                <div className="font-mono text-[10px] uppercase text-text-muted">Avg docs / employee</div>
                <div className="text-[16px] font-bold text-text-primary lg:text-[18px]">{avgDocs}</div>
              </div>
              <div className="rounded-xl bg-row-hover/70 px-3 py-2">
                <div className="font-mono text-[10px] uppercase text-text-muted">Storage used</div>
                <div className="text-[16px] font-bold text-text-primary lg:text-[18px]">{formatSize(totalSize)}</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Row 5 (admin): filing trend + top offices */}
      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Filing Trend</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
                  Documents filed per month, last 6 months
                </p>
              </div>
              <span className="rounded-full bg-row-hover px-2.5 py-1 font-mono text-[11px] font-semibold text-text-primary">
                {trend.reduce((n, m) => n + m.count, 0)} in period
              </span>
            </div>
            <div className="mt-3 flex h-36 items-end gap-2 lg:h-44 lg:gap-3">
              {trend.map((m) => (
                <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="font-mono text-[10px] font-semibold text-text-muted lg:text-[11px]">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div
                    title={`${m.label}: ${m.count} document${m.count === 1 ? '' : 's'}`}
                    className={`animate-progress w-full max-w-12 rounded-t-lg ${m.count > 0 ? 'bg-gradient-to-t from-navy-800 to-tile-blue' : 'bg-row-hover'}`}
                    style={{ height: `${maxTrend ? Math.max(6, Math.round((m.count / maxTrend) * 100)) : 6}%` }}
                  />
                  <span className="font-mono text-[10px] uppercase text-text-muted lg:text-[11px]">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-1">
              <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Top Offices</h2>
              <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
                Headcount by office
              </p>
            </div>
            <ul className="mt-2 space-y-2.5">
              {officeTops.map(([name, count], i) => (
                <li key={name}>
                  <div className="flex items-center justify-between gap-3 text-[12px] lg:text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold text-white ${['bg-tile-blue', 'bg-tile-green', 'bg-tile-orange', 'bg-tile-purple', 'bg-tile-slate'][i % 5]}`}>
                        {i + 1}
                      </span>
                      <span className="truncate">{name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-text-muted">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-row-hover">
                    <span
                      className="animate-progress block h-full rounded-full bg-gradient-to-r from-navy-800 to-tile-blue"
                      style={{ width: `${maxOffice ? Math.round((count / maxOffice) * 100) : 0}%` }}
                    />
                  </div>
                </li>
              ))}
              {officeTops.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-5 py-6 text-center text-[13px] text-text-muted">
                  No office data yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      )}

      {/* Row 6 (admin): file types + needs attention */}
      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          <section className="gov-card animate-rise flex flex-col items-center p-4 text-center lg:p-5">
            <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Documents by File Type</h2>
            <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
              Format mix across the registry
            </p>
            {fileTypes.length === 0 ? (
              <div className="w-full rounded-xl border border-dashed border-border px-5 py-8 text-center text-[13px] text-text-muted">
                No documents filed yet.
              </div>
            ) : (
              <>
                <Donut segments={fileTypes} size={148}>
                  <span className="text-[24px] font-bold leading-none text-text-primary lg:text-[28px]">
                    {stats.files.toLocaleString()}
                  </span>
                  <span className="mt-1 font-mono text-[10px] uppercase text-text-muted">files</span>
                </Donut>
                <ul className="mt-3 grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-left">
                  {fileTypes.map((t) => (
                    <li key={t.key} className="flex min-w-0 items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: t.hex }} />
                      <span className="min-w-0 flex-1 truncate font-medium text-text-primary">{t.label}</span>
                      <span className="shrink-0 font-mono text-text-muted">{t.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="gov-card animate-rise overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-gradient-to-r from-danger-bg/60 to-transparent p-4 lg:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-tile-red text-white shadow-sm">
                <AlertIcon />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">Needs Attention</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
                  {noFiles.length === 0
                    ? 'Everyone has at least one filed document.'
                    : `${noFiles.length} employee${noFiles.length === 1 ? '' : 's'} with nothing on record yet`}
                </p>
              </div>
              {noFiles.length > 0 && (
                <span className="rounded-full bg-danger-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-danger-text">
                  {noFiles.length} to file
                </span>
              )}
            </div>
            {noFiles.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-7 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success-text">
                  <CheckCircleIcon />
                </span>
                <p className="mt-2.5 text-[13px] font-semibold text-text-primary">All clear</p>
                <p className="mt-0.5 text-[12px] text-text-secondary">No employees are missing documents.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border px-4 lg:px-5">
                {noFiles.slice(0, 4).map((e, i) => (
                  <li key={e.id}>
                    <button
                      onClick={() => onNavigate('employees')}
                      className="group -mx-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-row-hover"
                    >
                      <span className="w-5 shrink-0 text-center font-mono text-[11px] font-semibold text-text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-danger-bg to-warning-bg text-[11px] font-bold text-danger-text">
                        {initials(e.complete_name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-text-primary">
                          {e.complete_name}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-text-muted">
                          {e.record_no}{e.office ? ` · ${e.office}` : ''}
                        </span>
                      </span>
                      <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning-text">
                        No files
                      </span>
                      <span className="text-text-muted transition-transform group-hover:translate-x-0.5">
                        <ChevronRightIcon />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {noFiles.length > 4 && (
              <div className="px-4 pb-3 lg:px-5">
                <button
                  onClick={() => onNavigate('employees')}
                  className="text-[12px] font-semibold text-tile-blue hover:text-navy-800"
                >
                  View all {noFiles.length} →
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Staff: documents + assistance */}
      {!isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-5 lg:gap-4">
          <section className="gov-card animate-rise p-4 lg:p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">My 201 File</h2>
                <p className="mt-0.5 text-[11px] text-text-secondary lg:text-[12px]">
                  View and manage the documents in your personal 201 file.
                </p>
              </div>
              <button
                onClick={() => onNavigate('employees')}
                className="flex items-center gap-1.5 rounded-[8px] bg-navy-btn px-3 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110 lg:px-4 lg:py-2.5 lg:text-sm"
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
                  className={`relative px-3 py-1.5 text-[12px] font-semibold transition-colors lg:py-2 lg:text-[13px] ${
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
                <table className="gov-table w-full min-w-[600px] text-left text-[12px]">
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

function StatusPill({ done }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${done ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
      {done ? 'Complete' : 'Incomplete'}
    </span>
  )
}

function Avatar({ emp }) {
  if (emp?.profile_pic) {
    return (
      <img
        src={emp.profile_pic}
        alt={emp.complete_name}
        className="h-16 w-16 shrink-0 rounded-full border-2 border-border object-cover lg:h-[72px] lg:w-[72px]"
      />
    )
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-white lg:h-[72px] lg:w-[72px] lg:text-xl">
      {initials(emp?.complete_name)}
    </span>
  )
}

function timeAgo(ts) {
  const t = new Date(String(ts || '').replace(' ', 'T')).getTime()
  if (Number.isNaN(t)) return String(ts || '').slice(0, 10)
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`
  const y = Math.floor(mo / 12)
  return `${y} year${y === 1 ? '' : 's'} ago`
}

function fmtDate(iso) {
  if (!iso) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  if (!y || !m || !d) return String(iso).slice(0, 10)
  return `${months[Number(m) - 1] || ''} ${Number(d)}, ${y}`
}

function AssistCard({ title, text, buttonLabel, onClick }) {
  return (
    <aside className="animate-rise rounded-2xl border border-border bg-gradient-to-br from-info-bg to-white p-4 lg:p-5">
      <h2 className="text-[14px] font-bold text-text-primary lg:text-[17px]">{title}</h2>
      <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary lg:text-[12px]">{text}</p>
      <button
        onClick={onClick}
        className="mt-4 flex items-center gap-2 rounded-[8px] bg-navy-btn px-3 py-2 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-110 lg:px-4 lg:py-2.5 lg:text-sm"
      >
        <DocIcon /> {buttonLabel}
      </button>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        Asenso Ozamiz
      </p>
    </aside>
  )
}

function Donut({ segments, size = 148, thickness = 14, children }) {
  const total = segments.reduce((n, s) => n + (Number(s.value) || 0), 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative mt-3 shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-row-hover" />
        {segments.map((s, i) => {
          const frac = (Number(s.value) || 0) / total
          const off = -acc * c
          acc += frac
          if (frac <= 0) return null
          return (
            <circle
              key={s.key || i}
              cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness}
              strokeLinecap="round" style={{ stroke: s.hex || '#6B7C99' }}
              strokeDasharray={`${frac * c} ${c}`}
              strokeDashoffset={off}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

function StatCard({ tile, icon, value, label, sublabel, onClick }) {
  const cls =
    'gov-card group flex items-center gap-2.5 p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg lg:gap-3 lg:p-3'
  const inner = (
    <>
      <span
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] text-white lg:h-[54px] lg:w-[54px] lg:rounded-[12px] ${tile}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[19px] font-bold leading-none text-text-primary lg:text-[26px]">
          {value}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-text-primary lg:mt-1 lg:text-[13px]">
          {label}
        </span>
        <span className="block truncate text-[9px] text-text-muted lg:text-[11px]">{sublabel}</span>
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

function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function UserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DocMinusIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function FolderIconSm() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function EditIconSm() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function CheckSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function UploadSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function UserPlusSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
