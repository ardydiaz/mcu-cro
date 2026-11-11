import { Router } from 'express'
import { audit } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { BENEFICIARY_EDITORS } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import { createProgramSchema } from '../../validators/programs.js'
import * as repo from './programs.repository.js'

// Mounted at /api/admin/programs. Everyone can list; coordinators and administrators add.
const router = Router()

router.get('/', async (req, res) => {
  res.json({ programs: await repo.listActive() })
})

router.post('/', requireRole(...BENEFICIARY_EDITORS), validate(createProgramSchema), async (req, res) => {
  if (await repo.findByName(req.body.name)) throw new HttpError(409, 'This program is already on the list.')
  const program = await repo.create(req.body)
  await audit(req, 'program.create', { entityType: 'program', entityId: program.id, details: program })
  res.status(201).json(program)
})

export default router
