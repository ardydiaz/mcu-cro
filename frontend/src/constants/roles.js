// Keep in sync with backend/src/constants/roles.js (users.role in MySQL).
export const ROLES = Object.freeze({
  IT_ADMIN: 'it_admin',
  CRO_ADMIN: 'cro_admin',
  COORDINATOR: 'coordinator',
  COLLEGE: 'college',
})

export const ALL_ROLES = Object.values(ROLES)

// Who may add and edit beneficiary profiles (and add barangays). Everyone can view.
export const BENEFICIARY_EDITORS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN, ROLES.COORDINATOR]
// Who may record services and referrals (college users: their own college only).
export const SERVICE_EDITORS = [...BENEFICIARY_EDITORS, ROLES.COLLEGE]
// Website content: everyone prepares (college users for their own college);
// CRO staff review and publish.
export const CONTENT_PUBLISHERS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN, ROLES.COORDINATOR]
// Who may remove beneficiary, service and referral records.
export const RECORD_MANAGERS = [ROLES.IT_ADMIN, ROLES.CRO_ADMIN]

export const ROLE_LABELS = {
  [ROLES.IT_ADMIN]: 'IT Administrator',
  [ROLES.CRO_ADMIN]: 'CRO Administrator',
  [ROLES.COORDINATOR]: 'Community Coordinator',
  [ROLES.COLLEGE]: 'College/Department User',
}
