import { z } from 'zod'
import { ALL_ROLES } from '../constants/roles.js'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254))

// Empty string clears the name.
const name = z
  .string()
  .trim()
  .max(160, 'Name is too long.')
  .transform((v) => v || null)

const role = z.enum(ALL_ROLES, { error: 'Choose a valid role.' })

// Required (and checked against the colleges table) only for College/Department users.
const collegeId = z.number({ error: 'Choose a valid college or department.' }).int().positive().nullable()

// Community Coordinators only: the barangays whose beneficiaries they handle.
const barangayIds = z
  .array(z.number().int().positive(), { error: 'Choose valid barangays.' })
  .max(500)
  .transform((ids) => [...new Set(ids)])

export const createUserSchema = z.object({
  email,
  name: name.optional(),
  role,
  collegeId: collegeId.optional(),
  barangayIds: barangayIds.optional(),
})

export const updateUserSchema = z
  .object({
    name: name.optional(),
    role: role.optional(),
    collegeId: collegeId.optional(),
    barangayIds: barangayIds.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), 'Nothing to update.')

export const listUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
})
