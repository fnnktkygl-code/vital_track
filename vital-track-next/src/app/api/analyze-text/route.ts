import { NextRequest, NextResponse } from 'next/server';
import { executeGeminiWithFailover } from '@/lib/ai/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const { query, language = 'fr' } = await req.json();
    const customKey = req.headers.get('x-gemini-key') || undefined;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Paramètre query requis' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    const systemPrompt = `Tu es l'expert mondial en Nutrition Vivante, Décomposition Culinaire et Hygiénisme Vitaliste (selon Dr. Robert Morse, Dr. Sebi, Arnold Ehret).
L'utilisateur te donne la description d'un plat ou d'un repas (ex: « Mafé au poulet », « Couscous royal », « Attiéké avec poisson braisé », « Salade composée avocat papaye graines de lin »).

Utilise la recherche Google (Google Search Grounding) pour identifier la recette authentique et décomposer ce plat en ses aliments constitutifs distincts avec leurs métriques bioénergétiques.

Retourne STRICTEMENT un objet JSON valide (aucun texte avant ou après, pas de markdown \`\`\`json) sous cette structure :

{
  "data": {
    "mealName": "Nom du plat",
    "summary": "Résumé de l'impact physiologique et lymphatique",
    "foods": [
      {
        "id": "food_1",
        "name": "Nom de l'ingrédient / aliment",
        "emoji": "🥗",
        "category": "Légumes | Fruits | Céréales | Légumineuses | Viandes & Charcuterie | etc.",
        "family": "Famille",
        "electric": true,
        "approved": true,
        "hybrid": false,
        "pral": -5.2,
        "scientific_defaults": { "pral": -5.2, "density": 85, "label": "Alcalinisant" },
        "scientific": { "pral": -5.2, "density": 85, "label": "Alcalinisant" },
        "nova": 1,
        "vitality": { "nova": 1, "freshness": 95, "label": "Aliment Brut" },
        "freshness": 95,
        "mucus": "Dissolvant | Sans Mucus | Faiblement Mucogène | Mucogène | Fortement Mucogène",
        "specific": { "electric": true, "hybrid": false, "mucus": "Dissolvant", "label": "Électrique (Dr. Sebi)" }
      }
    ]
  }
}`;

    const { result, modelUsed } = await executeGeminiWithFailover(
      'foodSearch',
      customKey,
      async (ai, modelName) => {
        const model = ai.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} } as any],
          generationConfig: {
            temperature: 0.1,
          },
        });

        const prompt = `Décompose et analyse factuellement les ingrédients du plat : « ${cleanQuery} ». Réponds en langue ${language === 'en' ? 'anglaise' : 'française'} au format JSON structuré demandé.`;

        const response = await model.generateContent([
          { text: systemPrompt },
          { text: prompt },
        ]);

        const rawText = response.response.text();
        
        let cleanJson = rawText.trim();
        const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanJson = jsonMatch[1].trim();
        }

        return JSON.parse(cleanJson);
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API AnalyzeText Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la décomposition IA du plat' },
      { status: 500 }
    );
  }
}
