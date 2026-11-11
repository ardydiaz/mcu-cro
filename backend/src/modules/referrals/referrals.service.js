import { collegeScopeOf } from '../../middleware/applyScope.js'
import { HttpError } from '../../utils/httpError.js'
import * as beneficiariesRepo from '../beneficiaries/beneficiaries.repository.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as serviceRecordsRepo from '../service-records/serviceRecords.repository.js'
import * as repo from './referrals.repository.js'

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])

export const list = (filters, actor) => repo.list(filters, collegeScopeOf(actor))

// College users see referrals from or to their college; others look missing.
export async function get(id, actor) {
  const referral = await repo.findById(id)
  const scope = collegeScopeOf(actor)
  const inScope = !scope || referral?.college.id === scope || referral?.referredToCollege?.id === scope
  if (!referral || !inScope) throw new HttpError(404, 'Referral not found.')
  return referral
}

// Checks the referral as it will be saved (`next` = stored values + changes).
async function check(next, changes, actor) {
  if (changes.beneficiaryId !== undefined && !(await beneficiariesRepo.findById(changes.beneficiaryId))) {
    throw fieldError('beneficiaryId', 'Choose a beneficiary from the list.')
  }
  if (changes.serviceRecordId) {
    const service = await serviceRecordsRepo.findById(changes.serviceRecordId)
    if (!service || service.beneficiary.id !== next.beneficiaryId) {
      throw fieldError('serviceRecordId', "Choose one of this beneficiary's service records.")
    }
  }
  if (changes.collegeId !== undefined) {
    if (!(await collegesRepo.findById(changes.collegeId))) throw fieldError('collegeId', 'Choose a college or department from the list.')
    const scope = collegeScopeOf(actor)
    if (scope && changes.collegeId !== scope) throw fieldError('collegeId', 'You can only refer from your own college or department.')
  }
  if (changes.referredToCollegeId && !(await collegesRepo.findById(changes.referredToCollegeId))) {
    throw fieldError('referredTo', 'Choose a college or department from the list.')
  }
  if (next.referredToCollegeId && next.referredToCollegeId === next.collegeId) {
    throw fieldError('referredTo', 'Choose a different college or department than the referring one.')
  }
  if (!next.referredToCollegeId && !next.referredToFacility) throw fieldError('referredTo', 'Choose where the beneficiary is referred to.')
}

// A referral goes to an MCU college OR an outside facility, never both.
const oneDestination = (data) =>
  data.referredToCollegeId ? { ...data, referredToFacility: null } : data.referredToFacility ? { ...data, referredToCollegeId: null } : data

export async function create(data, actor) {
  const next = oneDestination(data)
  await check(next, next, actor)
  return repo.create(next, actor.id)
}

// Returns { before, after } so callers can audit the change.
export async function update(id, changes, actor) {
  const before = await get(id, actor)
  const stored = {
    beneficiaryId: before.beneficiary.id,
    collegeId: before.college.id,
    referredToCollegeId: before.referredToCollege?.id ?? null,
    referredToFacility: before.referredToFacility,
  }
  const next = oneDestination(changes)
  await check({ ...stored, ...next }, next, actor)
  const after = await repo.update(id, next, actor.id)
  return { before, after }
}

export async function remove(id, actor) {
  const referral = await get(id, actor)
  await repo.remove(id, actor.id)
  return referral
}
