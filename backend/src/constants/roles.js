// Must match the users.role ENUM in database/migrations/001_create_users.sql.
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
})

export const ALL_ROLES = Object.values(ROLES)
