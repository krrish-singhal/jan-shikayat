import { Router } from 'express';
import { TranslationController } from '../controllers/translationController.js';
import { authenticate, requireActiveAccount } from '../middleware/auth.js';

const router = Router();

// Public language metadata endpoint
router.get('/languages', TranslationController.getSupportedLanguages);

// Authenticated user language preferences
router.get('/me/language', authenticate, requireActiveAccount, TranslationController.getUserLanguage);
router.patch('/me/language', authenticate, requireActiveAccount, TranslationController.updateUserLanguage);

// Dynamic translation endpoints
router.post('/translation/translate', authenticate, requireActiveAccount, TranslationController.translate);
router.post('/translation/detect-language', TranslationController.detectLanguage);

export default router;
