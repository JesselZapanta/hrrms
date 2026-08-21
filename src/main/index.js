import { app, BrowserWindow, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import { initDb, closeDb } from './db.js'
import { registerIpc } from './ipc.js'
import { splashDataUrl } from './splash.js'

app.setName('hrrms')

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

function setupAutoUpdater(win) {
  const send = (payload) => {
    if (!win.isDestroyed()) win.webContents.send('updater:status', payload)
  }
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('checking-for-update', () => send({ status: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ status: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }))
  autoUpdater.on('download-progress', (p) => send({ status: 'downloading', percent: Math.round(p.percent), bytesPerSecond: p.bytesPerSecond }))
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ status: 'error', message: err.message }))
  autoUpdater.checkForUpdates().catch(() => {})
}

function launchApp() {
  initDb()
  registerIpc()

  const splash = createSplashWindow()
  const start = Date.now()
  let revealed = false

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

  mainWin = createMainWindow(revealMain)
  if (app.isPackaged) setupAutoUpdater(mainWin)
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
