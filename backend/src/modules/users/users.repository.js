import { randomUUID } from 'node:crypto'
import { db } from '../../config/db.js'

const SELECT = `SELECT u.id, u.email, u.name, u.role, u.college_id, u.is_active, u.entra_oid, u.token_version,
                       u.last_login_at, u.created_at, u.updated_at, c.code AS college_code, c.name AS college_name
                FROM users u LEFT JOIN colleges c ON c.id = u.college_id`

// Database row → object. entraOid and tokenVersion stay internal (sign-in and
// session checks only) and are stripped by toPublic before reaching the API.
const toUser = (row) =>
  row && {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    college: row.college_id ? { id: row.college_id, code: row.college_code, name: row.college_name } : null,
    isActive: Boolean(row.is_active),
    entraOid: row.entra_oid,
    tokenVersion: row.token_version,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

const toPublic = ({ entraOid, tokenVersion, ...user }) => user // eslint-disable-line no-unused-vars

async function findOne(where, value) {
  const [rows] = await db.execute(`${SELECT} WHERE u.${where} = ? LIMIT 1`, [value])
  return toUser(rows[0])
}

export const findById = (id) => findOne('id', id)
export const findByEmail = (email) => findOne('email', email)
export const findByEntraOid = (entraOid) => findOne('entra_oid', entraOid)

export async function list({ search } = {}) {
  const like = `%${search ?? ''}%`
  const [rows] = await db.execute(
    `${SELECT}
     WHERE ? = '' OR u.email LIKE ? OR u.name LIKE ?
     ORDER BY u.is_active DESC, u.name IS NULL, u.name, u.email`,
    [search ?? '', like, like],
  )
  return withBarangays(rows.map((row) => toPublic(toUser(row))))
}

// Adds `barangays` (a coordinator's assigned barangays) to each user.
export async function withBarangays(users) {
  if (users.length === 0) return users
  const [rows] = await db.query(
    `SELECT ub.user_id, g.id, g.name, g.city FROM user_barangays ub JOIN barangays g ON g.id = ub.barangay_id
     WHERE ub.user_id IN (?) ORDER BY g.name`,
    [users.map((u) => u.id)],
  )
  return users.map((u) => ({
    ...u,
    barangays: rows.filter((r) => r.user_id === u.id).map((r) => ({ id: r.id, name: r.name, city: r.city })),
  }))
}

export async function setBarangays(userId, barangayIds) {
  await db.execute('DELETE FROM user_barangays WHERE user_id = ?', [userId])
  if (barangayIds.length > 0) {
    await db.query('INSERT INTO user_barangays (user_id, barangay_id) VALUES ?', [barangayIds.map((id) => [userId, id])])
  }
}

export async function create({ email, name = null, role, collegeId = null }) {
  const id = randomUUID()
  await db.execute('INSERT INTO users (id, email, name, role, college_id) VALUES (?, ?, ?, ?, ?)', [
    id,
    email,
    name,
    role,
    collegeId,
  ])
  return toPublic(await findById(id))
}

// Only these fields can be changed; keys map API names → columns.
const UPDATABLE = {
  name: 'name',
  role: 'role',
  collegeId: 'college_id',
  isActive: 'is_active',
  entraOid: 'entra_oid',
  lastLoginAt: 'last_login_at',
}

// Returns the full internal user (callers decide what to expose).
export async function update(id, changes) {
  const fields = Object.entries(changes).filter(([key, value]) => key in UPDATABLE && value !== undefined)
  if (fields.length > 0) {
    const set = fields.map(([key]) => `${UPDATABLE[key]} = ?`).join(', ')
    await db.execute(`UPDATE users SET ${set} WHERE id = ?`, [...fields.map(([, value]) => value), id])
  }
  return findById(id)
}

export { toPublic }

// Invalidates every token issued to this user so far.
export async function bumpTokenVersion(id) {
  await db.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [id])
}

export async function remove(id) {
  await db.execute('DELETE FROM users WHERE id = ?', [id])
}

export async function countActive(role) {
  const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM users WHERE role = ? AND is_active = TRUE', [role])
  return Number(total)
}
