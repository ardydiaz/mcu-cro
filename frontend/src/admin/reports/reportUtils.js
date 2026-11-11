import { formatDate } from '../shared/format.js'

// "Nov 1, 2026 – Nov 30, 2026" / "All time", for report headings and print-outs.
export function describeRange(from, to) {
  if (!from && !to) return 'All time'
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`
  return from ? `From ${formatDate(from)}` : `Until ${formatDate(to)}`
}

// Totals row: sums the given numeric fields over the rows.
export const sumRows = (rows, fields) => Object.fromEntries(fields.map((f) => [f, rows.reduce((total, row) => total + (row[f] ?? 0), 0)]))

// "Jun 4 – Nov 3, 2026" for first/last activity dates.
export const dateSpan = (first, last) => (first ? (first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`) : '—')

// "2026-07" → "Jul 2026"
export const formatMonth = (month) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })

export const n = (value) => (value ?? 0).toLocaleString()
