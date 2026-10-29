// Adds (or updates) a portal user from the command line. Use it to create the
// first administrator; after that, manage users in the admin portal (Settings → Users).
// Usage: npm run user:create -- <email> [admin|staff] ["Full Name"]
import { randomUUID } from 'node:crypto'
import { db } from '../src/config/db.js'
import { createUserSchema } from '../src/validators/users.js'

const [email, role = 'admin', name] = process.argv.slice(2)
const parsed = createUserSchema.safeParse({ email, role, name })
if (!parsed.success) {
  console.error('Usage: npm run user:create -- <email> [admin|staff] ["Full Name"]')
  for (const issue of parsed.error.issues) console.error(` - ${issue.path.join('.')}: ${issue.message}`)
  process.exit(1)
}

const data = parsed.data
await db.execute(
  `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE role = VALUES(role), is_active = TRUE, name = COALESCE(VALUES(name), name)`,
  [randomUUID(), data.email, data.name ?? null, data.role],
)
await db.end()
console.log(`OK: ${data.email} is an active ${data.role}.`)
