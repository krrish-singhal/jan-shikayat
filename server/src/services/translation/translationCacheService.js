import crypto from 'crypto';
import { TranslationCache } from '../../models/TranslationCache.js';

/**
 * Computes deterministic SHA-256 hash for source text
 */
export function hashText(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

export const translationCacheService = {
  /**
   * Look up cached translation
   */
  async get(text, sourceLanguage, targetLanguage) {
    if (!text || !text.trim()) return null;

    const sourceTextHash = hashText(text);
    const entry = await TranslationCache.findOne({
      sourceTextHash,
      sourceLanguage: sourceLanguage.toLowerCase(),
      targetLanguage: targetLanguage.toLowerCase(),
    }).lean();

    return entry;
  },

  /**
   * Save translation to cache
   */
  async set(originalText, sourceLanguage, targetLanguage, translatedText, provider = 'indictrans2') {
    if (!originalText || !originalText.trim() || !translatedText) return null;

    const sourceTextHash = hashText(originalText);

    try {
      const entry = await TranslationCache.findOneAndUpdate(
        {
          sourceTextHash,
          sourceLanguage: sourceLanguage.toLowerCase(),
          targetLanguage: targetLanguage.toLowerCase(),
        },
        {
          sourceTextHash,
          sourceLanguage: sourceLanguage.toLowerCase(),
          targetLanguage: targetLanguage.toLowerCase(),
          originalText,
          translatedText,
          provider,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return entry;
    } catch (err) {
      console.warn(`[Translation Cache Error] Failed to persist cache: ${err.message}`);
      return null;
    }
  },
};
