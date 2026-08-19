import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import { StatusDot } from '../components/StatusDot.jsx'

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

  const bySubcategory = useMemo(() => {
    const map = {}
    for (const f of files) {
      if (!map[f.subcategory_id]) map[f.subcategory_id] = []
      map[f.subcategory_id].push(f)
    }
    return map
  }, [files])

  const loadFiles = async () => {
    const res = await window.api.files.list(employee.id)
    if (res.ok) setFiles(res.data)
  }

  useEffect(() => {
    if (employee?.id) loadFiles()
  }, [employee?.id])

  const active = categories.find((c) => c.id === activeCat) || categories[0]

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
      if (res.ok) loadFiles()
    }
    setUploading(false)
  }

  const saveRename = async (e) => {
    e.preventDefault()
    const res = await window.api.files.rename(renaming.id, renaming.name)
    if (res.ok) {
      setRenaming(null)
      loadFiles()
    }
  }

  const removeFile = async () => {
    await window.api.files.remove(confirmDel.id)
    setConfirmDel(null)
    loadFiles()
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <button onClick={onBack} className="mb-3 text-sm text-ink/50 hover:text-orange">
        ← Back to employees
      </button>

      <header className="mb-6 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div className="folder-card flex h-16 w-16 items-center justify-center bg-paper-dark font-heading text-2xl font-bold text-navy">
            {initials(employee.complete_name)}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">{employee.complete_name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-ink/70">
              <span>{employee.position}</span>
              <span className="text-hairline">·</span>
              <StatusDot status={employee.status} />
              <span className="capitalize">{employee.status}</span>
            </div>
            <div className="mt-1 flex gap-4 font-mono text-[11px] text-ink/40">
              <span>{employee.record_no}</span>
              {employee.birthday && <span>DOB {employee.birthday}</span>}
            </div>
          </div>
        </div>
        <div className="font-mono text-xs text-ink/40">
          {files.length} document(s) on file
        </div>
      </header>

      {/* Manila-folder category tabs */}
      <div className="mb-6 flex flex-wrap gap-1">
        {categories.map((cat) => {
          const isActive = cat.id === activeCat
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`folder-tab px-5 pb-2.5 pt-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-orange font-semibold text-white'
                  : 'border border-b-0 border-hairline bg-white text-ink/70 hover:text-navy'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Active category subcategory sections */}
      {active ? (
        <div className="space-y-5">
          {active.subcategories.map((sub) => {
            const list = bySubcategory[sub.id] || []
            return (
              <section key={sub.id} className="overflow-hidden rounded-md border border-hairline bg-white">
                <div className="flex items-center justify-between border-b border-hairline bg-paper px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-navy">{sub.name}</h3>
                  <button
                    onClick={() => handleUpload(sub.id)}
                    disabled={uploading}
                    className="rounded bg-navy px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
                  >
                    + Add file
                  </button>
                </div>
                {list.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-ink/40">
                    No documents filed under this subcategory.
                  </div>
                ) : (
                  <ul>
                    {list.map((f, i) => (
                      <li
                        key={f.id}
                        className={`flex items-center justify-between px-4 py-2.5 ${
                          i !== list.length - 1 ? 'border-b border-hairline' : ''
                        }`}
                      >
                        <button
                          className="flex-1 text-left"
                          onClick={() => window.api.files.openPath(f.id)}
                          title="Open in viewer"
                        >
                          <div className="text-sm font-medium text-ink hover:text-navy">{f.file_name}</div>
                          <div className="font-mono text-[11px] text-ink/40">
                            {f.category_name} › {f.subcategory_name}
                          </div>
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-ink/40">
                            {f.created_at} · {formatSize(f.file_size)}
                          </span>
                          <button
                            onClick={() => setRenaming({ id: f.id, name: f.file_name })}
                            className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-orange hover:text-orange"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => setConfirmDel(f)}
                            className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-status-red hover:text-status-red"
                          >
                            Delete
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
        <div className="rounded-md border border-dashed border-hairline bg-white px-5 py-10 text-center text-sm text-ink/40">
          No categories available. Contact the administrator.
        </div>
      )}

      {renaming && (
        <Modal title="Rename document" onClose={() => setRenaming(null)}>
          <form onSubmit={saveRename} className="space-y-4">
            <input
              className="w-full rounded border border-hairline bg-paper px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange"
              value={renaming.name}
              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenaming(null)}
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
        <Modal title="Delete document" onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.file_name}</b> permanently?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded border border-hairline px-4 py-2 text-sm text-ink/70 hover:bg-paper-dark"
            >
              Cancel
            </button>
            <button
              onClick={removeFile}
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

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
