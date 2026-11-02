import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(100),
  description: z.string().trim().max(300).optional().default(''),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(100).optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
});
