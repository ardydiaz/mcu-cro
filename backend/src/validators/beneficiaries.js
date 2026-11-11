import { z } from 'zod'
import { optionalPhone, optionalText, todayInManila } from './common.js'

export const SEXES = ['male', 'female']
export const CIVIL_STATUSES = ['single', 'married', 'widowed', 'separated']
export const EDUCATION_LEVELS = ['none', 'elementary', 'high_school', 'senior_high', 'vocational', 'college', 'postgraduate']

const requiredName = (label) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(80, `The ${label} is too long.`)

const birthDate = z
  .iso.date({ error: 'Enter a valid birth date.' })
  .refine((d) => d >= '1900-01-01', 'Enter a valid birth date.')
  .refine((d) => d <= todayInManila(), "The birth date can't be in the future.")

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.union([z.literal(''), z.email('Enter a valid email address.').max(254)]))
  .transform((v) => v || null)
  .nullable()
  .optional()

// Fields from the requirements' example Beneficiary Profile (Project 2, Step 4).
const profile = {
  firstName: requiredName('first name'),
  middleName: optionalText(80, 'Middle name'),
  lastName: requiredName('last name'),
  suffix: optionalText(10, 'Suffix'),
  birthDate,
  sex: z.enum(SEXES, { error: 'Choose the sex.' }),
  civilStatus: z.enum(CIVIL_STATUSES, { error: 'Choose a valid civil status.' }).nullable().optional(),
  barangayId: z.number({ error: 'Choose the barangay.' }).int().positive('Choose the barangay.'),
  address: optionalText(255, 'Address'),
  contactNumber: optionalPhone,
  email,
  householdSize: z
    .number({ error: 'Enter a number from 1 to 50.' })
    .int('Enter a whole number.')
    .min(1, 'Enter a number from 1 to 50.')
    .max(50, 'Enter a number from 1 to 50.')
    .nullable()
    .optional(),
  emergencyContactName: optionalText(160, 'Emergency contact name'),
  emergencyContactNumber: optionalPhone,
  occupation: optionalText(80, 'Occupation'),
  education: z.enum(EDUCATION_LEVELS, { error: 'Choose a valid education level.' }).nullable().optional(),
  isPwd: z.boolean().optional(),
  notes: optionalText(2000, 'Notes'),
}

export const createBeneficiarySchema = z.object({
  ...profile,
  // Data Privacy Act: data may only be encoded once the beneficiary has consented.
  consent: z.literal(true, { error: "Confirm the beneficiary's consent before saving." }),
})

export const updateBeneficiarySchema = z
  .object(profile)
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), 'Nothing to update.')

export const listBeneficiariesSchema = z.object({
  search: z.string().trim().max(100).optional(),
  barangayId: z.coerce.number().int().positive().optional(),
  sex: z.enum(SEXES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
