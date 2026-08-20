import { getDb } from '../db.js'

export const SalaryGradeService = {
  list({ search = '' } = {}) {
    const db = getDb()
    const q = `%${String(search).trim()}%`
    const rows =
      q === '%%'
        ? db.prepare('SELECT * FROM salary_grades ORDER BY id').all()
        : db
            .prepare(
              `SELECT * FROM salary_grades
               WHERE grade LIKE ? OR CAST(salary AS TEXT) LIKE ?
               ORDER BY id`
            )
            .all(q, q)
    return rows
  },

  get(id) {
    return getDb().prepare('SELECT * FROM salary_grades WHERE id = ?').get(id) || null
  },

  create({ grade, salary }) {
    const result = getDb()
      .prepare('INSERT INTO salary_grades (grade, salary) VALUES (?, ?)')
      .run(String(grade).trim().toUpperCase(), Number(salary) || 0)
    return this.get(result.lastInsertRowid)
  },

  update(id, { grade, salary }) {
    const db = getDb()
    const existing = this.get(id)
    if (!existing) throw new Error('Salary grade not found')

    const set = []
    const params = []
    if (grade !== undefined) { set.push('grade = ?'); params.push(String(grade).trim().toUpperCase()) }
    if (salary !== undefined) { set.push('salary = ?'); params.push(Number(salary) || 0) }
    if (set.length === 0) return existing

    params.push(id)
    db.prepare(`UPDATE salary_grades SET ${set.join(', ')} WHERE id = ?`).run(...params)
    return this.get(id)
  },

  remove(id) {
    const result = getDb().prepare('DELETE FROM salary_grades WHERE id = ?').run(id)
    return { deleted: result.changes > 0 }
  }
}