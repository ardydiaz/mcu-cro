import { Router } from 'express'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { ROLES } from '../../constants/roles.js'
import { createUserSchema, listUsersSchema, updateUserSchema } from '../../validators/users.js'
import * as controller from './users.controller.js'

// Mounted at /api/admin/users. Per the requirements, access management belongs
// to the IT Administrator.
const router = Router()

router.use(requireRole(ROLES.IT_ADMIN))

router.get('/', validate(listUsersSchema, 'query'), controller.list)
router.post('/', validate(createUserSchema), controller.create)
router.patch('/:id', validate(updateUserSchema), controller.update)
router.delete('/:id', controller.remove)

export default router
