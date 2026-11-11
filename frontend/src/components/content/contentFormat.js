// Formatting helpers for public content.
export const formatDate = (iso, options = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-PH', options) : ''

export const formatBytes = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

// "PDF", "PowerPoint", … for download buttons.
export function fileKind(mimeType = '') {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PowerPoint'
  if (mimeType.includes('word')) return 'Word'
  if (mimeType.startsWith('image/')) return 'Image'
  return 'File'
}

// Body text: blank lines separate paragraphs.
export const paragraphs = (text) => (text ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [])
