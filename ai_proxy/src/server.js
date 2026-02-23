require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for inline Vertex data
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

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

const PROJECT_ID = 'neon-polymer-487913-j6';
const LOCATION = 'us-central1';
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

function buildVertexEndpoint(modelId, method) {
  const separator = method.includes('?') ? '&' : '?';
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelId}:${method}${separator}key=${encodeURIComponent(GEMINI_API_KEY)}`;
}

function safeError(error) {
  return {
    error: 'Request failed',
    detail: error instanceof Error ? error.message : String(error),
  };
}

async function fetchWithFallback(method, payload, isStream = false) {
  let lastError = null;
  for (const model of MODELS) {
    try {
      const endpoint = buildVertexEndpoint(model, isStream ? 'streamGenerateContent?alt=sse' : method);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vertex API failed (${response.status}): ${errText}`);
      }
      return response; // Return the fetch response object
    } catch (error) {
      console.error(`[Vertex error ${model}]:`, error.message);
      lastError = error;
      if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// System Prompts
const foodAnalysisPrompt = `You are an expert in Vitalist Nutrition (Dr. Sebi, Arnold Ehret, Dr. Morse).
YOUR GOAL: IDENTIFY ALL VISIBLE INGREDIENTS/FOODS.
Return a JSON object with an "items" array:
{
  "items": [{ "name": "Food Name", "emoji": "🍎", "origin": "Native/Hybrid/Man-made", "family": "Botanical Family", "scientific": { "pral": -2.5, "density": 90 }, "vitality": { "nova": 1, "freshness": 90 }, "specific": { "mucus": "Mucogène/Neutre/Dissolvant", "hybrid": false, "electric": true, "label": "Electric/Hybrid/Mucus" }, "note": "Brief analysis." }]
}
STRICT VITALIST RULES:
1. ELECTRIC / ALKALINE (Good): Fruits (Seeded ONLY), Amaranth greens, Avocado, Bell Pepper, Cucumber, Dandelion greens, Chickpeas, Kale, Quinoa, Spelt.
2. HYBRID / STARCH (Bad): CARROT, Garlic, Beet, Celery, Cauliflower, Corn, Potato, Cabbage, Grapefruit, Seedless fruits, White Rice, Wheat, Soy.
3. MUCUS FORMING (Bad): Meat, Eggs, Dairy, Sugar, Fried foods, Alcohol.
LOGIC: list dominant ingredients.`;

const chatSystemPrompt = `You are the VitalTrack Mascot — a friendly, wise Pigeon and expert in Vitalist Nutrition.
Be concise, practical, and supportive. Answer using BOTH context and your baseline Vitalist knowledge.`;

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'vital-track-vertex-proxy' });
});

// 1. Analyze text
app.post('/v1/analyze-text', async (req, res) => {
  try {
    const query = req.body?.query;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const payload = {
      contents: [{ role: 'user', parts: [{ text: `Analyze this food: ${query}` }] }],
      systemInstruction: { role: 'system', parts: [{ text: foodAnalysisPrompt }] },
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    };

    const response = await fetchWithFallback('generateContent', payload);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ data: JSON.parse(cleaned) });
  } catch (error) {
    res.status(502).json(safeError(error));
  }
});

// 2. Analyze image
app.post('/v1/analyze-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'file is required' });
    }

    const mimeType = String(req.body?.mimeType || req.file.mimetype || 'image/jpeg');
    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: 'Identify all foods/ingredients in this image.' },
          { inlineData: { mimeType, data: req.file.buffer.toString('base64') } }
        ]
      }],
      systemInstruction: { role: 'system', parts: [{ text: foodAnalysisPrompt }] },
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    };

    const response = await fetchWithFallback('generateContent', payload);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ data: JSON.parse(cleaned) });
  } catch (error) {
    res.status(502).json(safeError(error));
  }
});

// 3. Chat (supports SSE streaming)
app.post('/v1/chat', async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) return res.status(400).json({ error: 'query is required' });

    const isStream = req.query.stream === 'true' || req.headers['accept'] === 'text/event-stream';
    const profile = req.body?.profile || {};
    const context = Array.isArray(req.body?.context) ? req.body.context : [];
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const fileParts = Array.isArray(req.body?.fileParts) ? req.body.fileParts : [];

    let prompt = `USER QUESTION: ${query}\nPROFILE: ${JSON.stringify(profile)}\nCONTEXT: ${JSON.stringify(context)}\n`;
    if (history.length) prompt += `HISTORY: ${JSON.stringify(history)}\n`;

    const parts = [{ text: prompt }];
    for (const f of fileParts) {
      if (f.inlineData) parts.push(f);
    }

    const payload = {
      contents: [{ role: 'user', parts }],
      systemInstruction: { role: 'system', parts: [{ text: chatSystemPrompt }] },
      generationConfig: { temperature: 0.3 }
    };

    const response = await fetchWithFallback('generateContent', payload, isStream);

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Forward SSE chunks from Vertex AI to Flutter
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);

          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim();
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch (e) {
                // ignore incomplete chunks or parse errors
              }
            }
          }
          boundary = buffer.indexOf('\n');
        }
      }
      res.end();
    } else {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      res.json({ text });
    }
  } catch (error) {
    res.status(502).json(safeError(error));
  }
});

app.use((error, _req, res, _next) => {
  if (error && error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'CORS forbidden' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`vital-track-vertex-proxy listening on :${PORT}`);
});
