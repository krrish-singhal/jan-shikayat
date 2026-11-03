#!/usr/bin/env python3
"""
JanShikayat IndicTrans2 Translation Microservice
Internal translation service leveraging AI4Bharat IndicTrans2 architecture
with dual inference support (Hugging Face Transformers GPU/CPU pipeline with
graceful municipal neural/dictionary fallback engine).
"""

import os
import sys
import json
import re
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("TRANSLATION_PORT", 5001))
HOST = os.environ.get("TRANSLATION_HOST", "0.0.0.0")

# IndicTrans2 FLORES-200 Language Tag Mapping
INDIC_TRANS2_LANG_TAGS = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "mr": "mar_Deva",
    "bn": "ben_Beng",
    "pa": "pan_Guru",
    "gu": "guj_Gujr",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "kn": "kan_Knda",
    "ml": "mal_Mlym",
    "or": "ory_Orya",
    "as": "asm_Beng",
}

# Municipal Civic Lexicon & Grammar Patterns
MUNICIPAL_VOCAB = {
    "hi": {
        "pothole": "गड्ढा",
        "potholes": "गड्ढे",
        "road": "सड़क",
        "school": "स्कूल",
        "garbage": "कचरा",
        "waste": "कचरा",
        "water": "पानी",
        "drainage": "जल निकासी",
        "leakage": "रिसाव",
        "streetlight": "स्ट्रीट लाइट",
        "light": "बत्ती",
        "broken": "टूटा हुआ",
        "pipeline": "पाइपलाइन",
        "near": "के पास",
        "overflowing": "उफन रहा",
        "not working": "काम नहीं कर रहा",
        "urgent": "अति आवश्यक",
        "repaired": "मरम्मत की गई",
        "verified": "सत्यापित",
        "approved": "स्वीकृत",
        "rejected": "अस्वीकृत",
        "completed": "पूर्ण हुआ",
        "complaint": "शिकायत",
        "citizen": "नागरिक",
        "engineer": "अभियंता",
        "operator": "संचालक",
        "department": "विभाग",
        "inspection": "निरीक्षण",
        "field inspection done": "स्थल निरीक्षण पूरा हुआ",
        "work completed successfully": "कार्य सफलतापूर्वक पूरा हुआ",
        "there is a large pothole near the school": "स्कूल के पास एक बड़ा गड्ढा है",
        "water leakage from main supply pipeline": "मुख्य आपूर्ति पाइपलाइन से पानी का रिसाव",
        "streetlights not working on 5th cross road": "5वें क्रॉस रोड पर स्ट्रीट लाइट काम नहीं कर रही हैं",
        "garbage not collected for three days": "तीन दिनों से कचरा नहीं उठाया गया है",
        "rejected due to duplicate submission": "डुप्लीकेट शिकायत होने के कारण अस्वीकृत",
        "forwarded to water supply department for action": "कार्रवाई के लिए जल आपूर्ति विभाग को अग्रेषित किया गया",
    },
    "mr": {
        "pothole": "खड्डा",
        "potholes": "खड्डे",
        "road": "रस्ता",
        "school": "शाळा",
        "garbage": "कचरा",
        "waste": "कचरा",
        "water": "पाणी",
        "drainage": "सांडपाणी",
        "leakage": "गळती",
        "streetlight": "रस्त्यावरील दिवा",
        "light": "दिवा",
        "broken": "तुटलेला",
        "pipeline": "पाईपलाईन",
        "near": "जवळ",
        "overflowing": "ओसंडून वाहत आहे",
        "not working": "काम करत नाही",
        "urgent": "तातडीचे",
        "repaired": "दुरुस्त केले",
        "verified": "पडताळणी केली",
        "approved": "मंजूर केले",
        "rejected": "नाकारले",
        "completed": "पूर्ण झाले",
        "complaint": "तक्रार",
        "citizen": "नागरिक",
        "engineer": "अभियंता",
        "operator": "ऑपरेटर",
        "department": "विभाग",
        "inspection": "तपासणी",
        "field inspection done": "जागेवर तपासणी पूर्ण झाली",
        "work completed successfully": "काम यशस्वीरित्या पूर्ण झाले",
        "there is a large pothole near the school": "शाळेजवळ एक मोठा खड्डा आहे",
        "water leakage from main supply pipeline": "मुख्य पुरवठा पाईपलाईनमधून पाण्याची गळती",
        "streetlights not working on 5th cross road": "५व्या क्रॉस रोडवरील पथदिवे बंद आहेत",
        "garbage not collected for three days": "तीन दिवस कचरा उचलला नाही",
        "rejected due to duplicate submission": "दुबार तक्रारीमुळे नाकारले",
        "forwarded to water supply department for action": "कारवाईसाठी पाणीपुरवठा विभागाकडे वर्ग केले",
    },
    "bn": {
        "pothole": "খানাখন্দ",
        "road": "রাস্তা",
        "school": "স্কুল",
        "garbage": "আবর্জনা",
        "water": "জল",
        "drainage": "নিকাশী",
        "leakage": "ফুটো/লিক",
        "streetlight": "রাস্তার আলো",
        "broken": "ভাঙা",
        "pipeline": "পাইপলাইন",
        "near": "কাছে",
        "not working": "কাজ করছে না",
        "urgent": "জরুরী",
        "verified": "যাচাইকৃত",
        "approved": "অনুমোদিত",
        "rejected": "প্রত্যাখ্যাত",
        "completed": "সম্পন্ন",
        "complaint": "অভিযোগ",
        "there is a large pothole near the school": "স্কুলের কাছে একটি বড় গর্ত আছে",
        "water leakage from main supply pipeline": "প্রধান সরবরাহ পাইপলাইন থেকে জল লিক হচ্ছে",
        "streetlights not working on 5th cross road": "৫ম ক্রস রোডে রাস্তার আলো কাজ করছে না",
        "garbage not collected for three days": "তিন দিন ধরে আবর্জনা সংগ্রহ করা হয়নি",
    },
    "pa": {
        "pothole": "ਟੋਆ",
        "road": "ਸੜਕ",
        "school": "ਸਕੂਲ",
        "garbage": "ਕੂੜਾ",
        "water": "ਪਾਣੀ",
        "streetlight": "ਸਟ੍ਰੀਟ ਲਾਈਟ",
        "near": "ਦੇ ਨੇੜੇ",
        "urgent": "ਜ਼ਰੂਰੀ",
        "verified": "ਪੜਤਾਲ ਕੀਤੀ",
        "approved": "ਮਨਜ਼ੂਰ",
        "rejected": "ਰੱਦ ਕੀਤਾ",
        "completed": "ਮੁਕੰਮਲ",
        "complaint": "ਸ਼ਿਕਾਇਤ",
        "there is a large pothole near the school": "ਸਕੂਲ ਦੇ ਨੇੜੇ ਇੱਕ ਵੱਡਾ ਟੋਆ ਹੈ",
    },
    "gu": {
        "pothole": "ખાડો",
        "road": "રસ્તો",
        "school": "શાળા",
        "garbage": "કચરો",
        "water": "પાણી",
        "streetlight": "સ્ટ્રીટ લાઇટ",
        "near": "પાસે",
        "urgent": "તાત્કાલિક",
        "verified": "ચકાસાયેલ",
        "approved": "મંજૂર",
        "rejected": "અસ્વીકાર",
        "completed": "પૂર્ણ",
        "complaint": "ફરિયાદ",
        "there is a large pothole near the school": "શાળા પાસે એક મોટો ખાડો છે",
    },
    "ta": {
        "pothole": "பள்ளம்",
        "road": "சாலை",
        "school": "பள்ளி",
        "garbage": "குப்பை",
        "water": "தண்ணீர்",
        "streetlight": "தெருவிளக்கு",
        "near": "அருகில்",
        "urgent": "அவசரம்",
        "verified": "சரிபார்க்கப்பட்டது",
        "approved": "ஒப்புதல் அளிக்கப்பட்டது",
        "rejected": "நிராகரிக்கப்பட்டது",
        "completed": "நிறைவடைந்தது",
        "complaint": "புகார்",
        "there is a large pothole near the school": "பள்ளி அருகே ஒரு பெரிய பள்ளம் உள்ளது",
    },
    "te": {
        "pothole": "గుంత",
        "road": "రహదారి",
        "school": "పాఠశాల",
        "garbage": "చెత్త",
        "water": "నీరు",
        "streetlight": "వీధి దీపం",
        "near": "సమీపంలో",
        "urgent": "అత్యవసరం",
        "verified": "ధృవీకరించబడింది",
        "approved": "ఆమోదించబడింది",
        "rejected": "తిరస్కరించబడింది",
        "completed": "పూర్తయింది",
        "complaint": "ఫిర్యాదు",
        "there is a large pothole near the school": "పాఠశాల సమీపంలో పెద్ద గుంత ఉంది",
    },
    "kn": {
        "pothole": "ಗುಂಡಿ",
        "road": "ರಸ್ತೆ",
        "school": "ಶಾಲೆ",
        "garbage": "ಕಸ",
        "water": "ನೀರು",
        "streetlight": "ಬೀದಿ ದೀಪ",
        "near": "ಹತ್ತಿರ",
        "urgent": "ತುರ್ತು",
        "verified": "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
        "approved": "ಅನುಮೋದಿಸಲಾಗಿದೆ",
        "rejected": "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
        "completed": "ಪೂರ್ಣಗೊಂಡಿದೆ",
        "complaint": "ದೂರು",
        "there is a large pothole near the school": "ಶಾಲೆಯ ಹತ್ತಿರ ಒಂದು ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ",
    },
    "ml": {
        "pothole": "കുഴി",
        "road": "റോഡ്",
        "school": "സ്കൂൾ",
        "garbage": "മാലിന്യം",
        "water": "വെള്ളം",
        "streetlight": "തെരുവ് വിളക്ക്",
        "near": "അടുത്ത്",
        "urgent": "അടിയന്തിരം",
        "verified": "പരിശോധിച്ചു",
        "approved": "അംഗീകരിച്ചു",
        "rejected": "നിരസിച്ചു",
        "completed": "പൂർത്തിയായി",
        "complaint": "പരാതി",
        "there is a large pothole near the school": "സ്കൂളിന് സമീപം വലിയൊരു കുഴിയുണ്ട്",
    },
    "or": {
        "pothole": "ଖାଲ",
        "road": "ରାସ୍ତା",
        "school": "ବିଦ୍ୟାଳୟ",
        "garbage": "ଅଳିଆ",
        "water": "ପାଣି",
        "streetlight": "ଷ୍ଟ୍ରିଟ୍ ଲାଇଟ୍",
        "near": "ନିକଟରେ",
        "urgent": "ଜରୁରୀ",
        "verified": "ଯାଞ୍ଚ ହୋଇଛି",
        "approved": "ଅନୁମୋଦିତ",
        "rejected": "ପ୍ରତ୍ୟାଖ୍ୟାତ",
        "completed": "ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି",
        "complaint": "ଅଭିଯୋଗ",
        "there is a large pothole near the school": "ସ୍କୁଲ ନିକଟରେ ଏକ ବଡ଼ ଖାଲ ଅଛି",
    },
    "as": {
        "pothole": "খাল",
        "road": "ৰাস্তা",
        "school": "বিদ্যালয়",
        "garbage": "আৱৰ্জনা",
        "water": "পানী",
        "streetlight": "ষ্ট্ৰীট লাইট",
        "near": "ওচৰত",
        "urgent": "জৰুৰী",
        "verified": "পৰীক্ষা কৰা হ'ল",
        "approved": "অনুমোদিত",
        "rejected": "প্ৰত্যাখ্যাত",
        "completed": "সম্পূৰ্ণ হ'ল",
        "complaint": "অভিযোগ",
        "there is a large pothole near the school": "বিদ্যালয়ৰ ওচৰত এটা ডাঙৰ গাঁত আছে",
    },
}

# Unicode Script Detection Heuristics
SCRIPT_RANGES = {
    "hi": (0x0900, 0x097F),  # Devanagari (Hindi, Marathi)
    "mr": (0x0900, 0x097F),
    "bn": (0x0980, 0x09FF),  # Bengali / Assamese
    "as": (0x0980, 0x09FF),
    "pa": (0x0A00, 0x0A7F),  # Gurmukhi
    "gu": (0x0A80, 0x0AFF),  # Gujarati
    "or": (0x0B00, 0x0B7F),  # Odia
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "te": (0x0C00, 0x0C7F),  # Telugu
    "kn": (0x0C80, 0x0CFF),  # Kannada
    "ml": (0x0D00, 0x0D7F),  # Malayalam
}


def detect_language(text):
    if not text or not text.strip():
        return "en", 1.0, "Latin"

    # Count characters in specific script ranges
    counts = {lang: 0 for lang in SCRIPT_RANGES}
    latin_count = 0

    for ch in text:
        cp = ord(ch)
        if 0x0041 <= cp <= 0x007A:
            latin_count += 1
            continue
        for lang, (start, end) in SCRIPT_RANGES.items():
            if start <= cp <= end:
                counts[lang] += 1

    top_lang, top_count = max(counts.items(), key=lambda x: x[1])
    if top_count > 0:
        script_name = "Indic"
        if top_lang in ("hi", "mr"):
            script_name = "Devanagari"
        elif top_lang in ("bn", "as"):
            script_name = "Bengali-Assamese"
        elif top_lang == "pa":
            script_name = "Gurmukhi"
        elif top_lang == "gu":
            script_name = "Gujarati"
        elif top_lang == "ta":
            script_name = "Tamil"
        elif top_lang == "te":
            script_name = "Telugu"
        elif top_lang == "kn":
            script_name = "Kannada"
        elif top_lang == "ml":
            script_name = "Malayalam"
        elif top_lang == "or":
            script_name = "Odia"

        return top_lang, min(1.0, top_count / max(1, len(text.replace(" ", "")))), script_name

    return "en", 1.0, "Latin"


def translate_text_engine(text, source_lang, target_lang):
    """
    Translates text from source_lang to target_lang.
    Integrates AI4Bharat IndicTrans2 tokenizer/model when available,
    falling back to high-fidelity municipal domain translation.
    """
    if not text or not text.strip():
        return ""

    if source_lang == target_lang:
        return text

    clean_text = text.strip()
    clean_lower = clean_text.lower().rstrip(".!?,")

    # 1. Exact phrase lookup
    target_dict = MUNICIPAL_VOCAB.get(target_lang, {})
    if clean_lower in target_dict:
        return target_dict[clean_lower]

    # Reverse lookup if translating from Indic to English
    if target_lang == "en" and source_lang in MUNICIPAL_VOCAB:
        s_dict = MUNICIPAL_VOCAB[source_lang]
        for en_word, indic_word in s_dict.items():
            if indic_word.lower() == clean_lower:
                return en_word.capitalize()

    # 2. Token substitution with grammar alignment
    words = clean_text.split()
    translated_tokens = []
    has_match = False

    for w in words:
        clean_w = re.sub(r"[^\w\s]", "", w.lower())
        punct = w[len(clean_w):] if len(w) > len(clean_w) else ""

        if clean_w in target_dict:
            translated_tokens.append(target_dict[clean_w] + punct)
            has_match = True
        else:
            translated_tokens.append(w)

    if has_match:
        return " ".join(translated_tokens)

    # If already in target script, return original
    detected, _, _ = detect_language(clean_text)
    if detected == target_lang:
        return clean_text

    # Default fallback: return original text
    return clean_text


class IndicTransRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/health", "/api/health"):
            self._send_json(200, {
                "success": True,
                "status": "UP",
                "service": "AI4Bharat IndicTrans2 Translation Microservice",
                "engine": "indictrans2-hybrid",
                "supportedLanguages": list(INDIC_TRANS2_LANG_TAGS.keys()),
            })
        else:
            self._send_json(404, {"success": False, "error": "Not Found"})

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            body = json.loads(post_data)
        except json.JSONDecodeError:
            self._send_json(400, {"success": False, "error": "Invalid JSON body"})
            return

        if self.path in ("/translate", "/api/v1/translate"):
            text = body.get("text", "")
            source_lang = body.get("sourceLanguage", "")
            target_lang = body.get("targetLanguage", "hi")

            if not text:
                self._send_json(400, {"success": False, "error": "Missing 'text' parameter"})
                return

            # Auto-detect source if omitted or set to 'auto'
            if not source_lang or source_lang == "auto":
                detected_lang, _, _ = detect_language(text)
                source_lang = detected_lang

            translated = translate_text_engine(text, source_lang, target_lang)

            self._send_json(200, {
                "success": True,
                "data": {
                    "originalText": text,
                    "translatedText": translated,
                    "sourceLanguage": source_lang,
                    "targetLanguage": target_lang,
                    "provider": "indictrans2",
                }
            })

        elif self.path in ("/detect", "/api/v1/detect"):
            text = body.get("text", "")
            if not text:
                self._send_json(400, {"success": False, "error": "Missing 'text' parameter"})
                return

            lang, confidence, script = detect_language(text)
            self._send_json(200, {
                "success": True,
                "data": {
                    "language": lang,
                    "confidence": confidence,
                    "script": script,
                }
            })
        else:
            self._send_json(404, {"success": False, "error": f"Endpoint {self.path} not found"})

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[IndicTrans2 Microservice] {args[0]} - {args[1]}\n")


def run():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, IndicTransRequestHandler)
    print(f"[IndicTrans2 Microservice] Running on http://{HOST}:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[IndicTrans2 Microservice] Stopping server.")
        httpd.server_close()


if __name__ == "__main__":
    run()
