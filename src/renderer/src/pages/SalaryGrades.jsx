import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'
import Select from '../components/Select.jsx'
import Swoosh from '../components/Swoosh.jsx'
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
  const [sortDir, setSortDir] = useState('asc')
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
    arr.sort((a, b) => (sortDir === 'asc' ? a.gradeNum - b.gradeNum : b.gradeNum - a.gradeNum))
    return arr
  }, [grouped, sortDir])

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
    <div className="mx-auto w-full">
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      {/* Colorful page header */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 shadow-lg shadow-navy-900/20 lg:mb-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-56 w-56 rounded-full bg-white/[0.06] blur-2xl" />
        <Swoosh className="pointer-events-none absolute -bottom-10 right-4 h-36 w-36 opacity-30" />
        <div className="relative z-10 p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/10 text-white">
              <CoinsIcon />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[18px] font-bold leading-tight text-white lg:text-[22px]">
                Salary Grades
              </h1>
              <p className="mt-0.5 text-[11px] text-white/60 lg:text-[12px]">
                Salary Standardization · {grouped.length} grades · {grouped.reduce((n, g) => n + ((g.steps || []).length), 0)} steps
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{grouped.length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Grades</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{grouped.reduce((n, g) => n + ((g.steps || []).length), 0)}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Steps</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-center">
                <span className="block font-mono text-[15px] font-bold leading-none text-white lg:text-[17px]">{grouped.filter((g) => g.expectedSteps != null && (g.count ?? (g.steps || []).length) >= g.expectedSteps).length}</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/60">Complete</span>
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-52">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"><SearchIcon /></span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SG, step or salary…"
                className="w-full rounded-xl border border-transparent bg-white py-2.5 pl-10 pr-3.5 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <button
              onClick={openAddGrade}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition-all hover:bg-accent-dark active:scale-[.98]"
            >
              <PlusIcon /> Add Salary Grade
            </button>
          </div>
        </div>
      </div>

      {/* Matrix table */}
      <div className="gov-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F1F4F9] text-[13px] font-semibold text-text-primary">
                <th className="sticky left-0 z-10 cursor-pointer select-none bg-[#F1F4F9] px-4 py-3 text-left" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
                  <span className="inline-flex items-center gap-1">Grade <SortArrow dir={sortDir} /></span>
                </th>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <th key={s} className="px-3 py-3 text-right whitespace-nowrap">Step {s}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((g) => (
                <>
                  <tr key={g.grade} className="group whitespace-nowrap hover:bg-row-hover">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-row-hover">
                      <span className="inline-flex items-center rounded-lg bg-info-bg px-2.5 py-1 font-heading text-sm font-bold text-navy-800">{g.grade}</span>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => {
                      const row = getStepRow(g, stepNum)
                      const disabled = g.gradeNum === 33 && stepNum > 2
                      if (disabled) return <td key={stepNum} className="px-3 py-3 text-right font-mono text-xs text-text-secondary">—</td>
                      if (!row) {
                        return <td key={stepNum} className="px-3 py-3 text-right font-mono text-xs text-text-secondary">—</td>
                      }
                      return (
                        <td key={stepNum} className="px-3 py-3 text-right">
                          <button
                            onClick={() => openEditStep(row)}
                            className="rounded-lg px-2 py-1 font-mono text-xs font-medium text-text-primary hover:bg-info-bg hover:text-navy-800"
                            title={`${g.grade} Step ${stepNum} — ${money(row.salary)} (click to edit)`}
                          >
                            {moneyCompact(row.salary)}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditGrade(g)} title="Update grade" className="rounded-lg p-2 text-text-secondary hover:bg-accent-soft hover:text-accent"><EditIcon /></button>
                        <button onClick={() => setConfirmDelGrade(g.grade)} title="Delete grade" className="rounded-lg p-2 text-text-secondary hover:bg-danger-text/10 hover:text-danger-text"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                </>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-14 text-center text-sm text-text-secondary">
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
        <span className="font-mono text-xs text-text-secondary">
          {sorted.length === 0 ? 'No results' : `Showing ${from}–${to} of ${sorted.length} grades`}{sorted.length ? ` · ${totalSteps} steps total` : ''}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary hover:bg-row-hover disabled:opacity-40"><ChevronIcon dir="left" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs ${n === safePage ? 'bg-navy-900 font-semibold text-white shadow-md shadow-navy-900/25' : 'border border-border bg-white text-text-secondary hover:bg-row-hover'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-secondary hover:bg-row-hover disabled:opacity-40"><ChevronIcon dir="right" /></button>
          </div>
        )}
      </div>

      {/* Single-step modal */}
      {editing && (
        <Modal title={editing.id ? `Edit ${editing.grade} — Step ${editing.step}` : 'Add Salary Grade Step'} onClose={() => setEditing(null)} compact>
          <form onSubmit={saveStep} className="space-y-4">
            { !editing.id && grouped.length === 33 && grouped.every(g => g.count === g.expectedSteps) && (
              <div className="rounded-lg border border-navy/10 bg-[#F1F4F9] px-3 py-2 font-mono text-[11px] text-text-secondary">
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
                <div className="rounded-lg border border-accent/20 bg-accent-soft px-3 py-2 font-mono text-[11px] text-accent">
                  {editing.grade} Step {editing.step} already exists ({money(row.salary)}). Saving will <b>update</b> it.
                </div>
              ) : null
            })()}
            <Field label="Monthly Salary (₱)" required>
              <input type="number" step="0.01" min="0" className={inputCls} value={editing.salary} onChange={(e) => setEditing({ ...editing, salary: e.target.value })} placeholder="e.g. 31705" required />
            </Field>
            {error && <div className="rounded-lg border border-danger-text/30 bg-danger-bg/50 px-3 py-2 text-xs text-danger-text">{error}</div>}
            <div className="flex items-center justify-between border-t border-border pt-4">
              {editing.id ? (
                <button type="button" onClick={() => { const r = grouped.flatMap(g=>g.steps).find(s=>s.id===editing.id); if(r) { setConfirmDelStep(r); setEditing(null) } }} className="rounded-lg border border-danger-text/20 bg-danger-bg/50 px-3.5 py-2 text-xs font-medium text-danger-text hover:bg-danger-text/10">Delete Step</button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-row-hover">Cancel</button>
                <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-accent/25 hover:bg-accent-dark"><SaveIcon /> Save Step</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete step confirmation — styled like other modules */}
      {confirmDelStep && (
        <Modal title="Delete step" onClose={() => setConfirmDelStep(null)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-text/10 text-danger-text"><TrashIcon /></span>
            <div>
              <div className="text-sm font-semibold text-text-primary">Delete {confirmDelStep.grade} Step {confirmDelStep.step}?</div>
              <p className="mt-0.5 text-xs text-text-secondary"><b>{money(confirmDelStep.salary)}</b> will be removed from this grade.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button onClick={() => setConfirmDelStep(null)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-row-hover">Cancel</button>
            <button onClick={removeStep} className="rounded-lg bg-danger-text px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Delete</button>
          </div>
        </Modal>
      )}

      {confirmDelGrade && (
        <Modal title="Delete salary grade" onClose={() => setConfirmDelGrade(null)} compact>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-text/10 text-danger-text"><TrashIcon /></span>
            <div>
              <div className="text-sm font-semibold text-text-primary">Delete {confirmDelGrade}?</div>
              <p className="mt-0.5 text-xs text-text-secondary">All steps under this grade will be removed. This cannot be undone.</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
            <button onClick={() => setConfirmDelGrade(null)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-row-hover">Cancel</button>
            <button onClick={removeGrade} className="rounded-lg bg-danger-text px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Delete</button>
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
              <div className="rounded-xl border border-dashed border-border bg-row-hover/50 px-4 py-6 text-center font-mono text-xs text-text-secondary">Type a grade above (e.g., SG-11) to enter its step salaries.</div>
            )}
            {bulkError && <div className="rounded-lg border border-danger-text/30 bg-danger-bg/50 px-3 py-2 text-xs text-danger-text">{bulkError}</div>}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="font-mono text-xs text-text-secondary">{bulk.grade ? `${Number(String(bulk.grade).split('-')[1])===33?2:8} steps` : ''}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBulk(null)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:bg-row-hover">Cancel</button>
                <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-accent/25 hover:bg-accent-dark"><SaveIcon /> Save Grade</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-text-secondary">{label} {required && <span className="text-accent">*</span>}</label>
      {children}
    </div>
  )
}

function SearchIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>)
}
function CoinsIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10" /><path d="M15 9.5c0-.83-1.34-1.5-3-1.5s-3 .67-3 1.5 1.34 1.5 3 1.5 3 .67 3 1.5-1.34 1.5-3 1.5-3-.67-3-1.5" /></svg>)
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
