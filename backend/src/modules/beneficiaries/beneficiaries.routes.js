import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { BENEFICIARY_EDITORS, RECORD_MANAGERS } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import {
  createBeneficiarySchema,
  listBeneficiariesSchema,
  updateBeneficiarySchema,
} from '../../validators/beneficiaries.js'
import { idParamSchema } from '../../validators/common.js'
import * as controller from './beneficiaries.controller.js'
import * as importer from './beneficiaries.import.js'

// Mounted at /api/admin/beneficiaries. Every portal role can search and view
// the beneficiaries in their scope; coordinators and administrators add and
// edit; only administrators remove and import.
const router = Router()
const byId = validate(idParamSchema, 'params')

// ---------- Import from Excel/CSV (requirements Step 8 – Data Migration) ----------
router.get('/import/template', requireRole(...RECORD_MANAGERS), async (req, res) => {
  const buffer = await importer.buildTemplate()
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="beneficiaries-import-template.xlsx"',
    'Cache-Control': 'no-store',
  })
  res.send(Buffer.from(buffer))
})

// POST /import (multipart "file") checks the file and saves nothing.
// POST /import?commit=1 with consent=true saves the rows without problems.
router.post(
  '/import',
  requireRole(...RECORD_MANAGERS),
  (req, res, next) =>
    importer.uploadMiddleware(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'The file is too large (maximum 5 MB).'))
      if (err) return next(new HttpError(400, 'The upload could not be read. Please try again.'))
      next()
    }),
  async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose a file to upload.')
    const commit = req.query.commit === '1'
    if (commit && req.body.consent !== 'true') {
      throw new HttpError(400, 'Confirm that everyone in the file consented to their data being collected.')
    }
    const rows = await importer.check(req.file.buffer, req.file.originalname)
    const count = (status) => rows.filter((r) => r.status === status).length
    const summary = { total: rows.length, ready: count('ready'), problem: count('problem'), duplicate: count('duplicate') }

    if (!commit) {
      return res.json({ summary, rows: rows.map(({ payload, ...row }) => row) }) // eslint-disable-line no-unused-vars
    }
    if (summary.ready === 0) throw new HttpError(400, 'There are no rows ready to import.')
    const imported = await importer.save(rows, req.user.id)
    // Counts only: the log never holds the imported personal data.
    await audit(req, 'beneficiary.import', { entityType: 'beneficiary', details: { imported, skipped: rows.length - imported } })
    res.status(201).json({ imported, skipped: rows.length - imported })
  },
)

router.get('/', validate(listBeneficiariesSchema, 'query'), controller.list)
router.get('/:id', byId, controller.get)
router.post('/', requireRole(...BENEFICIARY_EDITORS), validate(createBeneficiarySchema), controller.create)
router.patch('/:id', requireRole(...BENEFICIARY_EDITORS), byId, validate(updateBeneficiarySchema), controller.update)
router.delete('/:id', requireRole(...RECORD_MANAGERS), byId, controller.remove)

export default router
