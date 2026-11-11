import { z } from 'zod'

const name = (label) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(120, `The ${label} is too long.`)

export const createBarangaySchema = z.object({
  name: name('barangay name'),
  city: name('city or municipality'),
})
