import { Router } from 'express'
import { db } from '../../config/db.js'
import { beneficiaryScopeOf, recordScopeOf } from '../../middleware/applyScope.js'
import { todayInManila } from '../../validators/common.js'
import * as beneficiariesRepo from '../beneficiaries/beneficiaries.repository.js'
import * as referralsRepo from '../referrals/referrals.repository.js'

// Mounted at /api/admin/dashboard. Key figures for the dashboard cards, limited
// to what the user may see (college users: their college; coordinators: their barangays).
const router = Router()

router.get('/', async (req, res) => {
  const scope = recordScopeOf(req.user)
  const today = todayInManila()
  const monthStart = `${today.slice(0, 8)}01`
  const inAWeek = new Date(Date.parse(`${today}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
  const scopeSql = [scope.collegeId && 'AND s.college_id = ?', scope.beneficiary && `AND ${scope.beneficiary.sql}`].filter(Boolean).join(' ')
  const scopeParams = [...(scope.collegeId ? [scope.collegeId] : []), ...(scope.beneficiary?.params ?? [])]

  const [[services]] = await db.query(
    `SELECT COUNT(*) AS total FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     WHERE s.deleted_at IS NULL AND s.service_date >= ? ${scopeSql}`,
    [monthStart, ...scopeParams],
  )
  // Scheduled follow-ups due within 7 days, including overdue ones.
  const [[followUps]] = await db.query(
    `SELECT COUNT(*) AS total FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     WHERE s.deleted_at IS NULL AND s.follow_up_status = 'scheduled' AND s.follow_up_date <= ? ${scopeSql}`,
    [inAWeek, ...scopeParams],
  )

  res.json({
    beneficiaries: await beneficiariesRepo.countActive(beneficiaryScopeOf(req.user)),
    servicesThisMonth: Number(services.total),
    openReferrals: await referralsRepo.countOpen(scope),
    followUpsDue: Number(followUps.total),
  })
})

export default router
