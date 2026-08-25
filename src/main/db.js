import { DatabaseSync } from 'node:sqlite'
import { app } from 'electron'
import crypto from 'node:crypto'
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

export function getKey() {
  const keyPath = path.join(app.getPath('userData'), 'hrrms.key')
  if (fs.existsSync(keyPath)) {
    const existing = fs.readFileSync(keyPath)
    if (existing.length === 32) return existing
  }
  const key = crypto.randomBytes(32)
  fs.writeFileSync(keyPath, key, { mode: 0o600 })
  return key
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
  // Execute schema statement-by-statement so a single failing
  // index (e.g., idx on new `step` column) doesn't abort whole init
  // on legacy DBs that still lack the column — migrate() will fix them.
  try {
    database.exec(schema)
  } catch (e) {
    // Fallback: try each statement individually, ignoring expected
    // "no such column: step" / "already exists" on legacy DBs
    console.warn('[initDb] schema exec warning:', e.message)
    for (const stmt of schema.split(';')) {
      const s = stmt.trim()
      if (!s) continue
      try { database.exec(s) } catch (err) {
        const msg = String(err.message)
        if (msg.includes('no such column: step') || msg.includes('already exists')) continue
        console.error('[initDb] statement failed:', msg, s.slice(0, 100))
      }
    }
  }

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
  ensureDefaultUsers(database)

  const employeeCount = database.prepare('SELECT COUNT(*) AS count FROM employees').get().count
  if (employeeCount === 0) {
    seedEmployees(database)
  }

  const officeCount = database.prepare('SELECT COUNT(*) AS count FROM offices').get().count
  if (officeCount === 0) {
    seedOffices(database)
  }

  const salaryGradeCount = database.prepare('SELECT COUNT(*) AS count FROM salary_grades').get().count
  if (salaryGradeCount === 0) {
    seedSalaryGrades(database)
  } else if (salaryGradeCount < 258) {
    // Existing DB (legacy single-step or partial) — fill missing steps with official 2026 rates
    seedMissingSalaryGradeSteps(database)
    // Patch legacy Step 1 salaries that still hold pre-2026 seed values (e.g., 13530 -> 14634)
    try {
      const legacyTo2026 = new Map([
        ['SG-1|13530', 14634], ['SG-2|14102', 15522], ['SG-3|14702', 16486], ['SG-4|15326', 17506],
        ['SG-5|15976', 18581], ['SG-6|16653', 19716], ['SG-7|17359', 20914], ['SG-8|18094', 22423],
        ['SG-9|18860', 24329], ['SG-10|19658', 26917], ['SG-11|20489', 31705], ['SG-12|21356', 33947],
        ['SG-13|22258', 36125], ['SG-14|23199', 38764], ['SG-15|24182', 42178], ['SG-16|25205', 45694],
        ['SG-17|26272', 49562], ['SG-18|27384', 53818], ['SG-19|28544', 59153], ['SG-20|29755', 66052],
        ['SG-21|31019', 73303], ['SG-22|32338', 81796], ['SG-23|33713', 91306], ['SG-24|35150', 102603],
        ['SG-25|36641', 116643], ['SG-26|38191', 131807], ['SG-27|39799', 148940], ['SG-28|41469', 167129],
        ['SG-29|43207', 187531], ['SG-30|45007', 210718], ['SG-31|46874', 300961], ['SG-32|48813', 356237],
        ['SG-33|50826', 449157],
      ])
      const rows = database.prepare('SELECT id, grade, step, salary FROM salary_grades WHERE step = 1').all()
      const upd = database.prepare('UPDATE salary_grades SET salary = ? WHERE id = ?')
      database.exec('BEGIN')
      for (const r of rows) {
        const key = `${r.grade}|${r.salary}`
        if (legacyTo2026.has(key)) upd.run(legacyTo2026.get(key), r.id)
      }
      database.exec('COMMIT')
    } catch {}
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
  const userCols = database.prepare('PRAGMA table_info(users)').all().map((c) => c.name)
  if (!userCols.includes('profile_pic')) {
    database.exec('ALTER TABLE users ADD COLUMN profile_pic TEXT')
  }

  const employeeCols = database.prepare('PRAGMA table_info(employees)').all().map((c) => c.name)
  const employeeAdds = {
    office: 'TEXT',
    plantilla_item: 'TEXT',
    salary_grade: 'TEXT',
    date_hired: 'TEXT',
    contact_number: 'TEXT',
    email: 'TEXT',
    profile_pic: 'TEXT'
  }
  for (const [col, type] of Object.entries(employeeAdds)) {
    if (!employeeCols.includes(col)) {
      database.exec(`ALTER TABLE employees ADD COLUMN ${col} ${type}`)
    }
  }

  // Salary grades: migrate legacy single-salary table to grade+step (SG steps)
  try {
    const sgCols = database.prepare('PRAGMA table_info(salary_grades)').all().map((c) => c.name)
    if (sgCols.length > 0 && !sgCols.includes('step')) {
      // Legacy schema detected: grade UNIQUE, salary single value
      database.exec(`
        CREATE TABLE IF NOT EXISTS salary_grades_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grade TEXT NOT NULL,
          step INTEGER NOT NULL CHECK (step BETWEEN 1 AND 8),
          salary REAL NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          UNIQUE(grade, step)
        )
      `)
      // Copy existing rows as Step 1
      const legacyRows = database.prepare('SELECT grade, salary, created_at FROM salary_grades').all()
      const ins = database.prepare('INSERT OR IGNORE INTO salary_grades_new (grade, step, salary, created_at) VALUES (?, 1, ?, ?)')
      database.exec('BEGIN')
      try {
        for (const r of legacyRows) {
          ins.run(String(r.grade).trim().toUpperCase(), Number(r.salary) || 0, r.created_at)
        }
        database.exec('COMMIT')
      } catch (e) {
        database.exec('ROLLBACK')
        throw e
      }
      database.exec('DROP TABLE salary_grades')
      database.exec('ALTER TABLE salary_grades_new RENAME TO salary_grades')
      database.exec('CREATE INDEX IF NOT EXISTS idx_salary_grades_grade ON salary_grades (grade)')
      database.exec('CREATE INDEX IF NOT EXISTS idx_salary_grades_grade_step ON salary_grades (grade, step)')
    }
  } catch (e) {
    // If migration fails, don't block app startup; log and continue
    console.error('[migrate] salary_grades step migration failed:', e.message)
  }

  // Ensure indexes exist for fresh or migrated DB, clean up legacy _new names if any
  try {
    database.exec('DROP INDEX IF EXISTS idx_salary_grades_new_grade')
    database.exec('DROP INDEX IF EXISTS idx_salary_grades_new_grade_step')
  } catch {}
  try {
    database.exec('CREATE INDEX IF NOT EXISTS idx_salary_grades_grade ON salary_grades (grade)')
    database.exec('CREATE INDEX IF NOT EXISTS idx_salary_grades_grade_step ON salary_grades (grade, step)')
  } catch {}

  // Employees: add salary_step column for SG step linkage
  try {
    const empCols2 = database.prepare('PRAGMA table_info(employees)').all().map((c) => c.name)
    if (!empCols2.includes('salary_step')) {
      database.exec('ALTER TABLE employees ADD COLUMN salary_step INTEGER')
    }
  } catch {}
}

const EMPLOYEE_SAMPLES = [
  { name: 'Maria Clara D. Santos', position: 'Administrative Assistant III', office: 'City Council Office', plantilla: 'Plantilla 11-01', grade: 'SG-11', birthday: '1982-04-15', status: 'permanent', hired: '2009-03-02', contact: '0917 555 0134', email: 'maria.santos@ozamizcity.gov.ph', address: 'Purok 3, Barangay Labo, Ozamiz City' },
  { name: 'Juan Miguel R. Dela Cruz', position: 'Administrative Aide VI', office: 'City Council Office', plantilla: 'Plantilla 06-12', grade: 'SG-6', birthday: '1990-11-23', status: 'permanent', hired: '2014-06-16', contact: '0918 555 0241', email: 'juan.delacruz@ozamizcity.gov.ph', address: 'Barangay Carmen, Ozamiz City' },
  { name: 'Ana Marie V. Fernandez', position: 'Secretary to the Sanggunian', office: 'City Council Office', plantilla: 'Plantilla 14-02', grade: 'SG-14', birthday: '1978-08-30', status: 'permanent', hired: '2005-01-10', contact: '0920 555 0378', email: 'ana.fernandez@ozamizcity.gov.ph', address: 'Barangay Cogon, Ozamiz City' },
  { name: 'Roberto C. Villanueva', position: 'Administrative Officer II', office: "City Mayor's Office", plantilla: 'Plantilla 08-07', grade: 'SG-8', birthday: '1985-02-19', status: 'permanent', hired: '2011-09-05', contact: '0921 555 0409', email: 'roberto.villanueva@ozamizcity.gov.ph', address: 'Barangay Aguada, Ozamiz City' },
  { name: 'Liza Mae G. Garcia', position: 'Human Resource Management Officer I', office: 'Human Resource Office', plantilla: 'Plantilla 11-05', grade: 'SG-11', birthday: '1987-07-12', status: 'permanent', hired: '2012-05-21', contact: '0922 555 0517', email: 'liza.garcia@ozamizcity.gov.ph', address: 'Barangay San Roque, Ozamiz City' },
  { name: 'Carlo Antonio L. Ramos', position: 'Records Officer I', office: 'City Council Office', plantilla: 'Plantilla 08-10', grade: 'SG-8', birthday: '1992-09-08', status: 'permanent', hired: '2016-02-15', contact: '0923 555 0628', email: 'carlo.ramos@ozamizcity.gov.ph', address: 'Barangay Tinago, Ozamiz City' },
  { name: 'Grace Ann S. Torres', position: 'Administrative Assistant I', office: 'City Council Office', plantilla: 'Plantilla 07-03', grade: 'SG-7', birthday: '1995-01-25', status: 'job_order', hired: '2021-07-01', contact: '0925 555 0739', email: 'grace.torres@ozamizcity.gov.ph', address: 'Barangay Balayhangin, Ozamiz City' },
  { name: 'Jose Rizalino P. Mendoza', position: 'Legislative Staff Assistant', office: 'City Council Office', plantilla: 'Plantilla 07-09', grade: 'SG-7', birthday: '1989-05-17', status: 'permanent', hired: '2013-11-04', contact: '0926 555 0840', email: 'jose.mendoza@ozamizcity.gov.ph', address: 'Barangay 50th, Ozamiz City' },
  { name: 'Kathleen Mae O. Navarro', position: 'Information Officer I', office: 'City Information Office', plantilla: 'Plantilla 10-04', grade: 'SG-10', birthday: '1993-12-02', status: 'contract_of_service', hired: '2022-03-14', contact: '0927 555 0951', email: 'kathleen.navarro@ozamizcity.gov.ph', address: 'Barangay Sta. Maria, Ozamiz City' },
  { name: 'Eduardo L. Santiago', position: 'Computer Maintenance Technologist', office: 'Management Information System Office', plantilla: 'Plantilla 08-15', grade: 'SG-8', birthday: '1984-10-11', status: 'permanent', hired: '2010-08-23', contact: '0928 555 1062', email: 'eduardo.santiago@ozamizcity.gov.ph', address: 'Barangay Baybay Triunfo, Ozamiz City' },
  { name: 'Rhea C. Aquino', position: 'Accountant II', office: 'City Accounting Office', plantilla: 'Plantilla 16-01', grade: 'SG-16', birthday: '1980-03-28', status: 'permanent', hired: '2008-04-07', contact: '0929 555 1173', email: 'rhea.aquino@ozamizcity.gov.ph', address: 'Purok 7, Barangay Labo, Ozamiz City' },
  { name: 'Dennis Paul T. Villarosa', position: 'Planning Officer II', office: 'City Planning and Development Office', plantilla: 'Plantilla 13-02', grade: 'SG-13', birthday: '1986-06-09', status: 'permanent', hired: '2012-10-22', contact: '0930 555 1284', email: 'dennis.villarosa@ozamizcity.gov.ph', address: 'Barangay Carmen, Ozamiz City' },
  { name: 'Sarah Jane B. Lim', position: 'Social Welfare Officer I', office: 'City Social Welfare Office', plantilla: 'Plantilla 10-08', grade: 'SG-10', birthday: '1991-08-31', status: 'contract_of_service', hired: '2020-01-06', contact: '0931 555 1395', email: 'sarah.lim@ozamizcity.gov.ph', address: 'Barangay Cogon, Ozamiz City' },
  { name: 'Alvin K. Reyes', position: 'Utility Worker', office: 'General Services Office', plantilla: 'Plantilla 02-05', grade: 'SG-2', birthday: '1975-12-13', status: 'permanent', hired: '2006-07-17', contact: '0932 555 1406', email: 'alvin.reyes@ozamizcity.gov.ph', address: 'Barangay Aguada, Ozamiz City' },
  { name: 'Michael Angelo D. Diaz', position: 'Driver II', office: 'General Services Office', plantilla: 'Plantilla 04-03', grade: 'SG-4', birthday: '1988-04-26', status: 'permanent', hired: '2013-01-28', contact: '0933 555 1517', email: 'michael.diaz@ozamizcity.gov.ph', address: 'Barangay San Roque, Ozamiz City' },
  { name: 'Patricia Anne C. Bautista', position: 'Nurse II', office: 'City Health Office', plantilla: 'Plantilla 13-06', grade: 'SG-13', birthday: '1990-02-14', status: 'permanent', hired: '2015-09-14', contact: '0934 555 1628', email: 'patricia.bautista@ozamizcity.gov.ph', address: 'Barangay Tinago, Ozamiz City' },
  { name: 'Frederick M. Pascual', position: 'Security Guard II', office: 'General Services Office', plantilla: 'Plantilla 05-04', grade: 'SG-5', birthday: '1983-07-21', status: 'permanent', hired: '2009-11-09', contact: '0935 555 1739', email: 'frederick.pascual@ozamizcity.gov.ph', address: 'Barangay Balayhangin, Ozamiz City' },
  { name: 'Christine Joy T. Domingo', position: 'Administrative Aide III', office: 'City Council Office', plantilla: 'Plantilla 03-08', grade: 'SG-3', birthday: '1996-10-05', status: 'job_order', hired: '2021-09-01', contact: '0936 555 1840', email: 'christine.domingo@ozamizcity.gov.ph', address: 'Barangay 50th, Ozamiz City' },
  { name: 'Ryan Christopher G. Salazar', position: 'Mechanic II', office: 'General Services Office', plantilla: 'Plantilla 06-11', grade: 'SG-6', birthday: '1987-03-18', status: 'permanent', hired: '2011-05-30', contact: '0937 555 1951', email: 'ryan.salazar@ozamizcity.gov.ph', address: 'Barangay Sta. Maria, Ozamiz City' },
  { name: 'Bernadette C. Flores', position: 'Bookkeeper II', office: "City Treasurer's Office", plantilla: 'Plantilla 07-14', grade: 'SG-7', birthday: '1992-06-27', status: 'permanent', hired: '2016-08-08', contact: '0938 555 2062', email: 'bernadette.flores@ozamizcity.gov.ph', address: 'Barangay Baybay Triunfo, Ozamiz City' },
  { name: 'Lorenzo M. Yap', position: 'Statistician I', office: 'City Planning and Development Office', plantilla: 'Plantilla 10-02', grade: 'SG-10', birthday: '1994-01-16', status: 'job_order', hired: '2022-06-13', contact: '0939 555 2173', email: 'lorenzo.yap@ozamizcity.gov.ph', address: 'Purok 2, Barangay Labo, Ozamiz City' },
  { name: 'Jenny Rose T. Ong', position: 'Cashier I', office: "City Treasurer's Office", plantilla: 'Plantilla 04-06', grade: 'SG-4', birthday: '1997-09-29', status: 'job_order', hired: '2023-01-09', contact: '0940 555 2284', email: 'jenny.ong@ozamizcity.gov.ph', address: 'Barangay Carmen, Ozamiz City' },
  { name: 'Emmanuel D. Gatchalian', position: 'Supply Officer I', office: 'General Services Office', plantilla: 'Plantilla 08-18', grade: 'SG-8', birthday: '1985-05-06', status: 'permanent', hired: '2010-02-22', contact: '0941 555 2395', email: 'emmanuel.gatchalian@ozamizcity.gov.ph', address: 'Barangay Cogon, Ozamiz City' },
  { name: 'Kathrina F. Manalo', position: 'Clerk II', office: 'City Council Office', plantilla: 'Plantilla 03-11', grade: 'SG-3', birthday: '1998-11-11', status: 'contract_of_service', hired: '2023-07-03', contact: '0942 555 2406', email: 'kathrina.manalo@ozamizcity.gov.ph', address: 'Barangay Aguada, Ozamiz City' },
  { name: 'Aaron Paul S. Valdez', position: 'Laborer II', office: 'General Services Office', plantilla: 'Plantilla 02-09', grade: 'SG-2', birthday: '1979-08-04', status: 'permanent', hired: '2007-10-15', contact: '0943 555 2517', email: 'aaron.valdez@ozamizcity.gov.ph', address: 'Barangay San Roque, Ozamiz City' }
]

function seedEmployees(database) {
  const insert = database.prepare(
    `INSERT INTO employees (record_no, complete_name, position, office, plantilla_item, salary_grade, birthday, status, date_hired, contact_number, email, complete_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  database.exec('BEGIN')
  try {
    EMPLOYEE_SAMPLES.forEach((e, i) => {
      insert.run(
        `201-${String(i + 1).padStart(5, '0')}`,
        e.name,
        e.position,
        e.office,
        e.plantilla,
        e.grade,
        e.birthday,
        e.status,
        e.hired,
        e.contact,
        e.email,
        e.address
      )
    })
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

const OFFICE_SAMPLES = [
  { name: 'Office of the City Mayor', description: 'Office of the local chief executive.' },
  { name: 'Office of the City Vice Mayor', description: 'Office of the presiding officer of the Sangguniang Panlungsod.' },
  { name: 'Sangguniang Panlungsod', description: 'Legislative body of the city.' },
  { name: 'Office of the City Administrator', description: 'Oversees the general administration of city operations.' },
  { name: 'City Legal Office', description: 'Provides legal services to the city government.' },
  { name: 'City Accounting Office', description: 'Prepares and manages the city\'s financial accounts.' },
  { name: 'City Treasurer\'s Office', description: 'Administers local taxes and revenue collection.' },
  { name: 'City Budget Office', description: 'Formulates and manages the city budget.' },
  { name: 'City Assessor\'s Office', description: 'Assesses real properties for taxation.' },
  { name: 'City Planning and Development Office', description: 'Formulates and monitors development plans and policies.' },
  { name: 'City Engineer\'s Office', description: 'Manages public infrastructure projects.' },
  { name: 'City Health Office', description: 'Delivers public health services.' },
  { name: 'City Social Welfare and Development Office', description: 'Provides social welfare programs and services.' },
  { name: 'City Agriculture Office', description: 'Promotes agricultural development and support.' },
  { name: 'City Environment and Natural Resources Office', description: 'Protects and manages the environment and natural resources.' },
  { name: 'Office of the City Civil Registrar', description: 'Registers vital events and issues civil registry documents.' },
  { name: 'City Information Office', description: 'Handles public information and media relations.' },
  { name: 'Human Resource Management Office', description: 'Manages human resource systems and employee welfare.' },
  { name: 'General Services Office', description: 'Provides general administrative and support services.' },
  { name: 'City Economic Enterprise and Development Office', description: 'Oversees city-owned enterprises and economic development.' },
  { name: 'City Disaster Risk Reduction and Management Office', description: 'Coordinates disaster preparedness and response.' },
  { name: 'Management Information System Office', description: 'Manages the city\'s information and communications technology.' },
  { name: 'City Tourism Office', description: 'Promotes tourism and manages tourism activities.' },
  { name: 'City Public Order and Safety Office', description: 'Enforces public safety and peace and order programs.' }
]

function seedOffices(database) {
  const insert = database.prepare(
    'INSERT INTO offices (name, description, status) VALUES (?, ?, ?)'
  )
  database.exec('BEGIN')
  try {
    OFFICE_SAMPLES.forEach((o) => {
      insert.run(o.name, o.description, 'active')
    })
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

// Official 2026 Third Tranche Salary Schedule (EO 64 s.2024, DBM NBC No. 601 Annex A)
const SALARY_GRADE_2026 = [
  ['SG-1', 1, 14634], ['SG-1', 2, 14730], ['SG-1', 3, 14849], ['SG-1', 4, 14968], ['SG-1', 5, 15089], ['SG-1', 6, 15211], ['SG-1', 7, 15333], ['SG-1', 8, 15456],
  ['SG-2', 1, 15522], ['SG-2', 2, 15636], ['SG-2', 3, 15752], ['SG-2', 4, 15869], ['SG-2', 5, 15986], ['SG-2', 6, 16103], ['SG-2', 7, 16223], ['SG-2', 8, 16342],
  ['SG-3', 1, 16486], ['SG-3', 2, 16610], ['SG-3', 3, 16732], ['SG-3', 4, 16856], ['SG-3', 5, 16982], ['SG-3', 6, 17106], ['SG-3', 7, 17234], ['SG-3', 8, 17360],
  ['SG-4', 1, 17506], ['SG-4', 2, 17636], ['SG-4', 3, 17767], ['SG-4', 4, 17898], ['SG-4', 5, 18031], ['SG-4', 6, 18163], ['SG-4', 7, 18298], ['SG-4', 8, 18433],
  ['SG-5', 1, 18581], ['SG-5', 2, 18720], ['SG-5', 3, 18858], ['SG-5', 4, 18998], ['SG-5', 5, 19137], ['SG-5', 6, 19280], ['SG-5', 7, 19423], ['SG-5', 8, 19565],
  ['SG-6', 1, 19716], ['SG-6', 2, 19862], ['SG-6', 3, 20009], ['SG-6', 4, 20158], ['SG-6', 5, 20307], ['SG-6', 6, 20456], ['SG-6', 7, 20609], ['SG-6', 8, 20761],
  ['SG-7', 1, 20914], ['SG-7', 2, 21069], ['SG-7', 3, 21224], ['SG-7', 4, 21382], ['SG-7', 5, 21539], ['SG-7', 6, 21699], ['SG-7', 7, 21859], ['SG-7', 8, 22022],
  ['SG-8', 1, 22423], ['SG-8', 2, 22627], ['SG-8', 3, 22832], ['SG-8', 4, 23038], ['SG-8', 5, 23246], ['SG-8', 6, 23456], ['SG-8', 7, 23668], ['SG-8', 8, 23883],
  ['SG-9', 1, 24329], ['SG-9', 2, 24523], ['SG-9', 3, 24720], ['SG-9', 4, 24917], ['SG-9', 5, 25117], ['SG-9', 6, 25318], ['SG-9', 7, 25521], ['SG-9', 8, 25725],
  ['SG-10', 1, 26917], ['SG-10', 2, 27131], ['SG-10', 3, 27347], ['SG-10', 4, 27565], ['SG-10', 5, 27786], ['SG-10', 6, 28007], ['SG-10', 7, 28230], ['SG-10', 8, 28456],
  ['SG-11', 1, 31705], ['SG-11', 2, 31820], ['SG-11', 3, 32109], ['SG-11', 4, 32401], ['SG-11', 5, 32697], ['SG-11', 6, 32998], ['SG-11', 7, 33302], ['SG-11', 8, 33611],
  ['SG-12', 1, 33947], ['SG-12', 2, 34069], ['SG-12', 3, 34357], ['SG-12', 4, 34648], ['SG-12', 5, 34943], ['SG-12', 6, 35242], ['SG-12', 7, 35544], ['SG-12', 8, 35850],
  ['SG-13', 1, 36125], ['SG-13', 2, 36283], ['SG-13', 3, 36599], ['SG-13', 4, 36919], ['SG-13', 5, 37244], ['SG-13', 6, 37572], ['SG-13', 7, 37904], ['SG-13', 8, 38241],
  ['SG-14', 1, 38764], ['SG-14', 2, 39141], ['SG-14', 3, 39523], ['SG-14', 4, 39910], ['SG-14', 5, 40300], ['SG-14', 6, 40696], ['SG-14', 7, 41097], ['SG-14', 8, 41503],
  ['SG-15', 1, 42178], ['SG-15', 2, 42594], ['SG-15', 3, 43015], ['SG-15', 4, 43442], ['SG-15', 5, 43874], ['SG-15', 6, 44310], ['SG-15', 7, 44753], ['SG-15', 8, 45202],
  ['SG-16', 1, 45694], ['SG-16', 2, 46152], ['SG-16', 3, 46615], ['SG-16', 4, 47084], ['SG-16', 5, 47559], ['SG-16', 6, 48040], ['SG-16', 7, 48528], ['SG-16', 8, 49020],
  ['SG-17', 1, 49562], ['SG-17', 2, 50066], ['SG-17', 3, 50576], ['SG-17', 4, 51092], ['SG-17', 5, 51614], ['SG-17', 6, 52144], ['SG-17', 7, 52678], ['SG-17', 8, 53221],
  ['SG-18', 1, 53818], ['SG-18', 2, 54371], ['SG-18', 3, 54933], ['SG-18', 4, 55499], ['SG-18', 5, 56075], ['SG-18', 6, 56657], ['SG-18', 7, 57246], ['SG-18', 8, 57842],
  ['SG-19', 1, 59153], ['SG-19', 2, 59966], ['SG-19', 3, 60793], ['SG-19', 4, 61632], ['SG-19', 5, 62486], ['SG-19', 6, 63353], ['SG-19', 7, 64236], ['SG-19', 8, 65132],
  ['SG-20', 1, 66052], ['SG-20', 2, 66970], ['SG-20', 3, 67904], ['SG-20', 4, 68853], ['SG-20', 5, 69818], ['SG-20', 6, 70772], ['SG-20', 7, 71727], ['SG-20', 8, 72671],
  ['SG-21', 1, 73303], ['SG-21', 2, 74337], ['SG-21', 3, 75388], ['SG-21', 4, 76456], ['SG-21', 5, 77542], ['SG-21', 6, 78645], ['SG-21', 7, 79692], ['SG-21', 8, 80831],
  ['SG-22', 1, 81796], ['SG-22', 2, 82963], ['SG-22', 3, 84151], ['SG-22', 4, 85356], ['SG-22', 5, 86582], ['SG-22', 6, 87746], ['SG-22', 7, 89011], ['SG-22', 8, 90295],
  ['SG-23', 1, 91306], ['SG-23', 2, 92622], ['SG-23', 3, 93962], ['SG-23', 4, 95330], ['SG-23', 5, 96823], ['SG-23', 6, 98341], ['SG-23', 7, 99883], ['SG-23', 8, 101318],
  ['SG-24', 1, 102603], ['SG-24', 2, 104209], ['SG-24', 3, 105841], ['SG-24', 4, 107500], ['SG-24', 5, 109185], ['SG-24', 6, 110898], ['SG-24', 7, 112533], ['SG-24', 8, 114301],
  ['SG-25', 1, 116643], ['SG-25', 2, 118469], ['SG-25', 3, 120326], ['SG-25', 4, 122212], ['SG-25', 5, 124131], ['SG-25', 6, 126079], ['SG-25', 7, 128061], ['SG-25', 8, 130073],
  ['SG-26', 1, 131807], ['SG-26', 2, 133870], ['SG-26', 3, 135968], ['SG-26', 4, 138100], ['SG-26', 5, 140268], ['SG-26', 6, 142469], ['SG-26', 7, 144707], ['SG-26', 8, 146983],
  ['SG-27', 1, 148940], ['SG-27', 2, 151273], ['SG-27', 3, 153644], ['SG-27', 4, 155906], ['SG-27', 5, 158353], ['SG-27', 6, 160235], ['SG-27', 7, 162752], ['SG-27', 8, 165310],
  ['SG-28', 1, 167129], ['SG-28', 2, 169752], ['SG-28', 3, 172418], ['SG-28', 4, 174797], ['SG-28', 5, 177545], ['SG-28', 6, 180339], ['SG-28', 7, 182660], ['SG-28', 8, 185537],
  ['SG-29', 1, 187531], ['SG-29', 2, 190482], ['SG-29', 3, 193480], ['SG-29', 4, 196528], ['SG-29', 5, 199624], ['SG-29', 6, 202005], ['SG-29', 7, 205191], ['SG-29', 8, 208430],
  ['SG-30', 1, 210718], ['SG-30', 2, 214038], ['SG-30', 3, 217207], ['SG-30', 4, 220425], ['SG-30', 5, 223691], ['SG-30', 6, 227224], ['SG-30', 7, 230595], ['SG-30', 8, 234240],
  ['SG-31', 1, 300961], ['SG-31', 2, 306691], ['SG-31', 3, 312532], ['SG-31', 4, 318182], ['SG-31', 5, 323938], ['SG-31', 6, 329989], ['SG-31', 7, 336092], ['SG-31', 8, 342310],
  ['SG-32', 1, 356237], ['SG-32', 2, 363257], ['SG-32', 3, 370418], ['SG-32', 4, 377359], ['SG-32', 5, 384805], ['SG-32', 6, 392400], ['SG-32', 7, 400150], ['SG-32', 8, 408055],
  ['SG-33', 1, 449157], ['SG-33', 2, 462329],
]

// Keep legacy name for compatibility, now maps to 2026 data
const SALARY_GRADE_SAMPLES = SALARY_GRADE_2026

function seedSalaryGrades(database) {
  const insert = database.prepare(
    'INSERT OR IGNORE INTO salary_grades (grade, step, salary) VALUES (?, ?, ?)'
  )
  database.exec('BEGIN')
  try {
    SALARY_GRADE_2026.forEach(([grade, step, salary]) => {
      insert.run(grade, step, salary)
    })
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

function seedMissingSalaryGradeSteps(database) {
  const existing = database.prepare('SELECT grade, step FROM salary_grades').all()
  const seen = new Set(existing.map((r) => `${r.grade}|${r.step}`))
  const insert = database.prepare('INSERT OR IGNORE INTO salary_grades (grade, step, salary) VALUES (?, ?, ?)')
  database.exec('BEGIN')
  try {
    for (const [grade, step, salary] of SALARY_GRADE_2026) {
      const key = `${grade}|${step}`
      if (!seen.has(key)) insert.run(grade, step, salary)
    }
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

const DEFAULT_USER_HASH = '$2b$12$h3oqRyG.r3agsSVT4ghrkusBRIFXC35zGuYjWZEjQZmuK3M/VOjjK'
const OLD_ADMIN_HASH = '$2b$12$e0fZx4PKAYME4G6Z9s844.EGwgtzaBXJsj762iJ6I3UcKbTaqzvXS'

function ensureDefaultUsers(database) {
  const upsert = database.prepare(
    'INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  )
  upsert.run('admin', DEFAULT_USER_HASH, 'Administrator', 'admin')
  upsert.run('staff', DEFAULT_USER_HASH, 'HR Staff', 'staff')

  const admin = database.prepare("SELECT id, password_hash FROM users WHERE username = 'admin'").get()
  if (admin && admin.password_hash === OLD_ADMIN_HASH) {
    database.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(DEFAULT_USER_HASH, admin.id)
  }
}
