import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'

const pickUser = (u) =>
  u && { id: u.id, username: u.username, full_name: u.full_name, role: u.role, status: u.status, created_at: u.created_at }

export const UserService = {
  list() {
    return getDb()
      .prepare('SELECT id, username, full_name, role, status, created_at FROM users ORDER BY full_name')
      .all()
  },

  create({ username, password, full_name, role }) {
    if (!username || !password || !full_name) {
      throw new Error('Username, password, and full name are required')
    }
    const hash = bcrypt.hashSync(String(password), 12)
    const result = getDb()
      .prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
      .run(String(username).trim(), hash, String(full_name).trim(), role === 'admin' ? 'admin' : 'staff')
    return this.get(result.lastInsertRowid)
  },

  update(id, { username, full_name, role, password, status }) {
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) throw new Error('User not found')

    const set = []
    const params = []
    if (username !== undefined) { set.push('username = ?'); params.push(String(username).trim()) }
    if (full_name !== undefined) { set.push('full_name = ?'); params.push(String(full_name).trim()) }
    if (role !== undefined) { set.push('role = ?'); params.push(role === 'admin' ? 'admin' : 'staff') }
    if (status !== undefined) { set.push('status = ?'); params.push(status === 'active' ? 'active' : 'inactive') }
    if (password) {
      set.push('password_hash = ?')
      params.push(bcrypt.hashSync(String(password), 12))
    }
    if (set.length === 0) return this.get(id)

    params.push(id)
    db.prepare(`UPDATE users SET ${set.join(', ')} WHERE id = ?`).run(...params)
    return this.get(id)
  },

  setStatus(id, status) {
    return this.update(id, { status })
  },

  remove(id) {
    const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
    return { deleted: result.changes > 0 }
  },

  get(id) {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
    return pickUser(row)
  }
}
