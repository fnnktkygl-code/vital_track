/**
 * POST /api/tts — Ultra-Realistic Neural Studio Text-To-Speech
 * 
 * Generates natural, human-like, fluid speech in French (France / Canada), English & Spanish
 * with choice of Male (Homme) and Female (Femme) neural studio voices.
 */
const { Communicate } = require('edge-tts-universal');
const { authGuard } = require('./_lib/auth');

const VOICE_MAP = {
  fr: {
    female: 'fr-FR-DeniseNeural',
    male: 'fr-FR-HenriNeural',
    female_expressive: 'fr-FR-VivienneMultilingualNeural',
    male_expressive: 'fr-FR-RemyMultilingualNeural',
    female_young: 'fr-FR-EloiseNeural'
  },
  'fr-CA': {
    female: 'fr-CA-SylvieNeural',
    male: 'fr-CA-AntoineNeural',
    male_mature: 'fr-CA-JeanNeural',
    male_young: 'fr-CA-ThierryNeural'
  },
  en: {
    female: 'en-US-JennyNeural',
    male: 'en-US-GuyNeural',
    female_hd: 'en-US-AvaMultilingualNeural',
    male_hd: 'en-US-AndrewMultilingualNeural'
  },
  es: {
    female: 'es-ES-ElviraNeural',
    male: 'es-ES-AlvaroNeural'
  }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!authGuard(req, res)) return;

  try {
    const { text, voice, gender, language } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    // Clean text: strip markdown code blocks, JSON action cards, links, emojis
    let cleanText = text
      .replace(/```[\s\S]*?```/g, '') // remove code/json
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // [text](url) -> text
      .replace(/[*#_~`>]/g, '') // markdown chars
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // emojis
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'No readable text after cleaning' });
    }

    // Limit text length to 4000 characters for snappy generation
    cleanText = cleanText.slice(0, 4000);

    const langKey = language === 'en' ? 'en' : language === 'es' ? 'es' : language === 'fr-CA' ? 'fr-CA' : 'fr';
    const langVoices = VOICE_MAP[langKey] || VOICE_MAP.fr;

    let selectedVoice = voice;
    if (!selectedVoice || !selectedVoice.includes('Neural')) {
      const selectedGender = (gender === 'male' || voice === 'male') ? 'male' : 'female';
      selectedVoice = langVoices[selectedGender] || langVoices.female;
    }

    const communicate = new Communicate(cleanText, {
      voice: selectedVoice,
      rate: '+5%', // Natural dynamic pace
      pitch: '+0Hz'
    });

    const stream = await communicate.stream();
    const chunks = [];
    for await (const chunk of stream) {
      if (chunk.type === 'audio') {
        chunks.push(chunk.data);
      }
    }

    if (!chunks.length) {
      return res.status(500).json({ error: 'TTS stream returned empty audio' });
    }

    const audioBuffer = Buffer.concat(chunks);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(audioBuffer);

  } catch (err) {
    console.error('[/api/tts] Error:', err);
    return res.status(500).json({ error: 'Speech synthesis failed', details: err.message });
  }
};
