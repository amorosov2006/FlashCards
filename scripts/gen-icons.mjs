// Generates PWA / home-screen icons as PNGs with zero dependencies (built-in
// zlib only). Draws the same "flashcard stack" mark as favicon.svg.
//
// Outputs into ./public:  pwa-192.png, pwa-512.png, pwa-maskable-512.png,
// apple-touch-icon.png (180).

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')
mkdirSync(outDir, { recursive: true })

// --- tiny PNG encoder ------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter type 0 (none)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- tiny rasterizer -------------------------------------------------------
function canvas(size) {
  return { size, data: Buffer.alloc(size * size * 4) }
}
function px(c, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return
  const i = (y * c.size + x) * 4
  const ia = a / 255
  c.data[i] = Math.round(c.data[i] * (1 - ia) + r * ia)
  c.data[i + 1] = Math.round(c.data[i + 1] * (1 - ia) + g * ia)
  c.data[i + 2] = Math.round(c.data[i + 2] * (1 - ia) + b * ia)
  c.data[i + 3] = Math.max(c.data[i + 3], a)
}
function lerp(a, b, t) { return a + (b - a) * t }
function inRoundRect(x, y, rx, ry, w, h, rad) {
  if (x < rx || y < ry || x >= rx + w || y >= ry + h) return false
  const cx = Math.min(Math.max(x, rx + rad), rx + w - rad)
  const cy = Math.min(Math.max(y, ry + rad), ry + h - rad)
  const dx = x - cx, dy = y - cy
  return dx * dx + dy * dy <= rad * rad
}
function fillRoundRect(c, rx, ry, w, h, rad, color) {
  for (let y = Math.floor(ry); y < ry + h; y++) {
    for (let x = Math.floor(rx); x < rx + w; x++) {
      if (inRoundRect(x + 0.5, y + 0.5, rx, ry, w, h, rad)) px(c, x, y, color[0], color[1], color[2], color[3] ?? 255)
    }
  }
}

function draw(size, { maskable = false } = {}) {
  const c = canvas(size)
  const s = size
  // Background: rounded (or full-bleed for maskable) vertical gradient.
  const bgRad = maskable ? 0 : s * 0.22
  const top = [99, 102, 241]   // #6366f1
  const bot = [67, 56, 202]    // #4338ca
  for (let y = 0; y < s; y++) {
    const t = y / s
    const col = [Math.round(lerp(top[0], bot[0], t)), Math.round(lerp(top[1], bot[1], t)), Math.round(lerp(top[2], bot[2], t))]
    for (let x = 0; x < s; x++) {
      if (inRoundRect(x + 0.5, y + 0.5, 0, 0, s, s, bgRad)) px(c, x, y, col[0], col[1], col[2], 255)
    }
  }
  // Card geometry — keep inside the maskable safe zone (~80%).
  const scale = maskable ? 0.62 : 0.46
  const cw = s * scale
  const ch = cw * 1.22
  const cx = (s - cw) / 2
  const cy = (s - ch) / 2
  const rad = cw * 0.16
  // Back card (rotated look via offset + lighter fill)
  fillRoundRect(c, cx - cw * 0.12, cy - ch * 0.04, cw, ch, rad, [255, 255, 255, 130])
  // Front card
  fillRoundRect(c, cx, cy, cw, ch, rad, [255, 255, 255, 255])
  // Lines
  const lx = cx + cw * 0.18
  const lw = cw * 0.64
  const lh = Math.max(2, ch * 0.06)
  fillRoundRect(c, lx, cy + ch * 0.28, lw, lh, lh / 2, [99, 102, 241, 255])
  fillRoundRect(c, lx, cy + ch * 0.46, lw, lh, lh / 2, [199, 210, 254, 255])
  fillRoundRect(c, lx, cy + ch * 0.64, lw * 0.6, lh, lh / 2, [199, 210, 254, 255])
  return encodePNG(s, s, c.data)
}

const targets = [
  ['pwa-192.png', draw(192)],
  ['pwa-512.png', draw(512)],
  ['pwa-maskable-512.png', draw(512, { maskable: true })],
  ['apple-touch-icon.png', draw(180)],
]
for (const [name, buf] of targets) {
  writeFileSync(join(outDir, name), buf)
  console.log('wrote', name, `(${buf.length} bytes)`)
}
