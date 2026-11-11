import { beneficiaryScopeOf, collegeScopeOf, recordScopeOf } from '../../middleware/applyScope.js'
import { HttpError } from '../../utils/httpError.js'
import * as beneficiariesRepo from '../beneficiaries/beneficiaries.repository.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as programsRepo from '../programs/programs.repository.js'
import * as repo from './serviceRecords.repository.js'

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])

export const list = (filters, actor) => repo.list(filters, recordScopeOf(actor))

// Records outside the user's scope look the same as missing ones.
export async function get(id, actor) {
  const record = await repo.findById(id, recordScopeOf(actor))
  if (!record) throw new HttpError(404, 'Service record not found.')
  return record
}

async function checkReferences({ beneficiaryId, programId, collegeId }, actor) {
  // Services can only be recorded for beneficiaries the user may see (assigned
  // to their college, or in their barangays).
  if (beneficiaryId !== undefined && !(await beneficiariesRepo.findById(beneficiaryId, beneficiaryScopeOf(actor)))) {
    throw fieldError('beneficiaryId', 'Choose a beneficiary from the list.')
  }
  if (programId && !(await programsRepo.findById(programId))) throw fieldError('programId', 'Choose a program from the list.')
  if (collegeId !== undefined) {
    if (!(await collegesRepo.findById(collegeId))) throw fieldError('collegeId', 'Choose a college or department from the list.')
    const scope = collegeScopeOf(actor)
    if (scope && collegeId !== scope) throw fieldError('collegeId', 'You can only record services for your own college or department.')
  }
}

// A follow-up date without a status means the follow-up is scheduled.
function normalizeFollowUp(next) {
  const status = next.followUpDate && (!next.followUpStatus || next.followUpStatus === 'none') ? 'scheduled' : next.followUpStatus
  if (status === 'scheduled' && !next.followUpDate) throw fieldError('followUpDate', 'Enter the follow-up date.')
  return status ?? 'none'
}

export async function create(data, actor) {
  await checkReferences(data, actor)
  return repo.create({ ...data, followUpStatus: normalizeFollowUp(data) }, actor.id)
}

// Returns { before, after } so callers can audit the change.
export async function update(id, changes, actor) {
  const before = await get(id, actor)
  await checkReferences(changes, actor)
  const merged = { followUpDate: before.followUpDate, followUpStatus: before.followUpStatus, ...changes }
  const after = await repo.update(id, { ...changes, followUpStatus: normalizeFollowUp(merged) }, actor.id)
  return { before, after }
}

export async function remove(id, actor) {
  const record = await get(id, actor)
  await repo.remove(id, actor.id)
  return record
}
