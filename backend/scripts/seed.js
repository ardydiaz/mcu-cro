// Fills the database with SAMPLE data for development, so lists, search,
// filters and pagination have something to show: barangays, programs,
// 75 beneficiaries, their service records and referrals, and learning
// materials (each with a generated PDF).
// Usage: npm run db:seed                add sample data (each part is skipped if already there)
//        npm run db:seed -- --materials add only the sample learning materials
//        npm run db:seed -- --reset     remove the sample beneficiaries (with their services and
//                                   referrals) and the sample learning materials and their files
// Sample beneficiaries are marked in `notes`; their services and referrals are
// removed with them. Sample materials are recognized by their file name
// (FILE_PREFIX). Real records are never touched. The data is fictional and
// generated the same way on every run.
import { unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { db } from '../src/config/db.js'
import { env } from '../src/config/env.js'
import { UPLOAD_DIR } from '../src/modules/files/files.service.js'
import { MATERIALS } from './sample-materials.js'

const MARKER = 'SAMPLE DATA – created by npm run db:seed'
const FILE_PREFIX = 'seed-sample-'
const COUNT = 75

if (env.isProduction) {
  console.error('Refusing to seed sample data in production.')
  process.exit(1)
}

// Repeatable pseudo-random numbers (mulberry32), so every run creates the same data.
let state = 20261103
function random() {
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (list) => list[Math.floor(random() * list.length)]
const chance = (p) => random() < p
const int = (min, max) => min + Math.floor(random() * (max - min + 1))

const BARANGAYS = [
  'Barangay 176 Bagong Silang',
  'Barangay 171 Bagumbong',
  'Barangay 178 Camarin',
  'Barangay 186 Tala',
  'Barangay 120 Grace Park',
  'Barangay 188 Tala',
]
const CITY = 'Caloocan City'

const PROGRAMS = [
  'Alaga Ko Barangay Ko: Alaga sa Bawat Edad',
  'Diabetes Monitoring',
  'Hypertension Monitoring',
  'Medical and Dental Mission',
  'Vision Screening',
  'Physical Therapy Outreach',
  'Health Education Seminar',
]

const MALE = ['Juan', 'Jose', 'Pedro', 'Antonio', 'Ramon', 'Eduardo', 'Roberto', 'Mark', 'John Paul', 'Christian', 'Miguel', 'Carlo', 'Daniel', 'Rafael', 'Angelo', 'Noel', 'Ernesto', 'Rogelio']
const FEMALE = ['Maria', 'Ana', 'Rosario', 'Teresita', 'Liza', 'Jennifer', 'Kristine', 'Mary Grace', 'Angelica', 'Patricia', 'Josefina', 'Carmela', 'Jasmine', 'Lorna', 'Erlinda', 'Nicole', 'Bea', 'Corazon']
const SURNAMES = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Ramos', 'Aquino', 'Villanueva', 'Dela Cruz', 'Gonzales', 'Torres', 'Flores', 'Castillo', 'Navarro', 'Domingo', 'Mercado', 'Pascual', 'Rivera', 'Soriano', 'Lopez', 'Manalo']
const STREETS = ['Phase 1', 'Phase 3', 'Phase 7', 'Phase 9', 'Purok 2', 'Purok 4', 'Purok 6', 'Zabarte Rd.', 'Camarin Rd.', 'Malaria Rd.']
const OCCUPATIONS = ['Vendor', 'Tricycle driver', 'Construction worker', 'Housekeeper', 'Sari-sari store owner', 'Factory worker', 'Security guard', 'Barangay health worker', 'Jeepney driver', 'Laundry worker']

// Per type of service: the responsible college and typical [findings, intervention, recommendation].
const SERVICES = {
  medical: {
    college: 'COM',
    cases: [
      ['Elevated blood pressure (150/95 mmHg).', 'Consultation; amlodipine 5 mg dispensed.', 'Monthly BP monitoring; reduce salt intake.'],
      ['Fasting blood sugar 182 mg/dL.', 'Consultation; metformin dispensed; diet counseling.', 'Diabetes monitoring every month.'],
      ['Upper respiratory tract infection.', 'Consultation; paracetamol and vitamins dispensed.', 'Increase fluid intake; return if fever persists.'],
      ['Normal vital signs; no complaints.', 'General check-up.', 'Annual check-up.'],
      ['Pallor; anemia suspected.', 'Consultation; ferrous sulfate dispensed.', 'Complete blood count.'],
    ],
  },
  dental: {
    college: 'COD',
    cases: [
      ['Dental caries on two molars.', 'Tooth extraction (1); oral hygiene instruction.', 'Return for restoration.'],
      ['Gingivitis; heavy plaque.', 'Oral prophylaxis.', 'Brush twice daily; dental check-up in 6 months.'],
      ['Healthy teeth and gums.', 'Dental check-up; fluoride application.', 'Dental check-up in 6 months.'],
    ],
  },
  optical: {
    college: 'COO',
    cases: [
      ['Presbyopia; near vision 20/50.', 'Eye examination; reading glasses (+2.00) provided.', 'Re-check in one year.'],
      ['Myopia (-1.50 both eyes).', 'Refraction done.', 'Prescription glasses.'],
      ['Early cataract, right eye.', 'Eye examination.', 'Ophthalmology consult.'],
    ],
  },
  physical_therapy: {
    college: 'CPT',
    cases: [
      ['Chronic low back pain; limited flexion.', 'Therapeutic exercises; hot pack.', 'Home exercise program; follow-up session.'],
      ['Knee osteoarthritis, both knees.', 'Strengthening exercises; gait training.', 'Weekly sessions for 4 weeks.'],
      ['Post-stroke weakness, left side.', 'Range-of-motion and balance exercises.', 'Continue therapy; caregiver training.'],
    ],
  },
  nursing: {
    college: 'CON',
    cases: [
      ['BP 130/85 mmHg; weight 68 kg.', 'Vital signs and BMI taken; health teaching.', 'Monitor BP at the health center.'],
      ['Small wound on the left foot.', 'Wound cleaning and dressing.', 'Keep dry; return in 3 days.'],
    ],
  },
  laboratory: {
    college: 'CMT',
    cases: [
      ['Hemoglobin 10.8 g/dL (low).', 'Complete blood count.', 'Results forwarded to the attending physician.'],
      ['Fasting blood sugar 126 mg/dL.', 'Blood sugar test.', 'Repeat test in 3 months.'],
      ['Urinalysis normal.', 'Urinalysis.', null],
    ],
  },
  pharmacy: {
    college: 'CPH',
    cases: [['Taking 4 maintenance medicines.', 'Medication review and counseling.', 'Take medicines at the same time daily.']],
  },
  health_education: {
    college: 'CON',
    cases: [
      [null, 'Attended a nutrition and healthy-eating seminar.', null],
      [null, 'Attended a handwashing and hygiene session.', null],
      [null, 'Attended a dengue prevention seminar.', null],
    ],
  },
}
const FACILITIES = ['Caloocan City Medical Center', 'MCU-FDTMF Hospital', 'Barangay Health Center', 'Tala Hospital']

const DAY = 86400000
const iso = (date) => date.toISOString().slice(0, 10)
const phone = () => `09${int(15, 99)}${String(int(0, 9999999)).padStart(7, '0')}`
const today = iso(new Date(Date.now() + 8 * 3600 * 1000)) // Philippines
const daysAgo = (n) => iso(new Date(Date.parse(`${today}T00:00:00Z`) - n * DAY))

async function insert(table, row) {
  const columns = Object.keys(row)
  const [result] = await db.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    Object.values(row),
  )
  return result.insertId
}

function person() {
  const sex = chance(0.55) ? 'female' : 'male'
  // Ages 2–88, weighted towards adults and seniors (typical medical mission turnout).
  const age = pick([int(2, 12), int(13, 20), int(21, 45), int(21, 45), int(46, 59), int(60, 88), int(60, 88)])
  const birth = new Date(Date.UTC(2026 - age, int(0, 11), int(1, 28)))
  const adult = age >= 18
  const lastName = pick(SURNAMES)
  return {
    first_name: pick(sex === 'female' ? FEMALE : MALE),
    middle_name: chance(0.85) ? pick(SURNAMES.filter((s) => s !== lastName)) : null,
    last_name: lastName,
    suffix: sex === 'male' && chance(0.06) ? pick(['Jr.', 'Sr.', 'III']) : null,
    birth_date: iso(birth),
    sex,
    civil_status: adult ? pick(['single', 'married', 'married', 'married', age >= 60 ? 'widowed' : 'separated']) : 'single',
    address: `${int(1, 250)} ${pick(STREETS)}`,
    contact_number: adult && chance(0.8) ? phone() : null,
    household_size: int(1, 9),
    emergency_contact_name: chance(0.6) ? `${pick(FEMALE.concat(MALE))} ${lastName}` : null,
    emergency_contact_number: chance(0.5) ? phone() : null,
    occupation: adult && age < 65 && chance(0.7) ? pick(OCCUPATIONS) : null,
    education: adult ? pick(['elementary', 'high_school', 'high_school', 'senior_high', 'vocational', 'college']) : age >= 6 ? 'elementary' : 'none',
    is_pwd: chance(0.08),
  }
}

async function seedBeneficiaries(adminId) {
  for (const name of BARANGAYS) await db.execute('INSERT IGNORE INTO barangays (name, city) VALUES (?, ?)', [name, CITY])
  const [barangays] = await db.query('SELECT id FROM barangays WHERE city = ? AND name IN (?)', [CITY, BARANGAYS])

  // Unique name + birth date, like the app requires.
  const people = new Map()
  while (people.size < COUNT) {
    const p = person()
    people.set(`${p.first_name}|${p.last_name}|${p.birth_date}`, p)
  }
  // "Registered" dates spread over the last six months.
  for (const p of people.values()) {
    const registered = new Date(Date.now() - int(0, 180) * DAY - int(0, 36000) * 1000)
    await insert('beneficiaries', {
      ...p,
      barangay_id: pick(barangays).id,
      notes: MARKER,
      consent_at: registered,
      created_at: registered,
      updated_at: registered,
      created_by: adminId,
      updated_by: adminId,
    })
  }
  console.log(`Added ${people.size} sample beneficiaries across ${barangays.length} barangays in ${CITY}.`)
}

async function seedServicesAndReferrals(adminId) {
  for (const name of PROGRAMS) await db.execute('INSERT IGNORE INTO programs (name) VALUES (?)', [name])
  const [programs] = await db.query('SELECT id, name FROM programs WHERE name IN (?)', [PROGRAMS])
  const [colleges] = await db.query('SELECT id, code FROM colleges')
  const collegeId = Object.fromEntries(colleges.map((c) => [c.code, c.id]))
  const [beneficiaries] = await db.query(
    'SELECT id, DATEDIFF(UTC_TIMESTAMP(), created_at) AS days_registered FROM beneficiaries WHERE notes = ? AND deleted_at IS NULL',
    [MARKER],
  )

  let services = 0
  let referrals = 0
  for (const b of beneficiaries) {
    // 1–4 services each, on or after the registration date.
    for (let n = int(1, 4); n > 0; n -= 1) {
      const type = pick(['medical', 'medical', 'medical', 'dental', 'dental', 'optical', 'physical_therapy', 'nursing', 'laboratory', 'pharmacy', 'health_education'])
      const { college, cases } = SERVICES[type]
      const [findings, intervention, recommendation] = pick(cases)
      const ago = int(0, Math.max(0, Number(b.days_registered)))
      const serviceDate = daysAgo(ago)

      // About a third get a follow-up 2–6 weeks later.
      let followUpDate = null
      let followUpStatus = 'none'
      if (recommendation && chance(0.35)) {
        const dueIn = int(14, 42) - ago // days from today
        followUpDate = daysAgo(-dueIn)
        followUpStatus = dueIn >= 0 ? 'scheduled' : chance(0.7) ? 'completed' : 'missed'
      }
      const created = new Date(`${serviceDate}T0${int(1, 8)}:00:00Z`)
      const serviceId = await insert('service_records', {
        beneficiary_id: b.id,
        service_date: serviceDate,
        program_id: chance(0.85) ? pick(programs).id : null,
        college_id: collegeId[college],
        service_type: type,
        findings,
        intervention,
        recommendation,
        follow_up_date: followUpDate,
        follow_up_status: followUpStatus,
        created_by: adminId,
        updated_by: adminId,
        created_at: created,
        updated_at: created,
      })
      services += 1

      // Some findings lead to a referral: to another MCU college or an outside facility.
      if (findings && type !== 'health_education' && chance(0.22)) {
        const toCollege = type === 'medical' && chance(0.5) ? pick(['CMT', 'COO', 'CPT']) : null
        const status = ago > 30 ? pick(['completed', 'completed', 'cancelled']) : ago > 7 ? pick(['in_progress', 'completed', 'pending']) : 'pending'
        await insert('referrals', {
          beneficiary_id: b.id,
          service_record_id: serviceId,
          referral_date: serviceDate,
          college_id: collegeId[college],
          referred_to_college_id: toCollege ? collegeId[toCollege] : null,
          referred_to_facility: toCollege ? null : pick(FACILITIES),
          reason: recommendation ?? findings,
          urgency: pick(['routine', 'routine', 'routine', 'routine', 'urgent', 'urgent', 'emergency']),
          status,
          outcome: status === 'completed' ? pick(['Seen and treated; back to regular monitoring.', 'Seen by specialist; medicines prescribed.', 'Procedure done; recovering well.']) : status === 'cancelled' ? 'Beneficiary could not be reached.' : null,
          created_by: adminId,
          updated_by: adminId,
          created_at: created,
          updated_at: created,
        })
        referrals += 1
      }
    }
  }
  console.log(`Added ${services} sample service records and ${referrals} referrals (${programs.length} programs).`)
}

// A minimal A4 PDF (standard Helvetica fonts, ASCII text), enough for the
// website's PDF viewer. Long text is wrapped and continues on new pages.
function makePdf({ title, subtitle, body }) {
  const escape = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`)
  const wrap = (text, width) => {
    const lines = []
    let line = ''
    for (const word of text.split(' ')) {
      if (line && `${line} ${word}`.length > width) {
        lines.push(line)
        line = word
      } else line = line ? `${line} ${word}` : word
    }
    return line ? [...lines, line] : lines
  }

  // [font, size, x, text, space before]
  const rows = [
    ...wrap(title, 44).map((t, i) => ['F2', 18, 56, t, i === 0 ? 0 : 4]),
    ['F1', 10, 56, subtitle, 10],
  ]
  for (const para of body) {
    if (para.startsWith('- ')) wrap(para.slice(2), 80).forEach((t, i) => rows.push(['F1', 11, i === 0 ? 70 : 80, i === 0 ? `-  ${t}` : t, i === 0 ? 4 : 1]))
    else if (para.endsWith(':')) rows.push(['F2', 12, 56, para, 14])
    else wrap(para, 84).forEach((t, i) => rows.push(['F1', 11, 56, t, i === 0 ? 10 : 1]))
  }

  const pages = [[]]
  let y = 786
  for (const [font, size, x, text, before] of rows) {
    y -= before + size + 3
    if (y < 70) {
      pages.push([])
      y = 786 - size
    }
    pages.at(-1).push(`BT /${font} ${size} Tf ${x} ${y} Td (${escape(text)}) Tj ET`)
  }
  const footer = 'BT /F1 8 Tf 56 40 Td (Sample material for development and testing - created by npm run db:seed) Tj ET'

  // Objects: 1 catalog, 2 page tree, 3-4 fonts, then a page and its content stream per page.
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]
  pages.forEach((lines, i) => {
    const stream = [...lines, footer].join('\n')
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    )
  })
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((obj, i) => {
    const at = pdf.length
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
    return at
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

const LANGUAGE_NAMES = { fil: 'Filipino', en: 'English', both: 'Filipino and English' }

async function seedMaterials(adminId) {
  const [colleges] = await db.query('SELECT id, code, name FROM colleges')
  const college = Object.fromEntries(colleges.map((c) => [c.code, c]))

  for (const [i, m] of MATERIALS.entries()) {
    const c = college[m.college]
    const pdf = makePdf({ title: m.title, subtitle: `${c.name}  |  ${m.topic}  |  ${LANGUAGE_NAMES[m.language]}`, body: m.body })
    const slug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
    const fileId = randomUUID()
    // Spread over the last four months, newest first in the list.
    const created = new Date(Date.now() - (i * 4 + int(1, 3)) * DAY - int(0, 36000) * 1000)
    const status = m.status ?? 'published'

    await writeFile(`${UPLOAD_DIR}${fileId}`, pdf)
    await insert('files', {
      id: fileId,
      original_name: `${FILE_PREFIX}${slug}.pdf`,
      mime_type: 'application/pdf',
      size_bytes: pdf.length,
      uploaded_by: adminId,
      created_at: created,
    })
    await insert('learning_resources', {
      college_id: c.id,
      topic: m.topic,
      type: m.type,
      title: m.title,
      description: m.description,
      file_id: fileId,
      language: m.language,
      status,
      review_note: m.reviewNote ?? null,
      is_featured: Boolean(m.featured),
      published_at: status === 'published' ? new Date(created.getTime() + 3600 * 1000) : null,
      reviewed_by: ['published', 'rejected'].includes(status) ? adminId : null,
      created_by: adminId,
      updated_by: adminId,
      created_at: created,
      updated_at: created,
    })
  }
  const published = MATERIALS.filter((m) => !m.status).length
  console.log(`Added ${MATERIALS.length} sample learning materials (${published} published, the rest draft, pending or sent back).`)
}

async function removeMaterials() {
  const [files] = await db.query('SELECT id FROM files WHERE original_name LIKE ?', [`${FILE_PREFIX}%`])
  if (files.length === 0) return console.log('Removed 0 sample learning materials.')
  const ids = files.map((f) => f.id)
  const [result] = await db.query('DELETE FROM learning_resources WHERE file_id IN (?)', [ids])
  await db.query('DELETE FROM files WHERE id IN (?)', [ids])
  for (const id of ids) await unlink(`${UPLOAD_DIR}${id}`).catch(() => {})
  console.log(`Removed ${result.affectedRows} sample learning materials and their files.`)
}

try {
  if (process.argv.includes('--reset')) {
    const [result] = await db.execute('DELETE FROM beneficiaries WHERE notes = ?', [MARKER])
    console.log(`Removed ${result.affectedRows} sample beneficiaries with their service records and referrals.`)
    await removeMaterials()
    console.log('Barangays and programs are kept (real records may use them).')
  } else {
    const [[admin]] = await db.query("SELECT id FROM users WHERE role = 'it_admin' AND is_active = TRUE ORDER BY created_at LIMIT 1")
    const adminId = admin?.id ?? null
    const onlyMaterials = process.argv.includes('--materials')

    if (!onlyMaterials) {
      const [[{ beneficiaries }]] = await db.execute('SELECT COUNT(*) AS beneficiaries FROM beneficiaries WHERE notes = ?', [MARKER])
      if (beneficiaries > 0) console.log(`Sample beneficiaries are already there (${beneficiaries}).`)
      else await seedBeneficiaries(adminId)

      const [[{ services }]] = await db.execute(
        'SELECT COUNT(*) AS services FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id WHERE b.notes = ?',
        [MARKER],
      )
      if (services > 0) console.log(`Sample service records are already there (${services}).`)
      else await seedServicesAndReferrals(adminId)
    }

    const [[{ materials }]] = await db.execute('SELECT COUNT(*) AS materials FROM files WHERE original_name LIKE ?', [`${FILE_PREFIX}%`])
    if (materials > 0) console.log(`Sample learning materials are already there (${materials}).`)
    else await seedMaterials(adminId)

    console.log('Remove the sample data with: npm run db:seed -- --reset')
  }
} finally {
  await db.end()
}
