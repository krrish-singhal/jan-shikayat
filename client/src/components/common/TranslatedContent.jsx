import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../../services/api.js';

export const TranslatedContent = ({
  text,
  complaintId,
  sourceLanguage = 'en',
  className = '',
  textClassName = '',
}) => {
  const { t, i18n } = useTranslation('common');
  const activeLang = i18n.language ? i18n.language.split('-')[0] : 'en';

  const [translatedText, setTranslatedText] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If target is English or source is same, no translation needed
    if (!text || activeLang === 'en' || activeLang === sourceLanguage) {
      setTranslatedText('');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchTranslation = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await api.post('/translation/translate', {
          text,
          sourceLanguage,
          targetLanguage: activeLang,
          complaintId,
        });

        if (isMounted && res.data?.success) {
          setTranslatedText(res.data.data.translatedText || text);
        }
      } catch (err) {
        if (isMounted) {
          // Graceful fallback to original text without breaking
          setError(true);
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, activeLang, sourceLanguage, complaintId]);

  if (!text) return null;

  // In English view, simply display original text
  if (activeLang === 'en' || !translatedText || translatedText === text) {
    return <div className={className}><p className={textClassName}>{text}</p></div>;
  }

  const displayText = showOriginal ? text : translatedText;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className={textClassName}>{displayText}</p>

      {/* Official AI4Bharat IndicTrans2 Attribution & Toggle Badge */}
      <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
        <button
          type="button"
          onClick={() => setShowOriginal(!showOriginal)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0f3b68] hover:bg-blue-100 border border-blue-200 transition-colors"
          title="Toggle between original and machine translated text"
        >
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          <span>
            {showOriginal
              ? t('viewTranslated', 'View Translation')
              : t('translatedAutomatically', 'Translated automatically – view original')}
          </span>
        </button>

        {showOriginal && (
          <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
            {t('originalText', 'Authoritative Original')}
          </span>
        )}

        {loading && (
          <span className="text-[10px] text-slate-400 italic">
            {t('translating', 'Translating...')}
          </span>
        )}
      </div>
    </div>
  );
};
