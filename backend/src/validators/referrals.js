import { z } from 'zod'
import { optionalText, todayInManila } from './common.js'

export const URGENCIES = ['routine', 'urgent', 'emergency']
export const REFERRAL_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

const id = (message) => z.number({ error: message }).int().positive(message)

const fields = {
  beneficiaryId: id('Choose the beneficiary.'),
  serviceRecordId: id('Choose a valid service record.').nullable().optional(),
  referralDate: z.iso
    .date({ error: 'Enter a valid referral date.' })
    .refine((d) => d >= '2000-01-01', 'Enter a valid referral date.')
    .refine((d) => d <= todayInManila(), "The referral date can't be in the future."),
  collegeId: id('Choose the referring college or department.'),
  referredToCollegeId: id('Choose a valid college or department.').nullable().optional(),
  referredToFacility: optionalText(160, 'Facility name'),
  reason: z.string({ error: 'Enter the reason for referral.' }).trim().min(1, 'Enter the reason for referral.').max(5000, 'The reason is too long.'),
  urgency: z.enum(URGENCIES, { error: 'Choose the urgency.' }).optional(),
  status: z.enum(REFERRAL_STATUSES, { error: 'Choose a valid status.' }).optional(),
  outcome: optionalText(5000, 'Outcome'),
}

const hasDestination = (data) => Boolean(data.referredToCollegeId || data.referredToFacility)
const destinationIssue = { message: 'Choose where the beneficiary is referred to.', path: ['referredTo'] }

export const createReferralSchema = z.object(fields).refine(hasDestination, destinationIssue)

// On update the destination is checked against the stored record (service layer).
export const updateReferralSchema = z
  .object(fields)
  .omit({ beneficiaryId: true })
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), 'Nothing to update.')

export const listReferralsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  beneficiaryId: z.coerce.number().int().positive().optional(),
  serviceRecordId: z.coerce.number().int().positive().optional(),
  collegeId: z.coerce.number().int().positive().optional(),
  status: z.enum([...REFERRAL_STATUSES, 'open']).optional(),
  urgency: z.enum(URGENCIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
