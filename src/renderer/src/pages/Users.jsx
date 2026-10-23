import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import Swoosh from '../components/Swoosh.jsx'
import { StatusDot } from '../components/StatusDot.jsx'
import Toast from '../components/Toast.jsx'

const EMPTY = { username: '', password: '', full_name: '', role: 'staff', status: 'active', profile_pic: '' }
const PAGE_SIZE = 10

export default function Users({ currentUser }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const load = async () => {
    const res = await window.api.users.list()
    if (res.ok) setUsers(res.data.filter((u) => u.id !== currentUser?.id))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = users.filter((u) => {
      if (q && !`${u.full_name} ${u.username} ${u.role} #${u.id}`.toLowerCase().includes(q)) return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      return true
    })
    return [...base].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [users, search, roleFilter, statusFilter, sortBy, sortDir])

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
    const payload = { ...editing, profile_pic: editing.profile_pic || null }
    const res = editing.id
      ? await window.api.users.update(editing.id, payload)
      : await window.api.users.create(payload)
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
    if (res.ok) {
      setConfirmToggle(null)
      setToast({
        message: `${u.status === 'active' ? 'Deactivated' : 'Activated'} user "${u.full_name}".`,
        tone: 'success'
      })
      load()
    }
  }

  const remove = async () => {
    await window.api.users.remove(confirmDel.id)
    setConfirmDel(null)
    setToast({ message: `Removed user "${confirmDel.full_name}".`, tone: 'success' })
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
    <div className="mx-auto w-full">
      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}

      {/* Colorful page header (replaces the plain breadcrumb on this page) */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 shadow-lg shadow-navy-900/20 lg:mb-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <Swoosh className="pointer-events-none absolute -bottom-10 right-4 h-36 w-36 opacity-30" />
        <div className="relative z-10 p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-white">
              <ShieldIcon />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold leading-tight text-white lg:text-[22px]">
                User Management
              </h1>
              <p className="mt-0.5 text-[11px] text-white/60 lg:text-[12px]">
                Access Control · {filtered.length} account{filtered.length === 1 ? '' : 's'} shown
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{users.length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Total</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{users.filter((u) => u.role === 'admin').length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Admins</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{users.filter((u) => u.status === 'active').length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Active</span>
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
                placeholder="Search name, username or ID…"
                className="w-full rounded-xl border border-transparent bg-white py-2.5 pl-10 pr-3.5 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterChip
                icon={<RoleIcon />}
                label="Role"
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'staff', label: 'Staff' }
                ]}
              />
              <FilterChip
                icon={<StatusIcon />}
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>
            <button
              onClick={() => setEditing({ ...EMPTY })}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition-all hover:bg-accent-dark active:scale-[.98]"
            >
              <PlusIcon />
              Add User
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
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.map((u) => (
              <tr key={u.id} className="group transition-colors hover:bg-row-hover">
                <td className="px-5 py-3.5">
                  <span className="inline-flex rounded-md bg-row-hover px-2 py-1 font-mono text-[11px] text-text-secondary">
                    {String(u.id).padStart(3, '0')}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <Avatar user={u} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text-primary">{u.full_name}</span>
                      <span className="font-mono text-[11px] text-text-secondary">@{u.username}</span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      u.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-row-hover text-text-secondary'
                    }`}
                  >
                    {u.role === 'admin' && <ShieldIcon />}
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        u.status === 'active' ? 'bg-success-text/10 text-success-text' : 'bg-row-hover text-text-secondary'
                      }`}
                    >
                      <StatusDot status={u.status} />
                      {u.status}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setConfirmToggle(u)}
                      title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={`rounded-lg p-2 transition-colors ${
                        u.status === 'active'
                          ? 'text-text-secondary hover:bg-success-bg/60 hover:text-success-text'
                          : 'text-text-secondary hover:bg-success-bg/60 hover:text-success-text'
                      }`}
                    >
                      <ToggleIcon />
                    </button>
                    <button
                      onClick={() => setEditing({ ...u, password: '' })}
                      title="Edit"
                      className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setConfirmDel(u)}
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
                  {users.length === 0 ? 'No users yet.' : 'No users match your filters.'}
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
        <Modal title={editing.id ? 'Edit User' : 'Add User'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-row-hover px-4 py-3">
              <div className="relative shrink-0">
                <Avatar user={editing} size="lg" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  title="Change photo"
                  className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-md shadow-accent/30 transition-transform hover:scale-105"
                >
                  <CameraIcon />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-text-primary">Profile photo</div>
                <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">Optional · JPG, PNG or GIF</p>
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
                  className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-row-hover"
                >
                  {editing.profile_pic ? 'Change' : 'Upload'}
                </button>
                {editing.profile_pic && (
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, profile_pic: '' })}
                    className="rounded-lg border border-danger-text/30 bg-danger-bg/50 px-2.5 py-1.5 text-[11px] font-medium text-danger-text transition-colors hover:bg-danger-text/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <Field label="Full Name" required>
              <input
                className={inputCls}
                value={editing.full_name}
                onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Username" required>
                <input
                  className={inputCls}
                  value={editing.username}
                  onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                  required
                />
              </Field>
              <Field label={editing.id ? 'New Password' : 'Password'} required={!editing.id} hint={editing.id && 'blank = keep'}>
                <input
                  type="password"
                  className={inputCls}
                  value={editing.password}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  required={!editing.id}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Select
                  variant="form"
                  value={editing.role}
                  onChange={(v) => setEditing({ ...editing, role: v })}
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'admin', label: 'Admin' }
                  ]}
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
            </div>

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
                Save User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Delete user" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-text-secondary">
            Delete <b>{confirmDel.full_name}</b> (@{confirmDel.username})? This cannot be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              onClick={remove}
              className="rounded-lg bg-danger-text px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {confirmToggle && (
        <Modal
          title={confirmToggle.status === 'active' ? 'Deactivate user' : 'Activate user'}
          onClose={() => setConfirmToggle(null)}
          compact
        >
          <div className="flex items-center gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                confirmToggle.status === 'active' ? 'bg-danger-text/10 text-danger-text' : 'bg-success-text/10 text-success-text'
              }`}
            >
              <ToggleIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {confirmToggle.status === 'active' ? 'Deactivate this user?' : 'Activate this user?'}
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">
                {confirmToggle.status === 'active'
                  ? `${confirmToggle.full_name} (@${confirmToggle.username}) will be blocked from signing in.`
                  : `${confirmToggle.full_name} (@${confirmToggle.username}) will be allowed to sign in again.`}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => setConfirmToggle(null)}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              onClick={() => toggleStatus(confirmToggle)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[.98] ${
                confirmToggle.status === 'active' ? 'bg-danger-text' : 'bg-success-text'
              }`}
            >
              {confirmToggle.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FilterChip({ icon, label, value, onChange, options }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white py-2.5 pl-3 pr-2.5 text-sm transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <span className="text-text-secondary">{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">{label}</span>
      <Select variant="chip" value={value} onChange={onChange} options={options} />
    </label>
  )
}

function Avatar({ user, size = 'md' }) {
  const sizes = {
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-sm',
    xl: 'h-20 w-20 text-xl'
  }
  const cls = sizes[size] || sizes.md
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className={`${cls} shrink-0 rounded-full border border-border object-cover`}
      />
    )
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full border border-border font-heading font-bold ${
        user?.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-info-bg text-navy-800'
      }`}
    >
      {initials(user?.full_name)}
    </span>
  )
}

const inputCls =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        <span>
          {label} {required && <span className="text-accent">*</span>}
        </span>
        {hint && <span className="font-normal normal-case tracking-normal text-text-secondary">{hint}</span>}
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

function RoleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

function ToggleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" />
      <circle cx="16" cy="12" r="3" />
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

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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