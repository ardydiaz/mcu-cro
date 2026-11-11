import { ROLES } from '../constants/roles.js'

// Data scope of the signed-in user (requirements Step 5): College/Department
// users only see and record services and referrals of their own college.
// Returns that college id, or null when the user may see every college.
export function collegeScopeOf(user) {
  return user.roles.includes(ROLES.COLLEGE) ? user.college?.id ?? -1 : null
}

// Scope for service records and referrals: college users by their college (the
// records of their college are always theirs to see); coordinators by the
// beneficiaries of their barangays.
export function recordScopeOf(user) {
  const collegeId = collegeScopeOf(user)
  return { collegeId, beneficiary: collegeId ? null : beneficiaryScopeOf(user) }
}

// Which beneficiaries the user may see, as an SQL condition on the
// beneficiaries table aliased `b`, or null for all of them:
// - Community Coordinators: beneficiaries of their assigned barangays.
// - College/Department users: beneficiaries assigned to their college, or that
//   their college has served or that were referred from or to it.
export function beneficiaryScopeOf(user) {
  if (user.roles.includes(ROLES.IT_ADMIN) || user.roles.includes(ROLES.CRO_ADMIN)) return null
  if (user.roles.includes(ROLES.COORDINATOR)) {
    return { sql: 'b.barangay_id IN (SELECT ub.barangay_id FROM user_barangays ub WHERE ub.user_id = ?)', params: [user.id] }
  }
  const college = collegeScopeOf(user) ?? -1
  return {
    sql: `(EXISTS (SELECT 1 FROM beneficiary_colleges bc WHERE bc.beneficiary_id = b.id AND bc.college_id = ?)
           OR EXISTS (SELECT 1 FROM service_records ss WHERE ss.beneficiary_id = b.id AND ss.college_id = ? AND ss.deleted_at IS NULL)
           OR EXISTS (SELECT 1 FROM referrals rr WHERE rr.beneficiary_id = b.id AND rr.deleted_at IS NULL
                      AND (rr.college_id = ? OR rr.referred_to_college_id = ?)))`,
    params: [college, college, college, college],
  }
}
