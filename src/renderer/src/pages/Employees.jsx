import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import DateInput from '../components/DateInput.jsx'
import { StatusDot } from '../components/StatusDot.jsx'
import Toast from '../components/Toast.jsx'

const EMPTY = {
  complete_name: '', position: '', office: '', plantilla_item: '', salary_grade: '', salary_step: '',
  birthday: '', status: 'permanent', date_hired: '', contact_number: '', email: '',
  complete_address: '', profile_pic: ''
}
const PAGE_SIZE = 10

const money = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n) || 0)

export default function Employees({ onOpenFolder }) {
  const [employees, setEmployees] = useState([])
  const [offices, setOffices] = useState([])
  const [salaryGrades, setSalaryGrades] = useState([])
  const [salaryGroups, setSalaryGroups] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const load = async (q = search) => {
    const res = await window.api.employees.list({ search: q })
    if (res.ok) setEmployees(res.data)
  }

  useEffect(() => {
    load('')
    ;(async () => {
      const [o, g, grp] = await Promise.all([
        window.api.offices.list({}),
        window.api.salaryGrades.list({}),
        window.api.salaryGrades.listGrouped({}),
      ])
      if (o.ok) setOffices(o.data)
      if (g.ok) setSalaryGrades(g.data)
      if (grp.ok) setSalaryGroups(grp.data)
    })()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const filtered = useMemo(() => {
    let base
    if (statusFilter === 'inactive') base = employees.filter((e) => e.status === 'inactive')
    else if (statusFilter === 'all') base = employees.filter((e) => e.status !== 'inactive')
    else base = employees.filter((e) => e.status === statusFilter)
    const sorted = [...base].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [employees, statusFilter, sortBy, sortDir])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir(col === 'id' ? 'desc' : 'asc') }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...EMPTY, ...editing }
    const res = editing.id
      ? await window.api.employees.update(editing.id, payload)
      : await window.api.employees.create(payload)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(null)
    setToast({ message: `Saved employee "${res.data.complete_name}".`, tone: 'success' })
    load()
  }

  const handlePic = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setEditing((prev) => ({ ...prev, profile_pic: reader.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, position, office, email…"
              className="w-80 rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-white py-2.5 pl-3 pr-2.5 text-sm transition-all focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/20">
            <span className="text-ink/35">
              <StatusIcon />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">Status</span>
            <Select
              variant="chip"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'permanent', label: 'Permanent' },
                { value: 'job_order', label: 'Job Order' },
                { value: 'contract_of_service', label: 'Contract of Service' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink/40">{filtered.length} on record</span>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
          >
            <PlusIcon />
            Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-navy/[0.04] font-mono text-[10px] uppercase tracking-[1.5px] text-ink/45">
              <th className="cursor-pointer select-none px-5 py-3.5 hover:text-ink" onClick={() => toggleSort('id')}>
                <span className="inline-flex items-center gap-1">ID {sortBy === 'id' && <SortArrow dir={sortDir} />}</span>
              </th>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Office</th>
              <th className="px-5 py-3.5">Employment Status</th>
              <th className="px-5 py-3.5">Date Hired</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pageRows.map((emp) => (
              <tr key={emp.id} className="group transition-colors hover:bg-paper/70">
                <td className="px-5 py-3.5 font-mono text-xs text-ink/60">#{emp.id}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <Avatar emp={emp} />
                    <div className="min-w-0">
                      <button
                        onClick={() => onOpenFolder(emp)}
                        className="block max-w-52 truncate text-left font-medium text-ink transition-colors hover:text-orange"
                        title="Open folder"
                      >
                        {emp.complete_name}
                      </button>
                      <div className="font-mono text-[11px] text-ink/45">
                        {emp.record_no} · {emp.file_count} file(s)
                      </div>
                    </div>
                  </div>
                </td>
                <td className="max-w-52 truncate px-5 py-3.5 text-ink/70">{emp.office || '—'}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      statusCls(emp.status)
                    }`}
                  >
                    <StatusDot status={emp.status} />
                    {emp.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-ink/60">{emp.date_hired || '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onOpenFolder(emp)}
                      title="Open folder"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-navy/5 hover:text-navy"
                    >
                      <FolderIcon />
                    </button>
                    <button
                      onClick={() => setEditing({ ...emp })}
                      title="Edit"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-orange-soft hover:text-orange"
                    >
                      <EditIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink/40">
                  {employees.length === 0 ? 'No employee records yet.' : 'No employees match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-xs text-ink/40">
          {filtered.length === 0 ? 'No results' : `Showing ${from}–${to} of ${filtered.length}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink/60 transition-colors hover:bg-paper-dark disabled:opacity-40"
            >
              <ChevronIcon dir="left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs transition-colors ${
                  n === safePage
                    ? 'bg-orange font-semibold text-white shadow-md shadow-orange/25'
                    : 'border border-hairline bg-white text-ink/60 hover:bg-paper-dark'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink/60 transition-colors hover:bg-paper-dark disabled:opacity-40"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Employee' : 'Add Employee'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-hairline bg-paper px-4 py-3">
              <div className="relative shrink-0">
                <Avatar emp={editing} size="lg" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  title="Change photo"
                  className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white shadow-md shadow-orange/30 transition-transform hover:scale-105"
                >
                  <CameraIcon />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-ink">Profile photo</div>
                <p className="mt-0.5 text-[11px] leading-snug text-ink/45">Optional · JPG, PNG or GIF</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePic}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink/70 transition-colors hover:bg-paper-dark"
                >
                  {editing.profile_pic ? 'Change' : 'Upload'}
                </button>
                {editing.profile_pic && (
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, profile_pic: '' })}
                    className="rounded-lg border border-status-red/30 bg-status-red/5 px-2.5 py-1.5 text-[11px] font-medium text-status-red transition-colors hover:bg-status-red/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Personal Information</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Complete Name" required>
                  <input
                    className={inputCls}
                    value={editing.complete_name}
                    onChange={(e) => setEditing({ ...editing, complete_name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Birthday">
                  <DateInput
                    value={editing.birthday || ''}
                    onChange={(v) => setEditing({ ...editing, birthday: v })}
                  />
                </Field>
                <Field label="Contact Number">
                  <input
                    className={inputCls}
                    value={editing.contact_number || ''}
                    onChange={(e) => setEditing({ ...editing, contact_number: e.target.value })}
                    placeholder="e.g. 09xx xxx xxxx"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    className={inputCls}
                    value={editing.email || ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Complete Address">
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={editing.complete_address || ''}
                    onChange={(e) => setEditing({ ...editing, complete_address: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div>
              <SectionLabel>Employment Details</SectionLabel>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Position" required>
                  <input
                    className={inputCls}
                    value={editing.position}
                    onChange={(e) => setEditing({ ...editing, position: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Office">
                  <Select
                    variant="form"
                    value={editing.office || ''}
                    onChange={(v) => setEditing({ ...editing, office: v })}
                    placeholder={offices.length === 0 ? 'No offices yet' : 'Select office…'}
                    options={offices.map((o) => ({
                      value: o.name,
                      label: o.status === 'inactive' ? `${o.name} (inactive)` : o.name
                    }))}
                  />
                </Field>
                <Field label="Plantilla Item">
                  <input
                    className={inputCls}
                    value={editing.plantilla_item || ''}
                    onChange={(e) => setEditing({ ...editing, plantilla_item: e.target.value })}
                    placeholder="e.g. Plantilla 18-04"
                  />
                </Field>
                <Field label="Salary Grade">
                  <Select
                    variant="form"
                    value={editing.salary_grade || ''}
                    onChange={(v) => {
                      const gradeNum = Number(String(v).split('-')[1])
                      const max = gradeNum === 33 ? 2 : 8
                      let step = editing.salary_step
                      if (step && Number(step) > max) step = ''
                      setEditing({ ...editing, salary_grade: v, salary_step: step })
                    }}
                    placeholder={salaryGroups.length === 0 ? 'No salary grades yet' : 'Select salary grade…'}
                    options={(salaryGroups.length ? salaryGroups : (() => {
                      const m = new Map()
                      salaryGrades.forEach((r) => { if (!m.has(r.grade)) m.set(r.grade, r) })
                      return Array.from(m.values()).map((g) => ({ grade: g.grade, minSalary: g.salary, maxSalary: g.salary, count: 1 }))
                    })()).map((g) => ({
                      value: g.grade,
                      label: `${g.grade} — ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(g.minSalary) || 0)}${g.maxSalary !== g.minSalary ? ` – ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(g.maxSalary) || 0)}` : ''} · ${g.count} step(s)`,
                    }))}
                  />
                  {editing.salary_grade && (() => {
                    const g = salaryGroups.find((x) => x.grade === editing.salary_grade)
                    if (!g) return null
                    const max = g.gradeNum === 33 ? 2 : 8
                    return <p className="mt-1 font-mono text-[10px] text-ink/40">{g.minSalary !== g.maxSalary ? `${money(g.minSalary)} – ${money(g.maxSalary)}` : money(g.minSalary)} · {g.count}/{max} steps</p>
                  })()}
                </Field>
                <Field label="SG Step">
                  <Select
                    variant="form"
                    value={editing.salary_step ? String(editing.salary_step) : ''}
                    onChange={(v) => setEditing({ ...editing, salary_step: v })}
                    placeholder={editing.salary_grade ? 'Select step…' : 'Select grade first'}
                    options={(() => {
                      if (!editing.salary_grade) return []
                      const g = salaryGroups.find((x) => x.grade === editing.salary_grade)
                      const max = g ? (g.gradeNum === 33 ? 2 : 8) : 8
                      const opts = []
                      for (let i = 1; i <= max; i++) {
                        const row = g ? g.steps.find((s) => s.step === i) : salaryGrades.find((r) => r.grade === editing.salary_grade && r.step === i)
                        const sal = row ? Number(row.salary) : null
                        opts.push({
                          value: String(i),
                          label: sal ? `Step ${i} — ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(sal)}` : `Step ${i}`,
                        })
                      }
                      return opts
                    })()}
                  />
                  {editing.salary_grade && editing.salary_step && (() => {
                    const g = salaryGroups.find((x) => x.grade === editing.salary_grade)
                    const row = g ? g.steps.find((s) => s.step === Number(editing.salary_step)) : salaryGrades.find((r) => r.grade === editing.salary_grade && r.step === Number(editing.salary_step))
                    if (!row) return <p className="mt-1 font-mono text-[10px] text-status-amber">No salary set for this step yet — will save step assignment only.</p>
                    return <p className="mt-1 font-mono text-[11px] font-semibold text-navy">→ {money(row.salary)}/mo · {money(row.salary / 22)}/day (casual)</p>
                  })()}
                </Field>
                <Field label="Date Hired">
                  <DateInput
                    value={editing.date_hired || ''}
                    onChange={(v) => setEditing({ ...editing, date_hired: v })}
                  />
                </Field>
                <Field label="Employment Status">
                  <Select
                    variant="form"
                    value={editing.status}
                    onChange={(v) => setEditing({ ...editing, status: v })}
                    options={[
                      { value: 'permanent', label: 'Permanent' },
                      { value: 'job_order', label: 'Job Order' },
                      { value: 'contract_of_service', label: 'Contract of Service' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-status-red/30 bg-status-red/5 px-3 py-2 text-xs text-status-red">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 transition-colors hover:bg-paper-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 active:scale-[.98]"
              >
                <SaveIcon />
                Save Employee
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

function SectionLabel({ children }) {
  return (
    <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[1.5px] text-ink/40">{children}</div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink/60">
        {label} {required && <span className="text-orange">*</span>}
      </label>
      {children}
    </div>
  )
}

function statusCls(status) {
  switch (status) {
    case 'permanent': return 'bg-status-green/10 text-status-green'
    case 'job_order': return 'bg-status-amber/10 text-status-amber'
    case 'contract_of_service': return 'bg-navy/10 text-navy'
    case 'inactive': return 'bg-status-red/10 text-status-red'
    default: return 'bg-ink/5 text-ink/45'
  }
}

function Avatar({ emp, size = 'md' }) {
  const sizes = {
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-sm'
  }
  const cls = sizes[size] || sizes.md
  if (emp?.profile_pic) {
    return (
      <img
        src={emp.profile_pic}
        alt={emp.complete_name}
        className={`${cls} shrink-0 rounded-full border border-hairline object-cover`}
      />
    )
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-navy/5 font-heading font-bold text-navy`}
    >
      {initials(emp?.complete_name)}
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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function StatusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function ChevronIcon({ dir = 'right' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dir === 'down' ? 'rotate-90' : dir === 'left' ? 'rotate-180' : ''}
    >
      <polyline points="9 18 15 12 9 6" />
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

function SaveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SortArrow({ dir }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={dir === 'asc' ? 'rotate-180' : ''}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}