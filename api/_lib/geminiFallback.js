/**
 * Smart Gemini Model Cascade Rotator — VitalTrack
 * 
 * Uses Google AI Studio free tier (generativelanguage.googleapis.com)
 * with automatic fallback across model tiers on quota exhaustion.
 *
 * Tier Hierarchy & Free Quotas (as of 2026-08):
 * 
 * 1. High-Capacity Lite (15 RPM / 500 RPD / 250K TPM):
 *    - gemini-3.5-flash-lite
 *    - gemini-3.1-flash-lite
 *    - gemini-2.5-flash-lite
 * 
 * 2. Premium Flash (5 RPM / 20 RPD / 250K TPM):
 *    - gemini-3.5-flash
 *    - gemini-3.6-flash
 *    - gemini-2.5-flash
 * 
 * 3. Gemma Reserve (30 RPM / 14,400 RPD):
 *    - gemma-4-31b-it
 *    - gemma-4-26b-a4b-it
 *    - gemma-2-27b-it
 * 
 * 4. Legacy Fallbacks:
 *    - gemini-2.0-flash
 *    - gemini-1.5-flash
 */

const COMPLEX_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemma-4-31b-it'
];

const SIMPLE_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];

// In-memory cooldown registry (persists across warm serverless invocations)
const modelCooldownMap = new Map();
let lastCallTimestamp = 0;

/**
 * Enforce a minimum delay between consecutive API calls
 * to avoid triggering RPM limits.
 */
async function enforcePacingDelay(delayMs = 200) {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTimestamp = Date.now();
}

/**
 * Call Gemini API with automatic model cascade on quota/rate-limit errors.
 * 
 * @param {Object} options
 * @param {string} options.apiKey - Gemini API key
 * @param {string} [options.prompt] - Simple text prompt (alternative to contents)
 * @param {Array} [options.contents] - Full contents array for the API
 * @param {Object} [options.generationConfig] - Generation configuration
 * @param {Object} [options.systemInstruction] - System instruction (text string)
 * @param {boolean} [options.stream] - Whether to use streaming
 * @param {string} [options.requestedModel] - Specific model selected by user
 * @returns {Promise<Response|Object>} Generated text or fetch Response
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
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  let lastErr = null;
  const now = Date.now();

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
    // Put user requested model first in cascade
    modelsToTry = [requestedModel.trim(), ...modelsToTry.filter(m => m !== requestedModel.trim())];
  }

  console.log(`[VT Router] Routing query (Complex: ${isComplex}, Requested: ${requestedModel || 'auto'}) via cascade...`);

  for (const modelName of modelsToTry) {
    // Skip models in cooldown
    const cooldownUntil = modelCooldownMap.get(modelName) || 0;
    if (now < cooldownUntil) {
      console.log(`[VT Rotator] Skipping ${modelName} (cooldown until ${new Date(cooldownUntil).toISOString()})`);
      continue;
    }

    try {
      await enforcePacingDelay(200);

      const method = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}${stream ? '&' : '?'}key=${apiKey}`;

      const bodyPayload = {};

      if (contents) {
        bodyPayload.contents = contents;
      } else if (prompt) {
        bodyPayload.contents = [{ parts: [{ text: prompt }] }];
      }

      if (generationConfig) {
        bodyPayload.generationConfig = generationConfig;
      }

      if (systemInstruction) {
        bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.warn(`[VT Rotator] Model ${modelName} status ${response.status}:`, JSON.stringify(errorBody));

        // Rate limited → 5min cooldown, cascade to next
        if (response.status === 429) {
          console.warn(`🚨 [QUOTA] ${modelName} rate-limited (429). 5min cooldown. Cascading...`);
          modelCooldownMap.set(modelName, Date.now() + 5 * 60 * 1000);
          lastErr = new Error(errorBody.error?.message || `Rate limit on ${modelName}`);
          continue;
        }

        // Model unavailable → cascade immediately
        if (response.status === 404 || response.status === 400) {
          console.warn(`⚠️ [CASCADE] ${modelName} returned ${response.status}. Cascading...`);
          lastErr = new Error(errorBody.error?.message || `Unavailable ${modelName}`);
          continue;
        }

        throw new Error(errorBody.error?.message || `Gemini API error: ${response.status}`);
      }

      // Handle streaming response
      if (stream) {
        console.log(`✅ [VT AI] Streaming via ${modelName}`);
        return response; // Return raw Response for SSE forwarding
      }

      // Non-streaming: extract text
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        console.log(`✅ [VT AI] Success via ${modelName}`);
        return { text: generatedText, model: modelName };
      }

      // Empty response — try next model
      console.warn(`⚠️ [VT AI] ${modelName} returned empty response. Cascading...`);
      lastErr = new Error(`Empty response from ${modelName}`);
      continue;

    } catch (err) {
      console.warn(`[VT Rotator] ${modelName} failed:`, err.message);
      lastErr = err;
      
      // On quota-related errors, cascade
      if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
        modelCooldownMap.set(modelName, Date.now() + 5 * 60 * 1000);
        continue;
      }
    }
  }

  // All models exhausted — clear cooldowns for next request cycle
  modelCooldownMap.clear();
  throw lastErr || new Error('All Gemini model tiers are temporarily busy. Please retry.');
}

module.exports = { callGeminiApi, COMPLEX_CASCADE, SIMPLE_CASCADE };
