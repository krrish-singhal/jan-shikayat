import { SUPPORTED_LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../../constants/languages.js';
import { translationCacheService } from './translationCacheService.js';
import { translationProvider } from './translationProvider.js';

export const translationService = {
  /**
   * Translate text with full cache integration and language validation
   */
  async translate({ text, sourceLanguage = 'en', targetLanguage = 'hi' }) {
    if (!text || !text.trim()) {
      return {
        originalText: text || '',
        translatedText: text || '',
        sourceLanguage: sourceLanguage || DEFAULT_LANGUAGE,
        targetLanguage: targetLanguage || DEFAULT_LANGUAGE,
        provider: 'none',
        cached: false,
      };
    }

    const normSource = (sourceLanguage || DEFAULT_LANGUAGE).toLowerCase().trim();
    const normTarget = (targetLanguage || DEFAULT_LANGUAGE).toLowerCase().trim();

    if (!SUPPORTED_LANGUAGE_CODES.includes(normTarget)) {
      throw new Error(`Unsupported target language: '${normTarget}'`);
    }

    // Same language: immediate return
    if (normSource === normTarget) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: normSource,
        targetLanguage: normTarget,
        provider: 'none',
        cached: false,
      };
    }

    // Step 1: Check Translation Cache
    const cachedEntry = await translationCacheService.get(text, normSource, normTarget);
    if (cachedEntry) {
      return {
        originalText: text,
        translatedText: cachedEntry.translatedText,
        sourceLanguage: normSource,
        targetLanguage: normTarget,
        provider: cachedEntry.provider || 'indictrans2',
        cached: true,
      };
    }

    // Step 2: Call IndicTrans2 Provider
    const result = await translationProvider.translate({
      text,
      sourceLanguage: normSource,
      targetLanguage: normTarget,
    });

    // Step 3: Cache result if valid and not an offline fallback of identical text
    if (result.translatedText && !result.isServiceOffline) {
      await translationCacheService.set(
        text,
        normSource,
        normTarget,
        result.translatedText,
        result.provider || 'indictrans2'
      );
    }

    return {
      originalText: text,
      translatedText: result.translatedText || text,
      sourceLanguage: normSource,
      targetLanguage: normTarget,
      provider: result.provider || 'indictrans2',
      cached: false,
    };
  },

  /**
   * Detect language of given text
   */
  async detectLanguage(text) {
    if (!text || !text.trim()) {
      return { language: DEFAULT_LANGUAGE, confidence: 1.0, script: 'Latin' };
    }
    return translationProvider.detectLanguage(text);
  },
};
