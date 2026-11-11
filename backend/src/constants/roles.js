// Must match the users.role ENUM (database/migrations/005_users_requirement_roles.sql).
// Roles come from the CRO requirements, Step 5 – Determine User Access.
export const ROLES = Object.freeze({
  IT_ADMIN: 'it_admin', // full access, plus system administration and user accounts
  CRO_ADMIN: 'cro_admin', // all community data, programs and reports
  COORDINATOR: 'coordinator', // encodes beneficiaries and services
  COLLEGE: 'college', // limited to their own college/department
})

export const ALL_ROLES = Object.values(ROLES)

// Who may add and edit beneficiary profiles (and add barangays). Everyone can view.
export const BENEFICIARY_EDITORS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN, ROLES.COORDINATOR]
// Who may record services and referrals (college users: their own college only).
export const SERVICE_EDITORS = [...BENEFICIARY_EDITORS, ROLES.COLLEGE]
// Website content: everyone can prepare materials and activities (college users
// for their own college); CRO staff review and publish them (requirements Step 7).
export const CONTENT_PUBLISHERS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN, ROLES.COORDINATOR]
// Who may remove beneficiary, service and referral records.
export const RECORD_MANAGERS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN]
