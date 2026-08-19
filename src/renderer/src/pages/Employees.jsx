import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import { StatusDot } from '../components/StatusDot.jsx'

const EMPTY = { complete_name: '', position: '', birthday: '', status: 'active', complete_address: '' }

export default function Employees({ onOpenFolder }) {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await window.api.employees.list({ search })
    if (res.ok) setEmployees(res.data)
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [search])

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
    load()
  }

  const remove = async () => {
    await window.api.employees.remove(confirmDel.id)
    setConfirmDel(null)
    load()
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Employees</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/40">
            201-files · {employees.length} on record
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange/90"
        >
          + Add Employee
        </button>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, position, or record no…"
        className="mb-6 w-full rounded border border-hairline bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange"
      />

      {employees.length === 0 ? (
        <div className="rounded-md border border-dashed border-hairline bg-white px-5 py-14 text-center text-sm text-ink/40">
          No employee records found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="folder-card group p-5">
              <div className="flex items-start justify-between">
                <button className="flex-1 text-left" onClick={() => onOpenFolder(emp)}>
                  <div className="font-heading text-lg font-semibold text-navy">
                    {emp.complete_name}
                  </div>
                  <div className="mt-0.5 text-sm text-ink/70">
                    {emp.position}
                    <span className="mx-2 text-hairline">·</span>
                    <StatusDot status={emp.status} />
                    <span className="ml-1.5 capitalize">{emp.status}</span>
                  </div>
                </button>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setEditing({ ...emp })}
                    className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-orange hover:text-orange"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDel(emp)}
                    className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-status-red hover:text-status-red"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-4 font-mono text-[11px] text-ink/40">
                <span>{emp.record_no}</span>
                {emp.birthday && <span>DOB {emp.birthday}</span>}
                <span>{emp.file_count} file(s)</span>
              </div>
              {emp.complete_address && (
                <div className="mt-1 text-xs text-ink/50">{emp.complete_address}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit Employee' : 'Add Employee'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Complete Name" required>
              <input
                className={inputCls}
                value={editing.complete_name}
                onChange={(e) => setEditing({ ...editing, complete_name: e.target.value })}
                required
              />
            </Field>
            <Field label="Position" required>
              <input
                className={inputCls}
                value={editing.position}
                onChange={(e) => setEditing({ ...editing, position: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Birthday">
                <input
                  type="date"
                  className={inputCls}
                  value={editing.birthday || ''}
                  onChange={(e) => setEditing({ ...editing, birthday: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="probationary">Probationary</option>
                  <option value="terminated">Terminated</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <Field label="Complete Address">
              <textarea
                className={inputCls}
                rows={2}
                value={editing.complete_address || ''}
                onChange={(e) => setEditing({ ...editing, complete_address: e.target.value })}
              />
            </Field>

            {error && (
              <div className="rounded border border-status-red/30 bg-status-red/5 px-3 py-2 text-sm text-status-red">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded border border-hairline px-4 py-2 text-sm text-ink/70 hover:bg-paper-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange/90"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete employee" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.complete_name}</b>? This permanently removes the record and all
            filed documents.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded border border-hairline px-4 py-2 text-sm text-ink/70 hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              className="rounded bg-status-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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
  'w-full rounded border border-hairline bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label} {required && <span className="text-orange">*</span>}
      </label>
      {children}
    </div>
  )
}
