# Human Resource Records Management System (HRRMS) – City Council Office, LGU Ozamiz

Filing manager system for managing employee files of the HR Office of the City Council Office – LGU Ozamiz.

## 1. Overview

A web/desktop application built with **Electron JS** for managing employee personnel files. The system organizes employee records and file folders by category and subcategory, with role-based access for Admin and Staff. **System name: Human Resource Records Management System (HRRMS).**

- **Platform:** Web-based / Desktop
- **Framework:** Electron JS
- **Theme:** Orange (#F97316) with Blue (#1D4ED8)

## 2. System Roles

### 2.1 Authentication
- Login page with username and password
- Role-based access control (Admin / Staff)

### 2.2 Admin
- **User Management**
  - Add / Edit / Deactivate users
  - Assign roles (Admin, Staff)
- **File Category**
  - Create / Edit / Delete main categories
- **Sub Category**
  - Create / Edit / Delete subcategories under each category

### 2.3 Staff
- **Employee Records**
  - Add new employee record with:
    - Complete Name
    - Position
    - Birthday
    - Status
    - Complete Address
- **Employee Folder**
  - Each employee has a folder containing their files
- **Files**
  - CRUD operations on files (PDF upload)
  - Upload, view, download, rename, and delete PDF files
  - Files are filed under the applicable category and subcategory

## 3. Categories and Subcategories

### 1. Personal Information
- Personal Data Sheet (PDS), CS Form No. 212
- Work Experience Sheet
- Certificate of Live Birth
- Marriage Certificate, if applicable
- Other documents supporting personal information

### 2. Appointment and Employment Documents
- Appointment papers
- Position Description Form (PDF)
- Oath of Office
- Certification of Assumption to Duty
- Appointment-related documents
- Documents for promotion, transfer, reappointment, or other personnel actions

### 3. Qualifications and Eligibility
- Civil Service eligibility
- Professional licenses, when required
- Transcript of Records (TOR)
- Other documents supporting qualifications

### 4. Medical and Clearance Documents
- Medical Certificate (CS Form No. 211)
- Required medical examination results
- NBI Clearance, when applicable
- Other required clearances
- Clearance for financial obligations / property accountability, when applicable

### 5. Performance Records
- Performance ratings
- IPCR/OPCR-related documents, as applicable
- Performance evaluation documents
- Other documents related to employee performance

### 6. Awards and Recognition
- Certificates of commendation
- Awards
- Certificates of achievement
- Recognition documents

### 7. Disciplinary and Administrative Records
- Administrative case documents, if any
- Disciplinary action documents
- Other authorized personnel actions related to administrative matters

### 8. Other Personnel Documents
- Leave-related personnel documents
- Promotion / transfer documents
- Designation documents
- Training and development records
- Other official documents affecting the employee's employment status

## 4. User Interface

### Theme
| Element | Color |
|---------|-------|
| Primary (Accent) | Orange `#F97316` |
| Secondary | Blue `#1D4ED8` |
| Background | Light / white with subtle gray |
| Text | Dark gray `#1F2937` |

### Screens
- **Login Screen**
  - Username, password, login button
- **Dashboard**
  - Summary cards: total employees, total files, recent uploads
- **Employees**
  - List/search employees, add/edit/delete employee records
  - View employee profile with folder structure
- **File Manager (Employee Folder)**
  - Category tree / tabs
  - Subcategory file lists
  - Upload PDF, preview, download, rename, delete
- **User Management (Admin only)**
  - User list, add/edit users, assign roles
- **Category Management (Admin only)**
  - Manage categories and subcategories

## 5. Technical Stack (Recommended)

| Layer | Technology | Why |
|-------|-----------|-----|
| Shell | Electron + Vite | Fast dev, easy bundling |
| Frontend | React + Tailwind CSS | Clean UI, easy orange/blue theming, reusable file/category components |
| Database | SQLite (`better-sqlite3`) | Local, zero-config, reliable for single-office HR use; no network needed |
| File Storage | Local filesystem folders (`storage/employees/<id>/<subcategory>/`) | Matches "folder per employee" requirement; PDFs stay accessible |
| PDF Handling | `pdfjs-dist` (preview) + Electron dialog (upload/save) | Native-feel preview and download |
| Data Layer | Electron IPC (`ipcMain`/`ipcRenderer`) + `preload.js` context bridge | Secure, keeps DB and filesystem off the renderer |
| Auth | `bcrypt` password hashing + session/localStorage token | Simple role-based Admin/Staff |

**Recommended combo:** Electron + React + Tailwind + SQLite (`better-sqlite3`) + `pdfjs-dist`.
Everything stays local and simple to deploy on one PC; SQLite can later be swapped for MySQL if the office goes networked.

### Networking note (axios)
Target is a **single office PC** — so **no axios / HTTP layer is used**. The React UI talks to SQLite directly through Electron IPC (`ipcRenderer.invoke` ↔ `ipcMain.handle`), which is simpler and more secure. Axios would only be added later if the system is converted to a multi-PC setup with a REST API.

### Future: multi-device / networked (planned)
Design now so the system can run on multiple office PCs later, with minimal rework:

- **Service-layer abstraction:** put all database and file operations behind a single `services/` module in the Electron main process. The renderer never touches DB/files directly — it only calls named functions (e.g. `EmployeeService.getAll()`, `FileService.upload()`).
- **Later migration path (when multi-device is needed):**
  1. Wrap the same service functions in an Express REST API (`express`) inside the Electron main process.
  2. Swap SQLite (`better-sqlite3`) for MySQL (or keep SQLite but move it to a shared network drive — not recommended for concurrency).
  3. Move `storage/employees/` to a network-accessible location.
  4. Add axios in React and replace the IPC call helper with an HTTP one — **only the transport layer changes; service code is reused as-is.**
- **Seeding from day 1:** keep `services/` free of Electron-specific code so it can run in plain Node (the future API server) unchanged.

This keeps the current single-PC build simple, but the migration to networked is mostly configuration + transport, not a rewrite.

### Alternatives / Notes
- **Web-based alternative:** same frontend, swap Electron IPC for a REST API (Express) + MySQL — useful if the office needs shared access across multiple PCs.
- **Backup strategy:** copy the SQLite DB file and the `storage/` folder to external drive / network share on a schedule.

### Suggested Project Structure

```
dokyu/
├── main.js                 # Electron main process
├── preload.js              # Secure IPC bridge
├── package.json
├── src/
│   ├── pages/              # HTML screens (login, dashboard, employees, files, users, categories)
│   ├── styles/             # Theme CSS
│   ├── renderer/           # Renderer JS logic
│   └── assets/             # Icons, logos
├── database/
│   ├── schema.sql          # Table definitions
│   └── seed.sql            # Default categories & subcategories, admin user
└── storage/
    └── employees/          # Folder per employee with PDF files
```

### Database Tables (Proposed)

- `users` – id, username, password_hash, role, name, status, created_at
- `employees` – id, complete_name, position, birthday, status, complete_address, created_at
- `categories` – id, name, sort_order
- `subcategories` – id, category_id, name, sort_order
- `files` – id, employee_id, subcategory_id, file_name, original_name, file_path, mime_type, size, uploaded_by, created_at

## 6. Notes / Next Steps

- Confirm web-based vs desktop deployment preference
- Confirm database choice (SQLite for local desktop / MySQL for shared network use)
- Confirm default Admin credentials to seed during setup
- Define backup strategy for employee PDF files