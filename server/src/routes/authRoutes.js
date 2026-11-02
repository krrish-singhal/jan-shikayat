import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireActiveAccount } from '../middleware/auth.js';
import {
  citizenRegisterSchema,
  citizenLoginSchema,
  staffLoginSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

// Public auth endpoints
router.post('/register', validate(citizenRegisterSchema), AuthController.registerCitizen);
router.post('/login', validate(citizenLoginSchema), AuthController.loginCitizen);
router.post('/staff/login', validate(staffLoginSchema), AuthController.loginStaff);
router.post('/google', AuthController.googleAuth);
router.get('/google/callback', (req, res) => {
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?${new URLSearchParams(req.query).toString()}`);
});
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
