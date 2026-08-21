/**
 * Smart Dual-Tier Gemini Model & Account Cascade — VitalTrack FinOps
 * 
 * NIVEAU 1 : Clé Gratuite (500 requêtes / jour à 0,00 € avec Search Grounding)
 * NIVEAU 2 : Clé Payante (Bascule instantanée et invisible en cas de quota atteint)
 */

const CASCADE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite'
];

const MODEL_ALIASES = {
  'auto': 'gemini-3.7-flash',
  'flash': 'gemini-3.7-flash',
  'gemini-3.7-flash': 'gemini-3.7-flash',
  'gemini-3.6-flash': 'gemini-3.6-flash',
  'gemini-3.5-flash': 'gemini-3.5-flash',
  'gemini-3.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest': 'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-2.5-flash': 'gemini-3.7-flash',
  'gemini-2.0-flash': 'gemini-3.6-flash',
  'gemini-1.5-flash': 'gemini-3.5-flash',
  'gemini-1.5-pro': 'gemini-3.7-flash',
  'pro': 'gemini-3.7-flash',
  'lite': 'gemini-3.5-flash-lite',
  'flash-lite': 'gemini-3.5-flash-lite'
};

function resolveModelName(name) {
  if (!name || name === 'auto') return 'gemini-3.7-flash';
  const clean = name.trim();
  if (MODEL_ALIASES[clean]) return MODEL_ALIASES[clean];
  return clean;
}

const COMPLEX_CASCADE = [...CASCADE_MODELS];
const SIMPLE_CASCADE = [...CASCADE_MODELS];

// In-memory model cooldown map: `${tierName}_${modelName}` -> timestamp
const modelCooldownMap = new Map();
const tierCooldownMap = new Map();
let lastCallTimestamp = 0;

function getTierKeys(explicitKey) {
  if (explicitKey && typeof explicitKey === 'string' && explicitKey.trim()) {
    return [{ key: explicitKey.trim(), tier: 'explicit' }];
  }

  const freeKey = (process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_FREE_KEY || '').trim();
  const paidKey = (process.env.GEMINI_API_KEY_PAID || process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY || '').trim();

  const tiers = [];
  if (freeKey) tiers.push({ key: freeKey, tier: 'free_tier_500rpd' });
  if (paidKey && paidKey !== freeKey) tiers.push({ key: paidKey, tier: 'paid_tier_vital_track' });
  if (tiers.length === 0 && paidKey) tiers.push({ key: paidKey, tier: 'default' });

  return tiers;
}

/**
 * Enforce pacing delay between calls to avoid burst RPM throttling.
 */
async function enforcePacingDelay(delayMs = 80) {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTimestamp = Date.now();
}

/**
 * Call Gemini API using dual-tier smart cascade failover:
 * 1. Try Free Tier (0,00 €)
 * 2. On 429 quota / RPM rate limit, seamlessly and invisibly failover to Paid Tier.
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
  const tiers = getTierKeys(apiKey);
  if (tiers.length === 0) {
    throw new Error('Aucune clé GEMINI_API_KEY configurée sur le serveur');
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

  for (const tierObj of tiers) {
    const { key: activeKey, tier: tierName } = tierObj;

    // Check if entire tier is in cooldown
    const tierCooldown = tierCooldownMap.get(tierName) || 0;
    if (now < tierCooldown) {
      console.log(`[VT FinOps] Tier [${tierName}] currently in cooldown. Skipping to next tier.`);
      continue;
    }

    console.log(`[VT FinOps Cascade] Attempting via Tier [${tierName}] (Models: ${modelsToTry.join(' -> ')})`);

    for (const modelName of modelsToTry) {
      const cooldownKey = `${tierName}_${modelName}`;
      const modelCooldown = modelCooldownMap.get(cooldownKey) || 0;
      if (now < modelCooldown) {
        continue;
      }

      try {
        await enforcePacingDelay(80);

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
          console.warn(`[VT Cascade] Tier [${tierName}] Model [${modelName}] Status ${response.status}:`, errMsg);

          // 429 Quota Exceeded (RPM or RPD)
          if (response.status === 429) {
            const isDaily = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('daily') || errMsg.includes('per day') || errMsg.includes('depleted');
            const cooldownDuration = isDaily ? (2 * 3600 * 1000) : (60 * 1000);
            modelCooldownMap.set(cooldownKey, Date.now() + cooldownDuration);
            
            // If Free Tier hits daily limit, set cooldown on the whole free tier so we don't waste time
            if (tierName.startsWith('free') && isDaily) {
              tierCooldownMap.set(tierName, Date.now() + cooldownDuration);
              console.warn(`⚡ [VT FinOps] Free Tier daily limit reached! Seamlessly switching to Paid Tier...`);
              break; // break inner model loop and try next tier (Paid)
            }

            lastErr = new Error(`Quota limit on Tier [${tierName}] model [${modelName}]`);
            continue; // Failover to next model in cascade
          }

          // 503 Overloaded / 500 / 502
          if (response.status === 503 || response.status === 500 || response.status === 502) {
            modelCooldownMap.set(cooldownKey, Date.now() + 45 * 1000);
            lastErr = new Error(`Overload on model [${modelName}]`);
            continue; // Failover to next model in cascade
          }

          // 404 / 400 Unsupported model
          if (response.status === 404 || response.status === 400) {
            modelCooldownMap.set(cooldownKey, Date.now() + 6 * 3600 * 1000);
            lastErr = new Error(`Unsupported model [${modelName}]`);
            continue;
          }

          throw new Error(errMsg);
        }

        // Streaming Response
        if (stream) {
          console.log(`✅ [VT Cascade] Streaming via Tier [${tierName}] Model [${modelName}]`);
          response.model = modelName;
          response.tier = tierName;
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
          console.log(`✅ [VT Cascade] Success via Tier [${tierName}] Model [${modelName}]`);
          return { text: generatedText.trim(), model: modelName, tier: tierName };
        }

        lastErr = new Error(`Empty response from ${modelName}`);
        continue;
      } catch (err) {
        console.warn(`[VT Cascade] Error on Tier [${tierName}] Model [${modelName}]:`, err.message);
        lastErr = err;
        if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
          modelCooldownMap.set(cooldownKey, Date.now() + 60 * 1000);
        }
      }
    }
  }

  throw lastErr || new Error('Tous les tiers et modèles de la cascade ont échoué.');
}

module.exports = {
  callGeminiApi,
  resolveModelName,
  CASCADE_MODELS,
  COMPLEX_CASCADE,
  SIMPLE_CASCADE,
};
