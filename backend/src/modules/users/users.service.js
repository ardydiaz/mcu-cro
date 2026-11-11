import { ROLES } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as repo from './users.repository.js'

// Shape used to sign tokens. `roles` stays an array so requireRole can accept
// several roles per user later without changing callers. `college` is set for
// College/Department users, whose data access is limited to that college.
export const toSessionUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  roles: [user.role],
  college: user.college,
  tokenVersion: user.tokenVersion,
})

// What the API exposes about the signed-in user (no internal fields).
export const toPublicSessionUser = ({ tokenVersion, ...user }) => user // eslint-disable-line no-unused-vars

// Called after a successful Microsoft 365 sign-in. Returns the session user, or
// null if the account isn't registered in the portal or has been deactivated.
export async function signIn({ entraOid, email, name }) {
  const user = (entraOid && (await repo.findByEntraOid(entraOid))) || (await repo.findByEmail(email))
  if (!user || !user.isActive) return null
  // Once linked, an account only accepts the same M365 identity, so a reassigned
  // email address doesn't inherit someone else's access.
  if (user.entraOid && user.entraOid !== entraOid) return null

  const updated = await repo.update(user.id, {
    entraOid: user.entraOid ?? entraOid,
    name: user.name ?? name,
    lastLoginAt: new Date(),
  })
  return toSessionUser(updated)
}

// Checks a token's user on every request: the account must still exist, be
// active, and the token must not have been revoked (token_version bumped).
// Roles always come from the database, so role changes apply immediately.
export async function getSessionUser(id, tokenVersion) {
  const user = await repo.findById(id)
  if (!user?.isActive || user.tokenVersion !== tokenVersion) return null
  return toSessionUser(user)
}

// "Sign out everywhere": every existing access and refresh token stops working.
export const revokeSessions = (id) => repo.bumpTokenVersion(id)

export const list = (filters) => repo.list(filters)

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])

// College/Department users must belong to an active college; other roles never do.
async function resolveCollegeId(role, collegeId) {
  if (role !== ROLES.COLLEGE) return null
  if (!collegeId) throw fieldError('collegeId', 'Choose their college or department.')
  if (!(await collegesRepo.findById(collegeId))) throw fieldError('collegeId', 'Choose a valid college or department.')
  return collegeId
}

export async function create(data) {
  if (await repo.findByEmail(data.email)) {
    throw new HttpError(409, 'A user with this email already exists.')
  }
  return repo.create({ ...data, collegeId: await resolveCollegeId(data.role, data.collegeId) })
}

async function getOrThrow(id) {
  const user = await repo.findById(id)
  if (!user) throw new HttpError(404, 'User not found.')
  return user
}

// Refuses changes that would leave nobody able to manage users.
async function assertKeepsAnAdmin(user, next) {
  const admin = ROLES.IT_ADMIN
  const losesAdmin = user.role === admin && user.isActive && (next.role !== admin || !next.isActive)
  if (losesAdmin && (await repo.countActive(admin)) <= 1) {
    throw new HttpError(409, 'At least one active IT administrator is required.')
  }
}

// Returns { before, after } (public fields) so callers can audit the change.
export async function update(id, changes, actor) {
  const user = await getOrThrow(id)
  const isSelf = id === actor.id
  if (isSelf && changes.isActive !== undefined) {
    throw new HttpError(409, "You can't deactivate your own account.")
  }
  if (changes.role !== undefined || changes.collegeId !== undefined) {
    const role = changes.role ?? user.role
    const collegeId = changes.collegeId !== undefined ? changes.collegeId : user.college?.id
    changes = { ...changes, collegeId: await resolveCollegeId(role, collegeId) }
  }
  // An IT administrator may change their own role, even as the last one (the
  // portal warns first; `npm run user:create` restores access). Changing other
  // people and deactivating still keep at least one IT administrator.
  if (!isSelf) await assertKeepsAnAdmin(user, { ...user, ...changes })
  const updated = await repo.update(id, changes)
  // Deactivation signs the user out immediately.
  if (user.isActive && changes.isActive === false) await repo.bumpTokenVersion(id)
  return { before: repo.toPublic(user), after: repo.toPublic(updated) }
}

export async function remove(id, actor) {
  const user = await getOrThrow(id)
  if (id === actor.id) throw new HttpError(409, "You can't delete your own account.")
  await assertKeepsAnAdmin(user, { ...user, isActive: false })
  await repo.remove(id)
  return repo.toPublic(user)
}
