const { callGeminiApi } = require('./_lib/geminiFallback');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server GEMINI_API_KEY not configured' });

    const systemInstruction = `Tu es un expert en nutrition vitaliste, naturopathie et classifications du Dr. Sebi, Arnold Ehret et Dr. Morse.
L'utilisateur cherche un aliment qui n'est pas dans notre base de données : "${query}".
Ton but est de retrouver les données factuelles de cet aliment et de retourner un objet JSON strictement formaté.
Si tu ne connais pas cet aliment, ou s'il n'existe pas, retourne un JSON avec id="not_found".
IMPORTANT:
- Ne crée PAS de fausses données.
- Si une donnée scientifique n'est pas certaine (ex: PRAL ou densité nutritionnelle), mets une valeur estimée au plus proche du réel ou 0 si impossible.
- Le nom doit inclure l'anglais et le français dans 'names'.
- Les catégories NOVA: 1 (Brut), 2 (Ingrédient culinaire), 3 (Transformé), 4 (Ultra-transformé).
- 'hybrid': booléen (l'aliment a-t-il été hybridé par l'homme ? ex: banane sans pépin, blé moderne).
- 'electric': booléen (classification Dr Sebi).
- 'mucus': "Dissolvant" (fruits acidulés/citrus), "Neutre", ou "Mucogène" (amidons, viandes, laitages).
`;

    const schema = {
      type: "OBJECT",
      properties: {
        id: { type: "STRING" },
        names: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        emoji: { type: "STRING" },
        family: { type: "STRING" },
        category: { type: "STRING" },
        vitality: {
          type: "OBJECT",
          properties: {
            nova: { type: "NUMBER" },
            freshness: { type: "NUMBER" },
            label: { type: "STRING" }
          },
          required: ["nova", "freshness", "label"]
        },
        specific: {
          type: "OBJECT",
          properties: {
            mucus: { type: "STRING" },
            hybrid: { type: "BOOLEAN" },
            electric: { type: "BOOLEAN" },
            label: { type: "STRING" }
          },
          required: ["mucus", "hybrid", "electric", "label"]
        },
        scientific_defaults: {
          type: "OBJECT",
          properties: {
            pral: { type: "NUMBER" },
            density: { type: "NUMBER" }
          },
          required: ["pral", "density"]
        }
      },
      required: ["id", "names", "emoji", "family", "category", "vitality", "specific", "scientific_defaults"]
    };

    const result = await callGeminiApi({
      apiKey,
      prompt: `Trouve les infos pour: ${query}`,
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    let foodData;
    try {
      foodData = JSON.parse(result.text);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    if (foodData.id === 'not_found') {
      return res.status(404).json({ error: 'Food not found by AI' });
    }

    // Ensure the ID is safe
    foodData.id = foodData.id.toLowerCase().replace(/\s+/g, '_');
    
    // Flag this as an AI generated food so the UI knows
    foodData.isNewFromAI = true;

    return res.status(200).json(foodData);
  } catch (error) {
    console.error('AI Food Search Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
};
