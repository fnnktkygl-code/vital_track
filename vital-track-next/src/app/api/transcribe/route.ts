import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiWithFailover } from '@/lib/ai/geminiClient';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-VT-API-Key, x-gemini-key, Accept',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const customKey = req.headers.get('x-gemini-key') || req.headers.get('X-Gemini-Key') || undefined;
    const body = await req.json().catch(() => ({}));
    const { audioData, mimeType = 'audio/webm', language = 'fr' } = body;

    if (!audioData || typeof audioData !== 'string') {
      return NextResponse.json({ error: 'Données audio requises (base64)' }, { status: 400 });
    }

    const cleanBase64 = audioData.replace(/^data:audio\/\w+;base64,/, '').trim();
    if (!cleanBase64) {
      return NextResponse.json({ error: 'Données audio invalides' }, { status: 400 });
    }

    const langMap: Record<string, string> = {
      'en': 'Transcribe accurately in English.',
      'es': 'Transcribe con absoluta fidelidad en Español.',
      'fr-CA': 'Transcris fidèlement et intégralement en Français (Canada / Québec).',
      'fr': 'Transcris fidèlement et intégralement en Français.'
    };
    const langInstruction = langMap[language] || langMap.fr;

    const systemPrompt = `You are a high-fidelity speech-to-text audio transcription engine for VitalTrack.
${langInstruction}
CRITICAL INSTRUCTIONS:
- Transcribe EVERYTHING the user said from the first syllable to the very last word with 100% completeness.
- Do NOT truncate or omit the ending words or trailing phrases.
- Accurately preserve all health, medical, vitalist, botanical, and dietary vocabulary (e.g. Dr. Sebi, Arnold Ehret, Robert Morse, détox, mucus, émonctoires, reins, lymphe, jeûne, papaye, algues, électrolytes, etc.).
- Output ONLY the raw transcribed text. Never add conversational commentary, timestamps, or quotes.`;

    const { result, modelUsed } = await executeGeminiWithFailover(
      'transcribe',
      customKey,
      async (ai, modelName) => {
        const model = ai.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: { temperature: 0.1 },
        });

        const audioPart = {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'audio/webm',
          },
        };

        const response = await model.generateContent([
          { text: 'Transcribe this complete voice audio recording without omitting any words.' },
          audioPart,
        ]);

        const text = response.response.text();
        return text ? text.replace(/^["'\s]+|["'\s]+$/g, '').trim() : '';
      }
    );

    return NextResponse.json({
      text: result,
      modelUsed,
    });
  } catch (error: any) {
    console.error('[API Transcribe Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la transcription audio' },
      { status: 500 }
    );
  }
}
