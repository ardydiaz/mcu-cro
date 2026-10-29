// Prints tokens for an existing portal user, for local API testing.
// Usage: npm run token -- <email>
import { issueTokens } from '../src/auth/tokens.js'
import { db } from '../src/config/db.js'
import { findByEmail } from '../src/modules/users/users.repository.js'
import { toSessionUser } from '../src/modules/users/users.service.js'

const email = process.argv[2]?.toLowerCase()
if (!email) {
  console.error('Usage: npm run token -- <email>')
  process.exit(1)
}

const user = await findByEmail(email)
await db.end()
if (!user) {
  console.error(`No user with email ${email}. Create one first: npm run user:create -- ${email} admin`)
  process.exit(1)
}
console.log(JSON.stringify(issueTokens(toSessionUser(user)), null, 2))
