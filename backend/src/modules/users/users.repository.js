import { randomUUID } from 'node:crypto'
import { db } from '../../config/db.js'

const COLUMNS = 'id, email, name, role, is_active, entra_oid, token_version, last_login_at, created_at, updated_at'

// Database row → object. entraOid and tokenVersion stay internal (sign-in and
// session checks only) and are stripped by toPublic before reaching the API.
const toUser = (row) =>
  row && {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: Boolean(row.is_active),
    entraOid: row.entra_oid,
    tokenVersion: row.token_version,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

const toPublic = ({ entraOid, tokenVersion, ...user }) => user // eslint-disable-line no-unused-vars

async function findOne(where, value) {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM users WHERE ${where} = ? LIMIT 1`, [value])
  return toUser(rows[0])
}

export const findById = (id) => findOne('id', id)
export const findByEmail = (email) => findOne('email', email)
export const findByEntraOid = (entraOid) => findOne('entra_oid', entraOid)

export async function list({ search } = {}) {
  const like = `%${search ?? ''}%`
  const [rows] = await db.execute(
    `SELECT ${COLUMNS} FROM users
     WHERE ? = '' OR email LIKE ? OR name LIKE ?
     ORDER BY is_active DESC, name IS NULL, name, email`,
    [search ?? '', like, like],
  )
  return rows.map((row) => toPublic(toUser(row)))
}

export async function create({ email, name = null, role }) {
  const id = randomUUID()
  await db.execute('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)', [id, email, name, role])
  return toPublic(await findById(id))
}

// Only these fields can be changed; keys map API names → columns.
const UPDATABLE = { name: 'name', role: 'role', isActive: 'is_active', entraOid: 'entra_oid', lastLoginAt: 'last_login_at' }

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

export async function countActiveAdmins() {
  const [[{ total }]] = await db.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = TRUE")
  return Number(total)
}
