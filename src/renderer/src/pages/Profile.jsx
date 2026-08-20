import { useRef, useState } from 'react'
import Toast from '../components/Toast.jsx'

export default function Profile({ currentUser, onUserChange }) {
  const [form, setForm] = useState({
    full_name: currentUser.full_name,
    username: currentUser.username,
    profile_pic: currentUser.profile_pic || ''
  })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const saveInfo = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await window.api.users.update(currentUser.id, {
      full_name: form.full_name,
      username: form.username,
      profile_pic: form.profile_pic || null
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    onUserChange(res.data)
    setToast({ message: 'Profile updated.', tone: 'success' })
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pw.next.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('New password and confirmation do not match.')
      return
    }
    const verify = await window.api.auth.login(currentUser.username, pw.current)
    if (!verify.ok) {
      setPwError('Current password is incorrect.')
      return
    }
    const res = await window.api.users.update(currentUser.id, { password: pw.next })
    if (!res.ok) {
      setPwError(res.error)
      return
    }
    onUserChange(res.data)
    setPw({ current: '', next: '', confirm: '' })
    setToast({ message: 'Password changed.', tone: 'success' })
  }

  const handlePic = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, profile_pic: reader.result }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile summary */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
            <div className="h-20 bg-navy" />
            <div className="px-6 pb-6">
              <div className="-mt-10 flex justify-center">
                <div className="relative">
                  <Avatar user={form} size="xl" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    title="Change photo"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange text-white shadow-md shadow-orange/30 transition-transform hover:scale-105"
                  >
                    <CameraIcon />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePic}
                  />
                </div>
              </div>
              <h2 className="mt-3 text-center font-heading text-lg font-semibold text-navy">
                {form.full_name || currentUser.full_name}
              </h2>
              <p className="mt-0.5 text-center font-mono text-xs text-ink/45">@{form.username || currentUser.username}</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    currentUser.role === 'admin' ? 'bg-orange-soft text-orange' : 'bg-paper-dark text-ink/60'
                  }`}
                >
                  {currentUser.role === 'admin' && <ShieldIcon />}
                  {currentUser.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    currentUser.status === 'active' ? 'bg-status-green/10 text-status-green' : 'bg-ink/5 text-ink/45'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentUser.status === 'active' ? 'bg-status-green' : 'bg-ink/40'}`} />
                  {currentUser.status}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-paper px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink/50">Member since</span>
                  <span className="font-mono text-xs text-ink/70">
                    {formatDate(currentUser.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-hairline bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h3 className="font-heading text-sm font-semibold text-navy">Personal Information</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">Account settings</span>
            </div>
            <form onSubmit={saveInfo} className="space-y-4 p-6">
              <Field label="Full Name" required>
                <input
                  className={inputCls}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Username" required>
                <input
                  className={inputCls}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
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
                  type="submit"
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 active:scale-[.98] disabled:opacity-60"
                >
                  <SaveIcon />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-hairline bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h3 className="font-heading text-sm font-semibold text-navy">Change Password</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">Security</span>
            </div>
            <form onSubmit={savePassword} className="space-y-4 p-6">
              <Field label="Current Password" required>
                <input
                  type="password"
                  className={inputCls}
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="New Password" required hint="min. 6 characters">
                  <input
                    type="password"
                    className={inputCls}
                    value={pw.next}
                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Confirm New Password" required>
                  <input
                    type="password"
                    className={inputCls}
                    value={pw.confirm}
                    onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                    required
                  />
                </Field>
              </div>

              {pwError && (
                <div className="rounded-lg border border-status-red/30 bg-status-red/5 px-3 py-2 text-xs text-status-red">
                  {pwError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-navy-deep active:scale-[.98]"
                >
                  <LockIcon />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink/60">
        <span>
          {label} {required && <span className="text-orange">*</span>}
        </span>
        {hint && <span className="font-normal normal-case tracking-normal text-ink/35">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Avatar({ user, size = 'xl' }) {
  const cls = 'h-24 w-24 text-2xl'
  if (user?.profile_pic) {
    return (
      <img
        src={user.profile_pic}
        alt={user.full_name}
        className={`${cls} shrink-0 rounded-full border-4 border-white object-cover shadow-md`}
      />
    )
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full border-4 border-white bg-orange-soft font-heading font-bold text-orange shadow-md`}
    >
      {initials(user?.full_name)}
    </span>
  )
}

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(String(v).includes('T') ? v : `${v.replace(' ', 'T')}`)
  if (isNaN(d)) return String(v)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
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

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}