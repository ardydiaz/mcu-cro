import { ROLES } from '../constants/roles.js'

// Data scope of the signed-in user (requirements Step 5): College/Department
// users only see and record services and referrals of their own college.
// Returns that college id, or null when the user may see every college.
export function collegeScopeOf(user) {
  return user.roles.includes(ROLES.COLLEGE) ? user.college?.id ?? -1 : null
}
