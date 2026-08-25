import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import Toast from '../components/Toast.jsx'

const PAGE_SIZE = 8 // grades per page (each grade expands to 8 steps)
const GRADE_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const n = i + 1
  return { value: `SG-${n}`, label: `SG-${n}` }
})
const STEP_OPTIONS_8 = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Step ${i + 1}` }))
const STEP_OPTIONS_2 = [{ value: '1', label: 'Step 1' }, { value: '2', label: 'Step 2' }]

const money = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n) || 0)
const moneyCompact = (n) => new Intl.NumberFormat('en-PH').format(Number(n) || 0)

export default function SalaryGrades() {
  const [grouped, setGrouped] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // {id, grade, step, salary}
  const [bulk, setBulk] = useState(null) // { grade, steps: {1: salary,...} }
  const [error, setError] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmDelStep, setConfirmDelStep] = useState(null)
  const [confirmDelGrade, setConfirmDelGrade] = useState(null)

  const load = async () => {
    const res = await window.api.salaryGrades.listGrouped({ search })
    if (res.ok) setGrouped(res.data)
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [search])

  const sorted = useMemo(() => {
    const arr = [...grouped]
    arr.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [grouped, sortBy, sortDir])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir(col === 'id' ? 'desc' : 'asc') }
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, sorted.length)
  const totalSteps = grouped.reduce((s, g) => s + g.count, 0)

  const openEditStep = (row) => {
    setError('')
    setEditing({ id: row.id, grade: row.grade, step: String(row.step), salary: String(row.salary) })
  }

  const openAddGrade = () => {
    setBulkError('')
    // Default to first grade that still has missing steps, or SG-1
    let def = ''
    for (let i = 1; i <= 33; i++) {
      const g = `SG-${i}`
      const found = grouped.find((x) => x.grade === g)
      if (!found || found.count < found.expectedSteps) { def = g; break }
    }
    if (!def) def = 'SG-1'
    setBulk({ grade: def, steps: {} })
  }

  const openEditGrade = (group) => {
    setBulkError('')
    const steps = {}
    for (const s of group.steps) steps[String(s.step)] = String(s.salary)
    setBulk({ grade: group.grade, steps, originalGrade: group.grade })
  }



  const saveStep = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      grade: editing.grade,
      step: Number(editing.step),
      salary: Number(editing.salary),
    }
    // Use upsert for new entries so "Add" on an existing grade/step just updates the salary
    // instead of throwing UNIQUE constraint. Edit (with id) still uses update for precise id.
    const res = editing.id
      ? await window.api.salaryGrades.update(editing.id, payload)
      : await window.api.salaryGrades.upsert(payload)
    if (!res.ok) { setError(res.error); return }
    setEditing(null)
    setToast({ message: editing.id ? `Updated ${res.data.grade} Step ${res.data.step}` : `Saved ${res.data.grade} Step ${res.data.step} — ${money(res.data.salary)}`, tone: 'success' })
    load()
  }

  const saveBulk = async (e) => {
    e.preventDefault()
    setBulkError('')
    if (!bulk.grade) { setBulkError('Select a salary grade.'); return }
    const gradeNum = Number(String(bulk.grade).split('-')[1])
    const maxStep = gradeNum === 33 ? 2 : 8
    const payload = []
    for (let i = 1; i <= maxStep; i++) {
      const v = bulk.steps[String(i)]
      if (v !== '' && v != null) {
        const n = Number(v)
        if (!Number.isFinite(n) || n <= 0) { setBulkError(`Step ${i} salary must be a positive amount.`); return }
        payload.push({ step: i, salary: n })
      }
    }
    if (payload.length === 0) { setBulkError('Enter at least one step salary.'); return }
    const res = await window.api.salaryGrades.upsertGrade(bulk.grade, payload)
    if (!res.ok) { setBulkError(res.error); return }
    setBulk(null)
    setToast({ message: `Saved ${bulk.grade} — ${payload.length} step(s) updated.`, tone: 'success' })
    load()
  }

  const removeStep = async () => {
    if (!confirmDelStep) return
    const res = await window.api.salaryGrades.remove(confirmDelStep.id)
    if (!res.ok) { setToast({ message: res.error, tone: 'error' }); setConfirmDelStep(null); return }
    setToast({ message: `Deleted ${confirmDelStep.grade} Step ${confirmDelStep.step}.`, tone: 'success' })
    setConfirmDelStep(null)
    load()
  }

  const removeGrade = async () => {
    if (!confirmDelGrade) return
    const res = await window.api.salaryGrades.removeGrade(confirmDelGrade)
    if (!res.ok) { setToast({ message: res.error, tone: 'error' }); setConfirmDelGrade(null); return }
    setToast({ message: `Deleted ${confirmDelGrade} (${res.data.deleted} step(s)).`, tone: 'success' })
    setConfirmDelGrade(null)
    load()
  }

  const getStepRow = (group, stepNum) => group.steps.find((r) => r.step === stepNum) || null

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SG, step or salary…"
              className="w-72 rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-ink/30 focus:border-orange focus:ring-2 focus:ring-orange/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddGrade}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange/25 transition-all hover:bg-orange/90 hover:shadow-lg hover:shadow-orange/30 active:scale-[.98]"
          >
            <PlusIcon /> Add Salary Grade
          </button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-navy/[0.04] font-mono text-[10px] uppercase tracking-[1.5px] text-ink/45">
                <th className="w-14 cursor-pointer select-none px-4 py-3 hover:text-ink" onClick={() => toggleSort('id')}>
                  <span className="inline-flex items-center gap-1">ID {sortBy === 'id' && <SortArrow dir={sortDir} />}</span>
                </th>
                <th className="sticky left-0 z-10 cursor-pointer select-none bg-navy/[0.04] px-4 py-3 text-left hover:text-ink" onClick={() => toggleSort('grade')}>
                  <span className="inline-flex items-center gap-1">Grade {sortBy === 'grade' && <SortArrow dir={sortDir} />}</span>
                </th>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <th key={s} className="px-3 py-3 text-right whitespace-nowrap">Step {s}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {pageRows.map((g) => (
                <>
                  <tr key={g.grade} className="group whitespace-nowrap hover:bg-paper/70">
                    <td className="px-4 py-3 font-mono text-xs text-ink/60">#{g.id}</td>
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-paper/70">
                      <span className="inline-flex items-center rounded-lg bg-navy/5 px-2.5 py-1 font-heading text-sm font-bold text-navy">{g.grade}</span>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => {
                      const row = getStepRow(g, stepNum)
                      const disabled = g.gradeNum === 33 && stepNum > 2
                      if (disabled) return <td key={stepNum} className="px-3 py-3 text-right font-mono text-xs text-ink/20">—</td>
                      if (!row) {
                        return <td key={stepNum} className="px-3 py-3 text-right font-mono text-xs text-ink/20">—</td>
                      }
                      return (
                        <td key={stepNum} className="px-3 py-3 text-right">
                          <button
                            onClick={() => openEditStep(row)}
                            className="rounded-lg px-2 py-1 font-mono text-xs font-medium text-ink/80 hover:bg-navy/5 hover:text-navy"
                            title={`${g.grade} Step ${stepNum} — ${money(row.salary)} (click to edit)`}
                          >
                            {moneyCompact(row.salary)}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditGrade(g)} title="Update grade" className="rounded-lg p-2 text-ink/50 hover:bg-orange-soft hover:text-orange"><EditIcon /></button>
                        <button onClick={() => setConfirmDelGrade(g.grade)} title="Delete grade" className="rounded-lg p-2 text-ink/40 hover:bg-status-red/10 hover:text-status-red"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                </>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-14 text-center text-sm text-ink/40">
                    {grouped.length === 0 ? 'No salary grades yet. Click “Add Salary Grade” to seed SG-1 to SG-33.' : 'No grades match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-xs text-ink/40">
          {sorted.length === 0 ? 'No results' : `Showing ${from}–${to} of ${sorted.length} grades`}{sorted.length ? ` · ${totalSteps} steps total` : ''}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink/60 hover:bg-paper-dark disabled:opacity-40"><ChevronIcon dir="left" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs ${n === safePage ? 'bg-orange font-semibold text-white shadow-md shadow-orange/25' : 'border border-hairline bg-white text-ink/60 hover:bg-paper-dark'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-white text-ink/60 hover:bg-paper-dark disabled:opacity-40"><ChevronIcon dir="right" /></button>
          </div>
        )}
      </div>

      {/* Single-step modal */}
      {editing && (
        <Modal title={editing.id ? `Edit ${editing.grade} — Step ${editing.step}` : 'Add Salary Grade Step'} onClose={() => setEditing(null)} compact>
          <form onSubmit={saveStep} className="space-y-4">
            { !editing.id && grouped.length === 33 && grouped.every(g => g.count === g.expectedSteps) && (
              <div className="rounded-lg border border-navy/10 bg-navy/[0.04] px-3 py-2 font-mono text-[11px] text-ink/50">
                All 33 grades already have complete steps (258 total). “Add” will update the salary for the selected grade/step.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Salary Grade" required>
                <input
                  list="sg-grade-list"
                  className={inputCls}
                  value={editing.grade}
                  onChange={(e) => {
                    const v = e.target.value
                    const m = String(v).toUpperCase().replace(/\s+/g, '').match(/^SG-?(\d+)$/)
                    const num = m ? Number(m[1]) : null
                    const max = num === 33 ? 2 : 8
                    let step = editing.step
                    if (num !== null && Number(step) > max) step = String(max)
                    setEditing({ ...editing, grade: v, step })
                  }}
                  placeholder="e.g. SG-11 or custom"
                  required
                />
                <datalist id="sg-grade-list">
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} />
                  ))}
                </datalist>
              </Field>
              <Field label="Step" required>
                <Select
                  variant="form"
                  value={editing.step}
                  onChange={(v) => setEditing({ ...editing, step: v })}
                  options={(() => {
                    const is33 = Number(String(editing.grade).split('-')[1]) === 33
                    const base = is33 ? STEP_OPTIONS_2 : STEP_OPTIONS_8
                    const grp = grouped.find(g => g.grade === editing.grade)
                    if (!grp) return base
                    return base.map(o => {
                      const row = grp.steps.find(r => String(r.step) === o.value)
                      return row ? { value: o.value, label: `${o.label} — ${money(row.salary)}` } : o
                    })
                  })()}
                />
              </Field>
            </div>
            { !editing.id && (() => {
              const grp = grouped.find(g => g.grade === editing.grade)
              const row = grp?.steps.find(r => String(r.step) === String(editing.step))
              return row ? (
                <div className="rounded-lg border border-orange/20 bg-orange-soft px-3 py-2 font-mono text-[11px] text-orange">
                  {editing.grade} Step {editing.step} already exists ({money(row.salary)}). Saving will <b>update</b> it.
                </div>
              ) : null
            })()}
            <Field label="Monthly Salary (₱)" required>
              <input type="number" step="0.01" min="0" className={inputCls} value={editing.salary} onChange={(e) => setEditing({ ...editing, salary: e.target.value })} placeholder="e.g. 31705" required />
            </Field>
            {error && <div className="rounded-lg border border-status-red/30 bg-status-red/5 px-3 py-2 text-xs text-status-red">{error}</div>}
            <div className="flex items-center justify-between border-t border-hairline pt-4">
              {editing.id ? (
                <button type="button" onClick={() => { const r = grouped.flatMap(g=>g.steps).find(s=>s.id===editing.id); if(r) { setConfirmDelStep(r); setEditing(null) } }} className="rounded-lg border border-status-red/20 bg-status-red/5 px-3.5 py-2 text-xs font-medium text-status-red hover:bg-status-red/10">Delete Step</button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 hover:bg-paper-dark">Cancel</button>
                <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange/25 hover:bg-orange/90"><SaveIcon /> Save Step</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete step confirmation — styled like other modules */}
      {confirmDelStep && (
        <Modal title="Delete step" onClose={() => setConfirmDelStep(null)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-red/10 text-status-red"><TrashIcon /></span>
            <div>
              <div className="text-sm font-semibold text-ink">Delete {confirmDelStep.grade} Step {confirmDelStep.step}?</div>
              <p className="mt-0.5 text-xs text-ink/50"><b>{money(confirmDelStep.salary)}</b> will be removed from this grade.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
            <button onClick={() => setConfirmDelStep(null)} className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 hover:bg-paper-dark">Cancel</button>
            <button onClick={removeStep} className="rounded-lg bg-status-red px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Delete</button>
          </div>
        </Modal>
      )}

      {confirmDelGrade && (
        <Modal title="Delete salary grade" onClose={() => setConfirmDelGrade(null)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-status-red/10 text-status-red"><TrashIcon /></span>
            <div>
              <div className="text-sm font-semibold text-ink">Delete {confirmDelGrade}?</div>
              <p className="mt-0.5 text-xs text-ink/50">All steps under this grade will be removed. This cannot be undone.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
            <button onClick={() => setConfirmDelGrade(null)} className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 hover:bg-paper-dark">Cancel</button>
            <button onClick={removeGrade} className="rounded-lg bg-status-red px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Delete</button>
          </div>
        </Modal>
      )}

      {/* Bulk grade modal — type to add */}
      {bulk && (
        <Modal title={bulk.originalGrade ? `Update ${bulk.grade}` : 'Add Salary Grade'} onClose={() => setBulk(null)} wide>
          <form onSubmit={saveBulk} className="space-y-4">
            <Field label="Salary Grade" required>
              <input
                list="sg-grade-list-bulk"
                className={inputCls}
                value={bulk.grade}
                onChange={(e) => setBulk({ ...bulk, grade: e.target.value.toUpperCase() })}
                placeholder="Type SG-1 to SG-33, e.g. SG-11"
                required
              />
              <datalist id="sg-grade-list-bulk">
                {GRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} />
                ))}
              </datalist>
            </Field>
            {bulk.grade ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: Number(String(bulk.grade).split('-')[1]) === 33 ? 2 : 8 }, (_, i) => {
                  const s = i + 1
                  return (
                    <Field key={s} label={`Step ${s} Salary (₱)`}>
                      <input type="number" step="0.01" min="0" className={inputCls} value={bulk.steps[String(s)] ?? ''} onChange={(e) => setBulk({ ...bulk, steps: { ...bulk.steps, [String(s)]: e.target.value } })} placeholder={s===1 ? 'e.g. 31705' : ''} />
                    </Field>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-hairline bg-paper/50 px-4 py-6 text-center font-mono text-xs text-ink/40">Type a grade above (e.g., SG-11) to enter its step salaries.</div>
            )}
            {bulkError && <div className="rounded-lg border border-status-red/30 bg-status-red/5 px-3 py-2 text-xs text-status-red">{bulkError}</div>}
            <div className="flex items-center justify-between border-t border-hairline pt-4">
              <div className="font-mono text-xs text-ink/40">{bulk.grade ? `${Number(String(bulk.grade).split('-')[1])===33?2:8} steps` : ''}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulk(null)} className="rounded-lg border border-hairline px-3.5 py-2 text-xs font-medium text-ink/70 hover:bg-paper-dark">Cancel</button>
                <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-orange px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange/25 hover:bg-orange/90"><SaveIcon /> Save Grade</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange focus:ring-1 focus:ring-orange'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-ink/60">{label} {required && <span className="text-orange">*</span>}</label>
      {children}
    </div>
  )
}

function SearchIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>)
}
function ChevronIcon({ dir = 'right' }) {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={dir === 'down' ? 'rotate-90' : dir === 'left' ? 'rotate-180' : dir === 'right' ? '' : 'rotate-180'}><polyline points="9 18 15 12 9 6" /></svg>)
}
function PlusIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>)
}
function SaveIcon() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>)
}
function EditIcon({ small }) {
  return (<svg width={small ? 12 : 15} height={small ? 12 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>)
}
function TrashIcon({ small }) {
  return (<svg width={small ? 12 : 14} height={small ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>)
}
function SortArrow({ dir }) {
  return (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={dir === 'asc' ? 'rotate-180' : ''}><polyline points="6 9 12 15 18 9" /></svg>)
}
