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

export async function list({ status, page, pageSize }) {
  const where = status ? 'WHERE i.status = ?' : ''
  const params = status ? [status] : []
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM inquiries i ${where}`, params)
  const [rows] = await db.query(`${SELECT} ${where} ORDER BY i.status = 'new' DESC, i.created_at DESC LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    (page - 1) * pageSize,
  ])
  return { items: rows.map(toInquiry), total: Number(total), page, pageSize }
}

export async function setStatus(id, status, actorId) {
  await db.execute('UPDATE inquiries SET status = ?, handled_by = ?, handled_at = ? WHERE id = ?', [
    status,
    status === 'new' ? null : actorId,
    status === 'new' ? null : new Date(),
    id,
  ])
  const [rows] = await db.query(`${SELECT} WHERE i.id = ?`, [id])
  return toInquiry(rows[0])
}

export async function countNew() {
  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM inquiries WHERE status = 'new'")
  return Number(total)
}
