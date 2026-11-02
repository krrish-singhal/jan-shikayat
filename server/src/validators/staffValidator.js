import { z } from 'zod';
import { STAFF_ROLES, ROLES } from '../constants/roles.js';

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().optional().or(z.literal('')),
  role: z.enum(STAFF_ROLES, { errorMap: () => ({ message: 'Invalid staff role' }) }),
  departmentId: z.string().optional().nullable(),
  maxActiveCases: z.coerce.number().min(1).max(50).optional().default(5),
}).refine((data) => {
  if ((data.role === ROLES.OPERATOR || data.role === ROLES.ENGINEER) && !data.departmentId) {
    return false;
  }
  return true;
}, {
  message: 'Department is mandatory for Operators and Engineers',
  path: ['departmentId'],
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().optional(),
  departmentId: z.string().optional().nullable(),
  role: z.enum(STAFF_ROLES).optional(),
  maxActiveCases: z.coerce.number().min(1).max(50).optional(),
});
