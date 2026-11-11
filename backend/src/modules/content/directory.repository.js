// Public descriptions of colleges, programs and partner barangays (Colleges/
// Departments, Programs and Services, and Partner Communities pages).
import { db } from '../../config/db.js'

const lines = (text) => (text ? text.split('\n').map((s) => s.trim()).filter(Boolean) : [])

export async function colleges() {
  const [rows] = await db.query('SELECT id, code, name, slug, description, services_offered FROM colleges WHERE is_active = TRUE ORDER BY sort_order')
  return rows.map((c) => ({ id: c.id, code: c.code, name: c.name, slug: c.slug, description: c.description, servicesOffered: lines(c.services_offered) }))
}

export async function programs() {
  const [rows] = await db.query('SELECT id, name, description, is_featured FROM programs WHERE is_active = TRUE ORDER BY is_featured DESC, name')
  return rows.map((p) => ({ id: p.id, name: p.name, description: p.description, isFeatured: Boolean(p.is_featured) }))
}

export async function barangays() {
  const [rows] = await db.query('SELECT id, name, city, description, is_partner FROM barangays WHERE is_active = TRUE ORDER BY name')
  return rows.map((b) => ({ id: b.id, name: b.name, city: b.city, description: b.description, isPartner: Boolean(b.is_partner) }))
}

export async function updateCollege(id, { description, servicesOffered }) {
  await db.execute('UPDATE colleges SET description = ?, services_offered = ? WHERE id = ?', [description ?? null, servicesOffered ?? null, id])
  return (await colleges()).find((c) => c.id === id)
}

export async function updateProgram(id, { description, isFeatured }) {
  await db.execute('UPDATE programs SET description = ?, is_featured = COALESCE(?, is_featured) WHERE id = ?', [description ?? null, isFeatured ?? null, id])
  return (await programs()).find((p) => p.id === id)
}

export async function updateBarangay(id, { description, isPartner }) {
  await db.execute('UPDATE barangays SET description = ?, is_partner = COALESCE(?, is_partner) WHERE id = ?', [description ?? null, isPartner ?? null, id])
  return (await barangays()).find((b) => b.id === id)
}
