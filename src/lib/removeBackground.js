// Removes a plain (single-colour) background from logos and badges, in the browser.
// It only acts when the image's border is mostly one colour, so real photos and
// screenshots with busy edges are left untouched.

const MAX_SIDE = 1200
const TOLERANCE = 40 // colour distance treated as "background"
const SOFT_EDGE = 1.8 // pixels up to TOLERANCE * SOFT_EDGE fade out for smooth edges
const MIN_BORDER_SHARE = 0.65 // share of border pixels that must match the background
const PADDING = 0.06 // space kept around the logo after trimming

// A logo is one or a few solid shapes; a dashboard or document breaks into many
// separate pieces once its background is gone. Those are kept as they are.
const MAX_ISLANDS = 10
const GRID = 48

/** Counts separate shapes left after removal, on a coarse grid (tiny specks ignored). */
function countIslands(d, w, h) {
  const filled = new Uint8Array(GRID * GRID)
  const cw = w / GRID
  const ch = h / GRID
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      // Sample a few points per cell.
      for (let s = 0; s < 9 && !filled[gy * GRID + gx]; s++) {
        const x = Math.min(w - 1, Math.floor((gx + ((s % 3) + 0.5) / 3) * cw))
        const y = Math.min(h - 1, Math.floor((gy + (Math.floor(s / 3) + 0.5) / 3) * ch))
        if (d[(y * w + x) * 4 + 3] > 24) filled[gy * GRID + gx] = 1
      }
    }
  }
  const seen = new Uint8Array(GRID * GRID)
  let islands = 0
  for (let start = 0; start < filled.length; start++) {
    if (!filled[start] || seen[start]) continue
    let size = 0
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const c = stack.pop()
      size++
      const x = c % GRID
      for (const n of [x > 0 ? c - 1 : -1, x < GRID - 1 ? c + 1 : -1, c - GRID, c + GRID]) {
        if (n >= 0 && n < filled.length && filled[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    if (size > 1) islands++
  }
  return islands
}

async function toBitmap(source) {
  if (typeof source === 'string') {
    const res = await fetch(source, { mode: 'cors' })
    if (!res.ok) throw new Error(`Couldn't load the image (${res.status}).`)
    source = await res.blob()
  }
  return createImageBitmap(source)
}

const distance = (d, i, c) => Math.sqrt((d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2)

/** The background colour, 'transparent', or null when the border isn't plain (a photo). */
function detectBackground(d, w, h) {
  const border = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1)

  const transparent = border.filter((p) => d[p * 4 + 3] < 16).length
  if (transparent / border.length > MIN_BORDER_SHARE) return 'transparent'

  // Most common border colour, bucketed so slight noise still counts as one colour.
  const buckets = new Map()
  for (const p of border) {
    const i = p * 4
    const key = `${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    b.n++
    b.r += d[i]
    b.g += d[i + 1]
    b.b += d[i + 2]
    buckets.set(key, b)
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0]
  const color = [top.r / top.n, top.g / top.n, top.b / top.n]
  const matching = border.filter((p) => distance(d, p * 4, color) < TOLERANCE).length
  return matching / border.length >= MIN_BORDER_SHARE ? color : null
}

/**
 * Returns { changed, file, reason }. When changed, `file` is a trimmed PNG/WebP
 * with a transparent background; otherwise the caller should keep the original.
 */
export async function removeBackground(source, name = 'image') {
  const bitmap = await toBitmap(source)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const bg = detectBackground(d, w, h)
  if (bg === 'transparent') return { changed: false, reason: 'already transparent' }
  if (!bg) return { changed: false, reason: 'looks like a photo' }

  // Flood-fill inward from every border pixel that matches the background.
  const seen = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0
  const push = (p) => {
    if (!seen[p]) {
      seen[p] = 1
      queue[tail++] = p
    }
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }

  while (head < tail) {
    const p = queue[head++]
    const i = p * 4
    const dist = distance(d, i, bg)
    if (dist <= TOLERANCE) {
      d[i + 3] = 0
      const x = p % w
      if (x > 0) push(p - 1)
      if (x < w - 1) push(p + 1)
      if (p >= w) push(p - w)
      if (p < w * (h - 1)) push(p + w)
    } else if (dist <= TOLERANCE * SOFT_EDGE) {
      // Anti-aliased edge: fade instead of a hard cut-out.
      const keep = (dist - TOLERANCE) / (TOLERANCE * (SOFT_EDGE - 1))
      d[i + 3] = Math.min(d[i + 3], Math.round(255 * keep))
    }
  }

  // Trim empty space so every logo fills its frame the same way.
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const boxW = maxX - minX + 1
  const boxH = maxY - minY + 1
  if (maxX < 0 || boxW * boxH < w * h * 0.02) return { changed: false, reason: 'nothing left after removing the background' }
  if (countIslands(d, w, h) > MAX_ISLANDS) return { changed: false, reason: 'looks like a screenshot or document' }

  ctx.putImageData(img, 0, 0)
  const pad = Math.round(Math.max(boxW, boxH) * PADDING)
  const out = document.createElement('canvas')
  out.width = boxW + pad * 2
  out.height = boxH + pad * 2
  out.getContext('2d').drawImage(canvas, minX, minY, boxW, boxH, pad, pad, boxW, boxH)

  // WebP keeps transparency and is small; browsers that can't encode it get PNG.
  let blob = await new Promise((r) => out.toBlob(r, 'image/webp', 0.9))
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => out.toBlob(r, 'image/png'))
  const ext = blob.type === 'image/webp' ? 'webp' : 'png'
  const base = String(name).replace(/\.[^.]+$/, '') || 'image'
  return { changed: true, file: new File([blob], `${base}-nobg.${ext}`, { type: blob.type }) }
}
