// Report queries (requirements Step 7). Every report skips removed records.
import { db } from '../../config/db.js'
import { toCode as beneficiaryCode } from '../beneficiaries/beneficiaries.repository.js'
import { toCode as serviceCode } from '../service-records/serviceRecords.repository.js'

const num = (v) => Number(v ?? 0)
const name = (r) => [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ')
const AGE = (today) => `TIMESTAMPDIFF(YEAR, b.birth_date, '${today}')`

// Collects SQL conditions and their parameters.
function conditions(initial = []) {
  const where = [...initial]
  const params = []
  const add = (sql, ...values) => {
    where.push(sql)
    params.push(...values)
  }
  return { add, where, params, sql: () => where.join(' AND ') }
}

// Services of active beneficiaries within the date range (alias s, joined b).
function serviceScope({ from, to, barangayId, programId, collegeId }) {
  const c = conditions(['s.deleted_at IS NULL', 'b.deleted_at IS NULL'])
  if (from) c.add('s.service_date >= ?', from)
  if (to) c.add('s.service_date <= ?', to)
  if (barangayId) c.add('b.barangay_id = ?', barangayId)
  if (programId === 'none') c.add('s.program_id IS NULL')
  else if (programId) c.add('s.program_id = ?', programId)
  if (collegeId) c.add('s.college_id = ?', collegeId)
  return { sql: c.sql(), params: c.params }
}

// ---------- Report 1: Beneficiaries per barangay ----------
// `from`/`to` filter by registration date.
export async function beneficiariesPerBarangay({ from, to, barangayId }, today) {
  const registered = conditions(['b.deleted_at IS NULL'])
  if (from) registered.add('DATE(b.created_at) >= ?', from)
  if (to) registered.add('DATE(b.created_at) <= ?', to)
  const params = registered.params
  const join = ['b.barangay_id = g.id', ...registered.where]
  const age = AGE(today)
  const [rows] = await db.query(
    `SELECT g.id, g.name, g.city, COUNT(b.id) AS total,
            SUM(b.sex = 'male') AS male, SUM(b.sex = 'female') AS female,
            SUM(${age} < 18) AS minors, SUM(${age} BETWEEN 18 AND 59) AS adults, SUM(${age} >= 60) AS seniors,
            SUM(b.is_pwd) AS pwd
     FROM barangays g LEFT JOIN beneficiaries b ON ${join.join(' AND ')}
     WHERE g.is_active = TRUE
     GROUP BY g.id ORDER BY total DESC, g.name`,
    params,
  )
  const summary = rows.map((r) => ({
    barangay: { id: r.id, name: r.name, city: r.city },
    total: num(r.total),
    male: num(r.male),
    female: num(r.female),
    minors: num(r.minors),
    adults: num(r.adults),
    seniors: num(r.seniors),
    pwd: num(r.pwd),
  }))

  let beneficiaries = null
  if (barangayId) {
    const [list] = await db.query(
      `SELECT b.id, b.first_name, b.middle_name, b.last_name, b.suffix, b.birth_date, b.sex, b.is_pwd, b.created_at,
              (SELECT COUNT(*) FROM service_records s WHERE s.beneficiary_id = b.id AND s.deleted_at IS NULL) AS services
       FROM beneficiaries b WHERE b.barangay_id = ? AND ${registered.sql()}
       ORDER BY b.last_name, b.first_name`,
      [barangayId, ...params],
    )
    beneficiaries = list.map((b) => ({
      id: b.id,
      code: beneficiaryCode(b.id),
      name: name(b),
      birthDate: b.birth_date,
      sex: b.sex,
      isPwd: Boolean(b.is_pwd),
      registeredAt: b.created_at,
      services: num(b.services),
    }))
  }
  return { summary, beneficiaries }
}

// ---------- Report 2: Beneficiaries per program ----------
// `from`/`to` filter by service date.
export async function beneficiariesPerProgram(filters) {
  const scope = serviceScope({ ...filters, programId: undefined })
  const [rows] = await db.query(
    `SELECT s.program_id AS id, p.name, COUNT(DISTINCT s.beneficiary_id) AS beneficiaries, COUNT(*) AS services,
            MIN(s.service_date) AS first_date, MAX(s.service_date) AS last_date
     FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id LEFT JOIN programs p ON p.id = s.program_id
     WHERE ${scope.sql}
     GROUP BY s.program_id, p.name ORDER BY s.program_id IS NULL, beneficiaries DESC, p.name`,
    scope.params,
  )
  const summary = rows.map((r) => ({
    program: r.id ? { id: r.id, name: r.name } : null,
    beneficiaries: num(r.beneficiaries),
    services: num(r.services),
    firstDate: r.first_date,
    lastDate: r.last_date,
  }))

  let beneficiaries = null
  if (filters.programId) {
    const listScope = serviceScope(filters)
    const [list] = await db.query(
      `SELECT b.id, b.first_name, b.middle_name, b.last_name, b.suffix, b.birth_date, b.sex, g.name AS barangay,
              COUNT(*) AS services, MAX(s.service_date) AS last_date
       FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id JOIN barangays g ON g.id = b.barangay_id
       WHERE ${listScope.sql}
       GROUP BY b.id, g.name ORDER BY b.last_name, b.first_name`,
      listScope.params,
    )
    beneficiaries = list.map((b) => ({
      id: b.id,
      code: beneficiaryCode(b.id),
      name: name(b),
      birthDate: b.birth_date,
      sex: b.sex,
      barangay: b.barangay,
      services: num(b.services),
      lastDate: b.last_date,
    }))
  }
  return { summary, beneficiaries }
}

// ---------- Report 3: Services rendered ----------
export async function servicesRendered(filters) {
  const scope = serviceScope({ ...filters, collegeId: undefined })
  const [rows] = await db.query(
    `SELECT c.id, c.code, c.name, s.service_type, COUNT(*) AS services, COUNT(DISTINCT s.beneficiary_id) AS served,
            MIN(s.service_date) AS first_date, MAX(s.service_date) AS last_date
     FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id JOIN colleges c ON c.id = s.college_id
     WHERE ${scope.sql}
     GROUP BY c.id, s.service_type ORDER BY c.sort_order, services DESC`,
    scope.params,
  )
  const summary = rows.map((r) => ({
    college: { id: r.id, code: r.code, name: r.name },
    serviceType: r.service_type,
    services: num(r.services),
    served: num(r.served),
    firstDate: r.first_date,
    lastDate: r.last_date,
  }))

  const all = serviceScope(filters)
  const [months] = await db.query(
    `SELECT DATE_FORMAT(s.service_date, '%Y-%m') AS month, COUNT(*) AS services, COUNT(DISTINCT s.beneficiary_id) AS served
     FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id
     WHERE ${all.sql} GROUP BY month ORDER BY month`,
    all.params,
  )
  const [[totals]] = await db.query(
    `SELECT COUNT(*) AS services, COUNT(DISTINCT s.beneficiary_id) AS served
     FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id WHERE ${all.sql}`,
    all.params,
  )

  let records = null
  if (filters.collegeId) {
    const listScope = all
    const [list] = await db.query(
      `SELECT s.id, s.service_date, s.service_type, b.id AS beneficiary_id, b.first_name, b.middle_name, b.last_name, b.suffix,
              p.name AS program
       FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id LEFT JOIN programs p ON p.id = s.program_id
       WHERE ${listScope.sql} ORDER BY s.service_date DESC, s.id DESC LIMIT 1000`,
      listScope.params,
    )
    records = list.map((s) => ({
      id: s.id,
      code: serviceCode(s.id),
      serviceDate: s.service_date,
      serviceType: s.service_type,
      beneficiary: { id: s.beneficiary_id, code: beneficiaryCode(s.beneficiary_id), name: name(s) },
      program: s.program,
    }))
  }
  return {
    summary,
    months: months.map((m) => ({ month: m.month, services: num(m.services), served: num(m.served) })),
    totals: { services: num(totals.services), served: num(totals.served) },
    records,
  }
}

// ---------- Report 5: Community / program report ----------
export async function communityProgram(filters) {
  const scope = serviceScope(filters)
  const [rows] = await db.query(
    `SELECT g.id AS barangay_id, g.name AS barangay, s.program_id, p.name AS program,
            COUNT(DISTINCT s.beneficiary_id) AS beneficiaries, COUNT(*) AS services,
            COUNT(DISTINCT s.service_date) AS activity_days, MIN(s.service_date) AS first_date, MAX(s.service_date) AS last_date,
            COUNT(DISTINCT s.college_id) AS colleges,
            SUM((SELECT COUNT(*) FROM referrals r WHERE r.service_record_id = s.id AND r.deleted_at IS NULL)) AS referrals,
            SUM(s.follow_up_status = 'scheduled') AS follow_ups_open,
            SUM(s.follow_up_status = 'completed') AS follow_ups_done,
            SUM(s.follow_up_status = 'missed') AS follow_ups_missed
     FROM service_records s
     JOIN beneficiaries b ON b.id = s.beneficiary_id
     JOIN barangays g ON g.id = b.barangay_id
     LEFT JOIN programs p ON p.id = s.program_id
     WHERE ${scope.sql}
     GROUP BY g.id, s.program_id, p.name
     ORDER BY g.name, s.program_id IS NULL, p.name`,
    scope.params,
  )
  return {
    rows: rows.map((r) => ({
      barangay: { id: r.barangay_id, name: r.barangay },
      program: r.program_id ? { id: r.program_id, name: r.program } : null,
      beneficiaries: num(r.beneficiaries),
      services: num(r.services),
      activityDays: num(r.activity_days),
      firstDate: r.first_date,
      lastDate: r.last_date,
      colleges: num(r.colleges),
      referrals: num(r.referrals),
      followUpsOpen: num(r.follow_ups_open),
      followUpsDone: num(r.follow_ups_done),
      followUpsMissed: num(r.follow_ups_missed),
    })),
  }
}
