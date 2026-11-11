// Importing beneficiaries from an Excel (.xlsx) or CSV file (requirements
// Project 2, Step 8 – Data Migration). The same file is checked first (nothing
// saved) and then imported; only rows without problems are saved.
import ExcelJS from 'exceljs'
import multer from 'multer'
import { db } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { createBeneficiarySchema } from '../../validators/beneficiaries.js'
import * as barangaysRepo from '../barangays/barangays.repository.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as repo from './beneficiaries.repository.js'

export const MAX_ROWS = 2000
const MAX_BYTES = 5 * 1024 * 1024

export const uploadMiddleware = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } }).single('file')

// Columns of the template. `aliases` are other headings accepted in existing
// files (compared without spaces, punctuation or case).
const COLUMNS = [
  { key: 'lastName', header: 'Last name', required: true, width: 18, aliases: ['surname', 'apelyido'] },
  { key: 'firstName', header: 'First name', required: true, width: 18, aliases: ['givenname', 'pangalan'] },
  { key: 'middleName', header: 'Middle name', width: 16, aliases: ['middleinitial', 'mi'] },
  { key: 'suffix', header: 'Suffix', width: 8, aliases: ['ext', 'extension', 'nameextension'] },
  { key: 'birthDate', header: 'Birth date', required: true, width: 14, aliases: ['dateofbirth', 'birthday', 'dob', 'kaarawan'] },
  { key: 'sex', header: 'Sex', required: true, width: 9, aliases: ['gender', 'kasarian'] },
  { key: 'civilStatus', header: 'Civil status', width: 13, aliases: ['status'] },
  { key: 'barangay', header: 'Barangay', required: true, width: 30, aliases: ['brgy'] },
  { key: 'address', header: 'House no., street, purok', width: 28, aliases: ['address', 'street', 'tirahan'] },
  { key: 'contactNumber', header: 'Contact number', width: 16, aliases: ['contactno', 'mobile', 'mobilenumber', 'mobileno', 'cellphone', 'cellphonenumber', 'phone', 'phonenumber'] },
  { key: 'email', header: 'Email', width: 24, aliases: ['emailaddress'] },
  { key: 'householdSize', header: 'Household size', width: 10, aliases: ['household', 'familysize', 'householdmembers', 'noofhouseholdmembers'] },
  { key: 'occupation', header: 'Occupation', width: 18, aliases: ['work', 'trabaho'] },
  { key: 'education', header: 'Highest education', width: 18, aliases: ['education', 'educationalattainment'] },
  { key: 'isPwd', header: 'PWD', width: 7, aliases: ['ispwd', 'personwithdisability'] },
  { key: 'emergencyContactName', header: 'Emergency contact person', width: 22, aliases: ['emergencycontact', 'emergencycontactname', 'incaseofemergency'] },
  { key: 'emergencyContactNumber', header: 'Emergency contact number', width: 16, aliases: ['emergencynumber', 'emergencycontactno'] },
  { key: 'colleges', header: 'Assigned colleges', width: 18, aliases: ['colleges', 'college', 'collegecodes'] },
  { key: 'notes', header: 'Notes', width: 24, aliases: ['remarks'] },
]
const LABEL = Object.fromEntries(COLUMNS.map((c) => [c.key, c.header]))

const squash = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

const SEX = { male: 'male', m: 'male', lalaki: 'male', female: 'female', f: 'female', babae: 'female' }
const CIVIL = { single: 'single', married: 'married', widowed: 'widowed', widow: 'widowed', widower: 'widowed', separated: 'separated', annulled: 'separated' }
const EDUCATION = [
  ['postgraduate', ['postgraduate', 'masters', 'doctorate', 'graduateschool']],
  ['senior_high', ['seniorhigh', 'shs', 'grade12', 'grade11']],
  ['high_school', ['highschool', 'hs', 'juniorhigh', 'secondary']],
  ['elementary', ['elementary', 'elem', 'primary', 'grade']],
  ['vocational', ['vocational', 'tesda', 'techvoc']],
  ['college', ['college', 'bachelor', 'tertiary', 'undergraduate']],
  ['none', ['none', 'noschooling', 'wala']],
]
const YES = ['yes', 'y', 'true', '1', 'oo', 'pwd']
const NO = ['no', 'n', 'false', '0', 'hindi', '']

// ---------- Template ----------
export async function buildTemplate() {
  const [barangays, colleges] = await Promise.all([barangaysRepo.listActive(), collegesRepo.listActive()])
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MCU Community Relations Office'

  const sheet = wb.addWorksheet('Beneficiaries', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }))
  const head = sheet.getRow(1)
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.alignment = { vertical: 'middle', wrapText: true }
  head.height = 30
  COLUMNS.forEach((c, i) => {
    head.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.required ? 'FF5C297C' : 'FF8E6BA6' } }
  })
  sheet.getColumn('birthDate').numFmt = 'yyyy-mm-dd'
  sheet.getColumn('contactNumber').numFmt = '@'
  sheet.getColumn('emergencyContactNumber').numFmt = '@'

  // Lists used by the drop-downs.
  const lists = wb.addWorksheet('Lists')
  lists.columns = [
    { header: 'Barangay', width: 36 },
    { header: 'College code', width: 14 },
    { header: 'College', width: 40 },
  ]
  lists.getRow(1).font = { bold: true }
  barangays.forEach((b, i) => (lists.getCell(i + 2, 1).value = b.name))
  colleges.forEach((c, i) => {
    lists.getCell(i + 2, 2).value = c.code
    lists.getCell(i + 2, 3).value = c.name
  })

  const dropdown = (key, formula) => {
    const col = sheet.getColumn(key).letter
    for (let row = 2; row <= MAX_ROWS + 1; row += 1) {
      sheet.getCell(`${col}${row}`).dataValidation = { type: 'list', allowBlank: true, formulae: [formula] }
    }
  }
  dropdown('sex', '"Male,Female"')
  dropdown('civilStatus', '"Single,Married,Widowed,Separated"')
  dropdown('education', '"None,Elementary,High school,Senior high,Vocational,College,Postgraduate"')
  dropdown('isPwd', '"Yes,No"')
  if (barangays.length > 0) dropdown('barangay', `Lists!$A$2:$A$${barangays.length + 1}`)

  const help = wb.addWorksheet('Instructions')
  help.getColumn(1).width = 110
  const lines = [
    ['How to fill in this file', true],
    ['• One row per beneficiary, on the "Beneficiaries" sheet. Do not change the headings in row 1.'],
    ['• Dark purple columns are required: Last name, First name, Birth date, Sex, Barangay.'],
    ['• Birth date: use the date format of your Excel, or type it as YYYY-MM-DD (e.g. 1965-03-21) or MM/DD/YYYY.'],
    ['• Barangay: choose from the drop-down. The list is on the "Lists" sheet; ask the CRO administrator to add a missing barangay first.'],
    ['• Assigned colleges (optional): college codes separated by commas, e.g. COM, COD. These colleges can then see the record.'],
    ['• PWD: Yes or No. Sex: Male or Female.'],
    [`• Up to ${MAX_ROWS.toLocaleString()} rows per file. People already in the system (same name and birth date) are skipped.`],
    [''],
    ['Data privacy', true],
    ['• Only include people who consented to their data being collected (Data Privacy Act of 2012, RA 10173).'],
    ['• Keep this file in a secure place and delete copies once the import is done.'],
  ]
  lines.forEach(([text, bold], i) => {
    const cell = help.getCell(i + 1, 1)
    cell.value = text
    if (bold) cell.font = { bold: true, size: 13 }
  })
  return wb.xlsx.writeBuffer()
}

// ---------- Reading the file ----------
function cellText(value) {
  if (value == null) return ''
  if (value instanceof Date) return value
  if (typeof value === 'object') {
    if ('result' in value) return cellText(value.result)
    if ('richText' in value) return value.richText.map((t) => t.text).join('')
    if ('text' in value) return cellText(value.text)
    return ''
  }
  return value
}

// Minimal CSV reader (quoted fields, commas, new lines), so values stay text.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

async function readGrid(buffer, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCsv(buffer.toString('utf8').replace(/^﻿/, ''))
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b
  if (ext !== 'xlsx' || !isZip) {
    throw new HttpError(400, 'Upload an Excel workbook (.xlsx) or a CSV file. In Excel, use File → Save As → Excel Workbook.')
  }
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(buffer)
  } catch {
    throw new HttpError(400, "The file couldn't be read. Open it in Excel, save it again as .xlsx, and retry.")
  }
  const sheet = wb.getWorksheet('Beneficiaries') ?? wb.worksheets[0]
  const grid = []
  sheet?.eachRow({ includeEmpty: true }, (row, number) => {
    grid[number - 1] = Array.from({ length: row.cellCount }, (_, i) => cellText(row.getCell(i + 1).value))
  })
  return Array.from(grid, (r) => r ?? [])
}

// Finds the header row (within the first 10) and maps each column to a field.
function mapHeader(grid) {
  const byName = new Map(COLUMNS.flatMap((c) => [[squash(c.header), c.key], [squash(c.key), c.key], ...c.aliases.map((a) => [a, c.key])]))
  for (let r = 0; r < Math.min(grid.length, 10); r += 1) {
    const columns = grid[r].map((h) => byName.get(squash(h)) ?? null)
    if (columns.filter(Boolean).length >= 3) {
      const missing = COLUMNS.filter((c) => c.required && !columns.includes(c.key)).map((c) => c.header)
      if (missing.length) throw new HttpError(400, `The file has no column for: ${missing.join(', ')}. Use the template's headings.`)
      return { headerRow: r, columns }
    }
  }
  throw new HttpError(400, 'No headings found. The first row should have the column names from the template (Last name, First name, Birth date…).')
}

// ---------- Converting values ----------
const pad = (n) => String(n).padStart(2, '0')

function toIsoDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
  if (typeof value === 'number' && value > 0 && value < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000).toISOString().slice(0, 10) // Excel serial date
  }
  const text = String(value).trim()
  let m = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`
  m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/) // MM/DD/YYYY, as used in the Philippines
  if (m) return `${m[3]}-${pad(m[1])}-${pad(m[2])}`
  const parsed = new Date(`${text} 00:00 UTC`) // e.g. "March 21, 1965"
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

const isRealDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso
}

function toPhone(value) {
  let text = String(value).trim()
  if (typeof value === 'number' || /^9\d{9}$/.test(text)) text = text.replace(/\.0+$/, '')
  return /^9\d{9}$/.test(text) ? `0${text}` : text // Excel drops the leading 0 of 09XX numbers
}

// Barangay names are matched without "Barangay"/"Brgy." and punctuation, or by
// their number when it is unique ("Brgy 176" → "Barangay 176 Bagong Silang").
function barangayMatcher(barangays) {
  const clean = (s) => String(s).toLowerCase().replace(/\b(barangay|brgy|bgy)\b\.?/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
  const numberOf = (s) => clean(s).match(/^\d+/)?.[0]
  return (value) => {
    const wanted = clean(value)
    const exact = barangays.filter((b) => clean(b.name) === wanted || clean(`${b.name} ${b.city}`) === wanted)
    if (exact.length === 1) return exact[0]
    const number = numberOf(value)
    const byNumber = number ? barangays.filter((b) => numberOf(b.name) === number) : []
    return byNumber.length === 1 ? byNumber[0] : null
  }
}

// One spreadsheet row → { payload, barangay, problems: Map(field → message) }.
function convertRow(raw, { matchBarangay, collegeByCode }) {
  const problems = new Map()
  const problem = (field, message) => problems.set(field, message)
  const text = (key) => (raw[key] == null ? '' : String(raw[key] instanceof Date ? raw[key].toISOString().slice(0, 10) : raw[key]).trim())
  const payload = {
    firstName: text('firstName'),
    middleName: text('middleName'),
    lastName: text('lastName'),
    suffix: text('suffix'),
    address: text('address'),
    email: text('email'),
    occupation: text('occupation'),
    emergencyContactName: text('emergencyContactName'),
    notes: text('notes'),
    contactNumber: raw.contactNumber === '' || raw.contactNumber == null ? '' : toPhone(raw.contactNumber),
    emergencyContactNumber: raw.emergencyContactNumber === '' || raw.emergencyContactNumber == null ? '' : toPhone(raw.emergencyContactNumber),
    consent: true,
  }

  if (text('birthDate')) {
    const iso = toIsoDate(raw.birthDate)
    if (iso && isRealDate(iso)) payload.birthDate = iso
    else problem('birthDate', 'Birth date: use YYYY-MM-DD or MM/DD/YYYY.')
  }

  const sex = SEX[squash(raw.sex)]
  if (sex) payload.sex = sex
  else if (text('sex')) problem('sex', 'Sex: write Male or Female.')

  if (text('civilStatus')) {
    const status = CIVIL[squash(raw.civilStatus)]
    if (status) payload.civilStatus = status
    else problem('civilStatus', 'Civil status: write Single, Married, Widowed or Separated.')
  }

  if (text('education')) {
    const value = squash(raw.education)
    const level = EDUCATION.find(([, words]) => words.some((w) => value.includes(w)))?.[0]
    if (level) payload.education = level
    else problem('education', 'Highest education: not recognized.')
  }

  const pwd = squash(raw.isPwd)
  if (YES.includes(pwd)) payload.isPwd = true
  else if (NO.includes(pwd)) payload.isPwd = false
  else problem('isPwd', 'PWD: write Yes or No.')

  if (text('householdSize')) {
    const size = Number(text('householdSize'))
    if (Number.isInteger(size)) payload.householdSize = size
    else problem('householdSize', 'Household size: enter a whole number.')
  }

  let barangay = null
  if (text('barangay')) {
    barangay = matchBarangay(raw.barangay)
    if (barangay) payload.barangayId = barangay.id
    else problem('barangayId', `Barangay "${text('barangay')}" is not on the list. Ask the CRO administrator to add it first.`)
  }

  if (text('colleges')) {
    const codes = text('colleges').toUpperCase().split(/[\s,;/]+/).filter(Boolean)
    const unknown = codes.filter((code) => !collegeByCode[code])
    if (unknown.length) problem('collegeIds', `Assigned colleges: unknown code ${unknown.join(', ')}.`)
    else payload.collegeIds = codes.map((code) => collegeByCode[code].id)
  }

  return { payload, barangay, problems }
}

const describeIssue = (issue) => {
  const field = issue.path[0]
  const label = LABEL[field] ?? { barangayId: 'Barangay', collegeIds: 'Assigned colleges' }[field] ?? field
  return `${label}: ${issue.message}`
}

// ---------- Check (and import) ----------
// Returns { rows: [{ row, name, birthDate, barangay, status, messages, payload }] }
// where status is ready | problem | duplicate.
export async function check(buffer, fileName) {
  const grid = await readGrid(buffer, fileName)
  const { headerRow, columns } = mapHeader(grid)
  const [barangays, colleges] = await Promise.all([barangaysRepo.listActive(), collegesRepo.listActive()])
  const context = {
    matchBarangay: barangayMatcher(barangays),
    collegeByCode: Object.fromEntries(colleges.map((c) => [c.code.toUpperCase(), c])),
  }

  const body = grid.slice(headerRow + 1)
  const dataRows = body.map((cells, i) => ({ cells, row: headerRow + i + 2 })).filter(({ cells }) => cells.some((c) => String(c ?? '').trim() !== ''))
  if (dataRows.length === 0) throw new HttpError(400, 'The file has no beneficiaries below the headings.')
  if (dataRows.length > MAX_ROWS) throw new HttpError(400, `The file has ${dataRows.length.toLocaleString()} rows; the limit is ${MAX_ROWS.toLocaleString()} per file. Split it into smaller files.`)

  const seen = new Map()
  const rows = []
  for (const { cells, row } of dataRows) {
    const raw = Object.fromEntries(columns.map((key, i) => [key, cells[i]]).filter(([key]) => key))
    const { payload, barangay, problems } = convertRow(raw, context)
    const result = createBeneficiarySchema.safeParse(payload)
    for (const issue of result.success ? [] : result.error.issues) {
      const field = String(issue.path[0])
      if (!problems.has(field)) problems.set(field, describeIssue(issue)) // keep the more specific message
    }
    const entry = {
      row,
      name: [payload.lastName, payload.firstName].filter(Boolean).join(', ') + (payload.middleName ? ` ${payload.middleName}` : ''),
      birthDate: payload.birthDate ?? null,
      barangay: barangay?.name ?? (raw.barangay ? String(raw.barangay) : null),
      status: problems.size ? 'problem' : 'ready',
      messages: [...problems.values()],
      payload: result.success ? result.data : null,
    }

    if (entry.status === 'ready') {
      const key = [payload.firstName, payload.lastName].map((s) => s.toLowerCase()).join('|') + `|${payload.birthDate}`
      const existing = await repo.findDuplicate(result.data)
      if (existing) {
        entry.status = 'duplicate'
        entry.messages = [`Already registered as ${existing.code}.`]
      } else if (seen.has(key)) {
        entry.status = 'duplicate'
        entry.messages = [`Same person as row ${seen.get(key)} of this file.`]
      } else seen.set(key, row)
    }
    rows.push(entry)
  }
  return rows
}

// Saves every ready row in one transaction. Returns the number saved.
export async function save(rows, actorId) {
  const ready = rows.filter((r) => r.status === 'ready')
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    for (const { payload } of ready) {
      const { consent, ...data } = payload // eslint-disable-line no-unused-vars
      await repo.insert(data, actorId, conn)
    }
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
  return ready.length
}
