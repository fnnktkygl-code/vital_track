require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const PORT = Number(process.env.PORT || 8080);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in environment.');
  process.exit(1);
}

const JSON_LIMIT = '1mb';

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: JSON_LIMIT }));
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  })
);

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_UPLOAD = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

function safeError(error) {
  return {
    error: 'Request failed',
    detail: error instanceof Error ? error.message : String(error),
  };
}

function parseGeminiJson(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function sanitizeFileName(fileName) {
  return (fileName || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function geminiGenerateContent(parts, model = 'gemini-2.5-flash') {
  const endpoint = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Gemini generateContent failed (${response.status})`);
  }

  const text =
    payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text || '';

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

async function geminiFileUpload({ bytes, mimeType, displayName, fileName }) {
  const startResponse = await fetch(`${GEMINI_UPLOAD}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(bytes.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: {
        displayName,
        mimeType,
        name: fileName,
      },
    }),
  });

  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (!startResponse.ok || !uploadUrl) {
    throw new Error(`Gemini upload start failed (${startResponse.status})`);
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(bytes.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: bytes,
  });

  const payload = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    throw new Error(`Gemini upload finalize failed (${uploadResponse.status})`);
  }

  return payload.file || payload;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'vital-track-ai-proxy' });
});

app.post('/v1/analyze-text', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const text = await geminiGenerateContent([{ text: `Analyze this food: ${query}` }]);
    const data = parseGeminiJson(text);
    return res.json(data);
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.post('/v1/analyze-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'file is required' });
    }

    const mimeType = String(req.body?.mimeType || req.file.mimetype || 'image/jpeg');
    const dataPart = {
      inlineData: {
        mimeType,
        data: req.file.buffer.toString('base64'),
      },
    };

    const text = await geminiGenerateContent([
      { text: 'Identify all foods/ingredients in this image.' },
      dataPart,
    ]);
    const data = parseGeminiJson(text);
    return res.json(data);
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.post('/v1/chat', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const profile = req.body?.profile || {};
    const context = Array.isArray(req.body?.context) ? req.body.context : [];
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    const prompt = [
      'You are the VitalTrack Mascot — concise, practical, supportive.',
      `USER QUESTION: ${query}`,
      `PROFILE: ${JSON.stringify(profile)}`,
      `CONTEXT: ${JSON.stringify(context)}`,
      `HISTORY: ${JSON.stringify(history)}`,
    ].join('\n\n');

    const text = await geminiGenerateContent([{ text: prompt }]);
    return res.json({ text });
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.post('/v1/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'file is required' });
    }

    const displayName = String(req.body?.displayName || req.file.originalname || 'upload');
    const mimeType = String(req.body?.mimeType || req.file.mimetype || 'application/octet-stream');

    const file = await geminiFileUpload({
      bytes: req.file.buffer,
      mimeType,
      displayName,
      fileName: sanitizeFileName(req.file.originalname),
    });

    return res.json({ file });
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.get('/v1/files', async (_req, res) => {
  try {
    const response = await fetch(`${GEMINI_BASE}/files?key=${encodeURIComponent(GEMINI_API_KEY)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Gemini list files failed (${response.status})`);
    }
    return res.json({ files: payload.files || [] });
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.get('/v1/files/:encodedName', async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.encodedName || '');
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const response = await fetch(
      `${GEMINI_BASE}/${fileName}?key=${encodeURIComponent(GEMINI_API_KEY)}`
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Gemini get file failed (${response.status})`);
    }
    return res.json({ file: payload });
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.delete('/v1/files/:encodedName', async (req, res) => {
  try {
    const fileName = decodeURIComponent(req.params.encodedName || '');
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const response = await fetch(
      `${GEMINI_BASE}/${fileName}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      { method: 'DELETE' }
    );

    if (!response.ok && response.status !== 204) {
      throw new Error(`Gemini delete file failed (${response.status})`);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(502).json(safeError(error));
  }
});

app.use((error, _req, res, _next) => {
  if (error && error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'CORS forbidden' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`vital-track-ai-proxy listening on :${PORT}`);
});
