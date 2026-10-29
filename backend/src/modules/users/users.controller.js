import { audit, diff } from '../../middleware/auditLog.js'
import * as service from './users.service.js'

export async function list(req, res) {
  res.json(await service.list(req.validated?.query))
}

export async function create(req, res) {
  const user = await service.create(req.body)
  await audit(req, 'user.create', { entityType: 'user', entityId: user.id, details: { email: user.email, role: user.role } })
  res.status(201).json(user)
}

export async function update(req, res) {
  const { before, after } = await service.update(req.params.id, req.body, req.user)
  await audit(req, 'user.update', { entityType: 'user', entityId: after.id, details: { email: after.email, changes: diff(before, after) } })
  res.json(after)
}

export async function remove(req, res) {
  const user = await service.remove(req.params.id, req.user)
  await audit(req, 'user.delete', { entityType: 'user', entityId: user.id, details: { email: user.email, role: user.role } })
  res.status(204).end()
}
