import { z } from 'zod';
import { ALL_STATUSES } from '../constants/complaintStatus.js';

export const registerComplaintSchema = z.object({
  departmentId: z.string().min(1, 'Please select a valid department'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
  address: z.string().trim().min(3, 'Address is required (at least 3 characters)'),
  latitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]).optional().nullable(),
  longitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]).optional().nullable(),
});

export const operatorRejectSchema = z.object({
  rejectionReason: z.string().trim().min(5, 'Rejection reason must be at least 5 characters').max(500, 'Rejection reason cannot exceed 500 characters'),
});

export const operatorForwardSchema = z.object({
  targetDepartmentId: z.string().min(1, 'Target department is required'),
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().default(''),
});

export const operatorAcceptSchema = z.object({
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().default(''),
});

export const engineerReleaseSchema = z.object({
  reason: z.string().trim().min(5, 'Release reason must be at least 5 characters').max(500, 'Release reason cannot exceed 500 characters'),
});

export const engineerDenySchema = z.object({
  rejectionReason: z.string().trim().min(5, 'Rejection reason must be at least 5 characters').max(500, 'Rejection reason cannot exceed 500 characters'),
});

export const engineerApproveSchema = z.object({
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().default(''),
});

export const engineerStartSchema = z.object({
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().default(''),
});

export const engineerCompleteSchema = z.object({
  completionNote: z.string().trim().min(5, 'Completion note must be at least 5 characters').max(500, 'Completion note cannot exceed 500 characters'),
});

export const adminOverrideSchema = z.object({
  targetStatus: z.enum(ALL_STATUSES, { errorMap: () => ({ message: 'Invalid target status' }) }),
  explanation: z.string().trim().min(5, 'Override explanation is required (minimum 5 characters)').max(500),
});

export const adminReassignSchema = z.object({
  engineerId: z.string().min(1, 'Target engineer ID is required'),
  force: z.boolean().optional().default(false),
  reason: z.string().trim().min(5, 'Reassignment reason must be at least 5 characters').max(500),
});
