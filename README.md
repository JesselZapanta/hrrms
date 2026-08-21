# HRRMS — Human Resource Records Management System

**City Council Office · LGU Ozamiz**

A desktop filing manager for employee records. HRRMS organizes each employee's files into categories and subcategories (manila-folder style), with role-based access for Admin and Staff.

Built with **Electron + React + Tailwind CSS** and a local **SQLite** database (`node:sqlite` — no native modules).

## Features

- **Auth** — role-based login (Admin / Staff), bcrypt-hashed passwords, profile pictures
- **Admin**
  - User management (create, edit, activate/deactivate, assign roles, profile pictures)
  - File categories and subcategories (CRUD, block delete if files exist)
  - Offices directory (24 seeded LGU offices)
  - Salary Grades 1–33 (SSL VI, seeded)
- **Staff**
  - Employee records: complete name, position, office, plantilla item, salary grade, birthday, status, date hired, contact, email, address, profile picture — ID column, sorted by ID desc, searchable
  - Employee folder per employee with colorful category tabs
  - File CRUD for PDF, Word, Excel, PowerPoint: upload, rename, delete, open (decrypted to temp and opened with default app)
- **Filing structure** — 8 categories with 38 seeded subcategories, 24 offices, SG-1..SG-33
- **Dashboard** — employee/file counts and recent filings (staff) / category overview (admin)
- **Design** — navy `#1B2C63`, orange `#E85B18`, paper `#FAF8F4` (see `design.md`), manila-folder tabs, splash screen with logo, app icon

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell / Desktop | Electron 43 + electron-vite |
| Frontend | React 19 + Tailwind CSS 4 |
| Database | SQLite via Node built-in `node:sqlite` |
| Auth | bcryptjs |
| Packaging | electron-builder (NSIS) |
| Auto-update | electron-updater (GitHub Releases) |

> **Why `node:sqlite`?** `better-sqlite3` ships no prebuilt binaries for the current Electron ABI and requires Visual Studio to compile. Node's built-in SQLite module (bundled with Electron 43) provides the same synchronous API with zero native dependencies.

## Getting Started

Prerequisites: Node.js 22+ and npm.

```bash
npm install
npm run dev      # run in development (hot reload)
```

## Building the installer

```bash
npm run build        # vite build only
npm run build:win    # produces dist/HRRMS Setup <version>.exe
npm run release      # build + publish to GitHub (needs GH_TOKEN)
```

Auto-update: installed apps check `latest.yml` on GitHub Releases on launch (splash) and show `Checking → Downloading → Restart` banner; `autoInstallOnAppQuit` installs on quit.

Kill-switch: `database/.status` (dotfile) and `package.json` `_hrrms` field — set `{"active":false}` to lock all installs on next launch (splash shows lock message).

## Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password` |
| Staff | `staff` | `password` |

## Data & Storage

- Database: `%APPDATA%\hrrms\hrrms\hrrms.db` (created on first run, `app.setName('hrrms')` → `%APPDATA%\hrrms`)
- Files: `%APPDATA%\hrrms\hrrms\storage\employees/<employeeId>/<subcategoryId>/<timestamp>_<name>.pdf.enc` (AES-256-GCM, `hrrms.key` at `%APPDATA%\hrrms\hrrms.key`)
- Schema & seed data: `database/schema.sql`, `database/seed.sql` (copied to `process.resourcesPath/database` when packaged)

## Project Structure

```
dokyu/
├── electron.vite.config.mjs
├── package.json          # build config is source of truth (electron-builder.yml is stale)
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── .status           # hidden kill-switch
├── build/
│   ├── icon.png / icon.ico
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.js          # app lifecycle, splash, autoUpdater + kill-switch
│   │   ├── db.js             # SQLite + init/migrate/seed
│   │   ├── crypto.js         # AES-256-GCM
│   │   ├── ipc.js            # IPC handlers (wrap → {ok,data})
│   │   ├── splash.js
│   │   └── services/         # Auth, User, Employee, Category, Office, SalaryGrade, File
│   ├── preload/              # contextBridge
│   └── renderer/             # React app
│       └── src/
│           ├── App.jsx
│           ├── pages/        # Login, Dashboard, Employees, EmployeeFolder, Users, Categories, Offices, SalaryGrades, Profile
│           ├── components/   # Layout, Modal, Select, StatusDot, Toast, Logo, DateInput
│           └── styles/       # Tailwind theme
└── design.md
```

## License

MIT
