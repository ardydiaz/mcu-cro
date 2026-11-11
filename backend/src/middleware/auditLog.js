import * as auditRepo from '../modules/audit/audit.repository.js'

// Records an action in audit_logs. Call after the action succeeds:
//   await audit(req, 'user.update', { entityType: 'user', entityId: id, details: { changes } })
// The actor defaults to req.user; pass `actor` for sign-in events. Logging
// failures are reported but never break the request.
export async function audit(req, action, { entityType, entityId, details, actor = req.user } = {}) {
  try {
    await auditRepo.insert({
      userId: actor?.id,
      actorEmail: actor?.email,
      action,
      entityType,
      entityId,
      details,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })
  } catch (err) {
    console.error(`Audit log failed for "${action}":`, err)
  }
}

// Fields that changed between two versions of a record: { field: { from, to } }.
export function diff(before, after) {
  return Object.fromEntries(
    Object.keys(after)
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]) && !['updatedAt'].includes(key))
      .map((key) => [key, { from: before[key], to: after[key] }]),
  )
}
