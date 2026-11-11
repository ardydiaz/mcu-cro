import { Router } from 'express'
import { db } from '../config/db.js'
import validate from '../middleware/validate.js'
import { inquiryLimiter } from '../middleware/rateLimit.js'
import { HttpError } from '../utils/httpError.js'
import { idParamSchema, todayInManila } from '../validators/common.js'
import { createInquirySchema, fileParamSchema, listPostsSchema, listResourcesSchema, slugParamSchema } from '../validators/content.js'
import * as directory from '../modules/content/directory.repository.js'
import * as inquiries from '../modules/content/inquiries.repository.js'
import * as postsRepo from '../modules/content/posts.repository.js'
import * as resourcesRepo from '../modules/content/resources.repository.js'
import * as files from '../modules/files/files.service.js'

// Mounted at /api/public, WITHOUT sign-in: the Community Website (requirements
// Project 1). Read-only, published content only. Beneficiary records are never
// exposed — only aggregate counts (no names, no per-person data).
const router = Router()
const PUBLIC = { publicOnly: true }
const num = (v) => Number(v ?? 0)
const publicList = (schema) => schema.omit({ status: true })

async function impact() {
  const [[row]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM beneficiaries WHERE deleted_at IS NULL) AS beneficiaries,
            (SELECT COUNT(*) FROM service_records s JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
             WHERE s.deleted_at IS NULL) AS services,
            (SELECT COUNT(*) FROM barangays WHERE is_active = TRUE AND is_partner = TRUE) AS barangays,
            (SELECT COUNT(DISTINCT college_id) FROM service_records WHERE deleted_at IS NULL) AS colleges,
            (SELECT COUNT(*) FROM learning_resources WHERE status = 'published' AND deleted_at IS NULL) AS resources`,
  )
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, num(v)]))
}

// Home: announcements, activities, featured learning materials and programs, key figures.
router.get('/home', async (req, res) => {
  const today = todayInManila()
  const options = { ...PUBLIC, today }
  let featured = await resourcesRepo.list({ featured: true, pageSize: 6 }, PUBLIC)
  if (featured.items.length === 0) featured = await resourcesRepo.list({ pageSize: 6 }, PUBLIC)
  res.json({
    announcements: (await postsRepo.list({ kind: 'announcement', pageSize: 3 }, options)).items,
    upcoming: (await postsRepo.list({ kind: 'activity', when: 'upcoming', pageSize: 3 }, options)).items,
    recent: (await postsRepo.list({ kind: 'activity', when: 'past', pageSize: 6 }, options)).items,
    featuredResources: featured.items,
    featuredPrograms: (await directory.programs()).filter((p) => p.isFeatured).slice(0, 6),
    impact: await impact(),
  })
})

// ---------- Learning resources ----------
router.get('/resources', validate(publicList(listResourcesSchema), 'query'), async (req, res) => {
  res.json(await resourcesRepo.list(req.validated.query, PUBLIC))
})

router.get('/resources/topics', async (req, res) => {
  res.json({ topics: await resourcesRepo.topics(PUBLIC) })
})

router.get('/resources/:id', validate(idParamSchema, 'params'), async (req, res) => {
  const resource = await resourcesRepo.findById(req.validated.params.id, PUBLIC)
  if (!resource) throw new HttpError(404, 'This material is not available.')
  res.json(resource)
})

// ---------- Activities and announcements ----------
router.get('/posts', validate(publicList(listPostsSchema), 'query'), async (req, res) => {
  res.json(await postsRepo.list(req.validated.query, { ...PUBLIC, today: todayInManila() }))
})

router.get('/posts/:slug', validate(slugParamSchema, 'params'), async (req, res) => {
  const post = await postsRepo.findBySlug(req.validated.params.slug, PUBLIC)
  if (!post) throw new HttpError(404, 'This page is not available.')
  res.json(post)
})

// ---------- Colleges / departments ----------
router.get('/colleges', async (req, res) => {
  const [counts] = await db.query(
    "SELECT college_id, COUNT(*) AS n FROM learning_resources WHERE status = 'published' AND deleted_at IS NULL GROUP BY college_id",
  )
  const byCollege = Object.fromEntries(counts.map((c) => [c.college_id, num(c.n)]))
  res.json({ colleges: (await directory.colleges()).map((c) => ({ ...c, resourceCount: byCollege[c.id] ?? 0 })) })
})

router.get('/colleges/:slug', validate(slugParamSchema, 'params'), async (req, res) => {
  const college = (await directory.colleges()).find((c) => c.slug === req.validated.params.slug)
  if (!college) throw new HttpError(404, 'College not found.')
  const today = todayInManila()
  res.json({
    college,
    resources: (await resourcesRepo.list({ collegeId: college.id, pageSize: 60 }, PUBLIC)).items,
    activities: (await postsRepo.list({ collegeId: college.id, kind: 'activity', pageSize: 6 }, { ...PUBLIC, today })).items,
  })
})

// ---------- Programs: what each covers, which colleges take part, how far it reaches ----------
router.get('/programs', async (req, res) => {
  const [stats] = await db.query(
    `SELECT s.program_id, COUNT(DISTINCT b.barangay_id) AS barangays, COUNT(*) AS services,
            MAX(s.service_date) AS last_date, GROUP_CONCAT(DISTINCT c.code ORDER BY c.sort_order) AS colleges
     FROM service_records s
     JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     JOIN colleges c ON c.id = s.college_id
     WHERE s.deleted_at IS NULL AND s.program_id IS NOT NULL
     GROUP BY s.program_id`,
  )
  const byProgram = Object.fromEntries(stats.map((s) => [s.program_id, s]))
  res.json({
    programs: (await directory.programs()).map((p) => {
      const s = byProgram[p.id]
      return {
        ...p,
        barangaysReached: num(s?.barangays),
        servicesRendered: num(s?.services),
        lastActivity: s?.last_date ?? null,
        colleges: s?.colleges ? s.colleges.split(',') : [],
      }
    }),
  })
})

// ---------- Partner communities: programs implemented and services available ----------
router.get('/partners', async (req, res) => {
  const [stats] = await db.query(
    `SELECT b.barangay_id, COUNT(DISTINCT s.id) AS services,
            GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR '\n') AS programs,
            GROUP_CONCAT(DISTINCT s.service_type ORDER BY s.service_type) AS service_types,
            GROUP_CONCAT(DISTINCT c.code ORDER BY c.sort_order) AS colleges
     FROM service_records s
     JOIN beneficiaries b ON b.id = s.beneficiary_id AND b.deleted_at IS NULL
     JOIN colleges c ON c.id = s.college_id
     LEFT JOIN programs p ON p.id = s.program_id
     WHERE s.deleted_at IS NULL
     GROUP BY b.barangay_id`,
  )
  const [activities] = await db.query(
    "SELECT barangay_id, COUNT(*) AS n FROM posts WHERE status = 'published' AND deleted_at IS NULL AND barangay_id IS NOT NULL GROUP BY barangay_id",
  )
  const byBarangay = Object.fromEntries(stats.map((s) => [s.barangay_id, s]))
  const activityCount = Object.fromEntries(activities.map((a) => [a.barangay_id, num(a.n)]))
  res.json({
    partners: (await directory.barangays())
      .filter((b) => b.isPartner)
      .map((b) => {
        const s = byBarangay[b.id]
        return {
          ...b,
          servicesRendered: num(s?.services),
          programs: s?.programs ? s.programs.split('\n') : [],
          serviceTypes: s?.service_types ? s.service_types.split(',') : [],
          colleges: s?.colleges ? s.colleges.split(',') : [],
          activities: activityCount[b.id] ?? 0,
        }
      }),
  })
})

// ---------- Contact form ----------
router.post('/inquiries', inquiryLimiter, validate(createInquirySchema), async (req, res) => {
  // Filled-in spam trap: pretend it worked so bots learn nothing.
  if (req.body.website) return res.status(201).json({ ok: true })
  await inquiries.create(req.body, req.ip)
  res.status(201).json({ ok: true })
})

// ---------- Files of published content ----------
router.get('/files/:id', validate(fileParamSchema, 'params'), async (req, res) => {
  const { id } = req.validated.params
  const file = (await files.isPublic(id)) && (await files.findById(id))
  if (!file) throw new HttpError(404, 'File not found.')
  await files.sendFile(res, file, { cache: true })
})

export default router
