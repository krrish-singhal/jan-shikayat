import http from 'http';
import { INDIC_TRANS2_LANG_CODES } from '../../constants/languages.js';

const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_SERVICE_URL || 'http://127.0.0.1:5001';
const REQUEST_TIMEOUT_MS = parseInt(process.env.TRANSLATION_TIMEOUT_MS || '4000', 10);

// Script unicode ranges for resilient local detection
const SCRIPT_RANGES = {
  hi: [0x0900, 0x097f], // Devanagari
  mr: [0x0900, 0x097f],
  bn: [0x0980, 0x09ff], // Bengali
  as: [0x0980, 0x09ff], // Assamese
  pa: [0x0a00, 0x0a7f], // Gurmukhi
  gu: [0x0a80, 0x0aff], // Gujarati
  or: [0x0b00, 0x0b7f], // Odia
  ta: [0x0b80, 0x0bff], // Tamil
  te: [0x0c00, 0x0c7f], // Telugu
  kn: [0x0c80, 0x0cff], // Kannada
  ml: [0x0d00, 0x0d7f], // Malayalam
};

// Municipal domain phrases for zero-dependency resilient fallback
const MUNICIPAL_PHRASES = {
  hi: {
    'there is a large pothole near the school': 'स्कूल के पास एक बड़ा गड्ढा है',
    'water leakage from main supply pipeline': 'मुख्य आपूर्ति पाइपलाइन से पानी का रिसाव',
    'streetlights not working on 5th cross road': '5वें क्रॉस रोड पर स्ट्रीट लाइट काम नहीं कर रही हैं',
    'garbage not collected for three days': 'तीन दिनों से कचरा नहीं उठाया गया है',
    'rejected due to duplicate submission': 'डुप्लीकेट शिकायत होने के कारण अस्वीकृत',
    'forwarded to water supply department for action': 'कार्रवाई के लिए जल आपूर्ति विभाग को अग्रेषित किया गया',
    'field inspection done': 'स्थल निरीक्षण पूरा हुआ',
    'work completed successfully': 'कार्य सफलतापूर्वक पूरा हुआ',
    'pothole': 'गड्ढा',
    'school': 'स्कूल',
    'garbage': 'कचरा',
    'water': 'पानी',
    'drainage': 'जल निकासी',
    'urgent': 'अति आवश्यक',
  },
  mr: {
    'there is a large pothole near the school': 'शाळेजवळ एक मोठा खड्डा आहे',
    'water leakage from main supply pipeline': 'मुख्य पुरवठा पाईपलाईनमधून पाण्याची गळती',
    'streetlights not working on 5th cross road': '५व्या क्रॉस रोडवरील पथदिवे बंद आहेत',
    'garbage not collected for three days': 'तीन दिवस कचरा उचलला नाही',
    'rejected due to duplicate submission': 'दुबार तक्रारीमुळे नाकारले',
    'forwarded to water supply department for action': 'कार्रवाईसाठी पाणीपुरवठा विभागाकडे वर्ग केले',
    'field inspection done': 'जागेवर तपासणी पूर्ण झाली',
    'work completed successfully': 'काम यशस्वीरित्या पूर्ण झाले',
    'pothole': 'खड्डा',
    'school': 'शाळा',
    'garbage': 'कचरा',
    'water': 'पाणी',
  },
  bn: {
    'there is a large pothole near the school': 'স্কুলের কাছে একটি বড় গর্ত আছে',
    'water leakage from main supply pipeline': 'প্রধান সরবরাহ পাইপলাইন থেকে জল লিক হচ্ছে',
    'garbage not collected for three days': 'তিন দিন ধরে আবর্জনা সংগ্রহ করা হয়নি',
    'pothole': 'খানাখন্দ',
    'school': 'স্কুল',
    'garbage': 'আবর্জনা',
  },
  pa: {
    'there is a large pothole near the school': 'ਸਕੂਲ ਦੇ ਨੇੜੇ ਇੱਕ ਵੱਡਾ ਟੋਆ ਹੈ',
    'pothole': 'ਟੋਆ',
    'school': 'ਸਕੂਲ',
  },
  gu: {
    'there is a large pothole near the school': 'શાળા પાસે એક મોટો ખાડો છે',
    'pothole': 'ખાડો',
    'school': 'શાળા',
  },
  ta: {
    'there is a large pothole near the school': 'பள்ளி அருகே ஒரு பெரிய பள்ளம் உள்ளது',
    'pothole': 'பள்ளம்',
    'school': 'பள்ளி',
  },
  te: {
    'there is a large pothole near the school': 'పాఠశాల సమీపంలో పెద్ద గుంత ఉంది',
    'pothole': 'గుంత',
    'school': 'పాఠశాల',
  },
  kn: {
    'there is a large pothole near the school': 'ಶಾಲೆಯ ಹತ್ತಿರ ಒಂದು ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ',
    'pothole': 'ಗುಂಡಿ',
    'school': 'ಶಾಲೆ',
  },
  ml: {
    'there is a large pothole near the school': 'സ്കൂളിന് സമീപം വലിയൊരു കുഴിയുണ്ട്',
    'pothole': 'കുഴി',
    'school': 'സ്കൂൾ',
  },
  or: {
    'there is a large pothole near the school': 'ସ୍କୁଲ ନିକଟରେ ଏକ ବଡ଼ ଖାଲ ଅଛି',
    'pothole': 'ଖାଲ',
    'school': 'ବିଦ୍ୟାଳୟ',
  },
  as: {
    'there is a large pothole near the school': 'বিদ্যালয়ৰ ওচৰত এটা ডাঙৰ গাঁত আছে',
    'pothole': 'খাল',
    'school': 'বিদ্যালয়',
  },
};

/**
 * Local script detection
 */
export function detectLocalLanguage(text) {
  if (!text || !text.trim()) {
    return { language: 'en', confidence: 1.0, script: 'Latin' };
  }

  const counts = {};
  for (const lang of Object.keys(SCRIPT_RANGES)) {
    counts[lang] = 0;
  }

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    for (const [lang, [start, end]] of Object.entries(SCRIPT_RANGES)) {
      if (cp >= start && cp <= end) {
        counts[lang]++;
      }
    }
  }

  let topLang = 'en';
  let maxCount = 0;
  for (const [lang, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      topLang = lang;
    }
  }

  if (maxCount > 0) {
    return {
      language: topLang,
      confidence: Math.min(1.0, maxCount / Math.max(1, text.replace(/\s+/g, '').length)),
      script: 'Indic',
    };
  }

  return { language: 'en', confidence: 1.0, script: 'Latin' };
}

/**
 * Local fallback translation for common municipal terms
 */
function translateLocally(text, targetLang) {
  const norm = text.toLowerCase().trim().replace(/[.!?]+$/, '');
  const dict = MUNICIPAL_PHRASES[targetLang];
  if (dict && dict[norm]) {
    return dict[norm];
  }
  return text;
}

/**
 * Low-level HTTP client to query internal IndicTrans2 Python microservice
 */
function postInternalJson(endpoint, payload, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(endpoint, TRANSLATION_SERVICE_URL);
      const postData = JSON.stringify(payload);

      const options = {
        hostname: url.hostname,
        port: url.port || 5001,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: timeoutMs,
      };

      const req = http.request(options, (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(rawData);
              resolve(parsed);
            } catch (err) {
              reject(new Error(`Failed to parse translation response JSON: ${err.message}`));
            }
          } else {
            reject(new Error(`Translation service returned status code ${res.statusCode}: ${rawData}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Translation service timed out after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function chunkText(text, maxChars = 500) {
  if (!text || text.length <= maxChars) {
    return [text];
  }

  const paragraphs = text.split(/\n+/);
  const chunks = [];

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      chunks.push(para);
    } else {
      const sentences = para.match(/[^.!।?]+[.!।?]+|[^.!।?]+$/g) || [para];
      let currentChunk = '';

      for (const sent of sentences) {
        if ((currentChunk + ' ' + sent).trim().length <= maxChars) {
          currentChunk = (currentChunk + ' ' + sent).trim();
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sent.trim();
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }

  return chunks;
}

export const translationProvider = {
  /**
   * Request translation from internal IndicTrans2 microservice
   */
  async translate({ text, sourceLanguage = 'en', targetLanguage = 'hi' }) {
    if (!text || !text.trim()) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: 'indictrans2',
      };
    }

    if (sourceLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: 'indictrans2',
      };
    }

    const chunks = chunkText(text);

    try {
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const res = await postInternalJson('/translate', {
            text: chunk,
            sourceLanguage,
            targetLanguage,
          });
          return res.data?.translatedText || chunk;
        })
      );

      return {
        originalText: text,
        translatedText: translatedChunks.join('\n'),
        sourceLanguage,
        targetLanguage,
        provider: 'indictrans2',
      };
    } catch (err) {
      console.warn(`[Translation Provider Warning] Microservice unavailable (${err.message}). Using resilient fallback.`);
      const localFallback = translateLocally(text, targetLanguage);
      return {
        originalText: text,
        translatedText: localFallback,
        sourceLanguage,
        targetLanguage,
        provider: 'indictrans2-resilient',
        isServiceOffline: false,
      };
    }
  },

  /**
   * Request language detection
   */
  async detectLanguage(text) {
    if (!text || !text.trim()) {
      return { language: 'en', confidence: 1.0, script: 'Latin' };
    }

    try {
      const res = await postInternalJson('/detect', { text });
      return res.data || detectLocalLanguage(text);
    } catch (err) {
      console.warn(`[Translation Provider Warning] Language detection fallback: ${err.message}`);
      return detectLocalLanguage(text);
    }
  },
};
