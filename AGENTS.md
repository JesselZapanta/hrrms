# AGENTS.md

## Stack
- Electron 43 + electron-vite 5, React 19, Tailwind CSS 4, `node:sqlite`, `bcryptjs`, `electron-updater`.
- Node **22+**. `better-sqlite3` is intentionally absent: `node:sqlite` ships with Electron 43 and avoids native builds.

## Commands
```bash
npm install
npm run dev        # electron-vite dev (main + renderer hot reload)
npm run build      # electron-vite build -> out/
npm run start      # preview the built app
npm run build:win  # build + electron-builder --win -> dist/HRDRMS Setup <version>.exe
npm run release    # build + electron-builder --win --publish always (needs GH_TOKEN)
node scripts/generate-icon.mjs  # legacy folder-mark icon (do NOT rerun — overwrites the real logo)
node scripts/embed-splash-logo.mjs  # sync build/icon.png + splash logo from assets/app-logo.ico
```
No test/lint/typecheck scripts exist. `npm run build` is the only verification gate; run it after touching `src/main` or `src/renderer`.

## Runtime wiring
- `electron.vite.config.mjs` builds three targets: `main`, `preload`, `renderer`.
- `src/main/index.js` — app lifecycle, splash (`splash.js`), kill-switch, mandatory update check.
- `src/main/db.js` — `DatabaseSync`; `initDb()` runs schema, `migrate()`, then count-gated seeds.
- `src/main/ipc.js` registers handlers; `src/preload/index.js` exposes `window.api`; the renderer never touches the DB or files directly. Services in `src/main/services/*` are synchronous `DatabaseSync` modules.
- `src/renderer/src/App.jsx` — `localStorage` session (`hrrms.session`) and view switch; `components/Layout.jsx` is the shell (`NAV`/`META`, update banner, version from `app:version` with the `res.data ?? res` unwrap).

## IPC / auth
- Service handlers in `ipc.js` are wrapped by `wrap(fn)` -> `{ok:true, data}` or `{ok:false, error}`. `app:checkForUpdates` and `app:quitAndInstall` are the raw exceptions.
- Always unwrap: `const res = await window.api.foo.bar(); if (!res.ok) ...; res.data`.
- **Do not** `.then(setState)` on a wrapped call — React receives the wrapper object and throws "Objects are not valid as a React child" (caused the v1.1.0 white screen). Use `setState(res.data ?? res)`.
- IPC does **not** verify the logged-in user or role. `currentUser` is only `localStorage` data; admin/staff checks are renderer-only. Add main-process checks if a change needs real authorization.
- Add a service: `src/main/services/XService.js` -> handler in `ipc.js` -> expose in `preload/index.js`.

## Data & DB
- `app.setName('hrrms')` makes `userData` `%APPDATA%\hrrms`; `getDataDir()` appends `hrrms` again:
  - DB: `%APPDATA%\hrrms\hrrms\hrrms.db` (plaintext WAL SQLite)
  - Files: `%APPDATA%\hrrms\hrrms\storage\employees/<employeeId>/<subcategoryId>/`
  - Key: `%APPDATA%\hrrms\hrrms.key`
- Files are AES-256-GCM encrypted (normally `.enc`); profile pictures use the `enc:v1:` string prefix (`src/main/crypto.js`). Decryption is content-based, not extension-based, and `FileService.rename()` currently drops `.enc` from the stored path.
- The DB stores absolute `file_path` values, so moving the data directory to a different path orphans existing files.
- Use `getDb()` for all queries; it enables WAL and `PRAGMA foreign_keys=ON` (cascade deletes rely on it). Don't open a second `DatabaseSync`.
- `schema.sql` uses `CREATE TABLE IF NOT EXISTS`; existing DBs only receive new columns through `migrate()`. Add both a `schema.sql` update and an `ALTER TABLE` migration (e.g. `salary_step` is migration-only).
- Seeding is count-gated, so a populated DB is not reseeded when you edit `seed.sql` or the seed arrays in `db.js`. `seed.sql` has 8 categories, 38 subcategories, and default users. `db.js` also seeds 25 sample employees, 24 offices, and 258 salary steps (8 per SG; SG-33 has 2).
- For DBs with fewer than 258 salary steps, `initDb()` fills missing steps and patches legacy Step 1 rates to 2026 values. Preserve that path when changing salary data.

## UI
- Tailwind 4 `@theme` tokens live in `src/renderer/src/styles/main.css`: navy `#1B2C63`, navy-deep `#14214b`, orange `#E85B18`, paper `#FAF8F4`, hairline `#E7E2D6`, ink, status colors. Fonts are Space Grotesk/Inter/IBM Plex Mono from Google Fonts (allowed by the CSP).
- The CSP in `src/renderer/index.html` blocks remote images and renderer-side fetches; do network work in the main process.
- `Select.jsx` uses `createPortal` to `document.body`, flips up, and repositions on scroll/resize — use it instead of a native select inside modals.
- `.folder-tab` uses `clip-path`; there is no component or icon library — plain Tailwind plus inline SVG icons. `design.md` documents the design system.

## Conventions
- Both roles see Dashboard, Employees, and File Categories. Users, Offices, and Salary Grades are admin-only. Delete buttons for employees/categories/subcategories are admin-only; staff can still add/edit categories. `NAV`/`META` live in `Layout.jsx`.
- Admins can hard-delete employees (DB cascade plus storage-folder removal); `status: inactive` is a manual state, not a delete replacement. Categories/subcategories refuse deletion while files exist.
- Default login: `admin`/`password`, `staff`/`password`. `ensureDefaultUsers()` seeds them and migrates the old admin hash.
- `README.md` covers setup and features, but is stale on auto-install behavior. `PROJECT.md` is an early proposal (`better-sqlite3`, orange/blue theme) that conflicts with the shipped app; prefer `package.json`, `src/`, and `design.md`.

## Build & publish
- `electron-builder` prefers the `build` field in `package.json` over `electron-builder.yml`, so the root YAML is ignored. It is stale (different `appId` `ph.gov.ozamiz.cco.hrrms`, narrower `extraResources`, no `publish`) — don't edit it expecting effect.
- `extraResources` copies `database/` (including dotfiles such as `.status`) to `process.resourcesPath/database`; keep `getSqlDir()` in sync.
- `releaseType: "release"` in `package.json:build.publish` is required; otherwise GitHub releases are drafts and `electron-updater` ignores them. `latest.yml` and `.blockmap` must ship with the exe.

## Release & auto-update
- System name is **HRDRMS** (Human Resource Digital Records Management System). Internal IDs deliberately stay `hrrms`: `appId`, `app.setName`, `_hrrms` key, `hrrms.session`, data paths, repo name — renaming them orphans existing installs' data/sessions and breaks the updater/kill-switch.
- Branching: work on `dev` and merge to `main` via PR; `main` is the release branch. Any push to `main` (except README/docs-only changes) runs the release workflow.
- Workflow: `.github/workflows/release.yml` bumps `max(package.json, latest GitHub release)` minor version (never reuses/downgrades tags), force-pushes tag `v<version>`, deletes all same-tag releases by ID (duplicates included, tag kept), runs `npm run release`, consolidates split/duplicate releases back into one from `dist/`, verifies exe+blockmap+`latest.yml` exist, then commits the bump back to `main` with `[skip ci]`. The tag must exist before publish or GitHub returns 422. Custom steps run under `shell: bash` (PowerShell mangles `|| true`).
- Installed app only: `npm run dev` skips both the kill-switch and updater.
- Kill switch: packaged launch reads `database/.status` and `package.json._hrrms` from `main` on GitHub, then bundled copies. `{"active":false}` leaves the splash locked and never opens the main window; remote values win, so don't push `active:false` carelessly.
- Update check: auto-downloads, clears `localStorage`, then calls `quitAndInstall()`; `autoInstallOnAppQuit=false`. If no update is found or the check errors, the app opens anyway (7s fail-safe).
- Manual publish: PowerShell `$env:GH_TOKEN = gh auth token; npm run release`; add `gh release edit v<ver> --draft=false` if it lands as a draft.
