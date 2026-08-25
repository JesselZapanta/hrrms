import { getDb, getStorageDir } from '../db.js'
import { encrypt, decrypt } from '../crypto.js'
import fs from 'node:fs'
import path from 'node:path'

const FIELDS = [
  'complete_name', 'position', 'office', 'plantilla_item', 'salary_grade', 'salary_step',
  'birthday', 'status', 'date_hired', 'contact_number', 'email',
  'complete_address', 'profile_pic'
]

export const EmployeeService = {
  list({ search = '' } = {}) {
    const db = getDb()
    const q = `%${String(search).trim()}%`
    const rows = q === '%%'
      ? db.prepare('SELECT * FROM employees ORDER BY complete_name').all()
      : db
          .prepare(
            `SELECT * FROM employees
             WHERE complete_name LIKE ? OR position LIKE ? OR record_no LIKE ?
                OR office LIKE ? OR plantilla_item LIKE ? OR email LIKE ?
                OR contact_number LIKE ?
             ORDER BY complete_name`
          )
          .all(q, q, q, q, q, q, q)
    return rows.map((r) => ({ ...r, profile_pic: decrypt(r.profile_pic), file_count: this.fileCount(r.id) }))
  },

  fileCount(id) {
    return getDb().prepare('SELECT COUNT(*) AS c FROM files WHERE employee_id = ?').get(id).c
  },

  get(id) {
    const row = getDb().prepare('SELECT * FROM employees WHERE id = ?').get(id)
    return row ? { ...row, profile_pic: decrypt(row.profile_pic) } : null
  },

  create(data) {
    const db = getDb()
    const clean = pick(data)
    // Ensure salary_step is handled as integer/null in SQL
    if (clean.salary_step === '' || clean.salary_step == null) clean.salary_step = null
    else clean.salary_step = Number(clean.salary_step) || null
    let id
    db.exec('BEGIN')
    try {
      const info = db
        .prepare(
          `INSERT INTO employees (complete_name, position, office, plantilla_item, salary_grade, salary_step, birthday, status, date_hired, contact_number, email, complete_address, profile_pic, record_no)
           VALUES (@complete_name, @position, @office, @plantilla_item, @salary_grade, @salary_step, @birthday, @status, @date_hired, @contact_number, @email, @complete_address, @profile_pic, @record_no)`
        )
        .run({ ...clean, record_no: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })
      id = Number(info.lastInsertRowid)
      const recordNo = `201-${String(id).padStart(5, '0')}`
      db.prepare('UPDATE employees SET record_no = ? WHERE id = ?').run(recordNo, id)
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    fs.mkdirSync(path.join(getStorageDir(), String(id)), { recursive: true })
    return this.get(id)
  },

  update(id, data) {
    const db = getDb()
    const existing = this.get(id)
    if (!existing) throw new Error('Employee not found')

    const clean = pick(data)
    const keys = Object.keys(clean).filter((k) => clean[k] !== undefined)
    if (keys.length === 0) return existing

    const set = keys.map((k) => `${k} = @${k}`).join(', ')
    clean.id = id
    db.prepare(`UPDATE employees SET ${set}, updated_at = datetime('now','localtime') WHERE id = @id`).run(clean)
    return this.get(id)
  },

  remove(id) {
    const db = getDb()
    let deleted = false
    db.exec('BEGIN')
    try {
      const info = db.prepare('DELETE FROM employees WHERE id = ?').run(id)
      deleted = info.changes > 0
      db.exec('COMMIT')
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
    const folder = path.join(getStorageDir(), String(id))
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true })
    return { deleted }
  }
}

function pick(data) {
  const out = {}
  for (const f of FIELDS) {
    if (data[f] !== undefined) {
      if (f === 'profile_pic') {
        out[f] = data[f] ? encrypt(String(data[f])) : null
      } else if (f === 'salary_step') {
        const v = data[f]
        if (v === '' || v == null) out[f] = null
        else {
          const n = Number(v)
          if (!Number.isInteger(n) || n < 1 || n > 8) out[f] = null
          else out[f] = n
        }
      } else if (f === 'salary_grade') {
        const g = String(data[f] ?? '').trim().toUpperCase()
        out[f] = g ? g.replace(/\s+/g, '') : ''
        // Normalize SG formatting: SG1 -> SG-1
        const m = out[f].match(/^SG-?(\d{1,2})$/)
        if (m) out[f] = `SG-${Number(m[1])}`
      } else {
        out[f] = String(data[f] ?? '').trim()
      }
    }
  }
  return out
}
