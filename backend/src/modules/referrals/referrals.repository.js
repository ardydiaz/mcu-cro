import { db } from '../../config/db.js'
import { beneficiarySearch, toCode as beneficiaryCode } from '../beneficiaries/beneficiaries.repository.js'
import { toCode as serviceCode } from '../service-records/serviceRecords.repository.js'

// Referral number shown to people: REF-000123.
export const toCode = (id) => `REF-${String(id).padStart(6, '0')}`

const SELECT = `SELECT r.*, b.first_name, b.middle_name, b.last_name, b.suffix,
                       c.code AS college_code, c.name AS college_name,
                       tc.code AS to_college_code, tc.name AS to_college_name,
                       s.service_date, s.service_type,
                       cu.name AS created_by_name, uu.name AS updated_by_name
                FROM referrals r
                JOIN beneficiaries b ON b.id = r.beneficiary_id AND b.deleted_at IS NULL
                JOIN colleges c ON c.id = r.college_id
                LEFT JOIN colleges tc ON tc.id = r.referred_to_college_id
                LEFT JOIN service_records s ON s.id = r.service_record_id AND s.deleted_at IS NULL
                LEFT JOIN users cu ON cu.id = r.created_by
                LEFT JOIN users uu ON uu.id = r.updated_by`

const toReferral = (row) =>
  row && {
    id: row.id,
    code: toCode(row.id),
    beneficiary: {
      id: row.beneficiary_id,
      code: beneficiaryCode(row.beneficiary_id),
      name: [row.first_name, row.middle_name, row.last_name, row.suffix].filter(Boolean).join(' '),
    },
    serviceRecord: row.service_date
      ? { id: row.service_record_id, code: serviceCode(row.service_record_id), serviceDate: row.service_date, serviceType: row.service_type }
      : null,
    referralDate: row.referral_date,
    college: { id: row.college_id, code: row.college_code, name: row.college_name },
    referredToCollege: row.referred_to_college_id
      ? { id: row.referred_to_college_id, code: row.to_college_code, name: row.to_college_name }
      : null,
    referredToFacility: row.referred_to_facility,
    reason: row.reason,
    urgency: row.urgency,
    status: row.status,
    outcome: row.outcome,
    createdByName: row.created_by_name,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

const COLUMNS = {
  beneficiaryId: 'beneficiary_id',
  serviceRecordId: 'service_record_id',
  referralDate: 'referral_date',
  collegeId: 'college_id',
  referredToCollegeId: 'referred_to_college_id',
  referredToFacility: 'referred_to_facility',
  reason: 'reason',
  urgency: 'urgency',
  status: 'status',
  outcome: 'outcome',
}
const fieldsOf = (data) => Object.entries(data).filter(([key, value]) => key in COLUMNS && value !== undefined)

// `scope` (from recordScopeOf): College/Department users see referrals from or to
// their college; coordinators the referrals of their barangays' beneficiaries.
function scopeConditions(scope, add) {
  if (scope?.collegeId) add('(r.college_id = ? OR r.referred_to_college_id = ?)', scope.collegeId, scope.collegeId)
  if (scope?.beneficiary) add(scope.beneficiary.sql, ...scope.beneficiary.params)
}

export async function findById(id, scope = null) {
  const where = ['r.id = ?', 'r.deleted_at IS NULL']
  const params = [id]
  scopeConditions(scope, (sql, ...values) => where.push(sql) && params.push(...values))
  const [rows] = await db.query(`${SELECT} WHERE ${where.join(' AND ')} LIMIT 1`, params)
  return toReferral(rows[0])
}

export async function list({ search, beneficiaryId, serviceRecordId, collegeId, status, urgency, page, pageSize }, scope = null) {
  const where = ['r.deleted_at IS NULL', 'b.deleted_at IS NULL']
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
  if (beneficiaryId) add('r.beneficiary_id = ?', beneficiaryId)
  if (serviceRecordId) add('r.service_record_id = ?', serviceRecordId)
  if (collegeId) add('(r.college_id = ? OR r.referred_to_college_id = ?)', collegeId, collegeId)
  if (status === 'open') add("r.status IN ('pending', 'in_progress')")
  else if (status) add('r.status = ?', status)
  if (urgency) add('r.urgency = ?', urgency)
  const whereSql = where.join(' AND ')

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM referrals r JOIN beneficiaries b ON b.id = r.beneficiary_id WHERE ${whereSql}`,
    params,
  )
  // Open and urgent referrals first, then newest.
  const [rows] = await db.query(
    `${SELECT} WHERE ${whereSql}
     ORDER BY r.status IN ('pending', 'in_progress') DESC, FIELD(r.urgency, 'emergency', 'urgent', 'routine'), r.referral_date DESC, r.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  )
  return { items: rows.map(toReferral), total: Number(total), page, pageSize }
}

export async function create(data, actorId) {
  const fields = fieldsOf(data)
  const columns = [...fields.map(([key]) => COLUMNS[key]), 'created_by', 'updated_by']
  const [result] = await db.execute(
    `INSERT INTO referrals (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    [...fields.map(([, value]) => value), actorId, actorId],
  )
  return findById(result.insertId)
}

export async function update(id, changes, actorId) {
  const fields = fieldsOf(changes)
  if (fields.length > 0) {
    const set = [...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_by = ?'].join(', ')
    await db.execute(`UPDATE referrals SET ${set} WHERE id = ? AND deleted_at IS NULL`, [...fields.map(([, v]) => v), actorId, id])
  }
  return findById(id)
}

export async function remove(id, actorId) {
  await db.execute('UPDATE referrals SET deleted_at = CURRENT_TIMESTAMP(3), updated_by = ? WHERE id = ?', [actorId, id])
}

export async function countOpen(scope = null) {
  const where = ['r.deleted_at IS NULL', "r.status IN ('pending', 'in_progress')"]
  const params = []
  scopeConditions(scope, (sql, ...values) => where.push(sql) && params.push(...values))
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM referrals r JOIN beneficiaries b ON b.id = r.beneficiary_id AND b.deleted_at IS NULL
     WHERE ${where.join(' AND ')}`,
    params,
  )
  return Number(total)
}
