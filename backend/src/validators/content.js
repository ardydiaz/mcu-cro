import { z } from 'zod'
import { parseVideoUrl } from '../utils/videos.js'
import { optionalPhone, optionalText } from './common.js'

export const RESOURCE_TYPES = ['video', 'module', 'pamphlet', 'presentation', 'health_info', 'other']
export const LANGUAGES = ['fil', 'en', 'both']
export const POST_KINDS = ['activity', 'announcement']
export const CONTENT_STATUSES = ['draft', 'pending', 'published', 'rejected']
export const INQUIRY_TOPICS = ['general', 'partnership', 'service_request', 'learning_materials']

const requiredText = (max, message) => z.string({ error: message }).trim().min(1, message).max(max, 'This is too long.')
const id = (message) => z.number({ error: message }).int().positive(message)
const fileId = z.uuid({ error: 'Upload the file again.' })

const videoUrl = z
  .string()
  .trim()
  .transform((v) => v || null)
  .refine((v) => v === null || parseVideoUrl(v), 'Paste a YouTube, Facebook or Vimeo video link.')
  .nullable()
  .optional()

// What the editor wants to do with the item when saving: keep it as a draft,
// send it to CRO for review, or (CRO staff only) publish it straight away.
const actions = z.enum(['draft', 'submit', 'publish'])
const action = actions.default('draft')

// ---------- Learning resources ----------
const resourceFields = {
  collegeId: id('Choose the college or department.'),
  topic: requiredText(120, 'Enter the topic (e.g. Diabetes, Dental care, Nutrition).'),
  type: z.enum(RESOURCE_TYPES, { error: 'Choose the type of material.' }),
  title: requiredText(200, 'Enter the title.'),
  description: optionalText(3000, 'Description'),
  videoUrl,
  fileId: fileId.nullable().optional(),
  language: z.enum(LANGUAGES).optional(),
  isFeatured: z.boolean().optional(),
}

const hasSource = (data) => Boolean(data.videoUrl || data.fileId)
const sourceIssue = { message: 'Add a video link or upload a file.', path: ['source'] }

export const createResourceSchema = z.object({ ...resourceFields, action }).refine(hasSource, sourceIssue)
export const updateResourceSchema = z.object({ ...resourceFields, action: actions }).partial()

// ---------- Activities and announcements ----------
const postFields = {
  kind: z.enum(POST_KINDS, { error: 'Choose activity or announcement.' }),
  title: requiredText(200, 'Enter the title.'),
  summary: optionalText(500, 'Summary'),
  body: optionalText(20000, 'Text'),
  eventDate: z.iso.date({ error: 'Enter a valid date.' }),
  location: optionalText(200, 'Location'),
  barangayId: id('Choose a valid barangay.').nullable().optional(),
  programId: id('Choose a valid program.').nullable().optional(),
  collegeId: id('Choose a valid college.').nullable().optional(),
  coverFileId: fileId.nullable().optional(),
  photos: z
    .array(z.object({ fileId, caption: optionalText(255, 'Caption') }))
    .max(40, 'Up to 40 photos per activity.')
    .optional(),
  isFeatured: z.boolean().optional(),
}

export const createPostSchema = z.object({ ...postFields, action })
export const updatePostSchema = z.object({ ...postFields, action: actions }).partial()

// ---------- Review (CRO staff) ----------
export const reviewSchema = z
  .object({
    decision: z.enum(['publish', 'reject', 'unpublish'], { error: 'Choose publish or send back.' }),
    note: optionalText(1000, 'Note'),
  })
  .refine((d) => d.decision !== 'reject' || Boolean(d.note), { message: 'Tell the college what to change.', path: ['note'] })

const page = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
}

export const listResourcesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  collegeId: z.coerce.number().int().positive().optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  topic: z.string().trim().max(120).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  ...page,
})

export const listPostsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  kind: z.enum(POST_KINDS).optional(),
  when: z.enum(['upcoming', 'past']).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  collegeId: z.coerce.number().int().positive().optional(),
  barangayId: z.coerce.number().int().positive().optional(),
  ...page,
})

export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(220) })
export const fileParamSchema = z.object({ id: fileId })

// ---------- Directory: public descriptions of colleges, programs, barangays ----------
export const updateCollegeInfoSchema = z.object({
  description: optionalText(3000, 'Description'),
  servicesOffered: optionalText(3000, 'Services offered'),
})
export const updateProgramInfoSchema = z.object({
  description: optionalText(3000, 'Description'),
  isFeatured: z.boolean().optional(),
})
export const updateBarangayInfoSchema = z.object({
  description: optionalText(3000, 'Description'),
  isPartner: z.boolean().optional(),
})

// ---------- Contact form ----------
export const createInquirySchema = z.object({
  topic: z.enum(INQUIRY_TOPICS).default('general'),
  name: requiredText(120, 'Enter your name.'),
  email: z.string({ error: 'Enter your email address.' }).trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(160)),
  phone: optionalPhone,
  organization: optionalText(160, 'Organization'),
  message: requiredText(2000, 'Enter your message.').refine((m) => m.length >= 10, 'Please write a little more (at least 10 characters).'),
  // Spam trap: hidden from people, filled in by bots (the route quietly drops those).
  website: z.string().max(500).optional(),
})

export const listInquiriesSchema = z.object({
  status: z.enum(['new', 'handled', 'archived']).optional(),
  ...page,
})
export const updateInquirySchema = z.object({ status: z.enum(['new', 'handled', 'archived']) })
