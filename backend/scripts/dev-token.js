// Prints tokens for local testing.
// Usage: npm run token -- <email> <role>[,<role>...]
import { issueTokens } from '../src/auth/tokens.js'

const [email = 'dev@mcu.edu.ph', roles = 'admin'] = process.argv.slice(2)
console.log(JSON.stringify(issueTokens({ id: 'dev', email, roles: roles.split(',') }), null, 2))
