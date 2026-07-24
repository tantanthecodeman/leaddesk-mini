import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  budgetRange: z.enum(['<1k', '1k-5k', '5k-20k', '20k+'], {
    message: 'Select a budget range',
  }),
  message: z.string().trim().min(10, 'Tell us a bit more (10+ characters)'),
})

export type LeadInput = z.infer<typeof leadSchema>

export const statusSchema = z.enum(['New', 'Contacted', 'Closed'])