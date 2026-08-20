import { getDb } from '../db.js'

export const CategoryService = {
  listAll() {
    const db = getDb()
    return db
      .prepare('SELECT * FROM categories ORDER BY sort_order, id')
      .all()
      .map((c) => ({
        ...c,
        file_count: this.categoryFileCount(c.id),
        subcategories: this.listSubcategories(c.id)
      }))
  },

  list() {
    return getDb().prepare('SELECT * FROM categories ORDER BY sort_order, id').all()
  },

  categoryFileCount(categoryId) {
    return getDb()
      .prepare(
        `SELECT COUNT(*) AS c FROM files f
         JOIN subcategories s ON s.id = f.subcategory_id
         WHERE s.category_id = ?`
      )
      .get(categoryId).c
  },

  subcategoryFileCount(subcategoryId) {
    return getDb()
      .prepare('SELECT COUNT(*) AS c FROM files WHERE subcategory_id = ?')
      .get(subcategoryId).c
  },

  create(name, sortOrder = 0) {
    const result = getDb()
      .prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)')
      .run(String(name).trim(), Number(sortOrder) || 0)
    return this.get(result.lastInsertRowid)
  },

  update(id, { name, sort_order }) {
    const set = []
    const params = []
    if (name !== undefined) { set.push('name = ?'); params.push(String(name).trim()) }
    if (sort_order !== undefined) { set.push('sort_order = ?'); params.push(Number(sort_order) || 0) }
    if (set.length === 0) return this.get(id)
    params.push(id)
    getDb().prepare(`UPDATE categories SET ${set.join(', ')} WHERE id = ?`).run(...params)
    return this.get(id)
  },

  remove(id) {
    const db = getDb()
    const count = this.categoryFileCount(id)
    if (count > 0) {
      throw new Error(
        `Cannot delete category: ${count} filed document${count === 1 ? ' is' : 's are'} still filed under it`
      )
    }
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    return { deleted: result.changes > 0 }
  },

  get(id) {
    return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id) || null
  },

  listSubcategories(categoryId) {
    return getDb()
      .prepare('SELECT * FROM subcategories WHERE category_id = ? ORDER BY sort_order, id')
      .all(categoryId)
      .map((s) => ({ ...s, file_count: this.subcategoryFileCount(s.id) }))
  },

  createSubcategory(categoryId, name, sortOrder = 0) {
    const result = getDb()
      .prepare('INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)')
      .run(categoryId, String(name).trim(), Number(sortOrder) || 0)
    return getDb().prepare('SELECT * FROM subcategories WHERE id = ?').get(result.lastInsertRowid)
  },

  updateSubcategory(id, { name, sort_order }) {
    const set = []
    const params = []
    if (name !== undefined) { set.push('name = ?'); params.push(String(name).trim()) }
    if (sort_order !== undefined) { set.push('sort_order = ?'); params.push(Number(sort_order) || 0) }
    if (set.length === 0) return getDb().prepare('SELECT * FROM subcategories WHERE id = ?').get(id)
    params.push(id)
    getDb().prepare(`UPDATE subcategories SET ${set.join(', ')} WHERE id = ?`).run(...params)
    return getDb().prepare('SELECT * FROM subcategories WHERE id = ?').get(id)
  },

  removeSubcategory(id) {
    const db = getDb()
    const count = this.subcategoryFileCount(id)
    if (count > 0) {
      throw new Error(
        `Cannot delete subcategory: ${count} filed document${count === 1 ? ' is' : 's are'} still filed under it`
      )
    }
    const result = db.prepare('DELETE FROM subcategories WHERE id = ?').run(id)
    return { deleted: result.changes > 0 }
  }
}
