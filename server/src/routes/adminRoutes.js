import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireActiveAccount, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { createStaffSchema, updateStaffSchema } from '../validators/staffValidator.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/departmentValidator.js';
import { adminOverrideSchema, adminReassignSchema } from '../validators/complaintValidator.js';

const router = Router();

// Apply Admin protection to all admin routes
router.use(authenticate, requireActiveAccount, authorizeRoles(ROLES.ADMIN));

// 7.1 Analytics
router.get('/stats', AdminController.getDashboardStats);

// 7.2 Staff Management
router.get('/staff', AdminController.getStaffList);
router.get('/staff/:id', AdminController.getStaffDetail);
router.post('/staff', validate(createStaffSchema), AdminController.createStaff);
router.patch('/staff/:id', validate(updateStaffSchema), AdminController.updateStaff);
router.patch('/staff/:id/status', AdminController.toggleStaffStatus);
router.post('/staff/:id/reset-password', AdminController.resetStaffPassword);

// 7.3 Department Management
router.get('/departments', AdminController.getDepartments);
router.post('/departments', validate(createDepartmentSchema), AdminController.createDepartment);
router.patch('/departments/:id', validate(updateDepartmentSchema), AdminController.updateDepartment);
router.delete('/departments/:id', AdminController.deactivateDepartment);

// 7.4 Complaint Management & Overrides
router.get('/complaints', AdminController.getAllComplaints);
router.get('/complaints/:id', AdminController.getComplaintDetail);
router.patch('/complaints/:id/status', validate(adminOverrideSchema), AdminController.overrideComplaintStatus);
router.patch('/complaints/:id/assign', validate(adminReassignSchema), AdminController.reassignEngineer);
router.patch('/complaints/:id/department', AdminController.changeComplaintDepartment);

// 7.5 Citizen Management
router.get('/citizens', AdminController.getCitizensList);
router.patch('/citizens/:id/block', AdminController.toggleCitizenBlock);
router.delete('/citizens/:id', AdminController.anonymizeCitizen);

// 7.6 Append-Only Audit Logs
router.get('/audit', AdminController.getAuditLogs);

export default router;
