import { Router } from 'express';
import { EngineerController } from '../controllers/engineerController.js';
import { authenticate, requireActiveAccount, authorizeRoles, requireDepartment } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  engineerReleaseSchema,
  engineerDenySchema,
  engineerApproveSchema,
  engineerStartSchema,
  engineerCompleteSchema,
} from '../validators/complaintValidator.js';

const router = Router();

// Apply Joint Engineer protection to all engineer routes
router.use(authenticate, requireActiveAccount, authorizeRoles(ROLES.ENGINEER), requireDepartment);

router.get('/capacity', EngineerController.getCapacity);
router.get('/dashboard', EngineerController.getDashboardStats);
router.get('/queue', EngineerController.getVerificationQueue);
router.get('/mine', EngineerController.getMyCases);
router.get('/complaints/:id', EngineerController.getComplaintDetail);

router.post('/complaints/:id/pickup', EngineerController.pickupComplaint);
router.post('/complaints/:id/release', validate(engineerReleaseSchema), EngineerController.releaseComplaint);
router.post('/complaints/:id/deny', validate(engineerDenySchema), EngineerController.denyComplaint);
router.post('/complaints/:id/approve', validate(engineerApproveSchema), EngineerController.approveComplaint);
router.post('/complaints/:id/start', validate(engineerStartSchema), EngineerController.startWork);
router.post('/complaints/:id/complete', upload.single('image'), validate(engineerCompleteSchema), EngineerController.completeWork);

export default router;
