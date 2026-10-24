import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import { StatusDot } from '../components/StatusDot.jsx'
import Swoosh from '../components/Swoosh.jsx'
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

  const activeFiledSubs = active
    ? active.subcategories.filter((s) => (bySubcategory[s.id] || []).length > 0).length
    : 0

  const handleUpload = async (subcategoryId) => {
    setUploading(true)
    const picked = await (window.api.dialog.pickFile?.() ?? window.api.dialog.pickPdf())
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
      } else if (res.error) {
        setToast({ message: res.error, tone: 'error' })
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
    <div className="mx-auto w-full">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 shadow-lg shadow-navy-900/20 lg:mb-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <Swoosh className="pointer-events-none absolute -bottom-10 right-4 h-36 w-36 opacity-30" />
        <div className="relative z-10 p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBack}
              title="Back to employees"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronIcon dir="left" />
            </button>
            <Avatar emp={employee} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold leading-tight text-white lg:text-[22px]">
                {employee.complete_name}
              </h1>
              <p className="mt-0.5 truncate text-[11px] text-white/60 lg:text-[12px]">
                {employee.position}{employee.office ? ` · ${employee.office}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{files.length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Documents</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{formatSize(totalSize)}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Storage</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold capitalize text-white">
                <StatusDot status={employee.status} />
                {employee.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee record */}
      <div className="gov-card mb-4 overflow-hidden lg:mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="font-heading text-base font-semibold text-navy-800">Employee Record</h2>
          <span className="shrink-0 rounded-md bg-row-hover px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
            #{employee.record_no}
          </span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoTile label="Plantilla Item" value={employee.plantilla_item} />
          <InfoTile label="Salary Grade" value={employee.salary_grade} mono />
          <InfoTile label="Date Hired" value={employee.date_hired} mono />
          <InfoTile label="Birthday" value={employee.birthday} mono />
          <InfoTile label="Contact Number" value={employee.contact_number} mono />
          <InfoTile label="Email" value={employee.email} />
          <InfoTile
            label="Complete Address"
            value={employee.complete_address}
            className="sm:col-span-2 lg:col-span-2"
          />
        </div>
      </div>

      {/* Category folder tabs */}
      <div className="mb-4 lg:mb-5">
        <div className="grid grid-cols-3 gap-2 border-b border-border">
          {categories.map((cat, idx) => {
            const c = TAB_COLORS[idx % TAB_COLORS.length]
            const isActive = cat.id === activeCat
            const n = countInCategory(cat.name)
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`folder-tab flex h-16 flex-col items-center justify-center gap-1.5 px-3 text-sm leading-none transition-all ${
                  isActive ? `${c.fill} font-semibold` : 'relative border border-b-0 border-border bg-white text-text-secondary hover:bg-paper'
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
        {active && active.subcategories.length > 0 && (
          <div className="mt-2 flex items-center gap-3 px-1">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-row-hover">
              <span
                className="block h-full rounded-full bg-success-bar transition-all"
                style={{ width: `${Math.round((activeFiledSubs / active.subcategories.length) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-[11px] text-text-secondary">
              {activeFiledSubs} / {active.subcategories.length} sections filed
            </span>
          </div>
        )}
      </div>

      {/* Active category subcategory sections */}
      {active ? (
        <div className="space-y-5">
          {active.subcategories.map((sub, i) => {
            const list = bySubcategory[sub.id] || []
            return (
              <section
                key={sub.id}
                className="gov-card overflow-hidden transition-shadow hover:shadow-md hover:shadow-navy-900/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-row-hover/70 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 font-mono text-[11px] text-white">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="truncate font-heading text-sm font-semibold text-navy-800">{sub.name}</h3>
                    <span className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">
                      {list.length} file{list.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpload(sub.id)}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-dark active:scale-[.98] disabled:opacity-50"
                  >
                    <PlusIcon />
                    Add file
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="px-5 py-8">
                    <div className="rounded-xl border border-dashed border-border px-5 py-6 text-center text-sm text-text-secondary">
                      No documents filed under this subcategory.
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {list.map((f) => (
                      <li key={f.id} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-row-hover">
                        <FileTypeIcon fileName={f.file_name} />
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => window.api.files.openPath(f.id)}
                          title="Open document"
                        >
                          <div className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
                            {f.file_name}
                          </div>
                          <div className="font-mono text-[11px] text-text-secondary">
                            {f.category_name} › {f.subcategory_name} · {f.created_at.slice(0, 10)}
                          </div>
                        </button>
                        <span className="hidden shrink-0 font-mono text-[11px] text-text-secondary sm:block">
                          {formatSize(f.file_size)}
                        </span>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => window.api.files.openPath(f.id)}
                            title="Open"
                            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-accent-soft hover:text-accent"
                          >
                            <OpenIcon />
                          </button>
                          <button
                            onClick={() => setRenaming({ id: f.id, name: f.file_name })}
                            title="Rename"
                            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-info-bg hover:text-navy-800"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setConfirmDel(f)}
                            title="Delete"
                            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-danger-text/10 hover:text-danger-text"
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
        <div className="rounded-2xl border border-dashed border-border bg-white px-5 py-10 text-center text-sm text-text-secondary">
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
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setRenaming(null)}
                className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-row-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-dark active:scale-[.98]"
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-text/10 text-danger-text">
              <TrashIcon />
            </span>
            <div>
              <div className="text-sm font-semibold text-text-primary">Delete permanently?</div>
              <p className="mt-0.5 text-xs text-text-secondary">
                <b>{confirmDel.file_name}</b> will be removed from this folder.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              onClick={removeFile}
              className="rounded-lg bg-danger-text px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[.98]"
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

const TAB_COLORS = [
  {
    fill: 'bg-accent text-white shadow-lg shadow-accent/30',
    edge: 'bg-accent',
    icon: 'text-accent',
    badge: 'bg-accent/15 text-accent',
  },
  {
    fill: 'bg-navy-800 text-white shadow-lg shadow-navy-900/30',
    edge: 'bg-navy-800',
    icon: 'text-navy-800',
    badge: 'bg-info-bg text-navy-800',
  },
  {
    fill: 'bg-success-text text-white shadow-lg shadow-success-text/30',
    edge: 'bg-success-text',
    icon: 'text-success-text',
    badge: 'bg-success-text/15 text-success-text',
  },
  {
    fill: 'bg-warning-text text-white shadow-lg shadow-warning-text/30',
    edge: 'bg-warning-text',
    icon: 'text-warning-text',
    badge: 'bg-warning-text/15 text-warning-text',
  },
  {
    fill: 'bg-danger-text text-white shadow-lg shadow-danger-text/30',
    edge: 'bg-danger-text',
    icon: 'text-danger-text',
    badge: 'bg-danger-text/15 text-danger-text',
  },
  {
    fill: 'bg-navy-700 text-white shadow-lg shadow-navy-700/30',
    edge: 'bg-navy-700',
    icon: 'text-navy-800',
    badge: 'bg-info-bg text-navy-800',
  },
]

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

function InfoTile({ label, value, mono, className = '' }) {
  return (
    <div className={`rounded-xl bg-row-hover px-3.5 py-2.5 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">{label}</div>
      <div className={`mt-1 truncate text-sm text-text-primary ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </div>
    </div>
  )
}

function Avatar({ emp }) {
  if (emp?.profile_pic) {
    return (
      <img
        src={emp.profile_pic}
        alt={emp.complete_name}
        className="h-14 w-14 shrink-0 rounded-full border-2 border-white/40 object-cover shadow-md lg:h-16 lg:w-16"
      />
    )
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 font-heading text-xl font-bold text-white shadow-md lg:h-16 lg:w-16">
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

function WordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13l2 5 2-5M12 13l2 5 2-5" />
    </svg>
  )
}

function ExcelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h8M8 17h8M9 13l3 4 3-4" />
    </svg>
  )
}

function PptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <rect x="8" y="13" width="8" height="4" rx="1" />
    </svg>
  )
}

function FileTypeIcon({ fileName }) {
  const ext = String(fileName || '').split('.').pop()?.toLowerCase() || ''
  if (['doc', 'docx'].includes(ext)) return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-bg text-navy-800"><WordIcon /></span>
  if (['xls', 'xlsx'].includes(ext)) return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-text/10 text-success-text"><ExcelIcon /></span>
  if (['ppt', 'pptx'].includes(ext)) return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-text/10 text-warning-text"><PptIcon /></span>
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-text/10 text-danger-text"><PdfIcon /></span>
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