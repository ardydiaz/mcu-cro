import { db } from '../../config/db.js'

export async function insert(entry) {
  await db.execute(
    `INSERT INTO audit_logs (user_id, actor_email, action, entity_type, entity_id, details, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId ?? null,
      entry.actorEmail ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ip ?? null,
      entry.userAgent?.slice(0, 255) ?? null,
    ],
  )
}
