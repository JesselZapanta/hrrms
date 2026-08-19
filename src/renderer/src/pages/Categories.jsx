import { useEffect, useState } from 'react'
import { Modal } from '../components/Modal.jsx'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null)
  const [newSub, setNewSub] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

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
      load()
    }
  }

  const saveSub = async (e) => {
    e.preventDefault()
    const res = await window.api.categories.createSub(newSub.category_id, newSub.name, newSub.sort_order || 0)
    if (res.ok) {
      setNewSub(null)
      load()
    }
  }

  const remove = async () => {
    const res = confirmDel.type === 'category'
      ? await window.api.categories.remove(confirmDel.id)
      : await window.api.categories.removeSub(confirmDel.id)
    if (res.ok) {
      setConfirmDel(null)
      load()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">File Categories</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/40">
            Admin only · structure of the filing system
          </p>
        </div>
        <button
          onClick={() => setEditing({ name: '', sort_order: 0 })}
          className="rounded bg-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange/90"
        >
          + Add Category
        </button>
      </header>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="overflow-hidden rounded-md border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline bg-paper px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink/40">#{cat.sort_order}</span>
                <h2 className="font-heading text-base font-semibold text-navy">{cat.name}</h2>
                <span className="font-mono text-[11px] text-ink/40">{cat.subcategories.length} sub</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewSub({ category_id: cat.id, name: '', sort_order: 0 })}
                  className="rounded border border-hairline px-2.5 py-1 text-xs text-ink/60 hover:border-navy hover:text-navy"
                >
                  + Subcategory
                </button>
                <button
                  onClick={() => setEditing({ id: cat.id, name: cat.name, sort_order: cat.sort_order })}
                  className="rounded border border-hairline px-2.5 py-1 text-xs text-ink/60 hover:border-orange hover:text-orange"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDel({ type: 'category', id: cat.id, name: cat.name })}
                  className="rounded border border-hairline px-2.5 py-1 text-xs text-ink/60 hover:border-status-red hover:text-status-red"
                >
                  Delete
                </button>
              </div>
            </div>
            <ul className="divide-y divide-hairline">
              {cat.subcategories.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-ink/80">{sub.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setEditing({
                          id: sub.id,
                          isSub: true,
                          category_id: cat.id,
                          name: sub.name,
                          sort_order: sub.sort_order
                        })
                      }
                      className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-orange hover:text-orange"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel({ type: 'sub', id: sub.id, name: sub.name })}
                      className="rounded border border-hairline px-2 py-0.5 text-xs text-ink/60 hover:border-status-red hover:text-status-red"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {cat.subcategories.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink/40">No subcategories.</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.isSub ? 'Edit Subcategory' : editing.id ? 'Edit Category' : 'Add Category'} onClose={() => setEditing(null)}>
          <form
            onSubmit={editing.isSub ? async (e) => {
              e.preventDefault()
              const res = await window.api.categories.updateSub(editing.id, {
                name: editing.name,
                sort_order: editing.sort_order || 0
              })
              if (res.ok) {
                setEditing(null)
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
        <Modal title={`Delete ${confirmDel.type}`} onClose={() => setConfirmDel(null)}>
          <p className="text-sm text-ink/70">
            Delete <b>{confirmDel.name}</b>? {confirmDel.type === 'category' && 'All its subcategories are also removed.'}
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
