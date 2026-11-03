import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../constants/languages.js';
import { translationService } from '../services/translation/translationService.js';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TranslationController {
  /**
   * GET /api/v1/languages
   * Returns metadata for all supported languages
   */
  static async getSupportedLanguages(req, res) {
    return sendSuccess(res, {
      languages: SUPPORTED_LANGUAGES,
      defaultLanguage: DEFAULT_LANGUAGE,
      total: SUPPORTED_LANGUAGES.length,
    });
  }

  /**
   * GET /api/v1/me/language
   * Returns current authenticated user's preferred language
   */
  static async getUserLanguage(req, res) {
    return sendSuccess(res, {
      preferredLanguage: req.user.preferredLanguage || DEFAULT_LANGUAGE,
    });
  }

  /**
   * PATCH /api/v1/me/language
   * Updates user's preferred language
   */
  static async updateUserLanguage(req, res) {
    const { language } = req.body;

    if (!language || typeof language !== 'string') {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Language code is required and must be a string.',
        },
        400
      );
    }

    const normLang = language.toLowerCase().trim();

    if (!SUPPORTED_LANGUAGE_CODES.includes(normLang)) {
      return sendError(
        res,
        {
          code: 'INVALID_LANGUAGE',
          message: `Unsupported language code: '${language}'. Supported languages: ${SUPPORTED_LANGUAGE_CODES.join(', ')}`,
        },
        400
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredLanguage: normLang },
      { new: true }
    );

    return sendSuccess(res, {
      preferredLanguage: user.preferredLanguage,
    });
  }

  /**
   * POST /api/v1/translation/translate
   * Translates dynamic municipal content with caching and authorization
   */
  static async translate(req, res) {
    const { text, sourceLanguage = 'en', targetLanguage, complaintId } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Text to translate is required.',
        },
        400
      );
    }

    if (!targetLanguage || typeof targetLanguage !== 'string') {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Target language is required.',
        },
        400
      );
    }

    const normTarget = targetLanguage.toLowerCase().trim();
    if (!SUPPORTED_LANGUAGE_CODES.includes(normTarget)) {
      return sendError(
        res,
        {
          code: 'INVALID_LANGUAGE',
          message: `Target language '${targetLanguage}' is not supported. Supported: ${SUPPORTED_LANGUAGE_CODES.join(', ')}`,
        },
        400
      );
    }

    // Authorization check if translating specific complaint content
    if (complaintId) {
      const complaint = await Complaint.findById(complaintId);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found.' }, 404);
      }

      const isCitizenOwner =
        req.user.role === ROLES.CITIZEN &&
        complaint.citizenId.toString() === req.user._id.toString();

      const isOperatorInDept =
        req.user.role === ROLES.OPERATOR &&
        req.user.departmentId?.toString() === complaint.departmentId.toString();

      const isEngineerInDeptOrAssigned =
        req.user.role === ROLES.ENGINEER &&
        (complaint.assignedEngineerId?.toString() === req.user._id.toString() ||
          req.user.departmentId?.toString() === complaint.departmentId.toString());

      const isAdmin = req.user.role === ROLES.ADMIN;

      if (!isCitizenOwner && !isOperatorInDept && !isEngineerInDeptOrAssigned && !isAdmin) {
        return sendError(
          res,
          {
            code: 'FORBIDDEN',
            message: 'You are not authorized to access or translate content for this complaint.',
          },
          403
        );
      }
    }

    try {
      const translation = await translationService.translate({
        text,
        sourceLanguage,
        targetLanguage: normTarget,
      });

      return sendSuccess(res, translation);
    } catch (err) {
      console.error('[TranslationController Error]', err);
      return sendError(
        res,
        {
          code: 'TRANSLATION_ERROR',
          message: err.message || 'Failed to translate content',
        },
        500
      );
    }
  }

  /**
   * POST /api/v1/translation/detect-language
   * Detects language and script
   */
  static async detectLanguage(req, res) {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return sendError(
        res,
        {
          code: 'VALIDATION_ERROR',
          message: 'Text is required for language detection.',
        },
        400
      );
    }

    try {
      const detection = await translationService.detectLanguage(text);
      return sendSuccess(res, detection);
    } catch (err) {
      console.error('[Detection Error]', err);
      return sendError(
        res,
        {
          code: 'DETECTION_ERROR',
          message: err.message || 'Failed to detect language',
        },
        500
      );
    }
  }
}
