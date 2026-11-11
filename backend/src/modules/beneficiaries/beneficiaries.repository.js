import { db } from '../../config/db.js'

// Beneficiary ID shown to people: BEN-000123.
export const toCode = (id) => `BEN-${String(id).padStart(6, '0')}`
const CODE_PATTERN = /^(?:BEN-?)?0*(\d{1,9})$/i

const SELECT = `SELECT b.*, g.name AS barangay_name, g.city AS barangay_city,
                       cu.name AS created_by_name, uu.name AS updated_by_name
                FROM beneficiaries b
                JOIN barangays g ON g.id = b.barangay_id
                LEFT JOIN users cu ON cu.id = b.created_by
                LEFT JOIN users uu ON uu.id = b.updated_by`

const toBeneficiary = (row) =>
  row && {
    id: row.id,
    code: toCode(row.id),
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    suffix: row.suffix,
    birthDate: row.birth_date,
    sex: row.sex,
    civilStatus: row.civil_status,
    barangay: { id: row.barangay_id, name: row.barangay_name, city: row.barangay_city },
    address: row.address,
    contactNumber: row.contact_number,
    email: row.email,
    householdSize: row.household_size,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactNumber: row.emergency_contact_number,
    occupation: row.occupation,
    education: row.education,
    isPwd: Boolean(row.is_pwd),
    notes: row.notes,
    consentAt: row.consent_at,
    createdByName: row.created_by_name,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

// API field → column, for inserts and updates.
const COLUMNS = {
  firstName: 'first_name',
  middleName: 'middle_name',
  lastName: 'last_name',
  suffix: 'suffix',
  birthDate: 'birth_date',
  sex: 'sex',
  civilStatus: 'civil_status',
  barangayId: 'barangay_id',
  address: 'address',
  contactNumber: 'contact_number',
  email: 'email',
  householdSize: 'household_size',
  emergencyContactName: 'emergency_contact_name',
  emergencyContactNumber: 'emergency_contact_number',
  occupation: 'occupation',
  education: 'education',
  isPwd: 'is_pwd',
  notes: 'notes',
}

const fieldsOf = (data) => Object.entries(data).filter(([key, value]) => key in COLUMNS && value !== undefined)

// `scope` (from beneficiaryScopeOf) hides beneficiaries the user may not see.
export async function findById(id, scope = null) {
  const [rows] = await db.query(`${SELECT} WHERE b.id = ? AND b.deleted_at IS NULL${scope ? ` AND ${scope.sql}` : ''} LIMIT 1`, [
    id,
    ...(scope?.params ?? []),
  ])
  const beneficiary = toBeneficiary(rows[0])
  if (beneficiary) beneficiary.colleges = await collegesOf(id)
  return beneficiary
}

// Colleges/departments the beneficiary is assigned to.
export async function collegesOf(id) {
  const [rows] = await db.execute(
    `SELECT c.id, c.code, c.name FROM beneficiary_colleges bc JOIN colleges c ON c.id = bc.college_id
     WHERE bc.beneficiary_id = ? ORDER BY c.sort_order`,
    [id],
  )
  return rows.map((c) => ({ id: c.id, code: c.code, name: c.name }))
}

// Replaces the assigned colleges; existing assignments keep their original date.
export async function setColleges(id, collegeIds, actorId, conn = db) {
  if (collegeIds.length === 0) {
    await conn.execute('DELETE FROM beneficiary_colleges WHERE beneficiary_id = ?', [id])
    return
  }
  await conn.query('DELETE FROM beneficiary_colleges WHERE beneficiary_id = ? AND college_id NOT IN (?)', [id, collegeIds])
  await conn.query('INSERT IGNORE INTO beneficiary_colleges (beneficiary_id, college_id, assigned_by) VALUES ?', [
    collegeIds.map((collegeId) => [id, collegeId, actorId]),
  ])
}

// SQL condition matching a beneficiary (table alias `b`) by name, contact
// number, or Beneficiary ID (BEN-000123 or 123). Also used by service records
// and referrals to search by beneficiary.
export function beneficiarySearch(search) {
  const like = `%${search}%`
  const terms = [
    "CONCAT_WS(' ', b.first_name, b.middle_name, b.last_name) LIKE ?",
    "CONCAT_WS(' ', b.last_name, b.first_name) LIKE ?",
    "CONCAT(b.last_name, ', ', b.first_name) LIKE ?",
    'b.contact_number LIKE ?',
  ]
  const params = [like, like, like, like]
  const code = search.match(CODE_PATTERN)
  if (code) {
    terms.push('b.id = ?')
    params.push(Number(code[1]))
  }
  return { sql: `(${terms.join(' OR ')})`, params }
}

export async function list({ search, barangayId, sex, page, pageSize }, scope = null) {
  const where = ['b.deleted_at IS NULL']
  const params = []
  if (scope) {
    where.push(scope.sql)
    params.push(...scope.params)
  }
  if (search) {
    const match = beneficiarySearch(search)
    where.push(match.sql)
    params.push(...match.params)
  }
  if (barangayId) {
    where.push('b.barangay_id = ?')
    params.push(barangayId)
  }
  if (sex) {
    where.push('b.sex = ?')
    params.push(sex)
  }
  const whereSql = where.join(' AND ')

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM beneficiaries b WHERE ${whereSql}`, params)
  const [rows] = await db.query(`${SELECT} WHERE ${whereSql} ORDER BY b.last_name, b.first_name, b.id LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    (page - 1) * pageSize,
  ])
  return { items: rows.map(toBeneficiary), total: Number(total), page, pageSize }
}

// Same first name, last name and birth date (ignoring case), excluding `excludeId`.
// Returns { id, code } or null.
export async function findDuplicate({ firstName, lastName, birthDate }, excludeId = 0) {
  const [rows] = await db.execute(
    `SELECT id FROM beneficiaries
     WHERE deleted_at IS NULL AND first_name = ? AND last_name = ? AND birth_date = ? AND id <> ?
     LIMIT 1`,
    [firstName, lastName, birthDate, excludeId],
  )
  return rows[0] ? { id: rows[0].id, code: toCode(rows[0].id) } : null
}

// Inserts one profile; pass `conn` to run inside a transaction. Returns the new id.
export async function insert({ collegeIds = [], ...data }, actorId, conn = db) {
  const fields = fieldsOf(data)
  const columns = [...fields.map(([key]) => COLUMNS[key]), 'consent_at', 'created_by', 'updated_by']
  const values = [...fields.map(([, value]) => value), new Date(), actorId, actorId]
  const [result] = await conn.execute(
    `INSERT INTO beneficiaries (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values,
  )
  if (collegeIds.length > 0) await setColleges(result.insertId, collegeIds, actorId, conn)
  return result.insertId
}

export async function create(data, actorId) {
  return findById(await insert(data, actorId))
}

export async function update(id, { collegeIds, ...changes }, actorId) {
  const fields = fieldsOf(changes)
  if (fields.length > 0 || collegeIds) {
    const set = [...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_by = ?'].join(', ')
    await db.execute(`UPDATE beneficiaries SET ${set} WHERE id = ? AND deleted_at IS NULL`, [
      ...fields.map(([, value]) => value),
      actorId,
      id,
    ])
  }
  if (collegeIds) await setColleges(id, collegeIds, actorId)
  return findById(id)
}

// Soft delete: the record leaves every list but stays for history and audit.
export async function remove(id, actorId) {
  await db.execute('UPDATE beneficiaries SET deleted_at = CURRENT_TIMESTAMP(3), updated_by = ? WHERE id = ?', [actorId, id])
}

export async function countActive(scope = null) {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM beneficiaries b WHERE b.deleted_at IS NULL${scope ? ` AND ${scope.sql}` : ''}`,
    scope?.params ?? [],
  )
  return Number(total)
}
