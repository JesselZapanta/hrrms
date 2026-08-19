# HRRMS — Human Resource Records Management System

**City Council Office · LGU Ozamiz**

A desktop filing manager for employee records. HRRMS organizes each employee's 201-file into categories and subcategories (manila-folder style), with role-based access for Admin and Staff.

Built with **Electron + React + Tailwind CSS** and a local **SQLite** database (`node:sqlite` — no native modules).

## Features

- **Auth** — role-based login (Admin / Staff), bcrypt-hashed passwords
- **Admin**
  - User management (create, edit, activate/deactivate, assign roles)
  - File categories and subcategories (CRUD)
- **Staff**
  - Employee records: complete name, position, birthday, status, complete address
  - A 201-file folder per employee
  - PDF file CRUD: upload, rename, delete, open in viewer
- **Filing structure** — 8 categories (Personal Information, Appointment & Employment, Qualifications & Eligibility, Medical & Clearance, Performance, Awards & Recognition, Disciplinary & Administrative, Other Personnel Documents) with 38 seeded subcategories
- **Dashboard** — employee/file counts and recent filings
- **Design** — navy `#1B2C63`, deep orange `#E85B18`, warm paper `#FAF8F4` (see `design.md`), manila-folder tabs, splash screen

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell / Desktop | Electron 43 + electron-vite |
| Frontend | React 19 + Tailwind CSS 4 |
| Database | SQLite via Node built-in `node:sqlite` |
| Auth | bcryptjs |
| Packaging | electron-builder (NSIS installer) |

> **Why `node:sqlite`?** `better-sqlite3` ships no prebuilt binaries for the current Electron ABI and requires Visual Studio to compile. Node's built-in SQLite module (bundled with Electron 43) provides the same synchronous API with zero native dependencies.

## Getting Started

Prerequisites: Node.js 22+ and npm.

```bash
npm install
npm run dev      # run in development (hot reload)
```

## Building the installer

```bash
npm run build:win   # produces dist\HRRMS-Setup-<version>.exe
```

## Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |

> Change the default password after first login.

## Data & Storage

- Database: `%APPDATA%\hrrms\hrrms\hrrms.db` (created on first run)
- PDF files: `%APPDATA%\hrrms\hrrms\storage\employees\<id>\<subcategory>\`
- Schema & seed data: `database/schema.sql`, `database/seed.sql`

## Project Structure

```
dokyu/
├── electron.vite.config.mjs
├── electron-builder.yml
├── database/
│   ├── schema.sql
│   └── seed.sql
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.js          # app lifecycle, splash screen
│   │   ├── db.js             # SQLite connection + init
│   │   ├── ipc.js            # IPC handlers
│   │   ├── splash.js         # splash screen markup
│   │   └── services/         # Auth, User, Employee, Category, File
│   ├── preload/              # contextBridge IPC bridge
│   └── renderer/             # React app
│       └── src/
│           ├── pages/        # Login, Dashboard, Employees, EmployeeFolder, Users, Categories
│           ├── components/   # Layout, Modal, StatusDot
│           └── styles/       # Tailwind theme + design tokens
└── design.md                 # design system reference
```

## Roadmap

- [ ] Inline PDF preview (pdfjs-dist)
- [ ] Custom application icon
- [ ] Backup utility (DB + storage export)
- [ ] Multi-device / networked mode (REST API + MySQL) — service layer is already transport-agnostic

## License

MIT
