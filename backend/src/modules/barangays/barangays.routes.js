import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { BENEFICIARY_EDITORS } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import { createBarangaySchema } from '../../validators/barangays.js'
import * as repo from './barangays.repository.js'

// Mounted at /api/admin/barangays. Everyone can list; beneficiary editors can add.
const router = Router()

router.get('/', async (req, res) => {
  res.json({ barangays: await repo.listActive() })
})

router.post('/', requireRole(...BENEFICIARY_EDITORS), validate(createBarangaySchema), async (req, res) => {
  if (await repo.findByNameAndCity(req.body.name, req.body.city)) {
    throw new HttpError(409, 'This barangay is already on the list.')
  }
  const barangay = await repo.create(req.body)
  await audit(req, 'barangay.create', { entityType: 'barangay', entityId: barangay.id, details: barangay })
  res.status(201).json(barangay)
})

export default router
