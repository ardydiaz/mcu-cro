import { HttpError } from '../../utils/httpError.js'
import * as barangaysRepo from '../barangays/barangays.repository.js'
import * as repo from './beneficiaries.repository.js'

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])

export const list = (filters) => repo.list(filters)

export async function get(id) {
  const beneficiary = await repo.findById(id)
  if (!beneficiary) throw new HttpError(404, 'Beneficiary not found.')
  return beneficiary
}

async function assertBarangay(barangayId) {
  if (barangayId !== undefined && !(await barangaysRepo.findById(barangayId))) {
    throw fieldError('barangayId', 'Choose a barangay from the list.')
  }
}

// One person, one record: refuse a second profile with the same name and birth date.
async function assertNotDuplicate(person, excludeId) {
  const existing = await repo.findDuplicate(person, excludeId)
  if (existing) {
    throw new HttpError(409, `This person is already registered as ${existing}. Search for them instead of adding a new record.`)
  }
}

export async function create({ consent, ...data }, actor) { // eslint-disable-line no-unused-vars
  await assertBarangay(data.barangayId)
  await assertNotDuplicate(data)
  return repo.create(data, actor.id)
}

// Returns { before, after } so callers can audit the change.
export async function update(id, changes, actor) {
  const before = await get(id)
  await assertBarangay(changes.barangayId)
  if (changes.firstName !== undefined || changes.lastName !== undefined || changes.birthDate !== undefined) {
    await assertNotDuplicate({ ...before, ...changes }, id)
  }
  const after = await repo.update(id, changes, actor.id)
  return { before, after }
}

export async function remove(id, actor) {
  const beneficiary = await get(id)
  await repo.remove(id, actor.id)
  return beneficiary
}
