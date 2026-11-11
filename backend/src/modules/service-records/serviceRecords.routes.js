import { Router } from 'express'
import { audit, diff } from '../../middleware/auditLog.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { RECORD_MANAGERS, SERVICE_EDITORS } from '../../constants/roles.js'
import { idParamSchema } from '../../validators/common.js'
import {
  createServiceRecordSchema,
  listServiceRecordsSchema,
  updateServiceRecordSchema,
} from '../../validators/serviceRecords.js'
import * as service from './serviceRecords.service.js'

// Mounted at /api/admin/service-records. Everyone can view (college users: their
// college only); editors and college users record services; administrators remove.
// Audit entries name the changed fields but never copy health information.
const router = Router()
const byId = validate(idParamSchema, 'params')
const entity = (record) => ({ entityType: 'service_record', entityId: record.id })

router.get('/', validate(listServiceRecordsSchema, 'query'), async (req, res) => {
  res.json(await service.list(req.validated.query, req.user))
})

router.get('/:id', byId, async (req, res) => {
  const record = await service.get(req.validated.params.id, req.user)
  await audit(req, 'service_record.view', entity(record))
  res.json(record)
})

router.post('/', requireRole(...SERVICE_EDITORS), validate(createServiceRecordSchema), async (req, res) => {
  const record = await service.create(req.body, req.user)
  await audit(req, 'service_record.create', { ...entity(record), details: { code: record.code, beneficiary: record.beneficiary.code } })
  res.status(201).json(record)
})

router.patch('/:id', requireRole(...SERVICE_EDITORS), byId, validate(updateServiceRecordSchema), async (req, res) => {
  const { before, after } = await service.update(req.validated.params.id, req.body, req.user)
  const fields = Object.keys(diff(before, after)).filter((key) => !['updatedByName'].includes(key))
  await audit(req, 'service_record.update', { ...entity(after), details: { code: after.code, fields } })
  res.json(after)
})

router.delete('/:id', requireRole(...RECORD_MANAGERS), byId, async (req, res) => {
  const record = await service.remove(req.validated.params.id, req.user)
  await audit(req, 'service_record.delete', { ...entity(record), details: { code: record.code } })
  res.status(204).end()
})

export default router
