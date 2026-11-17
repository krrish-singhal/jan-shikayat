import { Router } from 'express';
import { NoticeController } from '../controllers/noticeController.js';
import { authenticate, requireActiveAccount, authorizeRoles } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public route to fetch notices for home page
router.get('/', NoticeController.getPublicNotices);

// Protected Admin routes
router.get('/admin', authenticate, requireActiveAccount, authorizeRoles(ROLES.ADMIN), NoticeController.getAllNoticesAdmin);
router.post('/admin', authenticate, requireActiveAccount, authorizeRoles(ROLES.ADMIN), NoticeController.createNotice);
router.patch('/admin/:id', authenticate, requireActiveAccount, authorizeRoles(ROLES.ADMIN), NoticeController.updateNotice);
router.delete('/admin/:id', authenticate, requireActiveAccount, authorizeRoles(ROLES.ADMIN), NoticeController.deleteNotice);

export default router;
