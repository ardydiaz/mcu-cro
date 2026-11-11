import { db } from '../../config/db.js'

const toInquiry = (row) =>
  row && {
    id: row.id,
    topic: row.topic,
    name: row.name,
    email: row.email,
    phone: row.phone,
    organization: row.organization,
    message: row.message,
    status: row.status,
    handledByName: row.handled_by_name,
    handledAt: row.handled_at,
    createdAt: row.created_at,
  }

const SELECT = 'SELECT i.*, u.name AS handled_by_name FROM inquiries i LEFT JOIN users u ON u.id = i.handled_by'

export async function create({ topic, name, email, phone, organization, message }, ip) {
  const [result] = await db.execute(
    'INSERT INTO inquiries (topic, name, email, phone, organization, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [topic, name, email, phone ?? null, organization ?? null, message, ip ?? null],
  )
  return result.insertId
}

// Without a status filter, messages marked as spam are left out.
export async function list({ status, page, pageSize }) {
  const where = status ? 'WHERE i.status = ?' : "WHERE i.status <> 'spam'"
  const params = status ? [status] : []
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM inquiries i ${where}`, params)
  const [rows] = await db.query(`${SELECT} ${where} ORDER BY i.status = 'new' DESC, i.created_at DESC LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    (page - 1) * pageSize,
  ])
  return { items: rows.map(toInquiry), total: Number(total), page, pageSize }
}

export async function findById(id) {
  const [rows] = await db.query(`${SELECT} WHERE i.id = ?`, [id])
  return toInquiry(rows[0])
}

export async function setStatus(id, status, actorId) {
  await db.execute('UPDATE inquiries SET status = ?, handled_by = ?, handled_at = ? WHERE id = ?', [
    status,
    status === 'new' ? null : actorId,
    status === 'new' ? null : new Date(),
    id,
  ])
  return findById(id)
}

// ---------- Spam ----------
// Marking a message as spam blocks its sender and moves their other new messages to spam too.
export async function markSpam(id, actorId) {
  const message = await findById(id)
  if (!message) return null
  await db.execute('INSERT IGNORE INTO blocked_senders (email, blocked_by) VALUES (?, ?)', [message.email, actorId])
  await db.execute("UPDATE inquiries SET status = 'spam', handled_by = ?, handled_at = ? WHERE email = ? AND status IN ('new', 'spam')", [
    actorId,
    new Date(),
    message.email,
  ])
  await setStatus(id, 'spam', actorId) // also when it was handled or archived
  return findById(id)
}

// "Not spam": unblocks the sender and puts the message back as new.
export async function unmarkSpam(id) {
  const message = await findById(id)
  if (!message) return null
  await db.execute('DELETE FROM blocked_senders WHERE email = ?', [message.email])
  return setStatus(id, 'new', null)
}

export async function isBlocked(email) {
  const [rows] = await db.execute('SELECT 1 FROM blocked_senders WHERE email = ? LIMIT 1', [email])
  return rows.length > 0
}

// The same email sent the same message in the last 24 hours (e.g. pressing Send twice).
export async function isRecentDuplicate(email, message) {
  const [rows] = await db.execute(
    'SELECT 1 FROM inquiries WHERE email = ? AND message = ? AND created_at > UTC_TIMESTAMP(3) - INTERVAL 1 DAY LIMIT 1',
    [email, message],
  )
  return rows.length > 0
}

export async function countNew() {
  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM inquiries WHERE status = 'new'")
  return Number(total)
}
