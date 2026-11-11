import { Router } from 'express'
import { db } from '../../config/db.js'
import { collegeScopeOf } from '../../middleware/applyScope.js'
import { todayInManila } from '../../validators/common.js'
import * as beneficiariesRepo from '../beneficiaries/beneficiaries.repository.js'
import * as referralsRepo from '../referrals/referrals.repository.js'

// Mounted at /api/admin/dashboard. Key figures for the dashboard cards; college
// users get the figures of their own college.
const router = Router()

router.get('/', async (req, res) => {
  const scope = collegeScopeOf(req.user)
  const today = todayInManila()
  const monthStart = `${today.slice(0, 8)}01`
  const inAWeek = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
  const collegeSql = scope ? 'AND s.college_id = ?' : ''
  const collegeParams = scope ? [scope] : []

  const [[services]] = await db.query(
    `SELECT COUNT(*) AS total FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     WHERE s.deleted_at IS NULL AND s.service_date >= ? ${collegeSql}`,
    [monthStart, ...collegeParams],
  )
  // Scheduled follow-ups due within 7 days, including overdue ones.
  const [[followUps]] = await db.query(
    `SELECT COUNT(*) AS total FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     WHERE s.deleted_at IS NULL AND s.follow_up_status = 'scheduled' AND s.follow_up_date <= ? ${collegeSql}`,
    [inAWeek, ...collegeParams],
  )

  res.json({
    beneficiaries: await beneficiariesRepo.countActive(),
    servicesThisMonth: Number(services.total),
    openReferrals: await referralsRepo.countOpen(scope),
    followUpsDue: Number(followUps.total),
  })
})

export default router
