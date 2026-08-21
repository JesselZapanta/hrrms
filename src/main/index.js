import { app, BrowserWindow, shell, nativeImage, session } from 'electron'
import { autoUpdater } from 'electron-updater'
import fs from 'node:fs'
import path from 'node:path'
import { initDb, closeDb } from './db.js'
import { registerIpc } from './ipc.js'
import { splashDataUrl } from './splash.js'

app.setName('hrrms')

function getIconPath() {
  const candidates = [
    path.join(app.getAppPath(), 'build/icon.png'),
    path.join(process.resourcesPath, 'build/icon.png'),
    path.join(process.resourcesPath, 'app.asar', 'build/icon.png')
  ]
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p } catch {}
  }
  return undefined
}

function getWindowIcon() {
  const p = getIconPath()
  if (!p) return undefined
  try { return nativeImage.createFromPath(p) } catch { return undefined }
}

const isDev = !app.isPackaged
const SPLASH_MIN_MS = 1800

function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 460,
    height: 320,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#1B2C63',
    icon: getWindowIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  splash.loadURL(splashDataUrl())
  splash.once('ready-to-show', () => splash.show())
  splash.webContents.on('did-fail-load', () => {
    if (!splash.isDestroyed()) splash.close()
  })
  return splash
}

function createMainWindow(onReady) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'HRRMS - City Council Office, LGU Ozamiz',
    backgroundColor: '#FAF8F4',
    autoHideMenuBar: true,
    show: false,
    icon: getWindowIcon(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.once('ready-to-show', () => {
    if (onReady) onReady(win)
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

let mainWin = null

function setSplashStatus(splash, text) {
  if (!splash || splash.isDestroyed()) return
  const safe = String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`')
  splash.webContents.executeJavaScript(`(function(){var el=document.getElementById('splash-status'); if(el) el.textContent='${safe}';})()`).catch(() => {})
}

function setupAutoUpdater(win) {
  const send = (payload) => {
    if (!win.isDestroyed()) win.webContents.send('updater:status', payload)
  }
  // keep listeners for in-app banner (while app is running)
  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ status: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }))
  autoUpdater.on('download-progress', (p) => send({ status: 'downloading', percent: Math.round(p.percent), bytesPerSecond: p.bytesPerSecond }))
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ status: 'error', message: err.message }))
}

async function fetchAppStatus() {
  const fallback = { active: true, message: 'Something went wrong. Please contact the developer.' }
  // Hidden remote config — not at repo root. Tries dotfile then package field.
  const bust = '?ts=' + Date.now()
  const tryFetch = async (url, pick) => {
    try {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 3500)
      const r = await fetch(url + bust, { signal: c.signal, cache: 'no-store' })
      clearTimeout(t)
      if (!r.ok) return null
      const j = await r.json()
      const v = pick ? pick(j) : j
      if (v && typeof v.active === 'boolean') return { active: v.active, message: v.message || fallback.message }
    } catch {}
    return null
  }
  // 1) dotfile in database (hidden from file list)
  let s = await tryFetch('https://raw.githubusercontent.com/JesselZapanta/hrrms/main/database/.status', null)
  if (s) return s
  // 2) hidden field inside package.json
  s = await tryFetch('https://raw.githubusercontent.com/JesselZapanta/hrrms/main/package.json', (j) => j._hrrms)
  if (s) return s
  // 3) bundled fallbacks (shipped with installer)
  for (const p of [path.join(app.getAppPath(), 'database/.status'), path.join(process.resourcesPath, 'database/.status')]) {
    try { if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf-8')); if (typeof j.active === 'boolean') return { active: j.active, message: j.message || fallback.message } } } catch {}
  }
  for (const p of [path.join(app.getAppPath(), 'package.json'), path.join(process.resourcesPath, 'app.asar', 'package.json')]) {
    try { if (fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf-8')); const v = j._hrrms; if (v && typeof v.active === 'boolean') return { active: v.active, message: v.message || fallback.message } } } catch {}
  }
  return fallback
}

function showLockScreen(splash, message) {
  if (!splash || splash.isDestroyed()) return
  const safeMsg = String(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`').replace(/\n/g, '\\n')
  splash.webContents.executeJavaScript(`(function(){
    var s=document.getElementById('splash-status');
    if(s){ s.textContent='${safeMsg}'; s.style.color='rgba(250,248,244,0.95)'; s.style.fontSize='11px'; s.style.textTransform='none'; s.style.letterSpacing='0.3px'; s.style.lineHeight='1.4'; s.style.maxWidth='360px'; s.style.textAlign='center'; }
    var bar=document.querySelector('.bar'); if(bar) bar.style.display='none';
    var sub=document.querySelector('.subtitle'); if(sub) sub.textContent='Access paused';
  })()`).catch(() => {})
}

function launchApp() {
  initDb()
  registerIpc()

  const splash = createSplashWindow()
  const start = Date.now()
  let revealed = false
  let updateFlowActive = false
  let mainCreated = false

  const revealMain = (win) => {
    if (revealed) return
    revealed = true
    const elapsed = Date.now() - start
    const delay = Math.max(0, SPLASH_MIN_MS - elapsed)
    setTimeout(() => {
      if (!splash.isDestroyed()) splash.close()
      win.show()
      win.focus()
    }, delay)
  }

  const createMain = () => {
    if (mainCreated) return
    mainCreated = true
    mainWin = createMainWindow(revealMain)
    if (app.isPackaged) setupAutoUpdater(mainWin)
  }

  if (!app.isPackaged) {
    createMain()
    return
  }

  // Packaged: first check remote kill-switch — if inactive, lock the app on splash
  fetchAppStatus().then((status) => {
    if (!status.active) {
      showLockScreen(splash, status.message)
      // Do not create main window, do not check for updates — app stays locked on splash
      return
    }
    // Active: proceed to mandatory update check
    runMandatoryUpdateCheck()
  }).catch(() => runMandatoryUpdateCheck())

  function runMandatoryUpdateCheck() {
  updateFlowActive = true
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false // we will quitAndInstall explicitly to force logout

  let hasUpdate = false
  let settled = false

  const proceedToApp = () => {
    if (settled) return
    settled = true
    updateFlowActive = false
    createMain()
  }

  const failSafe = setTimeout(() => {
    if (!settled && !hasUpdate) proceedToApp()
  }, 7000)

  autoUpdater.once('update-available', () => {
    hasUpdate = true
    setSplashStatus(splash, 'Update available — downloading…')
  })

  autoUpdater.once('update-not-available', () => {
    clearTimeout(failSafe)
    proceedToApp()
  })

  autoUpdater.once('download-progress', (p) => {
    hasUpdate = true
    setSplashStatus(splash, `Downloading update… ${Math.round(p.percent)}%`)
  })

  // Use on (not once) for progress updates after available
  autoUpdater.on('download-progress', (p) => {
    if (hasUpdate) setSplashStatus(splash, `Downloading update… ${Math.round(p.percent)}%`)
  })

  autoUpdater.once('update-downloaded', async () => {
    clearTimeout(failSafe)
    hasUpdate = true
    setSplashStatus(splash, 'Update ready — restarting…')
    // Force logout all users: clear localStorage for app session
    try { await session.defaultSession.clearStorageData({ storages: ['localStorage'] }) } catch {}
    // Small delay so user sees the status
    setTimeout(() => autoUpdater.quitAndInstall(), 900)
  })

  autoUpdater.once('error', () => {
    clearTimeout(failSafe)
    if (!hasUpdate) proceedToApp()
  })

  setSplashStatus(splash, 'Checking for updates…')
  autoUpdater.checkForUpdates().catch(() => {
    clearTimeout(failSafe)
    if (!hasUpdate) proceedToApp()
  })

  // If no update-available within 4.5s, assume up-to-date and show app
  setTimeout(() => {
    if (!hasUpdate && !settled) {
      // still waiting for update-not-available / error — treat as no update if check is slow/offline
      // do not proceed yet, fall back to failSafe at 7s
      setSplashStatus(splash, 'Checking for updates…')
    }
  }, 4500)
  }
}

app.whenReady().then(() => {
  launchApp()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) launchApp()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => closeDb())
