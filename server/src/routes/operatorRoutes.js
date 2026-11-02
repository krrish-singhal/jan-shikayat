import { Router } from 'express';
import { OperatorController } from '../controllers/operatorController.js';
import { authenticate, requireActiveAccount, authorizeRoles, requireDepartment } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  operatorAcceptSchema,
  operatorRejectSchema,
  operatorForwardSchema,
} from '../validators/complaintValidator.js';

const router = Router();

// Apply operator protection to all operator routes
router.use(authenticate, requireActiveAccount, authorizeRoles(ROLES.OPERATOR), requireDepartment);

router.get('/dashboard', OperatorController.getDashboardStats);
router.get('/complaints', OperatorController.getIncomingQueue);
router.get('/complaints/:id', OperatorController.getComplaintDetail);
router.post('/complaints/:id/accept', validate(operatorAcceptSchema), OperatorController.acceptComplaint);
router.post('/complaints/:id/reject', validate(operatorRejectSchema), OperatorController.rejectComplaint);
router.post('/complaints/:id/forward', validate(operatorForwardSchema), OperatorController.forwardComplaint);
router.get('/history', OperatorController.getComplaintHistory);

export default router;
