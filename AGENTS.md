# AGENTS.md

## Stack
- Electron 43 + electron-vite 5, React 19, Tailwind 4 (`@tailwindcss/vite`), `node:sqlite` (no native deps), `bcryptjs`, `electron-updater` 6.8.
- Node **22+** required (`actions/setup-node@v4` uses 22). `better-sqlite3` is intentionally not used — `node:sqlite` ships with Electron 43.

## Commands
```bash
npm install
npm run dev        # electron-vite dev, hot reload (renderer + main)
npm run build      # electron-vite build only (out/)
npm run build:win  # build + electron-builder --win → dist/HRRMS Setup <version>.exe
npm run release    # build + electron-builder --win --publish always (needs GH_TOKEN)
```
No test/lint/typecheck scripts exist. `npm run build` is the only verification gate — always run it after touching `src/main` or `src/renderer`.

## Entrypoints & Layout
- `electron.vite.config.mjs` — three targets: `main`/`preload`/`renderer` (aliases `@main`, `@db`, `@renderer`).
- `src/main/index.js` — app lifecycle, splash (`src/main/splash.js`), `app.setName('hrrms')`, `autoUpdater` setup. `out/main/index.js` at runtime.
- `src/main/db.js` — `DatabaseSync`, `initDb()` reads `database/schema.sql`+`seed.sql`, runs `migrate()`. `src/main/ipc.js` registers handlers via `wrap()` → `{ok, data}`.
- `src/preload/index.js` — `contextBridge.exposeInMainWorld('api', …)` — renderer calls `window.api.*.invoke(...)`.
- `src/renderer/src/App.jsx` — session in `localStorage` (`hrrms.session`), view router (`dashboard`/`employees`/`folder`/`users`/`categories`/`offices`/`salaryGrades`/`profile`). `src/renderer/src/components/Layout.jsx` is the shell.
- `database/schema.sql` + `seed.sql` — 8 categories, 38 subcategories, 24 offices, SG-1..SG-33. `extraResources` copies `database/` to `process.resourcesPath/database` for packaged builds.

## Data Paths (gotcha)
`app.setName('hrrms')` makes `app.getPath('userData')` → `%APPDATA%\hrrms` on Windows.
- `getDataDir()` = `join(userData, 'hrrms')` → `%APPDATA%\hrrms\hrrms`
- DB: `%APPDATA%\hrrms\hrrms\hrrms.db`
- Storage: `%APPDATA%\hrrms\hrrms\storage\employees/<employeeId>/<subcategoryId>/`
- Key: `%APPDATA%\hrrms\hrrms.key` (`src/main/crypto.js`, AES-256-GCM, `enc:v1:` prefix for strings, raw `iv|tag|cipher` for files with `.enc` extension). DB file itself is not encrypted.

## IPC & Services
- Every handler in `src/main/ipc.js` is wrapped: `wrap(fn) → {ok, data} | {ok:false, error}`. Renderer must unwrap: `const res = await window.api.foo.bar(); if (!res.ok) …; res.data`.
- **Do not** do `.then(setState)` on a wrapped call — `setState` will receive the wrapper object and React will throw `Objects are not valid as a React child` (caused the v1.1.0 white-screen). Always `then(res => setState(res.data ?? res))`.
- Services: `src/main/services/{Auth,User,Employee,Category,Office,SalaryGrade,File}Service.js` — all sync `DatabaseSync`. Renderer never touches DB/files directly.
- Adding a service: create `Service.js` → handler in `ipc.js` → expose in `preload/index.js` → call via `window.api`.

## UI Notes
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles/main.css`: `navy #1B2C63`, `navy-deep #14214b`, `orange #E85B18`, `paper #FAF8F4`, `hairline #E7E2D6`, status colors; fonts Space Grotesk/Inter/IBM Plex Mono. `.folder-tab` uses `clip-path`.
- `Select.jsx` uses `createPortal` to `document.body` (flip-up, reposition on scroll) — don't render selects inside modals without it.
- `Layout.jsx` shows `v{version}` from `app:version` IPC (`app.getVersion()`). Keep the unwrap fix.

## Build / Publish
- `package.json:build` is the source of truth for `electron-builder` when run via `npm run build:win`/`release` (the `electron-builder.yml` file exists but is stale — `appId` differs `ph.gov.ozamiz.hrrms` vs `ph.gov.ozamiz.cco.hrrms` and lacks `publish`). Trust `package.json` + `electron.vite.config.mjs`.
- `extraResources` + `getSqlDir()` (`process.resourcesPath/database` when packaged) must stay in sync.
- `releaseType: "release"` in `package.json:build.publish` — without it releases are created as **drafts** and `electron-updater` won't see them.

## Release & Auto-Update
- Branching: `dev` → `main` via PR. Only pushes to `main` trigger `.github/workflows/release.yml`.
- Workflow (`windows-latest`): bump minor (`1.3.0 → 1.4.0` via Node, no `semver` CLI), **create tag** `v<version>` and push it, then `npm run release` (`GH_TOKEN: secrets.GITHUB_TOKEN`), then commit version bump back to `main`. Tag must exist before `electron-builder` publish or GitHub returns `422 Published releases must have a valid tag`.
- Installed app (`dist/HRRMS Setup *.exe`, NSIS `oneClick:false`) auto-updates on launch: `autoUpdater.checkForUpdates()` in `src/main/index.js:104` (`autoDownload:true`, `autoInstallOnAppQuit:true`). `latest.yml` + `.blockmap` must be uploaded alongside the exe.
- Manual publish (when workflow is broken): `GH_TOKEN=$(gh auth token) npm run release` locally, then `gh release edit v<ver> --draft=false` if it lands as draft, and handle the exe/blockmap split (builder sometimes creates two releases with same tag — delete duplicates).

## Conventions
- Roles: `admin` sees Dashboard/Users/Categories/Offices/Salary Grades; `staff` sees Employees. `NAV` + `META` in `Layout.jsx`.
- Employees are never deleted — set `status: inactive` and filter. Categories/subcategories refuse deletion if files exist.
- Default users seeded in `src/main/db.js:ensureDefaultUsers()` — `admin`/`staff` password `password` (hash `$2b$12$h3oqRyG…`). Migrates old `admin123` hash.
