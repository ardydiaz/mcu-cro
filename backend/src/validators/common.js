import { z } from 'zod'

// Route parameter `:id` for tables with numeric ids. Use with validate(idParamSchema, 'params').
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// Optional free text: trimmed, and an empty string is stored as null.
export const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} is too long.`)
    .transform((v) => v || null)
    .nullable()
    .optional()

// Optional phone number. Spaces, dashes and brackets are removed before checking.
export const optionalPhone = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.union([z.literal(''), z.string().regex(/^\+?\d{7,15}$/, 'Enter a valid phone number.')]))
  .transform((v) => v || null)
  .nullable()
  .optional()

// Today's date in the Philippines (UTC+8), as YYYY-MM-DD.
export const todayInManila = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
