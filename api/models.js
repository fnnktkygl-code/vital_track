module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const freeKey = (process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_FREE_KEY || '').trim();
  const paidKey = (process.env.GEMINI_API_KEY_PAID || process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY || '').trim();

  const keys = [];
  if (freeKey) keys.push({ tier: 'free', key: freeKey });
  if (paidKey) keys.push({ tier: 'paid', key: paidKey });

  const results = {};

  for (const k of keys) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k.key}`);
      const data = await resp.json();
      results[k.tier] = {
        status: resp.status,
        models: data.models ? data.models.map(m => m.name.replace('models/', '')) : data
      };
    } catch (err) {
      results[k.tier] = { error: err.message };
    }
  }

  res.status(200).json(results);
};
