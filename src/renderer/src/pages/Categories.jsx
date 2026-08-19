import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'

export default function Categories() {
  const [categories, setCategories] = useState([])
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

  const remove = async () => {
    const res = confirmDel.type === 'category'
      ? await window.api.categories.remove(confirmDel.id)
      : await window.api.categories.removeSub(confirmDel.id)
    if (res.ok) {
      setConfirmDel(null)
      setToast({ message: `Deleted "${confirmDel.name}".`, tone: 'success' })
      load()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-ink/50">
          Structure of the filing system — every category holds subcategories where employee documents are filed.
        </p>
        <button
          onClick={() => setEditing({ name: '', sort_order: categories.length + 1 })}
          className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
        >
          <PlusIcon />
          Add Category
        </button>
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="overflow-hidden rounded-xl border border-hairline bg-white transition-shadow hover:shadow-md hover:shadow-navy/5">
            {/* Folder-tab header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-paper">
                  <FolderIcon />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold text-navy">{cat.name}</h2>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-ink/40">
                    <span>#{cat.sort_order}</span>
                    <span className="text-hairline">·</span>
                    <span>{cat.subcategories.length} subcategories</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewSub({ category_id: cat.id, name: '', sort_order: 0 })}
                  className="flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
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
                  onClick={() => setConfirmDel({ type: 'category', id: cat.id, name: cat.name })}
                  className="rounded-lg border border-hairline bg-white p-2 text-ink/50 transition-colors hover:border-status-red hover:bg-status-red/5 hover:text-status-red"
                  title="Delete category"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* Subcategory list */}
            <ul className="divide-y divide-hairline">
              {cat.subcategories.map((sub) => (
                <li key={sub.id} className="group flex items-center justify-between px-5 py-2.5 transition-colors hover:bg-paper/60">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange/60" />
                    <span className="text-sm text-ink/80">{sub.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                      onClick={() => setConfirmDel({ type: 'sub', id: sub.id, name: sub.name })}
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
          </div>
        ))}

        {categories.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline bg-white px-5 py-14 text-center text-sm text-ink/40">
            No categories yet. Add your first filing category.
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.isSub ? 'Edit Subcategory' : editing.id ? 'Edit Category' : 'Add Category'}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={editing.isSub ? async (e) => {
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
            } : saveCategory}
            className="space-y-4"
          >
            <Field label="Name" required>
              <input
                className={inputCls}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Sort Order">
              <input
                type="number"
                className={inputCls}
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
              />
            </Field>
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

      {newSub && (
        <Modal title="Add Subcategory" onClose={() => setNewSub(null)}>
          <form onSubmit={saveSub} className="space-y-4">
            <Field label="Name" required>
              <input
                className={inputCls}
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Sort Order">
              <input
                type="number"
                className={inputCls}
                value={newSub.sort_order}
                onChange={(e) => setNewSub({ ...newSub, sort_order: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewSub(null)}
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
        <Modal title={`Delete ${confirmDel.type}`} onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.name}</b>?{' '}
            {confirmDel.type === 'category' && 'All its subcategories are also removed.'}
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
