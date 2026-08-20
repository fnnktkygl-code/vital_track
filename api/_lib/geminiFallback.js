/**
 * Smart Gemini Model & Multi-Key Cascade Matrix — VitalTrack
 * 
 * Routes queries dynamically across multiple API keys (multi-project failover)
 * and tiered model cascades with intelligent per-(key, model) cooldown tracking.
 */

const COMPLEX_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];

const SIMPLE_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];

// In-memory 2D cooldown map: `${keyId}::${modelName}` -> timestamp
const keyModelCooldownMap = new Map();
let lastCallTimestamp = 0;

function getKeyIdentifier(key) {
  if (!key) return 'none';
  return key.length > 8 ? key.slice(-8) : key;
}

function getAvailableKeys(explicitKey) {
  const keys = [];
  if (explicitKey && typeof explicitKey === 'string' && explicitKey.trim()) {
    keys.push(explicitKey.trim());
  }

  const envVars = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_BACKUP_KEYS,
    process.env.GEMINI_API_KEYS
  ];

  for (const envVal of envVars) {
    if (!envVal) continue;
    const split = envVal.split(/[,;\s]+/).map(k => k.trim()).filter(Boolean);
    for (const k of split) {
      if (!keys.includes(k)) keys.push(k);
    }
  }

  return keys;
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
 * Call Gemini API using intelligent 2D multi-key and multi-model matrix.
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
  const keysPool = getAvailableKeys(apiKey);
  if (keysPool.length === 0) {
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
    modelsToTry = [requestedModel.trim(), ...modelsToTry.filter(m => m !== requestedModel.trim())];
  }

  let lastErr = null;
  const now = Date.now();

  console.log(`[VT Matrix] Routing query (Complex: ${isComplex}, Keys in pool: ${keysPool.length})`);

  for (const modelName of modelsToTry) {
    for (let keyIdx = 0; keyIdx < keysPool.length; keyIdx++) {
      const activeKey = keysPool[keyIdx];
      const keyId = getKeyIdentifier(activeKey);
      const cooldownKey = `${keyId}::${modelName}`;

      const cooldownUntil = keyModelCooldownMap.get(cooldownKey) || 0;
      if (now < cooldownUntil) {
        continue;
      }

      try {
        await enforcePacingDelay(150);

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
          console.warn(`[VT Matrix] Key [${keyId}] Model [${modelName}] Status ${response.status}:`, errMsg);

          // 429 Quota Exceeded (RPM or RPD)
          if (response.status === 429) {
            const isDaily = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('daily') || errMsg.includes('per day');
            const cooldownDuration = isDaily ? (4 * 3600 * 1000) : (60 * 1000);
            keyModelCooldownMap.set(cooldownKey, Date.now() + cooldownDuration);
            lastErr = new Error(`Quota limit on key [${keyId}] model [${modelName}]`);
            continue; // Try next key for this same model!
          }

          // 503 Overloaded
          if (response.status === 503 || response.status === 500 || response.status === 502) {
            keyModelCooldownMap.set(cooldownKey, Date.now() + 45 * 1000);
            lastErr = new Error(`Overload on key [${keyId}] model [${modelName}]`);
            continue; // Try next key for this same model!
          }

          // 404 / 400 Unsupported model
          if (response.status === 404 || response.status === 400) {
            keyModelCooldownMap.set(cooldownKey, Date.now() + 6 * 3600 * 1000);
            lastErr = new Error(`Unsupported model [${modelName}]`);
            continue;
          }

          throw new Error(errMsg);
        }

        // Streaming Response
        if (stream) {
          console.log(`✅ [VT Matrix] Streaming via Key [${keyId}] / Model [${modelName}]`);
          response.model = modelName;
          response.keyId = keyId;
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
          console.log(`✅ [VT Matrix] Success via Key [${keyId}] / Model [${modelName}]`);
          return { text: generatedText.trim(), model: modelName, keyId };
        }

        lastErr = new Error(`Empty response from ${modelName}`);
        continue;
      } catch (err) {
        console.warn(`[VT Matrix] Error on Key [${keyId}] / Model [${modelName}]:`, err.message);
        lastErr = err;
        if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
          keyModelCooldownMap.set(cooldownKey, Date.now() + 60 * 1000);
        }
      }
    }
  }

  // All pairs exhausted — reset registry
  keyModelCooldownMap.clear();
  throw lastErr || new Error('Tous les modèles et clés sont momentanément occupés. Veuillez réessayer dans un instant.');
}

module.exports = { callGeminiApi, COMPLEX_CASCADE, SIMPLE_CASCADE };
