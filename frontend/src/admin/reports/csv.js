// Downloads rows as a CSV file that opens in Excel (UTF-8 with BOM).
// `columns`: [{ label, csv: (row) => value }]
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map((c) => escape(c.label)), ...rows.map((row) => columns.map((c) => escape(c.csv(row))))]
  const blob = new Blob(['﻿', lines.map((line) => line.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
