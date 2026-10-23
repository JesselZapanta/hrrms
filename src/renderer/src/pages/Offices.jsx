import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import Swoosh from '../components/Swoosh.jsx'
import { StatusDot } from '../components/StatusDot.jsx'
import Toast from '../components/Toast.jsx'

const EMPTY = { name: '', description: '', status: 'active' }
const PAGE_SIZE = 10

export default function Offices() {
  const [offices, setOffices] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    const res = await window.api.offices.list({ search })
    if (res.ok) setOffices(res.data)
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const filtered = useMemo(() => {
    const base = statusFilter === 'all' ? offices : offices.filter((o) => o.status === statusFilter)
    return [...base].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [offices, statusFilter, sortBy, sortDir])

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
      ? await window.api.offices.update(editing.id, payload)
      : await window.api.offices.create(payload)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(null)
    setToast({ message: `Saved office "${res.data.name}".`, tone: 'success' })
    load()
  }

  const remove = async () => {
    const res = await window.api.offices.remove(confirmDel.id)
    if (res.ok) {
      setConfirmDel(null)
      setToast({ message: `Deleted office "${confirmDel.name}".`, tone: 'success' })
      load()
    }
  }

  return (
    <div className="mx-auto w-full">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Colorful page header */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 shadow-lg shadow-navy-900/20 lg:mb-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <Swoosh className="pointer-events-none absolute -bottom-10 right-4 h-36 w-36 opacity-30" />
        <div className="relative z-10 p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-white">
              <BuildingIcon />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold leading-tight text-white lg:text-[22px]">
                Offices
              </h1>
              <p className="mt-0.5 text-[11px] text-white/60 lg:text-[12px]">
                City Offices Directory · {filtered.length} on record
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{offices.length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Total</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{offices.filter((o) => o.status === 'active').length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Active</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{offices.filter((o) => o.status !== 'active').length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Inactive</span>
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-52">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search offices…"
                className="w-full rounded-xl border border-transparent bg-white py-2.5 pl-10 pr-3.5 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white py-2.5 pl-3 pr-2.5 text-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <span className="text-text-secondary">
                <StatusIcon />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">Status</span>
              <Select
                variant="chip"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </label>
            <button
              onClick={() => setEditing({ ...EMPTY })}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition-all hover:bg-accent-dark active:scale-[.98]"
            >
              <PlusIcon />
              Add Office
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="gov-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[#F1F4F9] text-[13px] font-semibold text-text-primary">
              <th className="w-14 cursor-pointer select-none px-5 py-3.5 hover:text-text-primary" onClick={() => toggleSort('id')}>
                <span className="inline-flex items-center gap-1">ID {sortBy === 'id' && <SortArrow dir={sortDir} />}</span>
              </th>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.map((office) => (
              <tr key={office.id} className="group transition-colors hover:bg-row-hover">
                <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">#{office.id}</td>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-text-primary">{office.name}</span>
                </td>
                <td className="max-w-md truncate px-5 py-3.5 text-text-secondary">{office.description || '—'}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      office.status === 'active' ? 'bg-success-text/10 text-success-text' : 'bg-danger-text/10 text-danger-text'
                    }`}
                  >
                    <StatusDot status={office.status} />
                    {office.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing({ ...office })}
                      title="Edit"
                      className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmDel(office)}
                      title="Delete"
                      className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-text/10 hover:text-danger-text"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-text-secondary">
                  {offices.length === 0 ? 'No offices yet. Add your first office.' : 'No offices match your filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-xs text-text-secondary">
          {filtered.length === 0 ? 'No results' : `Showing ${from}–${to} of ${filtered.length}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary transition-colors hover:bg-row-hover disabled:opacity-40"
            >
              <ChevronIcon dir="left" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs transition-colors ${
                  n === safePage
                    ? 'bg-navy-900 font-semibold text-white shadow-md shadow-navy-900/25'
                    : 'border border-border bg-white text-text-secondary hover:bg-row-hover'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary transition-colors hover:bg-row-hover disabled:opacity-40"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Office' : 'Add Office'} onClose={() => setEditing(null)} compact>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name" required>
              <input
                className={inputCls}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. City Health Office"
                required
              />
            </Field>
            <Field label="Description">
              <textarea
                className={inputCls}
                rows={2}
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What does this office do?"
              />
            </Field>
            <Field label="Status">
              <Select
                variant="form"
                value={editing.status}
                onChange={(v) => setEditing({ ...editing, status: v })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </Field>
            {error && (
              <div className="rounded-lg border border-danger-text/30 bg-danger-bg/50 px-3 py-2 text-xs text-danger-text">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-row-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-dark active:scale-[.98]"
              >
                <SaveIcon />
                Save Office
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete office" onClose={() => setConfirmDel(null)} compact>
          <p className="text-sm text-text-secondary">
            Delete <b>{confirmDel.name}</b>? This permanently removes the office from the registry.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              className="rounded-lg bg-danger-text px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
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

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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