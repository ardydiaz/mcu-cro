import { Router } from 'express'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { BENEFICIARY_EDITORS, RECORD_MANAGERS } from '../../constants/roles.js'
import {
  createBeneficiarySchema,
  listBeneficiariesSchema,
  updateBeneficiarySchema,
} from '../../validators/beneficiaries.js'
import { idParamSchema } from '../../validators/common.js'
import * as controller from './beneficiaries.controller.js'

// Mounted at /api/admin/beneficiaries. Every portal role can search and view;
// coordinators and administrators add and edit; only administrators remove.
const router = Router()
const byId = validate(idParamSchema, 'params')

router.get('/', validate(listBeneficiariesSchema, 'query'), controller.list)
router.get('/:id', byId, controller.get)
router.post('/', requireRole(...BENEFICIARY_EDITORS), validate(createBeneficiarySchema), controller.create)
router.patch('/:id', requireRole(...BENEFICIARY_EDITORS), byId, validate(updateBeneficiarySchema), controller.update)
router.delete('/:id', requireRole(...RECORD_MANAGERS), byId, controller.remove)

export default router
