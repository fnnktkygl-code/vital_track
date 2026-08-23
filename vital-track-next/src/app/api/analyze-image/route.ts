import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiWithFailover } from '@/lib/ai/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();
    const customKey = req.headers.get('x-gemini-key') || undefined;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 requise' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyse cette photo de repas ou d'aliment selon les principes de la nutrition vivante et vitaliste (Dr. Sebi, Arnold Ehret, Dr. Morse).
    Retourne STRICTEMENT un objet JSON valide avec cette structure :
    {
      "mealName": "Nom clair du plat",
      "emoji": "🍽️",
      "pralScore": -8.5,
      "novaGroup": 1,
      "isElectric": true,
      "isHybrid": false,
      "isMucusForming": false,
      "freshnessScore": 95,
      "identifiedIngredients": ["ingrédient 1", "ingrédient 2"],
      "vitalityAnalysis": "Analyse détaillée de l'impact sur les émonctoires...",
      "recommendations": ["Conseil 1", "Conseil 2"]
    }`;

    const { result, modelUsed } = await executeGeminiWithFailover(
      'vision',
      customKey,
      async (ai, modelName) => {
        const model = ai.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        };

        const response = await model.generateContent([prompt, imagePart]);
        const text = response.response.text();
        return JSON.parse(text);
      }
    );

    return NextResponse.json({
      analysis: result,
      modelUsed,
      cached: false,
    });
  } catch (error: any) {
    console.error('[API Vision Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse de l\'image' },
      { status: 500 }
    );
  }
}
