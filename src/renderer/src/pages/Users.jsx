import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'

const EMPTY = { username: '', password: '', full_name: '', role: 'staff', status: 'active' }

export default function Users({ currentUser }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    const res = await window.api.users.list()
    if (res.ok) setUsers(res.data.filter((u) => u.id !== currentUser?.id))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const res = editing.id
      ? await window.api.users.update(editing.id, editing)
      : await window.api.users.create(editing)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(null)
    setToast({ message: `Saved user "${res.data.full_name}".`, tone: 'success' })
    load()
  }

  const toggleStatus = async (u) => {
    const res = await window.api.users.update(u.id, { status: u.status === 'active' ? 'inactive' : 'active' })
    if (res.ok) load()
  }

  const remove = async () => {
    await window.api.users.remove(confirmDel.id)
    setConfirmDel(null)
    setToast({ message: `Removed user "${confirmDel.full_name}".`, tone: 'success' })
    load()
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink/40">{filtered.length} account(s)</span>
          <button
            onClick={() => setEditing({ ...EMPTY })}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
          >
            <PlusIcon />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-hairline bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper/70 font-mono text-[11px] uppercase tracking-wider text-ink/45">
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr
                key={u.id}
                className={`group transition-colors hover:bg-paper/60 ${
                  i !== filtered.length - 1 ? 'border-b border-hairline' : ''
                }`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold ${
                        u.role === 'admin' ? 'bg-orange-soft text-orange' : 'bg-navy/5 text-navy'
                      }`}
                    >
                      {initials(u.full_name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{u.full_name}</span>
                      <span className="font-mono text-[11px] text-ink/45">@{u.username}</span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      u.role === 'admin' ? 'bg-orange-soft text-orange' : 'bg-paper-dark text-ink/60'
                    }`}
                  >
                    {u.role === 'admin' && <ShieldIcon />}
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggleStatus(u)}
                    title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      u.status === 'active' ? 'bg-status-green' : 'bg-hairline'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        u.status === 'active' ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <span className={`ml-2 text-xs font-medium capitalize ${u.status === 'active' ? 'text-status-green' : 'text-ink/40'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing({ ...u, password: '' })}
                      title="Edit"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-orange-soft hover:text-orange"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmDel(u)}
                      title="Delete"
                      className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-status-red/10 hover:text-status-red"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-14 text-center text-sm text-ink/40">
                  {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit User' : 'Add User'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Full Name" required>
              <input
                className={inputCls}
                value={editing.full_name}
                onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Username" required>
                <input
                  className={inputCls}
                  value={editing.username}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  required
                />
              </Field>
              <Field label={editing.id ? 'New Password (blank = keep)' : 'Password'} required={!editing.id}>
                <input
                  type="password"
                  className={inputCls}
                  value={editing.password}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  required={!editing.id}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role">
                <select
                  className={inputCls}
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            {error && (
              <div className="rounded border border-status-red/30 bg-status-red/5 px-3 py-2 text-sm text-status-red">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink/70 hover:bg-paper-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange/90"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete user" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.full_name}</b> (@{confirmDel.username})? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-hairline px-4 py-2 text-sm text-ink/70 hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              className="rounded-lg bg-status-red px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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
  'w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

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

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
