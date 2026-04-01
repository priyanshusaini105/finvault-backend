import { z } from 'zod';

export const createRecordSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50),
  date: z.string().datetime('Invalid date format'),
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = createRecordSchema.partial();

export type CreateRecordInput = z.infer<
  typeof createRecordSchema
>;
export type UpdateRecordInput = z.infer<
  typeof updateRecordSchema
>;
