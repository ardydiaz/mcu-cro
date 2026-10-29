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

export const createUserSchema = z.object({
  email,
  name: name.optional(),
  role,
})

export const updateUserSchema = z
  .object({
    name: name.optional(),
    role: role.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), 'Nothing to update.')

export const listUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
})
