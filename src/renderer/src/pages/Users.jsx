import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal.jsx'

const EMPTY = { username: '', password: '', full_name: '', role: 'staff', status: 'active' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await window.api.users.list()
    if (res.ok) setUsers(res.data)
  }

  useEffect(() => {
    load()
  }, [])

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
    load()
  }

  const toggleStatus = async (u) => {
    await window.api.users.update(u.id, { status: u.status === 'active' ? 'inactive' : 'active' })
    load()
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">User Management</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/40">
            Admin only · {users.length} account(s)
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange/90"
        >
          + Add User
        </button>
      </header>

      <div className="overflow-hidden rounded-md border border-hairline bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline bg-paper font-heading text-xs uppercase tracking-wide text-ink/50">
              <th className="px-5 py-3">Full Name</th>
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i !== users.length - 1 ? 'border-b border-hairline' : ''}>
                <td className="px-5 py-3 font-medium">{u.full_name}</td>
                <td className="px-5 py-3 font-mono text-xs text-ink/60">{u.username}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${
                      u.role === 'admin' ? 'bg-orange-soft text-orange' : 'bg-paper-dark text-ink/60'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-medium capitalize ${
                      u.status === 'active' ? 'text-status-green' : 'text-status-red'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => setEditing({ ...u })}
                    className="mr-2 rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-orange hover:text-orange"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-navy hover:text-navy"
                  >
                    {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  No users found.
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
