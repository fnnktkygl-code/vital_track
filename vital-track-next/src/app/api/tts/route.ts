import { NextRequest, NextResponse } from 'next/server';
import { Communicate } from 'edge-tts-universal';

const VOICE_MAP: Record<string, Record<string, string>> = {
  fr: {
    female: 'fr-FR-DeniseNeural',
    male: 'fr-FR-HenriNeural',
    female_expressive: 'fr-FR-VivienneMultilingualNeural',
    male_expressive: 'fr-FR-RemyMultilingualNeural',
    female_young: 'fr-FR-EloiseNeural',
  },
  'fr-CA': {
    female: 'fr-CA-SylvieNeural',
    male: 'fr-CA-AntoineNeural',
    male_mature: 'fr-CA-JeanNeural',
    male_young: 'fr-CA-ThierryNeural',
  },
  en: {
    female: 'en-US-JennyNeural',
    male: 'en-US-GuyNeural',
    female_hd: 'en-US-AvaMultilingualNeural',
    male_hd: 'en-US-AndrewMultilingualNeural',
  },
  es: {
    female: 'es-ES-ElviraNeural',
    male: 'es-ES-AlvaroNeural',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice, gender = 'female', language = 'fr', rate = '+0%' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texte requis pour la synthèse vocale' }, { status: 400 });
    }

    // Clean text: strip markdown code blocks, URLs, and excessive symbols
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*#_~`>]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    if (!cleanText) {
      return NextResponse.json({ error: 'Aucun texte lisible' }, { status: 400 });
    }

    const langKey = language === 'en' ? 'en' : language === 'es' ? 'es' : language === 'fr-CA' ? 'fr-CA' : 'fr';
    const langVoices = VOICE_MAP[langKey] || VOICE_MAP.fr;

    let selectedVoice = voice;
    if (!selectedVoice || !selectedVoice.includes('Neural')) {
      const selectedGender = gender === 'male' ? 'male' : 'female';
      selectedVoice = langVoices[selectedGender] || langVoices.female;
    }

    const communicate = new Communicate(cleanText, {
      voice: selectedVoice,
      rate,
      pitch: '+0Hz',
    });

    const stream = await communicate.stream();
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      if (chunk.type === 'audio' && chunk.data) {
        chunks.push(new Uint8Array(chunk.data));
      }
    }

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Flux audio vide' }, { status: 500 });
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return new Response(merged, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: any) {
    console.error('[API TTS Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération audio TTS' },
      { status: 500 }
    );
  }
}
