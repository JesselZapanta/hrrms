// Syncs the app logo from assets/app-logo.ico (ICO container holding PNG entries).
// - build/icon.png: 256px entry (desktop/exe icon via electron-builder; do NOT
//   add a build/icon.ico — a prebuilt .ico breaks NSIS makensis).
// - src/main/splash.js: 128px entry embedded as a base64 data URI (splash mark).
// The renderer keeps using the seal (logo.webp); this logo is splash + desktop only.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const buf = fs.readFileSync(path.join(root, 'assets', 'app-logo.ico'))
if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) throw new Error('assets/app-logo.ico is not an ICO file')
const count = buf.readUInt16LE(4)
const entries = []
for (let i = 0; i < count; i++) {
  const o = 6 + i * 16
  entries.push({ w: buf[o] || 256, size: buf.readUInt32LE(o + 8), off: buf.readUInt32LE(o + 12) })
}
const pick = (w) => entries.find((e) => e.w === w) ?? entries[entries.length - 1]
const pngBytes = (e) => buf.slice(e.off, e.off + e.size)

// Desktop / exe icon
const icon256 = pngBytes(pick(256))
fs.mkdirSync(path.join(root, 'build'), { recursive: true })
fs.writeFileSync(path.join(root, 'build', 'icon.png'), icon256)
console.log(`Wrote build/icon.png (${icon256.length} bytes)`)

// Splash mark (embedded data URI — the splash loads from a data: URL)
const uri = `data:image/png;base64,${pngBytes(pick(128)).toString('base64')}`
const splashPath = path.join(root, 'src', 'main', 'splash.js')
let html = fs.readFileSync(splashPath, 'utf8')
if (!html.includes('object-fit: cover;')) {
  html = html.replace(
    'border: 2px solid rgba(255,255,255,.8);',
    'border: 2px solid rgba(255,255,255,.8);\n    object-fit: cover;'
  )
}
const before = html
html = html.replace(/<div class="mark">.*?<\/div>/s, `<img class="mark" src="${uri}" alt="" />`)
if (html === before) throw new Error('splash mark anchor not found')
fs.writeFileSync(splashPath, html)
console.log(`Embedded ${uri.length} chars into src/main/splash.js`)
