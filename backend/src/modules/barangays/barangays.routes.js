import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { RECORD_MANAGERS, ROLES } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import { createBarangaySchema } from '../../validators/barangays.js'
import * as repo from './barangays.repository.js'

// Mounted at /api/admin/barangays. Everyone can list; administrators can add.
// ?assigned=1 returns only the barangays the user works with: a Community
// Coordinator's assigned barangays, every barangay for everyone else.
const router = Router()

router.get('/', async (req, res) => {
  const mine = req.query.assigned === '1' && req.user.roles.includes(ROLES.COORDINATOR)
  res.json({ barangays: mine ? await repo.listAssigned(req.user.id) : await repo.listActive() })
})

router.post('/', requireRole(...RECORD_MANAGERS), validate(createBarangaySchema), async (req, res) => {
  if (await repo.findByNameAndCity(req.body.name, req.body.city)) {
    throw new HttpError(409, 'This barangay is already on the list.')
  }
  const barangay = await repo.create(req.body)
  await audit(req, 'barangay.create', { entityType: 'barangay', entityId: barangay.id, details: barangay })
  res.status(201).json(barangay)
})

export default router
