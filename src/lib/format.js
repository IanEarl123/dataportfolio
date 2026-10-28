export function formatPrice(value, currency = 'PHP') {
  const n = Number(value ?? 0)
  try {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}

// Dates come from Postgres as 'YYYY-MM-DD'; parse as local dates so they don't shift a day.
function parseDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value, opts = { month: 'short', year: 'numeric' }) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString('en-US', opts) : ''
}

export function formatRange(start, end) {
  const s = formatDate(start)
  const e = end ? formatDate(end) : 'Present'
  return s ? `${s} — ${e}` : end ? e : ''
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function readingTime(markdown = '') {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
