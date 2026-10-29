// Keep in sync with backend/src/constants/roles.js (Entra ID app role values).
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
})

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.STAFF]: 'Staff',
}
