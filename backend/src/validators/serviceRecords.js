import { z } from 'zod'
import { optionalText, todayInManila } from './common.js'

export const SERVICE_TYPES = ['medical', 'dental', 'optical', 'physical_therapy', 'nursing', 'laboratory', 'pharmacy', 'health_education', 'other']
export const FOLLOW_UP_STATUSES = ['none', 'scheduled', 'completed', 'missed']

const date = (label) => z.iso.date({ error: `Enter a valid ${label}.` }).refine((d) => d >= '2000-01-01', `Enter a valid ${label}.`)
const id = (message) => z.number({ error: message }).int().positive(message)

const fields = {
  beneficiaryId: id('Choose the beneficiary.'),
  serviceDate: date('service date').refine((d) => d <= todayInManila(), "The service date can't be in the future."),
  programId: id('Choose a valid program.').nullable().optional(),
  collegeId: id('Choose the responsible college or department.'),
  serviceType: z.enum(SERVICE_TYPES, { error: 'Choose the type of service.' }),
  findings: optionalText(5000, 'Findings'),
  intervention: optionalText(5000, 'Intervention'),
  recommendation: optionalText(5000, 'Recommendation'),
  followUpDate: date('follow-up date').nullable().optional(),
  followUpStatus: z.enum(FOLLOW_UP_STATUSES, { error: 'Choose a valid follow-up status.' }).optional(),
}

// A scheduled follow-up needs a date.
const followUpNeedsDate = (data) => data.followUpStatus !== 'scheduled' || Boolean(data.followUpDate)
const followUpIssue = { message: 'Enter the follow-up date.', path: ['followUpDate'] }

export const createServiceRecordSchema = z.object(fields).refine(followUpNeedsDate, followUpIssue)

export const updateServiceRecordSchema = z
  .object(fields)
  .omit({ beneficiaryId: true })
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), 'Nothing to update.')

export const listServiceRecordsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  beneficiaryId: z.coerce.number().int().positive().optional(),
  collegeId: z.coerce.number().int().positive().optional(),
  programId: z.coerce.number().int().positive().optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  followUpStatus: z.enum(FOLLOW_UP_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
