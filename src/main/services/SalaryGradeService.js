import { getDb } from '../db.js'

function normalizeGrade(raw) {
  const s = String(raw || '').trim()
  if (!s) throw new Error('Grade is required.')
  const up = s.toUpperCase().replace(/\s+/g, '')
  // Normalize SG variants: SG1, SG-1, SG 1 -> SG-1 (allow 1-99 for flexibility)
  const m = up.match(/^SG-?(\d{1,3})$/)
  if (m) {
    const n = Number(m[1])
    if (n >= 1 && n <= 99) return `SG-${n}`
  }
  // Numeric like "11" -> SG-11
  if (/^\d{1,3}$/.test(up)) {
    const n = Number(up)
    if (n >= 1 && n <= 99) return `SG-${n}`
  }
  // Allow any custom grade (e.g., "JO", "Contractual", "SG-A") — just uppercase and single-space
  return String(raw).trim().toUpperCase().replace(/\s+/g, ' ')
}

function validateStep(grade, step) {
  const s = Number(step)
  if (!Number.isInteger(s)) throw new Error('Step must be an integer 1-8 (SG-33 only 1-2).')
  const gStr = String(grade)
  const m = gStr.match(/^SG-(\d+)$/)
  const gradeNum = m ? Number(m[1]) : null
  const max = gradeNum === 33 ? 2 : 8
  if (s < 1 || s > max) throw new Error(`Step must be between 1 and ${max} for ${grade}.`)
  return s
}

function validateSalary(salary) {
  const v = Number(salary)
  if (!Number.isFinite(v) || v <= 0) throw new Error('Salary must be a positive amount.')
  if (v > 1000000) throw new Error('Salary is unrealistically high.')
  return Math.round(v * 100) / 100
}

function orderClause() {
  // Numeric grade order, then step
  return `ORDER BY CAST(substr(grade, 4) AS INTEGER) ASC, step ASC, id ASC`
}

export const SalaryGradeService = {
  // Flat list (all steps) — for backward compat
  list({ search = '', grade = '' } = {}) {
    const db = getDb()
    const hasSearch = String(search).trim() !== ''
    const hasGrade = String(grade).trim() !== ''
    let sql = `SELECT * FROM salary_grades`
    const where = []
    const params = []
    if (hasGrade) {
      try {
        const norm = normalizeGrade(grade)
        where.push('grade = ?')
        params.push(norm)
      } catch {
        where.push('grade LIKE ?')
        params.push(`%${String(grade).trim()}%`)
      }
    }
    if (hasSearch) {
      const q = `%${String(search).trim()}%`
      where.push('(grade LIKE ? OR CAST(step AS TEXT) LIKE ? OR CAST(salary AS TEXT) LIKE ?)')
      params.push(q, q, q)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ' + orderClause()
    return db.prepare(sql).all(...params)
  },

  // Grouped view: [{ grade, steps: [{id, step, salary}], minSalary, maxSalary, count }]
  listGrouped({ search = '' } = {}) {
    const rows = this.list({ search })
    const map = new Map()
    for (const r of rows) {
      if (!map.has(r.grade)) map.set(r.grade, [])
      map.get(r.grade).push(r)
    }
    const out = []
    for (const [grade, steps] of map.entries()) {
      steps.sort((a, b) => a.step - b.step)
      const salaries = steps.map((s) => Number(s.salary))
      const m = String(grade).match(/^SG-(\d+)$/)
      const num = m ? Number(m[1]) : 999
      const expected = num === 33 ? 2 : 8
      out.push({
        grade,
        gradeNum: Number.isFinite(num) ? num : 999,
        steps,
        count: steps.length,
        minSalary: Math.min(...salaries),
        maxSalary: Math.max(...salaries),
        expectedSteps: expected,
        isComplete: steps.length === expected,
      })
    }
    out.sort((a, b) => {
      if (a.gradeNum !== b.gradeNum) return a.gradeNum - b.gradeNum
      return String(a.grade).localeCompare(String(b.grade))
    })
    return out
  },

  // Distinct grades summary (for dropdowns like Employees)
  listGrades() {
    const db = getDb()
    const rows = db.prepare(`
      SELECT grade,
             MIN(salary) as minSalary,
             MAX(salary) as maxSalary,
             COUNT(*) as stepCount,
             MIN(step) as minStep,
             MAX(step) as maxStep
      FROM salary_grades
      GROUP BY grade
      ${orderClause().replace('step ASC,', '')}
    `).all()
    // custom numeric sort for SG-N, lexical fallback for custom grades
    rows.sort((a, b) => {
      const ma = String(a.grade).match(/^SG-(\d+)$/), mb = String(b.grade).match(/^SG-(\d+)$/)
      const na = ma ? Number(ma[1]) : 999, nb = mb ? Number(mb[1]) : 999
      if (na !== nb) return na - nb
      return String(a.grade).localeCompare(String(b.grade))
    })
    return rows
  },

  get(id) {
    return getDb().prepare('SELECT * FROM salary_grades WHERE id = ?').get(id) || null
  },

  getByGradeStep(grade, step) {
    const g = normalizeGrade(grade)
    const s = validateStep(g, step)
    return getDb().prepare('SELECT * FROM salary_grades WHERE grade = ? AND step = ?').get(g, s) || null
  },

  create({ grade, step, salary }) {
    const g = normalizeGrade(grade)
    const s = validateStep(g, step)
    const sal = validateSalary(salary)
    const db = getDb()
    const existing = db.prepare('SELECT id FROM salary_grades WHERE grade = ? AND step = ?').get(g, s)
    if (existing) throw new Error(`${g} Step ${s} already exists (ID #${existing.id}). Use update instead.`)
    const result = db.prepare('INSERT INTO salary_grades (grade, step, salary) VALUES (?, ?, ?)').run(g, s, sal)
    return this.get(result.lastInsertRowid)
  },

  update(id, { grade, step, salary }) {
    const db = getDb()
    const existing = this.get(id)
    if (!existing) throw new Error('Salary grade step not found')

    let newGrade = existing.grade
    let newStep = existing.step
    let newSalary = existing.salary

    if (grade !== undefined) newGrade = normalizeGrade(grade)
    if (step !== undefined) newStep = validateStep(grade !== undefined ? newGrade : existing.grade, step)
    // Cross-validate step if grade changed but step not
    if (grade !== undefined && step === undefined) {
      newStep = validateStep(newGrade, existing.step)
    }
    if (salary !== undefined) newSalary = validateSalary(salary)

    // Check unique violation if grade/step changed
    if (newGrade !== existing.grade || newStep !== existing.step) {
      const dup = db.prepare('SELECT id FROM salary_grades WHERE grade = ? AND step = ? AND id != ?').get(newGrade, newStep, id)
      if (dup) throw new Error(`${newGrade} Step ${newStep} already exists (ID #${dup.id}).`)
    }

    db.prepare('UPDATE salary_grades SET grade = ?, step = ?, salary = ? WHERE id = ?').run(newGrade, newStep, newSalary, id)
    return this.get(id)
  },

  // Upsert: create or update a single grade+step
  upsert({ grade, step, salary }) {
    const g = normalizeGrade(grade)
    const s = validateStep(g, step)
    const sal = validateSalary(salary)
    const db = getDb()
    const existing = db.prepare('SELECT id FROM salary_grades WHERE grade = ? AND step = ?').get(g, s)
    if (existing) {
      db.prepare('UPDATE salary_grades SET salary = ? WHERE id = ?').run(sal, existing.id)
      return this.get(existing.id)
    }
    const res = db.prepare('INSERT INTO salary_grades (grade, step, salary) VALUES (?, ?, ?)').run(g, s, sal)
    return this.get(res.lastInsertRowid)
  },

  // Bulk: upsert an entire grade's steps (array of {step, salary} or salary array indexed 1..8)
  upsertGrade(grade, steps) {
    const g = normalizeGrade(grade)
    const db = getDb()
    const inputs = Array.isArray(steps) ? steps : []
    // Normalize to [{step, salary}]
    const normalized = []
    for (const item of inputs) {
      if (item == null) continue
      if (typeof item === 'object' && 'salary' in item) {
        normalized.push({ step: Number(item.step), salary: Number(item.salary) })
      } else if (typeof item === 'number') {
        // not used
      }
    }
    // Alternative: if steps is plain object {1: 14634, 2: 14730}
    if (inputs.length === 0 && typeof steps === 'object' && !Array.isArray(steps)) {
      for (const [k, v] of Object.entries(steps)) normalized.push({ step: Number(k), salary: Number(v) })
    }

    const results = []
    db.exec('BEGIN')
    try {
      for (const { step, salary } of normalized) {
        const s = validateStep(g, step)
        const sal = validateSalary(salary)
        const existing = db.prepare('SELECT id FROM salary_grades WHERE grade = ? AND step = ?').get(g, s)
        if (existing) {
          db.prepare('UPDATE salary_grades SET salary = ? WHERE id = ?').run(sal, existing.id)
          results.push(this.get(existing.id))
        } else {
          const res = db.prepare('INSERT INTO salary_grades (grade, step, salary) VALUES (?, ?, ?)').run(g, s, sal)
          results.push(this.get(res.lastInsertRowid))
        }
      }
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
    return results
  },

  remove(id) {
    const result = getDb().prepare('DELETE FROM salary_grades WHERE id = ?').run(id)
    if (result.changes === 0) throw new Error('Salary grade step not found')
    return { deleted: true }
  },

  removeGrade(grade) {
    const g = normalizeGrade(grade)
    const res = getDb().prepare('DELETE FROM salary_grades WHERE grade = ?').run(g)
    return { deleted: res.changes }
  },
}
