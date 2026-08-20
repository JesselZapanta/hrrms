import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'

const EMPTY = { grade: '', salary: '' }
const PAGE_SIZE = 12

const money = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n) || 0)

export default function SalaryGrades() {
  const [grades, setGrades] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    const res = await window.api.salaryGrades.list({ search })
    if (res.ok) setGrades(res.data)
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filtered = useMemo(() => grades, [grades])

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
      ? await window.api.salaryGrades.update(editing.id, payload)
      : await window.api.salaryGrades.create(payload)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(null)
    setToast({ message: `Saved salary grade "${res.data.grade}".`, tone: 'success' })
    load()
  }

  const remove = async () => {
    const res = await window.api.salaryGrades.remove(confirmDel.id)
    if (res.ok) {
      setConfirmDel(null)
      setToast({ message: `Deleted salary grade "${confirmDel.grade}".`, tone: 'success' })
      load()
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salary grade…"
            className="w-80 rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink/40">{filtered.length} salary grades on record</span>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
          >
            <PlusIcon />
            Add Salary Grade
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-navy/[0.04] font-mono text-[10px] uppercase tracking-[1.5px] text-ink/45">
              <th className="px-5 py-3.5">Salary Grade</th>
              <th className="px-5 py-3.5">Salary (Monthly)</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {pageRows.map((g) => (
              <tr key={g.id} className="group transition-colors hover:bg-paper/70">
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-lg bg-navy/5 px-2.5 py-1 font-heading text-sm font-semibold text-navy">
                    {g.grade}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-ink/80">{money(g.salary)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing({ ...g })}
                      title="Edit"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-orange-soft hover:text-orange"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmDel(g)}
                      title="Delete"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-status-red/10 hover:text-status-red"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-14 text-center text-sm text-ink/40">
                  {grades.length === 0 ? 'No salary grades yet. Add your first salary grade.' : 'No salary grades match your search.'}
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
        <Modal title={editing.id ? 'Edit Salary Grade' : 'Add Salary Grade'} onClose={() => setEditing(null)} compact>
          <form onSubmit={save} className="space-y-4">
            <Field label="Salary Grade" required>
              <input
                className={inputCls}
                value={editing.grade}
                onChange={(e) => setEditing({ ...editing, grade: e.target.value })}
                placeholder="e.g. SG-18"
                required
              />
            </Field>
            <Field label="Monthly Salary (₱)" required>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={editing.salary}
                onChange={(e) => setEditing({ ...editing, salary: e.target.value })}
                placeholder="e.g. 27384.00"
                required
              />
            </Field>
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
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete salary grade" onClose={() => setConfirmDel(null)} compact>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.grade}</b>? This permanently removes the salary grade from the schedule.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              className="rounded-lg bg-status-red px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
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
  'w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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