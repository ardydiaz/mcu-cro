import { z } from 'zod'

export const createProgramSchema = z.object({
  name: z.string({ error: 'Enter the program name.' }).trim().min(1, 'Enter the program name.').max(160, 'The name is too long.'),
})
