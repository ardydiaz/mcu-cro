import { Router } from 'express'
import { audit, diff } from '../../middleware/auditLog.js'
import { collegeScopeOf } from '../../middleware/applyScope.js'
import requireRole from '../../middleware/requireRole.js'
import validate from '../../middleware/validate.js'
import { CONTENT_PUBLISHERS } from '../../constants/roles.js'
import { HttpError } from '../../utils/httpError.js'
import { idParamSchema, todayInManila } from '../../validators/common.js'
import {
  createPostSchema,
  createResourceSchema,
  listInquiriesSchema,
  listPostsSchema,
  listResourcesSchema,
  reviewSchema,
  updateBarangayInfoSchema,
  updateCollegeInfoSchema,
  updateInquirySchema,
  updatePostSchema,
  updateProgramInfoSchema,
  updateResourceSchema,
} from '../../validators/content.js'
import * as directory from './directory.repository.js'
import * as inquiries from './inquiries.repository.js'
import * as postsRepo from './posts.repository.js'
import * as resourcesRepo from './resources.repository.js'
import * as service from './content.service.js'

// Mounted at /api/admin/content: the website's content management (requirements Project 1).
const router = Router()
const byId = validate(idParamSchema, 'params')
const publishersOnly = requireRole(...CONTENT_PUBLISHERS)
const changedFields = (before, after) => Object.keys(diff(before, after)).filter((k) => !['updatedAt', 'photos'].includes(k))

// Badges: items waiting for review and new messages.
router.get('/summary', async (req, res) => {
  const scope = collegeScopeOf(req.user)
  res.json({
    pendingResources: await resourcesRepo.countByStatus('pending', scope),
    pendingPosts: await postsRepo.countByStatus('pending', scope),
    newMessages: service.isPublisher(req.user) ? await inquiries.countNew() : 0,
  })
})

// Learning resources and posts share the same routes and workflow.
for (const [path, kind, schemas] of [
  ['resources', 'resource', { list: listResourcesSchema, create: createResourceSchema, update: updateResourceSchema }],
  ['posts', 'post', { list: listPostsSchema, create: createPostSchema, update: updatePostSchema }],
]) {
  const entity = (item) => ({ entityType: kind, entityId: item.id })

  router.get(`/${path}`, validate(schemas.list, 'query'), async (req, res) => {
    res.json(await service.list(kind, req.validated.query, req.user, todayInManila()))
  })

  router.get(`/${path}/:id`, byId, async (req, res) => {
    res.json(await service.get(kind, req.validated.params.id, req.user))
  })

  router.post(`/${path}`, validate(schemas.create), async (req, res) => {
    const item = kind === 'resource' ? await service.createResource(req.body, req.user) : await service.createPost(req.body, req.user)
    await audit(req, `${kind}.create`, { ...entity(item), details: { title: item.title, status: item.status } })
    res.status(201).json(item)
  })

  router.patch(`/${path}/:id`, byId, validate(schemas.update), async (req, res) => {
    const id = req.validated.params.id
    const { before, after } = kind === 'resource' ? await service.updateResource(id, req.body, req.user) : await service.updatePost(id, req.body, req.user)
    await audit(req, `${kind}.update`, { ...entity(after), details: { title: after.title, fields: changedFields(before, after), status: after.status } })
    res.json(after)
  })

  router.post(`/${path}/:id/review`, publishersOnly, byId, validate(reviewSchema), async (req, res) => {
    const { after } = await service.review(kind, req.validated.params.id, req.body, req.user)
    await audit(req, `${kind}.${req.body.decision}`, { ...entity(after), details: { title: after.title, note: req.body.note } })
    res.json(after)
  })

  router.delete(`/${path}/:id`, byId, async (req, res) => {
    const item = await service.remove(kind, req.validated.params.id, req.user)
    await audit(req, `${kind}.delete`, { ...entity(item), details: { title: item.title } })
    res.status(204).end()
  })
}

// Topic suggestions for the material form.
router.get('/topics', async (req, res) => {
  res.json({ topics: await resourcesRepo.topics({ scopeCollegeId: null }) })
})

// ---------- Directory ----------
router.get('/directory', async (req, res) => {
  res.json({ colleges: await directory.colleges(), programs: await directory.programs(), barangays: await directory.barangays() })
})

// College users may describe their own college; CRO staff any college.
router.patch('/directory/colleges/:id', byId, validate(updateCollegeInfoSchema), async (req, res) => {
  const id = req.validated.params.id
  const scope = collegeScopeOf(req.user)
  if (scope ? scope !== id : !service.isPublisher(req.user)) throw new HttpError(403, 'Forbidden')
  const college = await directory.updateCollege(id, req.body)
  if (!college) throw new HttpError(404, 'College not found.')
  await audit(req, 'college.update_info', { entityType: 'college', entityId: id })
  res.json(college)
})

router.patch('/directory/programs/:id', publishersOnly, byId, validate(updateProgramInfoSchema), async (req, res) => {
  const program = await directory.updateProgram(req.validated.params.id, req.body)
  if (!program) throw new HttpError(404, 'Program not found.')
  await audit(req, 'program.update_info', { entityType: 'program', entityId: program.id })
  res.json(program)
})

router.patch('/directory/barangays/:id', publishersOnly, byId, validate(updateBarangayInfoSchema), async (req, res) => {
  const barangay = await directory.updateBarangay(req.validated.params.id, req.body)
  if (!barangay) throw new HttpError(404, 'Barangay not found.')
  await audit(req, 'barangay.update_info', { entityType: 'barangay', entityId: barangay.id })
  res.json(barangay)
})

// ---------- Messages from the contact form ----------
router.get('/inquiries', publishersOnly, validate(listInquiriesSchema, 'query'), async (req, res) => {
  res.json(await inquiries.list(req.validated.query))
})

router.patch('/inquiries/:id', publishersOnly, byId, validate(updateInquirySchema), async (req, res) => {
  const inquiry = await inquiries.setStatus(req.validated.params.id, req.body.status, req.user.id)
  if (!inquiry) throw new HttpError(404, 'Message not found.')
  await audit(req, 'inquiry.update', { entityType: 'inquiry', entityId: inquiry.id, details: { status: inquiry.status } })
  res.json(inquiry)
})

export default router
