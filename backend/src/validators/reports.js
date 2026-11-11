import { z } from 'zod'

export const REPORT_TYPES = ['barangays', 'programs', 'services', 'beneficiary', 'community']

const date = z.iso.date({ error: 'Enter a valid date.' })
const id = z.coerce.number().int().positive()

// Filters shared by all reports; each report uses the ones that apply to it.
export const reportQuerySchema = z
  .object({
    from: date.optional(),
    to: date.optional(),
    barangayId: id.optional(),
    programId: z.union([id, z.literal('none')]).optional(), // 'none' = services without a program
    collegeId: id.optional(),
    beneficiaryId: id.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: 'The start date must be before the end date.', path: ['from'] })

export const reportTypeSchema = z.object({ type: z.enum(REPORT_TYPES) })
