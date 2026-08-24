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

    const systemPrompt = `Tu es l'expert mondial en Biochimie Clinique, Botanique Médicale, Nutrition Vivante et Hygiénisme Vitaliste (selon Dr. Robert Morse, Dr. Sebi, Arnold Ehret).
Ton rôle est d'analyser n'importe quel aliment ou plat du monde (même méconnu, traditionnel, régional ou dans une langue étrangère).

Utilise la recherche Google (Google Search Grounding) pour identifier la composition réelle, les ingrédients exacts et la méthode de préparation authentique de « ${cleanQuery} ».

Retourne STRICTEMENT un objet JSON valide (aucun texte avant ou après, pas de markdown \`\`\`json) respectant rigoureusement ce schéma :

{
  "id": "food_${Date.now()}",
  "name": "Nom canonique du plat ou de l'aliment (ex: Mafé de Poulet à l'Arachide)",
  "names": ["Nom principal", "Nom d'origine ou synonymes"],
  "emoji": "🍲",
  "category": "Plats Cuisinés & Fast Food",
  "family": "Famille culinaire ou botanique",
  "electric": false,
  "approved": false,
  "hybrid": false,
  "pral": 8.5,
  "scientific_defaults": {
    "pral": 8.5,
    "density": 45,
    "label": "Acidifiant"
  },
  "scientific": {
    "pral": 8.5,
    "density": 45,
    "label": "Acidifiant"
  },
  "nova": 3,
  "vitality": {
    "nova": 3,
    "freshness": 40,
    "label": "Score de vitalité biologique"
  },
  "freshness": 40,
  "mucus": "Mucogène",
  "specific": {
    "electric": false,
    "hybrid": false,
    "mucus": "Mucogène",
    "label": "Standard / Mucogène"
  },
  "ingredients": ["ingrédient 1", "ingrédient 2", "ingrédient 3", "ingrédient 4", "ingrédient 5"],
  "items": [
    {
      "name": "Nom de l'ingrédient ou plante (ex: Dakhaar / Tamarin sauvage)",
      "pral": -14.2,
      "electric": true,
      "category": "Fruits sauvages",
      "role": "Solvant lymphatique puissant, drainage hépato-biliaire"
    }
  ],
  "electrolytes": {
    "potassium": 350,
    "magnesium": 45,
    "calcium": 30,
    "sodium": 420
  },
  "macros": {
    "calories": 480,
    "proteins": 28,
    "carbs": 35,
    "fats": 26
  },
  "note": "Explication clinique et vitaliste complète : impact sur le feu digestif, la viscosité de la lymphe, la charge acide rénale et conseils d'optimisation ou de transition.",
  "grounding_sources": []
}

Règles de classification vitaliste :
1. "electric" = true UNIQUEMENT si l'aliment est une plante sauvage ou non hybridée de la liste officielle du Dr. Sebi (ou équivalent sauvage natif cru/vivant).
2. "hybrid" = true pour les plantes hybridées/amidons cuits (carotte cuite, pomme de terre, riz, blé, tofu, haricots).
3. "mucus" = "Dissolvant" (fruits aqueux acides/subacides, baies, melons), "Sans Mucus" (feuilles vertes crues, courgettes, concombres), "Faiblement Mucogène" (légumes cuits vapeur douce), "Mucogène" (amidons cuits, viandes, produits laitiers, fritures).
4. Le PRAL doit être calculé de manière scientifiquement rigoureuse selon la formule de Remer et Manz.
5. Sois 100% FACTUEL et précis pour tous les plats du monde entier.`;

    const { result, modelUsed } = await executeGeminiWithFailover(
      'foodSearch',
      customKey,
      async (ai, modelName) => {
        // Active Google Search Grounding for real-world factual retrieval
        const model = ai.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} } as any],
          generationConfig: {
            temperature: 0.1,
          },
        });

        const prompt = `Recherche et analyse de manière factuelle et approfondie l'aliment ou plat : « ${cleanQuery} ». Réponds en langue ${language === 'en' ? 'anglaise' : 'française'} au format JSON structuré demandé.`;

        const response = await model.generateContent([
          { text: systemPrompt },
          { text: prompt },
        ]);

        const rawText = response.response.text();
        
        // Extract JSON if model wrapped in markdown code fence
        let cleanJson = rawText.trim();
        const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          cleanJson = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(cleanJson);

        // Extract search grounding metadata if available
        const candidate = response.response.candidates?.[0];
        const groundingMetadata = (candidate as any)?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          const webSources = groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web?.title || chunk.web?.uri)
            .filter(Boolean);
          if (webSources.length > 0) {
            parsed.grounding_sources = webSources.slice(0, 5);
          }
        }

        return parsed;
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API SearchFood Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la recherche IA de l\'aliment' },
      { status: 500 }
    );
  }
}
