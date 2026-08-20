import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [editing, setEditing] = useState(null)
  const [newSub, setNewSub] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [toast, setToast] = useState(null)

  const load = async () => {
    const res = await window.api.categories.listAll()
    if (res.ok) setCategories(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q) return categories
    return categories
      .map((c) => ({
        ...c,
        subcategories: c.subcategories.filter((s) => s.name.toLowerCase().includes(q))
      }))
      .filter((c) => c.name.toLowerCase().includes(q) || c.subcategories.length > 0)
  }, [categories, q])

  const subTotal = categories.reduce((n, c) => n + c.subcategories.length, 0)

  const saveCategory = async (e) => {
    e.preventDefault()
    const data = { name: editing.name, sort_order: editing.sort_order || 0 }
    const res = editing.id
      ? await window.api.categories.update(editing.id, data)
      : await window.api.categories.create(data.name, data.sort_order)
    if (res.ok) {
      setEditing(null)
      setToast({ message: `Saved category "${res.data.name}".`, tone: 'success' })
      load()
    }
  }

  const saveSub = async (e) => {
    e.preventDefault()
    const res = await window.api.categories.createSub(newSub.category_id, newSub.name, newSub.sort_order || 0)
    if (res.ok) {
      setNewSub(null)
      setToast({ message: `Added subcategory "${res.data.name}".`, tone: 'success' })
      load()
    }
  }

  const saveSubEdit = async (e) => {
    e.preventDefault()
    const res = await window.api.categories.updateSub(editing.id, {
      name: editing.name,
      sort_order: editing.sort_order || 0
    })
    if (res.ok) {
      setEditing(null)
      setToast({ message: `Saved subcategory "${res.data.name}".`, tone: 'success' })
      load()
    }
  }

  const remove = async () => {
    const res = confirmDel.type === 'category'
      ? await window.api.categories.remove(confirmDel.id)
      : await window.api.categories.removeSub(confirmDel.id)
    if (res.ok) {
      setConfirmDel(null)
      setToast({ message: `Deleted "${confirmDel.name}".`, tone: 'success' })
      load()
    } else {
      setConfirmDel(null)
      setToast({ message: res.error, tone: 'error' })
    }
  }

  const tryDelete = (target) => {
    const count = target.file_count || 0
    if (count > 0) {
      setToast({
        message: `"${target.name}" has ${count} filed document${count === 1 ? '' : 's'} and cannot be deleted.`,
        tone: 'error'
      })
      return
    }
    setConfirmDel(target)
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
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
            placeholder="Search categories or subcategories…"
            className="w-80 rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink/40">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} · {subTotal} subcategor{subTotal === 1 ? 'y' : 'ies'}
          </span>
          <button
            onClick={() => setEditing({ name: '', sort_order: categories.length + 1 })}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
          >
            <PlusIcon />
            Add Category
          </button>
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {filtered.map((cat) => {
          const isOpen = !collapsed[cat.id]
          const count = cat.subcategories.length
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition-shadow hover:shadow-md hover:shadow-navy/5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3.5">
                  <button
                    onClick={() => setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))}
                    title={isOpen ? 'Collapse' : 'Expand'}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-paper transition-all hover:bg-navy-deep ${
                      isOpen ? '' : 'opacity-70'
                    }`}
                  >
                    <ChevronIcon dir={isOpen ? 'down' : 'right'} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-heading text-base font-semibold text-navy">{cat.name}</h2>
                      <span className="shrink-0 rounded-md bg-paper-dark px-1.5 py-0.5 font-mono text-[10px] text-ink/45">
                        #{cat.sort_order}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-ink/40">
                      <span>{count} subcategor{count === 1 ? 'y' : 'ies'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewSub({ category_id: cat.id, name: '', sort_order: 0 })}
                    className="flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-orange hover:bg-orange-soft hover:text-orange"
                  >
                    <PlusIcon />
                    Subcategory
                  </button>
                  <button
                    onClick={() => setEditing({ id: cat.id, name: cat.name, sort_order: cat.sort_order })}
                    className="rounded-lg border border-hairline bg-white p-2 text-ink/50 transition-colors hover:border-orange hover:bg-orange-soft hover:text-orange"
                    title="Edit category"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => tryDelete({ type: 'category', id: cat.id, name: cat.name, file_count: cat.file_count })}
                    className="rounded-lg border border-hairline bg-white p-2 text-ink/50 transition-colors hover:border-status-red hover:bg-status-red/5 hover:text-status-red"
                    title="Delete category"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Subcategory list */}
              {isOpen && (
                <ul className="divide-y divide-hairline">
                  {cat.subcategories.map((sub, i) => (
                    <li key={sub.id} className="group flex items-center justify-between px-5 py-2.5 transition-colors hover:bg-paper/60">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-6 shrink-0 font-mono text-[11px] text-ink/30">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-sm text-ink/80">{sub.name}</span>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() =>
                            setEditing({ id: sub.id, isSub: true, category_id: cat.id, name: sub.name, sort_order: sub.sort_order })
                          }
                          className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-orange-soft hover:text-orange"
                          title="Edit subcategory"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => tryDelete({ type: 'sub', id: sub.id, name: sub.name, file_count: sub.file_count })}
                          className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-status-red/5 hover:text-status-red"
                          title="Delete subcategory"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                  {cat.subcategories.length === 0 && (
                    <li className="px-5 py-4 text-sm text-ink/40">No subcategories yet.</li>
                  )}
                </ul>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-hairline bg-white px-5 py-14 text-center text-sm text-ink/40">
            {categories.length === 0
              ? 'No categories yet. Add your first filing category.'
              : 'No categories match your search.'}
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.isSub ? 'Edit Subcategory' : editing.id ? 'Edit Category' : 'Add Category'}
          onClose={() => setEditing(null)}
          compact
        >
          <form
            onSubmit={editing.isSub ? saveSubEdit : saveCategory}
            className="space-y-4"
          >
            <Field label="Name" required>
              <input
                className={inputCls}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={editing.isSub ? 'e.g. Personal Data Sheet (PDS)' : 'e.g. Personal Information'}
                required
              />
            </Field>
            <Field label="Sort Order" hint="lower = first">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
              />
            </Field>
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

      {newSub && (
        <Modal title="Add Subcategory" onClose={() => setNewSub(null)} compact>
          <form onSubmit={saveSub} className="space-y-4">
            <Field label="Name" required>
              <input
                className={inputCls}
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                placeholder="e.g. Personal Data Sheet (PDS)"
                required
              />
            </Field>
            <Field label="Sort Order" hint="lower = first">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={newSub.sort_order}
                onChange={(e) => setNewSub({ ...newSub, sort_order: e.target.value })}
              />
            </Field>
            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setNewSub(null)}
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
        <Modal title={`Delete ${confirmDel.type}`} onClose={() => setConfirmDel(null)} compact>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.name}</b>?{' '}
            {confirmDel.type === 'category' && 'All its subcategories are also removed.'}
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
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
      className={dir === 'down' ? '' : 'rotate-180'}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}