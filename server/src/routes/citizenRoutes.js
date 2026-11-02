import { Router } from 'express';
import { CitizenController } from '../controllers/citizenController.js';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireActiveAccount, authorizeRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/authValidator.js';

const router = Router();

// Publicly available active departments for dropdown
router.get('/departments', CitizenController.getActiveDepartments);

// Authenticated citizen complaint actions
router.post(
  '/complaints',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.CITIZEN),
  upload.single('image'),
  CitizenController.registerComplaint
);

router.get(
  '/complaints',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.CITIZEN),
  CitizenController.getMyComplaints
);

router.get(
  '/complaints/:id',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.CITIZEN),
  CitizenController.getComplaintDetails
);

router.get(
  '/citizen/stats',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.CITIZEN),
  CitizenController.getCitizenStats
);

// Profile management
router.get('/me', authenticate, requireActiveAccount, AuthController.getMe);
router.patch('/me', authenticate, requireActiveAccount, validate(updateProfileSchema), AuthController.updateProfile);
router.post('/me/change-password', authenticate, requireActiveAccount, validate(changePasswordSchema), AuthController.changePassword);
router.delete('/me', authenticate, requireActiveAccount, AuthController.deleteAccount);

// Notifications
router.get('/notifications', authenticate, requireActiveAccount, CitizenController.getNotifications);
router.patch('/notifications/:id/read', authenticate, requireActiveAccount, CitizenController.markNotificationRead);
router.patch('/notifications/read-all', authenticate, requireActiveAccount, CitizenController.markAllNotificationsRead);

export default router;
