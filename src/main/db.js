import { DatabaseSync } from 'node:sqlite'
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

let db = null

function getSqlDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'database')
  }
  return path.join(app.getAppPath(), 'database')
}

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'hrrms')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getDbPath() {
  return path.join(getDataDir(), 'hrrms.db')
}

export function getStorageDir() {
  const dir = path.join(getDataDir(), 'storage', 'employees')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getDb() {
  if (!db) {
    db = new DatabaseSync(getDbPath())
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const database = getDb()
  const schemaPath = path.join(getSqlDir(), 'schema.sql')
  const seedPath = path.join(getSqlDir(), 'seed.sql')

  const schema = fs.readFileSync(schemaPath, 'utf-8')
  database.exec(schema)

  migrate(database)

  const seeded = database
    .prepare('SELECT COUNT(*) AS count FROM categories')
    .get().count

  if (seeded === 0) {
    const seed = fs.readFileSync(seedPath, 'utf-8')
    database.exec(seed)
  }

  const userCount = database.prepare('SELECT COUNT(*) AS count FROM users').get().count
  if (userCount === 0) {
    database.exec(fs.readFileSync(seedPath, 'utf-8'))
  }

  return database
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

function migrate(database) {
  const cols = database.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
  if (!cols.includes('profile_pic')) {
    database.exec('ALTER TABLE users ADD COLUMN profile_pic TEXT')
  }
}
