import { ROLES } from '../../constants/roles.js'
import { beneficiaryScopeOf } from '../../middleware/applyScope.js'
import { HttpError } from '../../utils/httpError.js'
import * as barangaysRepo from '../barangays/barangays.repository.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as repo from './beneficiaries.repository.js'

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])

export const list = (filters, actor) => repo.list(filters, beneficiaryScopeOf(actor))

// Beneficiaries outside the user's scope look the same as missing ones.
export async function get(id, actor) {
  const beneficiary = await repo.findById(id, beneficiaryScopeOf(actor))
  if (!beneficiary) throw new HttpError(404, 'Beneficiary not found.')
  return beneficiary
}

// The barangay must exist; Community Coordinators may only use their assigned barangays.
async function assertBarangay(barangayId, actor) {
  if (barangayId === undefined) return
  if (!(await barangaysRepo.findById(barangayId))) throw fieldError('barangayId', 'Choose a barangay from the list.')
  if (actor.roles.includes(ROLES.COORDINATOR)) {
    const assigned = await barangaysRepo.listAssigned(actor.id)
    if (!assigned.some((b) => b.id === barangayId)) {
      throw fieldError('barangayId', 'You can only encode beneficiaries of the barangays assigned to you.')
    }
  }
}

async function assertColleges(collegeIds) {
  for (const id of collegeIds ?? []) {
    if (!(await collegesRepo.findById(id))) throw fieldError('collegeIds', 'Choose colleges or departments from the list.')
  }
}

// One person, one record: refuse a second profile with the same name and birth date.
async function assertNotDuplicate(person, excludeId, actor) {
  const existing = await repo.findDuplicate(person, excludeId)
  if (!existing) return
  // Only name the existing record to someone who may open it.
  const visible = await repo.findById(existing.id, beneficiaryScopeOf(actor))
  throw new HttpError(
    409,
    visible
      ? `This person is already registered as ${existing.code}. Search for them instead of adding a new record.`
      : 'This person is already registered in a barangay that is not assigned to you. Ask the CRO to check their record.',
  )
}

export async function create({ consent, ...data }, actor) { // eslint-disable-line no-unused-vars
  await assertBarangay(data.barangayId, actor)
  await assertColleges(data.collegeIds)
  await assertNotDuplicate(data, 0, actor)
  return repo.create(data, actor.id)
}

// Returns { before, after } so callers can audit the change.
export async function update(id, changes, actor) {
  const before = await get(id, actor)
  await assertBarangay(changes.barangayId, actor)
  await assertColleges(changes.collegeIds)
  if (changes.firstName !== undefined || changes.lastName !== undefined || changes.birthDate !== undefined) {
    await assertNotDuplicate({ ...before, ...changes }, id, actor)
  }
  const after = await repo.update(id, changes, actor.id)
  return { before, after }
}

export async function remove(id, actor) {
  const beneficiary = await get(id, actor)
  await repo.remove(id, actor.id)
  return beneficiary
}
