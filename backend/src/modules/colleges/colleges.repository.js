import { db } from '../../config/db.js'

const toCollege = (row) => row && { id: row.id, code: row.code, name: row.name, slug: row.slug }

export async function listActive() {
  const [rows] = await db.execute('SELECT id, code, name, slug FROM colleges WHERE is_active = TRUE ORDER BY sort_order, name')
  return rows.map(toCollege)
}

export async function findById(id) {
  const [rows] = await db.execute('SELECT id, code, name, slug FROM colleges WHERE id = ? AND is_active = TRUE LIMIT 1', [id])
  return toCollege(rows[0])
}

export async function findByCode(code) {
  const [rows] = await db.execute('SELECT id, code, name, slug FROM colleges WHERE code = ? AND is_active = TRUE LIMIT 1', [code])
  return toCollege(rows[0])
}
