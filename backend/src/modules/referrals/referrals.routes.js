import { Router } from 'express'
import { audit, diff } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { RECORD_MANAGERS, SERVICE_EDITORS } from '../../constants/roles.js'
import { idParamSchema } from '../../validators/common.js'
import { createReferralSchema, listReferralsSchema, updateReferralSchema } from '../../validators/referrals.js'
import * as service from './referrals.service.js'

// Mounted at /api/admin/referrals. Everyone can view (college users: referrals
// from or to their college); editors and college users create and update;
// administrators remove. Audit entries name changed fields, never health details.
const router = Router()
const byId = validate(idParamSchema, 'params')
const entity = (referral) => ({ entityType: 'referral', entityId: referral.id })

router.get('/', validate(listReferralsSchema, 'query'), async (req, res) => {
  res.json(await service.list(req.validated.query, req.user))
})

router.get('/:id', byId, async (req, res) => {
  const referral = await service.get(req.validated.params.id, req.user)
  await audit(req, 'referral.view', entity(referral))
  res.json(referral)
})

router.post('/', requireRole(...SERVICE_EDITORS), validate(createReferralSchema), async (req, res) => {
  const referral = await service.create(req.body, req.user)
  await audit(req, 'referral.create', { ...entity(referral), details: { code: referral.code, beneficiary: referral.beneficiary.code } })
  res.status(201).json(referral)
})

router.patch('/:id', requireRole(...SERVICE_EDITORS), byId, validate(updateReferralSchema), async (req, res) => {
  const { before, after } = await service.update(req.validated.params.id, req.body, req.user)
  const fields = Object.keys(diff(before, after)).filter((key) => !['updatedByName'].includes(key))
  await audit(req, 'referral.update', { ...entity(after), details: { code: after.code, fields, status: after.status } })
  res.json(after)
})

router.delete('/:id', requireRole(...RECORD_MANAGERS), byId, async (req, res) => {
  const referral = await service.remove(req.validated.params.id, req.user)
  await audit(req, 'referral.delete', { ...entity(referral), details: { code: referral.code } })
  res.status(204).end()
})

export default router
