import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import validate from '../../middleware/validate.js'
import { HttpError } from '../../utils/httpError.js'
import { fileParamSchema } from '../../validators/content.js'
import * as files from './files.service.js'

// Mounted at /api/admin/files. Any portal user can upload content files and
// open them (also before they're published, for previews).
const router = Router()

// POST /api/admin/files?purpose=document|image  (multipart field "file")
router.post('/', (req, res, next) => {
  files.uploadMiddleware(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'The file is too large (maximum 25 MB).'))
    if (err) return next(new HttpError(400, 'The upload could not be read. Please try again.'))
    next()
  })
}, async (req, res) => {
  const purpose = req.query.purpose === 'image' ? 'image' : 'document'
  const file = await files.saveUpload(req.file, purpose, req.user)
  await audit(req, 'file.upload', { entityType: 'file', entityId: file.id, details: { name: file.name, size: file.size } })
  res.status(201).json(file)
})

router.get('/:id', validate(fileParamSchema, 'params'), async (req, res) => {
  const file = await files.findById(req.validated.params.id)
  if (!file) throw new HttpError(404, 'File not found.')
  await files.sendFile(res, file, { cache: false })
})

export default router
