import mongoose from 'mongoose';

const translationCacheSchema = new mongoose.Schema(
  {
    sourceTextHash: {
      type: String,
      required: true,
      index: true,
    },
    sourceLanguage: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    targetLanguage: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    translatedText: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: 'indictrans2',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for instant cache lookup
translationCacheSchema.index(
  { sourceTextHash: 1, sourceLanguage: 1, targetLanguage: 1 },
  { unique: true }
);

export const TranslationCache = mongoose.model('TranslationCache', translationCacheSchema);
