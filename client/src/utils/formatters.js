import { DEFAULT_LANGUAGE, LANGUAGE_LOOKUP } from '../constants/languages.js';

/**
 * Standardize language code to valid BCP 47 locale
 */
export function getBcp47Locale(langCode = DEFAULT_LANGUAGE) {
  const map = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
    pa: 'pa-IN',
    gu: 'gu-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    or: 'or-IN',
    as: 'as-IN',
  };
  return map[langCode] || langCode || 'en-IN';
}

/**
 * Format date in a language-aware manner using Intl.DateTimeFormat
 */
export function formatDate(date, langCode = DEFAULT_LANGUAGE, options = {}) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    const locale = getBcp47Locale(langCode);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.warn('[Format Date Error]', err);
    return String(date);
  }
}

/**
 * Format date and time in a language-aware manner
 */
export function formatDateTime(date, langCode = DEFAULT_LANGUAGE, options = {}) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    const locale = getBcp47Locale(langCode);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.warn('[Format DateTime Error]', err);
    return String(date);
  }
}

/**
 * Format numbers with language/locale awareness (e.g. Indian numbering system like 1,00,000)
 */
export function formatNumber(number, langCode = DEFAULT_LANGUAGE, options = {}) {
  if (number === null || number === undefined || isNaN(number)) return '0';
  try {
    const locale = getBcp47Locale(langCode);
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (err) {
    console.warn('[Format Number Error]', err);
    return String(number);
  }
}

/**
 * Format currency with language/locale awareness (INR default)
 */
export function formatCurrency(amount, langCode = DEFAULT_LANGUAGE, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  try {
    const locale = getBcp47Locale(langCode);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (err) {
    return `₹${amount}`;
  }
}

/**
 * Get reading direction (LTR/RTL) for a language code
 */
export function getLanguageDirection(langCode = DEFAULT_LANGUAGE) {
  const lang = LANGUAGE_LOOKUP[langCode];
  return lang?.direction || 'ltr';
}

/**
 * Resolve full public URL for uploaded media or external URLs
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:5000';
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${apiBase}${cleanPath}`;
}
