import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import { StatusDot } from '../components/StatusDot.jsx'
import Toast from '../components/Toast.jsx'

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function EmployeeFolder({ employee, categories, onBack }) {
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [toast, setToast] = useState(null)

  const bySubcategory = useMemo(() => {
    const map = {}
    for (const f of files) {
      if (!map[f.subcategory_id]) map[f.subcategory_id] = []
      map[f.subcategory_id].push(f)
    }
    return map
  }, [files])

  const totalSize = useMemo(() => files.reduce((n, f) => n + (f.file_size || 0), 0), [files])

  const loadFiles = async () => {
    const res = await window.api.files.list(employee.id)
    if (res.ok) setFiles(res.data)
  }

  useEffect(() => {
    if (employee?.id) loadFiles()
  }, [employee?.id])

  const active = categories.find((c) => c.id === activeCat) || categories[0]

  const countInCategory = (catName) => files.filter((f) => f.category_name === catName).length

  const handleUpload = async (subcategoryId) => {
    setUploading(true)
    const picked = await window.api.dialog.pickPdf()
    if (picked && picked.ok && picked.data) {
      const res = await window.api.files.uploadFromPath({
        employee_id: employee.id,
        subcategory_id: subcategoryId,
        source_path: picked.data,
        uploaded_by: employee.user_id
      })
      if (res.ok) {
        setToast({ message: `Filed "${res.data.file_name}".`, tone: 'success' })
        loadFiles()
      }
    }
    setUploading(false)
  }

  const saveRename = async (e) => {
    e.preventDefault()
    const res = await window.api.files.rename(renaming.id, renaming.name)
    if (res.ok) {
      setRenaming(null)
      setToast({ message: `Renamed to "${res.data.file_name}".`, tone: 'success' })
      loadFiles()
    }
  }

  const removeFile = async () => {
    await window.api.files.remove(confirmDel.id)
    setConfirmDel(null)
    setToast({ message: `Deleted "${confirmDel.file_name}".`, tone: 'success' })
    loadFiles()
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink/60 transition-colors hover:border-orange hover:text-orange"
      >
        <ChevronIcon dir="left" />
        Back to employees
      </button>

      {/* Employee summary */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
        <div className="h-14 bg-navy" />
        <div className="px-6 pb-6">
          <div className="-mt-7 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar emp={employee} />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-xl font-bold text-navy">{employee.complete_name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/70">
                  <span>{employee.position}</span>
                  {employee.office && (
                    <>
                      <span className="text-hairline">·</span>
                      <span>{employee.office}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  statusCls(employee.status)
                }`}
              >
                <StatusDot status={employee.status} />
                {employee.status.replace('_', ' ')}
              </span>
              <span className="font-mono text-[11px] text-ink/40">
                {files.length} document{files.length === 1 ? '' : 's'} · {formatSize(totalSize)}
              </span>
            </div>
          </div>

          {/* Full record information */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoTile label="Record No." value={employee.record_no} mono />
            <InfoTile label="Plantilla Item" value={employee.plantilla_item} />
            <InfoTile label="Salary Grade" value={employee.salary_grade} mono />
            <InfoTile label="Date Hired" value={employee.date_hired} mono />
            <InfoTile label="Birthday" value={employee.birthday} mono />
            <InfoTile label="Contact Number" value={employee.contact_number} mono />
            <InfoTile label="Email" value={employee.email} className="sm:col-span-2 lg:col-span-1" />
            <InfoTile
              label="Complete Address"
              value={employee.complete_address}
              className="sm:col-span-2 lg:col-span-2"
            />
          </div>
        </div>
      </div>

      {/* Category folder tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 border-b border-hairline">
          {categories.map((cat, idx) => {
            const c = TAB_COLORS[idx % TAB_COLORS.length]
            const isActive = cat.id === activeCat
            const n = countInCategory(cat.name)
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`folder-tab flex h-16 flex-col items-center justify-center gap-1.5 px-3 text-sm leading-none transition-all ${
                  isActive ? `${c.fill} font-semibold` : 'border border-b-0 border-hairline bg-white text-ink/60 hover:bg-paper'
                }`}
              >
                {!isActive && <span className={`absolute inset-x-0 top-0 h-1 ${c.edge}`} />}
                <span className="flex items-center gap-2">
                  <FolderIcon className={isActive ? 'text-white' : c.icon} />
                  {cat.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    isActive ? 'bg-white/25 text-white' : c.badge
                  }`}
                >
                  {n}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active category subcategory sections */}
      {active ? (
        <div className="space-y-5">
          {active.subcategories.map((sub, i) => {
            const list = bySubcategory[sub.id] || []
            return (
              <section
                key={sub.id}
                className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition-shadow hover:shadow-md hover:shadow-navy/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] font-mono text-[11px] text-navy">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-navy">{sub.name}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-ink/45">
                      {list.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpload(sub.id)}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-lg bg-orange px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 active:scale-[.98] disabled:opacity-50"
                  >
                    <PlusIcon />
                    Add file
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-ink/40">
                    No documents filed under this subcategory.
                  </div>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {list.map((f) => (
                      <li key={f.id} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-paper/60">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-red/10 text-status-red">
                          <PdfIcon />
                        </span>
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => window.api.files.openPath(f.id)}
                          title="Open document"
                        >
                          <div className="truncate text-sm font-medium text-ink transition-colors group-hover:text-orange">
                            {f.file_name}
                          </div>
                          <div className="font-mono text-[11px] text-ink/40">
                            {f.category_name} › {f.subcategory_name} · {f.created_at.slice(0, 10)}
                          </div>
                        </button>
                        <span className="hidden shrink-0 font-mono text-[11px] text-ink/40 sm:block">
                          {formatSize(f.file_size)}
                        </span>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => window.api.files.openPath(f.id)}
                            title="Open"
                            className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-orange-soft hover:text-orange"
                          >
                            <OpenIcon />
                          </button>
                          <button
                            onClick={() => setRenaming({ id: f.id, name: f.file_name })}
                            title="Rename"
                            className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-navy/5 hover:text-navy"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setConfirmDel(f)}
                            title="Delete"
                            className="rounded-lg p-2 text-ink/50 transition-colors hover:bg-status-red/10 hover:text-status-red"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-hairline bg-white px-5 py-10 text-center text-sm text-ink/40">
          No categories available. Contact the administrator.
        </div>
      )}

      {renaming && (
        <Modal title="Rename document" onClose={() => setRenaming(null)} compact>
          <form onSubmit={saveRename} className="space-y-4">
            <Field label="File Name" required>
              <input
                className={inputCls}
                value={renaming.name}
                onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                autoFocus
                required
              />
            </Field>
            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setRenaming(null)}
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
        <Modal title="Delete document" onClose={() => setConfirmDel(null)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-red/10 text-status-red">
              <TrashIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-ink">Delete permanently?</div>
              <p className="mt-0.5 text-xs text-ink/50">
                <b>{confirmDel.file_name}</b> will be removed from this folder.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 transition-colors hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={removeFile}
              className="rounded-lg bg-status-red px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[.98]"
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

const TAB_COLORS = [
  {
    fill: 'bg-orange text-white shadow-lg shadow-orange/30',
    edge: 'bg-orange',
    icon: 'text-orange',
    badge: 'bg-orange/15 text-orange',
  },
  {
    fill: 'bg-navy text-white shadow-lg shadow-navy/30',
    edge: 'bg-navy',
    icon: 'text-navy',
    badge: 'bg-navy/10 text-navy',
  },
  {
    fill: 'bg-status-green text-white shadow-lg shadow-status-green/30',
    edge: 'bg-status-green',
    icon: 'text-status-green',
    badge: 'bg-status-green/15 text-status-green',
  },
  {
    fill: 'bg-status-amber text-white shadow-lg shadow-status-amber/30',
    edge: 'bg-status-amber',
    icon: 'text-status-amber',
    badge: 'bg-status-amber/15 text-status-amber',
  },
  {
    fill: 'bg-status-red text-white shadow-lg shadow-status-red/30',
    edge: 'bg-status-red',
    icon: 'text-status-red',
    badge: 'bg-status-red/15 text-status-red',
  },
  {
    fill: 'bg-navy-deep text-white shadow-lg shadow-navy-deep/30',
    edge: 'bg-navy-deep',
    icon: 'text-navy',
    badge: 'bg-navy/10 text-navy',
  },
]

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

function InfoTile({ label, value, mono, className = '' }) {
  return (
    <div className={`rounded-xl bg-paper px-3.5 py-2.5 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink/40">{label}</div>
      <div className={`mt-1 truncate text-sm text-ink/80 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </div>
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

function Avatar({ emp }) {
  if (emp?.profile_pic) {
    return (
      <img
        src={emp.profile_pic}
        alt={emp.complete_name}
        className="h-24 w-24 shrink-0 rounded-full border-4 border-white object-cover shadow-md"
      />
    )
  }
  return (
    <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-orange-soft font-heading text-2xl font-bold text-orange shadow-md">
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

function ChevronIcon({ dir = 'right' }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dir === 'left' ? 'rotate-180' : ''}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function FolderIcon({ className = '' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  )
}

function OpenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
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