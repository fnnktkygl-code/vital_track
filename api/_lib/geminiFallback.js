/**
 * Smart Gemini Model Cascade — VitalTrack
 * 
 * Utilise un projet unique (clé GEMINI_API_KEY principale) avec une cascade
 * intelligente de modèles en cas de quota atteint (429) ou surcharge temporaire.
 */

const CASCADE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

const MODEL_ALIASES = {
  'auto': 'gemini-2.5-flash',
  'flash': 'gemini-2.5-flash',
  'gemini-3.7-flash': 'gemini-2.5-flash',
  'gemini-3.6-flash': 'gemini-2.0-flash',
  'gemini-3.5-flash': 'gemini-2.0-flash',
  'gemini-3.5-pro': 'gemini-1.5-pro',
  'gemini-3.1-pro': 'gemini-1.5-pro',
  'gemini-3.6-flash-lite': 'gemini-2.0-flash-lite',
  'gemini-3.5-flash-lite': 'gemini-2.0-flash-lite',
  'gemini-3.1-flash-lite': 'gemini-2.0-flash-lite',
  'gemini-3.1-flash-lite-preview': 'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest': 'gemini-2.0-flash-lite',
  'gemini-3-flash-preview': 'gemini-2.0-flash',
  'gemma-4-31b-it': 'gemini-2.0-flash-lite',
  'gemma-4-26b-a4b-it': 'gemini-1.5-flash-8b',
  'flash-lite': 'gemini-2.0-flash-lite',
  'pro': 'gemini-1.5-pro',
  'lite': 'gemini-2.0-flash-lite'
};

function resolveModelName(name) {
  if (!name || name === 'auto') return 'gemini-2.5-flash';
  const clean = name.trim();
  if (MODEL_ALIASES[clean]) return MODEL_ALIASES[clean];
  return clean;
}

const COMPLEX_CASCADE = [...CASCADE_MODELS];
const SIMPLE_CASCADE = [...CASCADE_MODELS];

// In-memory model cooldown map: `${modelName}` -> timestamp
const modelCooldownMap = new Map();
let lastCallTimestamp = 0;

function getPrimaryApiKey(explicitKey) {
  if (explicitKey && typeof explicitKey === 'string' && explicitKey.trim()) {
    return explicitKey.trim();
  }
  return (process.env.GEMINI_API_KEY || '').trim();
}

/**
 * Enforce pacing delay between calls to avoid burst RPM throttling.
 */
async function enforcePacingDelay(delayMs = 150) {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTimestamp = Date.now();
}

/**
 * Call Gemini API using single project key with robust model cascade failover.
 */
async function callGeminiApi({
  apiKey,
  prompt,
  contents,
  generationConfig,
  systemInstruction,
  stream = false,
  requestedModel = null,
}) {
  const activeKey = getPrimaryApiKey(apiKey);
  if (!activeKey) {
    throw new Error('Aucune clé GEMINI_API_KEY disponible');
  }

  let isComplex = false;
  if (contents && Array.isArray(contents)) {
    if (contents.length > 8) isComplex = true;
    const lastUserText = contents[contents.length - 1]?.parts?.[0]?.text || '';
    if (lastUserText.length > 300) isComplex = true;
  } else if (prompt && prompt.length > 300) {
    isComplex = true;
  }

  let modelsToTry = isComplex ? [...COMPLEX_CASCADE] : [...SIMPLE_CASCADE];
  if (requestedModel && requestedModel !== 'auto' && requestedModel.trim()) {
    const resolved = resolveModelName(requestedModel.trim());
    modelsToTry = [resolved, ...modelsToTry.filter(m => m !== resolved)];
  }

  let lastErr = null;
  const now = Date.now();

  console.log(`[VT Model Cascade] Routing query (Complex: ${isComplex}, Models: ${modelsToTry.join(' -> ')})`);

  for (const modelName of modelsToTry) {
    const cooldownUntil = modelCooldownMap.get(modelName) || 0;
    if (now < cooldownUntil) {
      continue;
    }

    try {
      await enforcePacingDelay(100);

      const method = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}${stream ? '&' : '?'}key=${activeKey}`;

      const bodyPayload = {};
      if (contents) bodyPayload.contents = contents;
      else if (prompt) bodyPayload.contents = [{ parts: [{ text: prompt }] }];
      if (generationConfig) bodyPayload.generationConfig = generationConfig;
      if (systemInstruction) bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errMsg = errorBody.error?.message || `HTTP ${response.status}`;
        console.warn(`[VT Cascade] Model [${modelName}] Status ${response.status}:`, errMsg);

        // 429 Quota Exceeded (RPM or RPD)
        if (response.status === 429) {
          const isDaily = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('daily') || errMsg.includes('per day');
          const cooldownDuration = isDaily ? (4 * 3600 * 1000) : (60 * 1000);
          modelCooldownMap.set(modelName, Date.now() + cooldownDuration);
          lastErr = new Error(`Quota limit on model [${modelName}]`);
          continue; // Failover to next model in cascade
        }

        // 503 Overloaded / 500 / 502
        if (response.status === 503 || response.status === 500 || response.status === 502) {
          modelCooldownMap.set(modelName, Date.now() + 45 * 1000);
          lastErr = new Error(`Overload on model [${modelName}]`);
          continue; // Failover to next model in cascade
        }

        // 404 / 400 Unsupported model
        if (response.status === 404 || response.status === 400) {
          modelCooldownMap.set(modelName, Date.now() + 6 * 3600 * 1000);
          lastErr = new Error(`Unsupported model [${modelName}]`);
          continue;
        }

        throw new Error(errMsg);
      }

      // Streaming Response
      if (stream) {
        console.log(`✅ [VT Cascade] Streaming via Model [${modelName}]`);
        response.model = modelName;
        return response;
      }

      // Non-streaming JSON response
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const generatedText = parts
        .filter(p => !p.thought && p.text)
        .map(p => p.text)
        .join('');

      if (generatedText && generatedText.trim()) {
        console.log(`✅ [VT Cascade] Success via Model [${modelName}]`);
        return { text: generatedText.trim(), model: modelName };
      }

      lastErr = new Error(`Empty response from ${modelName}`);
      continue;
    } catch (err) {
      console.warn(`[VT Cascade] Error on Model [${modelName}]:`, err.message);
      lastErr = err;
      if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
        modelCooldownMap.set(modelName, Date.now() + 60 * 1000);
      }
    }
  }

  // All models exhausted — reset cooldowns
  modelCooldownMap.clear();
  throw lastErr || new Error('Tous les modèles IA sont momentanément occupés. Veuillez réessayer dans un instant.');
}

module.exports = { callGeminiApi, CASCADE_MODELS, COMPLEX_CASCADE, SIMPLE_CASCADE };
