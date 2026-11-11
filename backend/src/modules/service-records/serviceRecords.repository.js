import { db } from '../../config/db.js'
import { beneficiarySearch, toCode as beneficiaryCode } from '../beneficiaries/beneficiaries.repository.js'

// Service record number shown to people: SR-000123.
export const toCode = (id) => `SR-${String(id).padStart(6, '0')}`

const SELECT = `SELECT s.*, b.first_name, b.middle_name, b.last_name, b.suffix, b.birth_date, b.sex,
                       p.name AS program_name, c.code AS college_code, c.name AS college_name,
                       cu.name AS created_by_name, uu.name AS updated_by_name,
                       (SELECT COUNT(*) FROM referrals r WHERE r.service_record_id = s.id AND r.deleted_at IS NULL) AS referral_count
                FROM service_records s
                JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
                JOIN colleges c ON c.id = s.college_id
                LEFT JOIN programs p ON p.id = s.program_id
                LEFT JOIN users cu ON cu.id = s.created_by
                LEFT JOIN users uu ON uu.id = s.updated_by`

const toRecord = (row) =>
  row && {
    id: row.id,
    code: toCode(row.id),
    beneficiary: {
      id: row.beneficiary_id,
      code: beneficiaryCode(row.beneficiary_id),
      name: [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' '),
      birthDate: row.birth_date,
      sex: row.sex,
    },
    serviceDate: row.service_date,
    program: row.program_id ? { id: row.program_id, name: row.program_name } : null,
    college: { id: row.college_id, code: row.college_code, name: row.college_name },
    serviceType: row.service_type,
    findings: row.findings,
    intervention: row.intervention,
    recommendation: row.recommendation,
    followUpDate: row.follow_up_date,
    followUpStatus: row.follow_up_status,
    referralCount: Number(row.referral_count),
    createdByName: row.created_by_name,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

const COLUMNS = {
  beneficiaryId: 'beneficiary_id',
  serviceDate: 'service_date',
  programId: 'program_id',
  collegeId: 'college_id',
  serviceType: 'service_type',
  findings: 'findings',
  intervention: 'intervention',
  recommendation: 'recommendation',
  followUpDate: 'follow_up_date',
  followUpStatus: 'follow_up_status',
}
const fieldsOf = (data) => Object.entries(data).filter(([key, value]) => key in COLUMNS && value !== undefined)

// `scope` (from recordScopeOf): College/Department users see their own college's
// records; coordinators the records of their barangays' beneficiaries.
function scopeConditions(scope, add) {
  if (scope?.collegeId) add('s.college_id = ?', scope.collegeId)
  if (scope?.beneficiary) add(scope.beneficiary.sql, ...scope.beneficiary.params)
}

export async function findById(id, scope = null) {
  const where = ['s.id = ?', 's.deleted_at IS NULL']
  const params = [id]
  scopeConditions(scope, (sql, ...values) => where.push(sql) && params.push(...values))
  const [rows] = await db.query(`${SELECT} WHERE ${where.join(' AND ')} LIMIT 1`, params)
  return toRecord(rows[0])
}

export async function list({ search, beneficiaryId, collegeId, programId, serviceType, followUpStatus, page, pageSize }, scope = null) {
  const where = ['s.deleted_at IS NULL', 'b.deleted_at IS NULL']
  const params = []
  const add = (sql, ...values) => {
    where.push(sql)
    params.push(...values)
  }
  scopeConditions(scope, add)
  if (search) {
    const match = beneficiarySearch(search)
    add(match.sql, ...match.params)
  }
  if (beneficiaryId) add('s.beneficiary_id = ?', beneficiaryId)
  if (collegeId) add('s.college_id = ?', collegeId)
  if (programId) add('s.program_id = ?', programId)
  if (serviceType) add('s.service_type = ?', serviceType)
  if (followUpStatus) add('s.follow_up_status = ?', followUpStatus)
  const whereSql = where.join(' AND ')

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id WHERE ${whereSql}`,
    params,
  )
  const [rows] = await db.query(`${SELECT} WHERE ${whereSql} ORDER BY s.service_date DESC, s.id DESC LIMIT ? OFFSET ?`, [
    ...params,
    pageSize,
    (page - 1) * pageSize,
  ])
  return { items: rows.map(toRecord), total: Number(total), page, pageSize }
}

export async function create(data, actorId) {
  const fields = fieldsOf(data)
  const columns = [...fields.map(([key]) => COLUMNS[key]), 'created_by', 'updated_by']
  const [result] = await db.execute(
    `INSERT INTO service_records (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    [...fields.map(([, value]) => value), actorId, actorId],
  )
  return findById(result.insertId)
}

export async function update(id, changes, actorId) {
  const fields = fieldsOf(changes)
  if (fields.length > 0) {
    const set = [...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_by = ?'].join(', ')
    await db.execute(`UPDATE service_records SET ${set} WHERE id = ? AND deleted_at IS NULL`, [...fields.map(([, v]) => v), actorId, id])
  }
  return findById(id)
}

export async function remove(id, actorId) {
  await db.execute('UPDATE service_records SET deleted_at = CURRENT_TIMESTAMP(3), updated_by = ? WHERE id = ?', [actorId, id])
}
