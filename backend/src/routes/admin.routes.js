import { Router } from 'express'
import requireRole from '../middleware/requireRole.js'
import { ALL_ROLES } from '../constants/roles.js'
import barangaysRoutes from '../modules/barangays/barangays.routes.js'
import beneficiariesRoutes from '../modules/beneficiaries/beneficiaries.routes.js'
import collegesRoutes from '../modules/colleges/colleges.routes.js'
import contentRoutes from '../modules/content/content.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'
import filesRoutes from '../modules/files/files.routes.js'
import programsRoutes from '../modules/programs/programs.routes.js'
import referralsRoutes from '../modules/referrals/referrals.routes.js'
import reportsRoutes from '../modules/reports/reports.routes.js'
import serviceRecordsRoutes from '../modules/service-records/serviceRecords.routes.js'
import usersRoutes from '../modules/users/users.routes.js'

const router = Router()

// requireAuth is applied in app.js; every portal role may enter the admin area,
// and each module restricts itself further.
router.use(requireRole(...ALL_ROLES))

router.use('/barangays', barangaysRoutes)
router.use('/beneficiaries', beneficiariesRoutes)
router.use('/colleges', collegesRoutes)
router.use('/content', contentRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/files', filesRoutes)
router.use('/programs', programsRoutes)
router.use('/referrals', referralsRoutes)
router.use('/reports', reportsRoutes)
router.use('/service-records', serviceRecordsRoutes)
router.use('/users', usersRoutes)

export default router
