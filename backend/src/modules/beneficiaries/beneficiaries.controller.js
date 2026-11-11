import { audit, diff } from '../../middleware/auditLog.js'
import * as service from './beneficiaries.service.js'

// Audit entries name the changed fields but never copy personal data into the log.

export async function list(req, res) {
  res.json(await service.list(req.validated.query))
}

// Viewing a full profile is logged: access logs for personal data (requirements Step 9).
export async function get(req, res) {
  const beneficiary = await service.get(req.validated.params.id)
  await audit(req, 'beneficiary.view', { entityType: 'beneficiary', entityId: beneficiary.id })
  res.json(beneficiary)
}

export async function create(req, res) {
  const beneficiary = await service.create(req.body, req.user)
  await audit(req, 'beneficiary.create', { entityType: 'beneficiary', entityId: beneficiary.id, details: { code: beneficiary.code } })
  res.status(201).json(beneficiary)
}

export async function update(req, res) {
  const { before, after } = await service.update(req.validated.params.id, req.body, req.user)
  const fields = Object.keys(diff(before, after)).filter((key) => !['updatedByName'].includes(key))
  await audit(req, 'beneficiary.update', { entityType: 'beneficiary', entityId: after.id, details: { code: after.code, fields } })
  res.json(after)
}

export async function remove(req, res) {
  const beneficiary = await service.remove(req.validated.params.id, req.user)
  await audit(req, 'beneficiary.delete', { entityType: 'beneficiary', entityId: beneficiary.id, details: { code: beneficiary.code } })
  res.status(204).end()
}
