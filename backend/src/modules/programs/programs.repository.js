import { db } from '../../config/db.js'

const toProgram = (row) => row && { id: row.id, name: row.name }

export async function listActive() {
  const [rows] = await db.execute('SELECT id, name FROM programs WHERE is_active = TRUE ORDER BY name')
  return rows.map(toProgram)
}

export async function findById(id) {
  const [rows] = await db.execute('SELECT id, name FROM programs WHERE id = ? AND is_active = TRUE LIMIT 1', [id])
  return toProgram(rows[0])
}

export async function findByName(name) {
  const [rows] = await db.execute('SELECT id, name FROM programs WHERE name = ? LIMIT 1', [name])
  return toProgram(rows[0])
}

export async function create({ name }) {
  const [result] = await db.execute('INSERT INTO programs (name) VALUES (?)', [name])
  return findById(result.insertId)
}
