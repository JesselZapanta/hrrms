import { getDb, getStorageDir } from '../db.js'
import fs from 'node:fs'
import path from 'node:path'

export const FileService = {
  listByEmployee(employeeId) {
    return getDb()
      .prepare(
        `SELECT f.*, s.name AS subcategory_name, c.name AS category_name
         FROM files f
         JOIN subcategories s ON s.id = f.subcategory_id
         JOIN categories c ON c.id = s.category_id
         WHERE f.employee_id = ?
         ORDER BY c.sort_order, s.sort_order, f.created_at DESC`
      )
      .all(employeeId)
  },

  upload({ employee_id, subcategory_id, original_name, data, mime_type = 'application/pdf', uploaded_by }) {
    const db = getDb()
    const sub = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(subcategory_id)
    if (!sub) throw new Error('Subcategory not found')

    const employeeDir = path.join(getStorageDir(), String(employee_id), String(subcategory_id))
    fs.mkdirSync(employeeDir, { recursive: true })

    const safeName = sanitize(original_name)
    const storedName = `${Date.now()}_${safeName}`
    const filePath = path.join(employeeDir, storedName)
    fs.writeFileSync(filePath, Buffer.from(data))

    const info = db
      .prepare(
        `INSERT INTO files (employee_id, subcategory_id, file_name, original_name, file_path, mime_type, file_size, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        employee_id,
        subcategory_id,
        safeName,
        original_name,
        filePath,
        mime_type,
        fs.statSync(filePath).size,
        uploaded_by || null
      )

    return db.prepare('SELECT * FROM files WHERE id = ?').get(info.lastInsertRowid)
  },

  uploadFromPath({ employee_id, subcategory_id, source_path, mime_type = 'application/pdf', uploaded_by }) {
    if (!fs.existsSync(source_path)) throw new Error('Source file not found')
    const data = fs.readFileSync(source_path)
    return this.upload({
      employee_id,
      subcategory_id,
      original_name: path.basename(source_path),
      data,
      mime_type,
      uploaded_by
    })
  },

  rename(id, newName) {
    const file = getDb().prepare('SELECT * FROM files WHERE id = ?').get(id)
    if (!file) throw new Error('File not found')

    const safeName = sanitize(newName)
    const oldPath = file.file_path
    const newPath = path.join(path.dirname(oldPath), `${Date.now()}_${safeName}`)

    if (oldPath !== newPath && fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath)
    }

    getDb()
      .prepare('UPDATE files SET file_name = ?, original_name = ?, file_path = ? WHERE id = ?')
      .run(safeName, newName, newPath, id)
    return getDb().prepare('SELECT * FROM files WHERE id = ?').get(id)
  },

  getPath(id) {
    const file = getDb().prepare('SELECT * FROM files WHERE id = ?').get(id)
    return file && fs.existsSync(file.file_path) ? file : null
  },

  readData(id) {
    const file = this.getPath(id)
    if (!file) throw new Error('File not found')
    return { file, data: fs.readFileSync(file.file_path) }
  },

  remove(id) {
    const file = getDb().prepare('SELECT * FROM files WHERE id = ?').get(id)
    if (!file) return { deleted: false }
    if (fs.existsSync(file.file_path)) fs.rmSync(file.file_path, { force: true })
    getDb().prepare('DELETE FROM files WHERE id = ?').run(id)
    return { deleted: true }
  }
}

function sanitize(name) {
  const base = path.basename(String(name || 'file.pdf'))
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim()
  return base || 'file.pdf'
}
