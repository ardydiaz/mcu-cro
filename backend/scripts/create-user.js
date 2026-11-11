// Adds (or updates) a portal user from the command line. Use it to create the
// first IT administrator; after that, manage users in the admin portal (Settings → Users).
// Usage: npm run user:create -- <email> [role] ["Full Name"] [college code]
//   role: it_admin (default) | cro_admin | coordinator | college
//   college code (college role only): COM, COD, CPT, CON, CPH, COO, CMT, CAS, BED, IOE, SBM
import { randomUUID } from 'node:crypto'
import { db } from '../src/config/db.js'
import { ROLES } from '../src/constants/roles.js'
import { findByCode } from '../src/modules/colleges/colleges.repository.js'
import { createUserSchema } from '../src/validators/users.js'

const USAGE = 'Usage: npm run user:create -- <email> [it_admin|cro_admin|coordinator|college] ["Full Name"] [college code]'

async function fail(...lines) {
  for (const line of [USAGE, ...lines]) console.error(line)
  await db.end()
  process.exit(1)
}

const [email, role = ROLES.IT_ADMIN, name, collegeCode] = process.argv.slice(2)
const parsed = createUserSchema.safeParse({ email, role, name })
if (!parsed.success) {
  await fail(...parsed.error.issues.map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`))
}

const data = parsed.data
let college = null
if (data.role === ROLES.COLLEGE) {
  college = collegeCode && (await findByCode(collegeCode.toUpperCase()))
  if (!college) await fail(` - College users need a valid college code (got "${collegeCode ?? ''}").`)
}

await db.execute(
  `INSERT INTO users (id, email, name, role, college_id) VALUES (?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE role = VALUES(role), college_id = VALUES(college_id), is_active = TRUE,
                           name = COALESCE(VALUES(name), name)`,
  [randomUUID(), data.email, data.name ?? null, data.role, college?.id ?? null],
)
await db.end()
console.log(`OK: ${data.email} is an active ${data.role}${college ? ` (${college.code})` : ''}.`)
