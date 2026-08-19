/**
 * Universal LLM Cascade Rotator with Cooldown Management
 * 
 * Automatically iterates through prioritized AI models on rate-limit (429)
 * or temporary server errors, maintaining a cooldown registry in memory.
 */

const COMPLEX_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-pro',
  'gemini-3.5-flash',
  'gemini-3.1-pro',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];

const SIMPLE_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.6-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it'
];

const modelCooldownMap = new Map();
let lastCallTimestamp = 0;

async function enforcePacingDelay(delayMs = 200) {
  const now = Date.now();
  const elapsed = now - lastCallTimestamp;
  if (elapsed < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTimestamp = Date.now();
}

async function callLlmCascade({
  prompt,
  systemPrompt = '',
  apiKey = process.env.GEMINI_API_KEY,
  isComplex = false,
  stream = false
}) {
  if (!apiKey) {
    throw new Error('Missing API Key in environment variables.');
  }

  const cascadeList = isComplex ? COMPLEX_CASCADE : SIMPLE_CASCADE;
  const now = Date.now();

  for (const model of cascadeList) {
    const cooldownUntil = modelCooldownMap.get(model) || 0;
    if (now < cooldownUntil) {
      continue;
    }

    try {
      await enforcePacingDelay(200);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 429) {
        modelCooldownMap.set(model, Date.now() + 60000);
        continue;
      }

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { text, model, raw: data };
    } catch (err) {
      continue;
    }
  }

  throw new Error('All models in cascade failed or exhausted quota.');
}

module.exports = { callLlmCascade, COMPLEX_CASCADE, SIMPLE_CASCADE };
