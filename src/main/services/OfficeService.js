import { getDb } from '../db.js'

export const OfficeService = {
  list({ search = '' } = {}) {
    const db = getDb()
    const q = `%${String(search).trim()}%`
    const rows =
      q === '%%'
        ? db.prepare('SELECT * FROM offices ORDER BY name').all()
        : db
            .prepare(
              `SELECT * FROM offices
               WHERE name LIKE ? OR description LIKE ?
               ORDER BY name`
            )
            .all(q, q)
    return rows
  },

  get(id) {
    return getDb().prepare('SELECT * FROM offices WHERE id = ?').get(id) || null
  },

  create({ name, description, status = 'active' }) {
    const result = getDb()
      .prepare('INSERT INTO offices (name, description, status) VALUES (?, ?, ?)')
      .run(String(name).trim(), String(description ?? '').trim(), status)
    return this.get(result.lastInsertRowid)
  },

  update(id, { name, description, status }) {
    const db = getDb()
    const existing = this.get(id)
    if (!existing) throw new Error('Office not found')

    const set = []
    const params = []
    if (name !== undefined) { set.push('name = ?'); params.push(String(name).trim()) }
    if (description !== undefined) { set.push('description = ?'); params.push(String(description).trim()) }
    if (status !== undefined) { set.push('status = ?'); params.push(status) }
    if (set.length === 0) return existing

    params.push(id)
    db.prepare(`UPDATE offices SET ${set.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`).run(...params)
    return this.get(id)
  },

  remove(id) {
    const result = getDb().prepare('DELETE FROM offices WHERE id = ?').run(id)
    return { deleted: result.changes > 0 }
  }
}