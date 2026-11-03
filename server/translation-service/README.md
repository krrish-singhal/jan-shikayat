# AI4Bharat IndicTrans2 Translation Microservice

## Overview
This standalone microservice provides high-accuracy Indian language translation and language detection for the **JanShikayat Municipal Grievance Redressal System**. It translates dynamic municipal content—such as citizen complaint descriptions, operator forwarding notes, ground verification remarks, rejection reasons, and completion summaries—across all 12 supported Indic languages and English.

## Supported Languages (12 Initial Languages)
| Language | Code | Native Script | IndicTrans2 FLORES-200 Tag |
|---|---|---|---|
| English | `en` | English | `eng_Latn` |
| Hindi | `hi` | हिन्दी | `hin_Deva` |
| Marathi | `mr` | मराठी | `mar_Deva` |
| Bengali | `bn` | বাংলা | `ben_Beng` |
| Punjabi | `pa` | ਪੰਜਾਬੀ | `pan_Guru` |
| Gujarati | `gu` | ગુજરાતી | `guj_Gujr` |
| Tamil | `ta` | தமிழ் | `tam_Taml` |
| Telugu | `te` | తెలుగు | `tel_Telu` |
| Kannada | `kn` | ಕನ್ನಡ | `kan_Knda` |
| Malayalam | `ml` | മലയാളം | `mal_Mlym` |
| Odia | `or` | ଓଡ଼ିଆ | `ory_Orya` |
| Assamese | `as` | অসমীয়া | `asm_Beng` |

---

## Hardware & Compute Deployment Requirements

### 1. GPU Production Deployment (Recommended for High Throughput)
- **NVIDIA GPU**: Minimum 8GB VRAM (NVIDIA T4, RTX 3080/4080, A10, A100, or L4).
- **Quantization**: 4-bit (bitsandbytes `load_in_4bit=True`) requires ~3.5GB VRAM.
- **8-bit Quantization**: Requires ~5.2GB VRAM.
- **Full Precision (FP16 / BF16)**: Requires ~8GB VRAM per model direction.
- **CUDA Version**: CUDA 11.8+ or 12.1+.
- **Throughput**: ~15-25 sentences/second with batched inference.

### 2. CPU Deployment (Budget / Small Municipality Deployment)
- **CPU**: 4 to 8 vCPUs (x86_64 or ARM64 with AVX2/AVX-512 support).
- **RAM**: Minimum 8GB system RAM (16GB recommended for model caching).
- **Storage**: Minimum 10GB SSD for huggingface model weight cache.
- **Throughput**: ~2-4 sentences/second per worker process.
- **Cost**: Zero per-call API charges (100% self-hosted and open-source).

---

## Running the Service

### Zero-Dependency Quickstart (Built-in HTTP Engine)
The service features a zero-external-dependency built-in server that runs out of the box with Python 3:
```bash
python3 app.py
```
Default port: `5001`. To customize:
```bash
TRANSLATION_PORT=5001 TRANSLATION_HOST=0.0.0.0 python3 app.py
```

### Full AI4Bharat PyTorch Neural Pipeline
To load full IndicTrans2 1B parameter checkpoints from Hugging Face:
```bash
pip install -r requirements.txt
python3 app.py
```

Checkpoints utilized:
- English to Indic: `ai4bharat/indictrans2-en-indic-1B`
- Indic to English: `ai4bharat/indictrans2-indic-en-1B`
- Indic to Indic: `ai4bharat/indictrans2-indic-indic-1B`

---

## Internal Microservice Endpoints

### 1. Translate Dynamic Content
- **Path**: `POST /translate`
- **Request**:
```json
{
  "text": "There is a large pothole near the school",
  "sourceLanguage": "en",
  "targetLanguage": "hi"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "originalText": "There is a large pothole near the school",
    "translatedText": "स्कूल के पास एक बड़ा गड्ढा है",
    "sourceLanguage": "en",
    "targetLanguage": "hi",
    "provider": "indictrans2"
  }
}
```

### 2. Detect Language
- **Path**: `POST /detect`
- **Request**:
```json
{
  "text": "शाळेजवळ एक मोठा खड्डा आहे"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "language": "mr",
    "confidence": 1.0,
    "script": "Devanagari"
  }
}
```

### 3. Health Check
- **Path**: `GET /health`
- **Response**:
```json
{
  "success": true,
  "status": "UP",
  "service": "AI4Bharat IndicTrans2 Translation Microservice",
  "engine": "indictrans2-hybrid",
  "supportedLanguages": ["en", "hi", "mr", "bn", "pa", "gu", "ta", "te", "kn", "ml", "or", "as"]
}
```

---

## Fault Tolerance & Zero Breaking Failure Policy
If the microservice is offline, undergoes maintenance, or encounters transient network errors, the main Express backend catches the error gracefully, serves the original stored text, and never interrupts the citizen complaint lifecycle or portal rendering.
