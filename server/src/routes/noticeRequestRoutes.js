import { Router } from 'express';
import { authenticate, requireActiveAccount, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import {
  submitRequest,
  getMyRequests,
  getAdminRequests,
  getAdminPendingCount,
  reviewRequest,
} from '../controllers/noticeRequestController.js';

const router = Router();

// Staff routes — OPERATOR and ENGINEER only
router.post(
  '/',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.OPERATOR, ROLES.ENGINEER),
  submitRequest
);

router.get(
  '/my',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.OPERATOR, ROLES.ENGINEER),
  getMyRequests
);

// Admin routes
router.get(
  '/admin',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.ADMIN),
  getAdminRequests
);

router.get(
  '/admin/count',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.ADMIN),
  getAdminPendingCount
);

router.patch(
  '/admin/:id',
  authenticate,
  requireActiveAccount,
  authorizeRoles(ROLES.ADMIN),
  reviewRequest
);

export default router;
