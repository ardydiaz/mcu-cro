import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { db } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

// Uploaded files live outside the code, in backend/storage/uploads/<id> (no
// extension; the type is stored in the database). Back this folder up with the database.
export const UPLOAD_DIR = fileURLToPath(new URL('../../../storage/uploads/', import.meta.url))
await mkdir(UPLOAD_DIR, { recursive: true })

const MB = 1024 * 1024

// What can be uploaded. The file's first bytes must match its type, so a
// renamed executable can't pass as a PDF.
const TYPES = {
  'application/pdf': { ext: 'pdf', magic: [[0x25, 0x50, 0x44, 0x46]] },
  'image/jpeg': { ext: 'jpg', magic: [[0xff, 0xd8, 0xff]], image: true },
  'image/png': { ext: 'png', magic: [[0x89, 0x50, 0x4e, 0x47]], image: true },
  'image/webp': { ext: 'webp', magic: [[0x52, 0x49, 0x46, 0x46]], image: true },
  // Office files: new formats are ZIP archives, old ones OLE2 documents.
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', magic: [[0x50, 0x4b, 0x03, 0x04]] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', magic: [[0x50, 0x4b, 0x03, 0x04]] },
  'application/vnd.ms-powerpoint': { ext: 'ppt', magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  'application/msword': { ext: 'doc', magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
}
const BY_EXT = Object.fromEntries(Object.entries(TYPES).map(([mime, t]) => [t.ext, mime]))
BY_EXT.jpeg = 'image/jpeg'

// purpose: 'document' (learning materials) or 'image' (photos and covers)
export const LIMITS = { document: 25 * MB, image: 8 * MB }

// Keeps the upload in memory (max 25 MB) until it has been checked.
export const uploadMiddleware = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.document, files: 1 } }).single('file')

function detectType(buffer, originalName) {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? ''
  const mime = BY_EXT[ext]
  const type = TYPES[mime]
  const matches = type?.magic.some((bytes) => bytes.every((b, i) => buffer[i] === b))
  if (!matches) return null
  if (mime === 'image/webp' && buffer.subarray(8, 12).toString('ascii') !== 'WEBP') return null
  return { mime, ...type }
}

export async function saveUpload(file, purpose, actor) {
  if (!file) throw new HttpError(400, 'Choose a file to upload.')
  const type = detectType(file.buffer, file.originalname)
  if (!type || (purpose === 'image' && !type.image)) {
    throw new HttpError(
      400,
      purpose === 'image'
        ? 'Upload a JPG, PNG or WebP image.'
        : 'Upload a PDF, PowerPoint (PPT/PPTX), Word (DOC/DOCX) or image (JPG, PNG, WebP) file.',
    )
  }
  if (file.size > LIMITS[purpose]) throw new HttpError(400, `The file is too large (maximum ${LIMITS[purpose] / MB} MB).`)

  const id = randomUUID()
  // Keep a readable name for downloads; strip anything odd.
  const name = file.originalname.replace(/[^\w.\- ()]+/g, '_').slice(-200)
  await writeFile(`${UPLOAD_DIR}${id}`, file.buffer)
  await db.execute('INSERT INTO files (id, original_name, mime_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?)', [
    id,
    name,
    type.mime,
    file.size,
    actor.id,
  ])
  return findById(id)
}

export const toFile = (row) =>
  row && { id: row.id, name: row.original_name, mimeType: row.mime_type, size: row.size_bytes, url: `/api/public/files/${row.id}` }

export async function findById(id) {
  const [rows] = await db.execute('SELECT * FROM files WHERE id = ? LIMIT 1', [id])
  return toFile(rows[0])
}

// A file is public only while attached to published content.
export async function isPublic(id) {
  const [[row]] = await db.query(
    `SELECT
       EXISTS(SELECT 1 FROM learning_resources WHERE file_id = ? AND status = 'published' AND deleted_at IS NULL) OR
       EXISTS(SELECT 1 FROM posts WHERE cover_file_id = ? AND status = 'published' AND deleted_at IS NULL) OR
       EXISTS(SELECT 1 FROM post_photos ph JOIN posts p ON p.id = ph.post_id
              WHERE ph.file_id = ? AND p.status = 'published' AND p.deleted_at IS NULL) AS public`,
    [id, id, id],
  )
  return Boolean(row.public)
}

// Sends a stored file. Images and PDFs open in the browser; Office files download.
export function sendFile(res, file, { cache }) {
  const inline = file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf'
  return new Promise((resolve, reject) =>
    res.sendFile(
      file.id,
      {
        root: UPLOAD_DIR,
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${file.name.replace(/"/g, '')}"`,
          'Cache-Control': cache ? 'public, max-age=86400' : 'private, no-store',
          // Nothing in a file may run scripts; images and the browser's PDF viewer still work.
          'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        },
      },
      (err) => (err ? reject(err.code === 'ENOENT' ? new HttpError(404, 'File not found.') : err) : resolve()),
    ),
  )
}
