import { Router } from 'express'
import requireRole from '../middleware/requireRole.js'
import { ROLES } from '../constants/roles.js'
import usersRoutes from '../modules/users/users.routes.js'

const router = Router()

// requireAuth is applied in app.js; restrict the whole admin area by role here.
router.use(requireRole(ROLES.ADMIN, ROLES.STAFF))

router.use('/users', usersRoutes)

export default router
