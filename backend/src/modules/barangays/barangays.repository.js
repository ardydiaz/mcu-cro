import { db } from '../../config/db.js'

const toBarangay = (row) => row && { id: row.id, name: row.name, city: row.city }

export async function listActive() {
  const [rows] = await db.execute('SELECT id, name, city FROM barangays WHERE is_active = TRUE ORDER BY name, city')
  return rows.map(toBarangay)
}

// Barangays assigned to a Community Coordinator.
export async function listAssigned(userId) {
  const [rows] = await db.execute(
    `SELECT g.id, g.name, g.city FROM user_barangays ub JOIN barangays g ON g.id = ub.barangay_id
     WHERE ub.user_id = ? AND g.is_active = TRUE ORDER BY g.name, g.city`,
    [userId],
  )
  return rows.map(toBarangay)
}

export async function findById(id) {
  const [rows] = await db.execute('SELECT id, name, city FROM barangays WHERE id = ? AND is_active = TRUE LIMIT 1', [id])
  return toBarangay(rows[0])
}

export async function findByNameAndCity(name, city) {
  const [rows] = await db.execute('SELECT id, name, city FROM barangays WHERE name = ? AND city = ? LIMIT 1', [name, city])
  return toBarangay(rows[0])
}

export async function create({ name, city }) {
  const [result] = await db.execute('INSERT INTO barangays (name, city) VALUES (?, ?)', [name, city])
  return findById(result.insertId)
}
