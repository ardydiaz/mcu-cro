// Website content workflow (requirements Step 7): colleges prepare materials
// and activity documentation and submit them; CRO staff review and publish.
//   draft → (submit) → pending → (publish) → published
//                           └──→ (send back with a note) → rejected → edit → submit …
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import { collegeScopeOf } from '../../middleware/applyScope.js'
import { HttpError } from '../../utils/httpError.js'
import { db } from '../../config/db.js'
import * as barangaysRepo from '../barangays/barangays.repository.js'
import * as collegesRepo from '../colleges/colleges.repository.js'
import * as programsRepo from '../programs/programs.repository.js'
import * as postsRepo from './posts.repository.js'
import * as resourcesRepo from './resources.repository.js'

const REPOS = { resource: resourcesRepo, post: postsRepo }
const LABEL = { resource: 'Learning material', post: 'Post' }

const fieldError = (field, message) => new HttpError(400, 'Please check the highlighted fields.', [{ field, message }])
export const isPublisher = (actor) => actor.roles.some((role) => CONTENT_PUBLISHERS.includes(role))

// Status fields for the requested action (an edit without an action keeps the status).
function workflow(action, actor, current) {
  if (action === 'publish') {
    if (!isPublisher(actor)) throw new HttpError(403, 'Only CRO staff can publish. Submit it for review instead.')
    return { status: 'published', publishedAt: current?.publishedAt ?? new Date(), reviewedBy: actor.id, reviewNote: null }
  }
  if (action === 'submit') return { status: 'pending' }
  return { status: 'draft' }
}

// College users work on their own college's items, and can't change published ones.
function assertCanEdit(item, actor) {
  const scope = collegeScopeOf(actor)
  if (!scope) return
  if (item.college?.id !== scope) throw new HttpError(404, `${LABEL[item.kind ? 'post' : 'resource']} not found.`)
  if (item.status === 'published') {
    throw new HttpError(403, 'This is already published on the website. Ask CRO staff if it needs changes.')
  }
}

async function assertFile(fileId, field, { image = false } = {}) {
  if (!fileId) return
  const [[file]] = await db.query('SELECT mime_type FROM files WHERE id = ?', [fileId])
  if (!file) throw fieldError(field, 'Upload the file again.')
  if (image && !file.mime_type.startsWith('image/')) throw fieldError(field, 'Choose an image (JPG, PNG or WebP).')
}

// ---------- Shared: get, list, review, remove ----------
export async function get(kind, id, actor) {
  const item = await REPOS[kind].findById(id, { scopeCollegeId: collegeScopeOf(actor) })
  if (!item) throw new HttpError(404, `${LABEL[kind]} not found.`)
  return item
}

export const list = (kind, filters, actor, today) => REPOS[kind].list(filters, { scopeCollegeId: collegeScopeOf(actor), today })

// decision: publish | reject (send back with a note) | unpublish (back to draft)
export async function review(kind, id, { decision, note }, actor) {
  const before = await get(kind, id, actor)
  const changes =
    decision === 'publish'
      ? workflow('publish', actor, before)
      : decision === 'reject'
        ? { status: 'rejected', reviewNote: note, reviewedBy: actor.id }
        : { status: 'draft', reviewedBy: actor.id }
  if (kind === 'post' && decision === 'publish' && !before.publishedAt) {
    changes.slug = await postsRepo.uniqueSlug(before.title, before.id)
  }
  return { before, after: await REPOS[kind].update(id, changes, actor.id) }
}

export async function remove(kind, id, actor) {
  const item = await get(kind, id, actor)
  assertCanEdit(item, actor)
  await REPOS[kind].remove(id, actor.id)
  return item
}

// ---------- Learning resources ----------
async function checkResource(data, actor) {
  if (data.collegeId !== undefined) {
    if (!(await collegesRepo.findById(data.collegeId))) throw fieldError('collegeId', 'Choose a college or department from the list.')
    const scope = collegeScopeOf(actor)
    if (scope && data.collegeId !== scope) throw fieldError('collegeId', 'You can only add materials for your own college or department.')
  }
  await assertFile(data.fileId, 'source')
}

export async function createResource({ action, ...data }, actor) {
  await checkResource(data, actor)
  if (!isPublisher(actor)) delete data.isFeatured
  return resourcesRepo.create({ ...data, ...workflow(action, actor) }, actor.id)
}

export async function updateResource(id, { action, ...changes }, actor) {
  const before = await get('resource', id, actor)
  assertCanEdit(before, actor)
  await checkResource(changes, actor)
  if (!isPublisher(actor)) delete changes.isFeatured
  const next = { videoUrl: before.video?.url ?? null, fileId: before.file?.id ?? null, ...changes }
  if (!next.videoUrl && !next.fileId) throw fieldError('source', 'Add a video link or upload a file.')
  const after = await resourcesRepo.update(id, { ...changes, ...(action ? workflow(action, actor, before) : {}) }, actor.id)
  return { before, after }
}

// ---------- Activities and announcements ----------
async function checkPost(data, actor) {
  if (data.barangayId && !(await barangaysRepo.findById(data.barangayId))) throw fieldError('barangayId', 'Choose a barangay from the list.')
  if (data.programId && !(await programsRepo.findById(data.programId))) throw fieldError('programId', 'Choose a program from the list.')
  const scope = collegeScopeOf(actor)
  if (data.collegeId !== undefined && data.collegeId !== null) {
    if (!(await collegesRepo.findById(data.collegeId))) throw fieldError('collegeId', 'Choose a college or department from the list.')
    if (scope && data.collegeId !== scope) throw fieldError('collegeId', 'You can only post for your own college or department.')
  }
  await assertFile(data.coverFileId, 'coverFileId', { image: true })
  for (const photo of data.photos ?? []) await assertFile(photo.fileId, 'photos', { image: true })
}

export async function createPost({ action, ...data }, actor) {
  const scope = collegeScopeOf(actor)
  if (scope) data.collegeId = scope // college posts always belong to their college
  await checkPost(data, actor)
  if (!isPublisher(actor)) delete data.isFeatured
  const slug = await postsRepo.uniqueSlug(data.title)
  return postsRepo.create({ ...data, slug, ...workflow(action, actor) }, actor.id)
}

export async function updatePost(id, { action, ...changes }, actor) {
  const before = await get('post', id, actor)
  assertCanEdit(before, actor)
  if (collegeScopeOf(actor)) delete changes.collegeId
  await checkPost(changes, actor)
  if (!isPublisher(actor)) delete changes.isFeatured
  // The web address stays the same once published, so shared links keep working.
  if (changes.title && !before.publishedAt) changes.slug = await postsRepo.uniqueSlug(changes.title, id)
  const after = await postsRepo.update(id, { ...changes, ...(action ? workflow(action, actor, before) : {}) }, actor.id)
  return { before, after }
}
