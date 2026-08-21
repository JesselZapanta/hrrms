import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'
import pngToIco from 'png-to-ico'

const SIZE = 512
const png = new PNG({ width: SIZE, height: SIZE })

// Colors
const navy = { r: 27, g: 44, b: 99 } // #1B2C63
const navyDeep = { r: 20, g: 33, b: 75 } // #14214b approximated
const orange = { r: 232, g: 91, b: 24 } // #E85B18
const white = { r: 255, g: 255, b: 255 }

function setPixel(x, y, c, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const idx = (y * SIZE + x) * 4
  png.data[idx] = c.r
  png.data[idx + 1] = c.g
  png.data[idx + 2] = c.b
  png.data[idx + 3] = a
}

// Fill background with navy gradient (vertical)
for (let y = 0; y < SIZE; y++) {
  const t = y / SIZE
  const r = Math.round(navy.r + (navyDeep.r - navy.r) * t)
  const g = Math.round(navy.g + (navyDeep.g - navy.g) * t)
  const b = Math.round(navy.b + (navyDeep.b - navy.b) * t)
  for (let x = 0; x < SIZE; x++) {
    // Rounded rect for icon background (28px radius)
    const radius = 84 // 512 * 0.164 (approx rounded-xl)
    let inside = true
    if (x < radius && y < radius) inside = (x - radius) ** 2 + (y - radius) ** 2 <= radius ** 2
    else if (x >= SIZE - radius && y < radius) inside = (x - (SIZE - radius)) ** 2 + (y - radius) ** 2 <= radius ** 2
    else if (x < radius && y >= SIZE - radius) inside = (x - radius) ** 2 + (y - (SIZE - radius)) ** 2 <= radius ** 2
    else if (x >= SIZE - radius && y >= SIZE - radius) inside = (x - (SIZE - radius)) ** 2 + (y - (SIZE - radius)) ** 2 <= radius ** 2
    if (inside) setPixel(x, y, { r, g, b })
    else setPixel(x, y, { r, g, b }, 0)
  }
}

// Helper: point in rounded folder shape
// Folder viewBox 48x48 scaled to 512: scale = 512/48 = 10.666
// Path: M6 15.5A4.5 4.5 0 0 1 10.5 11h8.2l3.2 4.4H37.5A4.5 4.5 0 0 1 42 19.9V34a4.5 4.5 0 0 1-4.5 4.5h-27A4.5 4.5 0 0 1 6 34v-18.5z
// Approx folder rect: x 6-42, y 11-38.5 in viewBox -> scaled: x 64-448, y 117-411
// We'll rasterize by checking if point is inside the folder polygon with rounded corners
function isInFolder(px, py) {
  // Convert pixel to viewBox coords
  const vbX = (px / SIZE) * 48
  const vbY = (py / SIZE) * 48
  // Quick bounds
  if (vbX < 6 || vbX > 42 || vbY < 11 || vbY > 38.5) return false
  // Tab notch: left part y<15.5, x<18.7 is top edge with tab
  // The top edge is at y=11 from x=10.5 to 18.7, then slants to (21.9,15.5)
  // For simplicity, include tab area: if y < 15.5 and x < 21.9, check if above the slant line
  if (vbY < 15.5) {
    if (vbX < 10.5) return false
    if (vbX >= 10.5 && vbX <= 18.7) return true // flat top
    if (vbX > 18.7 && vbX < 21.9) {
      // line from (18.7,11) to (21.9,15.5)
      const lineY = 11 + ((vbX - 18.7) / (21.9 - 18.7)) * 4.5
      return vbY >= lineY
    }
  }
  return true
}

// Draw folder (orange) with rounded corners approx via distance check
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (isInFolder(x, y)) {
      // Check rounded corners (4.5 in viewBox = 48px in 512)
      const r = 4.5 * (SIZE / 48) // 48
      const vbX = (x / SIZE) * 48
      const vbY = (y / SIZE) * 48
      let isCorner = false
      let inCorner = true
      // Top-left corner at (10.5,11) radius 4.5
      if (vbX < 10.5 + 4.5 && vbY < 11 + 4.5) {
        isCorner = true
        const dx = vbX - (10.5 + 4.5)
        const dy = vbY - (11 + 4.5)
        // Only outer corner
        if (dx < 0 && dy < 0) inCorner = dx * dx + dy * dy <= 4.5 * 4.5
      }
      // Top-right
      if (vbX > 37.5 - 4.5 && vbY < 19.9) {
        // not exact, skip for now
      }
      // Bottom corners
      if (vbY > 38.5 - 4.5) {
        if (vbX < 10.5) {
          const dx = vbX - 10.5
          const dy = vbY - (38.5 - 4.5)
          if (dx < 0 || dy > 0) {
            isCorner = true
            inCorner = dx * dx + dy * dy <= 4.5 * 4.5
          }
        }
        if (vbX > 37.5) {
          const dx = vbX - 37.5
          const dy = vbY - (38.5 - 4.5)
          isCorner = true
          if (dx * dx + dy * dy > 4.5 * 4.5) inCorner = false
        }
      }
      if (!isCorner || inCorner) setPixel(x, y, orange)
    }
  }
}

// Draw person: circle at (24,23.5) r6, and bottom shape M14.5 36.5c0-5.6 4.2-9 9.5-9s9.5 3.4 9.5 9
// Scaled
const cx = (24 / 48) * SIZE
const cy = (23.5 / 48) * SIZE
const pr = (6 / 48) * SIZE
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx
    const dy = y - cy
    if (dx * dx + dy * dy <= pr * pr) {
      setPixel(x, y, white)
    }
  }
}
// Bottom person shape: flat bottom with rounded top
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const vbX = (x / SIZE) * 48
    const vbY = (y / SIZE) * 48
    // Check if inside the bottom shape
    // Shape is at y 27.5 to 36.5, x 14.5 to 33.5, with top curved
    if (vbY < 27.5 || vbY > 36.5 || vbX < 14.5 || vbX > 33.5) continue
    // Top curve: y = 36.5 - 9 * (1 - ((x-24)/9.5)^2) ??? Approx as ellipse
    // Original: M14.5 36.5c0-5.6 4.2-9 9.5-9s9.5 3.4 9.5 9
    // This is a cubic bezier from (14.5,36.5) to (33.5,36.5) with control points
    // For raster, approximate top edge as parabola: y_top = 27.5 + ((vbX-24)/9.5)^2 * 0
    // Actually the curve is flat at center 27.5 and rises to 36.5 at edges? No, it's a bulge.
    // Let's approximate: at x=24, y=27.5; at x=14.5 or 33.5, y=36.5
    const nx = (vbX - 24) / 9.5
    const yTop = 27.5 + nx * nx * 9 // parabola that is 27.5 at center, 36.5 at edge (9 diff)
    if (vbY >= yTop) setPixel(x, y, white)
  }
}

const outPng = path.join('build', 'icon.png')
fs.mkdirSync('build', { recursive: true })
fs.writeFileSync(outPng, PNG.sync.write(png))
console.log(`Wrote ${outPng} ${SIZE}x${SIZE}`)

// Generate ICO with multiple sizes
const sizes = [16, 24, 32, 48, 64, 128, 256, 512]
const pngBuffers = []
for (const s of sizes) {
  // Simple downscale by nearest neighbor from 512 png
  // For now just use the 512 png for all sizes - png-to-ico will scale
  // Instead generate smaller PNGs by scaling
  const small = new PNG({ width: s, height: s })
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const srcX = Math.floor((x / s) * SIZE)
      const srcY = Math.floor((y / s) * SIZE)
      const srcIdx = (srcY * SIZE + srcX) * 4
      const dstIdx = (y * s + x) * 4
      small.data[dstIdx] = png.data[srcIdx]
      small.data[dstIdx + 1] = png.data[srcIdx + 1]
      small.data[dstIdx + 2] = png.data[srcIdx + 2]
      small.data[dstIdx + 3] = png.data[srcIdx + 3]
    }
  }
  pngBuffers.push(PNG.sync.write(small))
}

const icoBuf = await pngToIco(pngBuffers)
fs.writeFileSync('build/icon.ico', icoBuf)
console.log(`Wrote build/icon.ico (${icoBuf.length} bytes, ${sizes.length} sizes)`)
