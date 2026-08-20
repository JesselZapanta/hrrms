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

const SALARY_GRADE_SAMPLES = [
  ['SG-1', 13530.00], ['SG-2', 14102.00], ['SG-3', 14702.00], ['SG-4', 15326.00],
  ['SG-5', 15976.00], ['SG-6', 16653.00], ['SG-7', 17359.00], ['SG-8', 18094.00],
  ['SG-9', 18860.00], ['SG-10', 19658.00], ['SG-11', 20489.00], ['SG-12', 21356.00],
  ['SG-13', 22258.00], ['SG-14', 23199.00], ['SG-15', 24182.00], ['SG-16', 25205.00],
  ['SG-17', 26272.00], ['SG-18', 27384.00], ['SG-19', 28544.00], ['SG-20', 29755.00],
  ['SG-21', 31019.00], ['SG-22', 32338.00], ['SG-23', 33713.00], ['SG-24', 35150.00],
  ['SG-25', 36641.00], ['SG-26', 38191.00], ['SG-27', 39799.00], ['SG-28', 41469.00],
  ['SG-29', 43207.00], ['SG-30', 45007.00], ['SG-31', 46874.00], ['SG-32', 48813.00],
  ['SG-33', 50826.00]
]

function seedSalaryGrades(database) {
  const insert = database.prepare(
    'INSERT INTO salary_grades (grade, salary) VALUES (?, ?)'
  )
  database.exec('BEGIN')
  try {
    SALARY_GRADE_SAMPLES.forEach(([grade, salary]) => {
      insert.run(grade, salary)
    })
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
