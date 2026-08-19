import { getDb, getStorageDir } from '../db.js'
import fs from 'node:fs'
import path from 'node:path'

const FIELDS = ['complete_name', 'position', 'birthday', 'status', 'complete_address']

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
             ORDER BY complete_name`
          )
          .all(q, q, q)
    return rows.map((r) => ({ ...r, file_count: this.fileCount(r.id) }))
  },

  fileCount(id) {
    return getDb().prepare('SELECT COUNT(*) AS c FROM files WHERE employee_id = ?').get(id).c
  },

  get(id) {
    const row = getDb().prepare('SELECT * FROM employees WHERE id = ?').get(id)
    return row || null
  },

  create(data) {
    const db = getDb()
    const clean = pick(data)
    const insert = db.prepare(
      `INSERT INTO employees (complete_name, position, birthday, status, complete_address)
       VALUES (@complete_name, @position, @birthday, @status, @complete_address)`
    )
    let id
    db.exec('BEGIN')
    try {
      const info = insert.run(clean)
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
    db.prepare(`UPDATE employees SET ${set}, updated_at = datetime('now','localtime') WHERE id = ?`).run(clean)
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
    if (data[f] !== undefined) out[f] = String(data[f] ?? '').trim()
  }
  return out
}
