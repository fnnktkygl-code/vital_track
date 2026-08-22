/**
 * POST /api/deep-search — VitalTrack Deep Clinical Vitalist Search & Assessment
 * 
 * Holistic, Multi-Emunctory Clinical Engine powered by Gemini Free Tier (500 RPD).
 * Integrates 10M characters of vitalist primary sources:
 * - Dr. Sebi, Arnold Ehret, Dr. Robert Morse, David Wolfe, Dr. John Kallas,
 *   Dr. John Christopher, Stephen Buhner, Dr. James Duke & Leslie Taylor.
 * 
 * Guaranteed 100% Free / Zero Paid Fallback.
 */

const { callGeminiApi } = require('./_lib/geminiFallback');
const { authGuard } = require('./_lib/auth');
const { retrieveRelevantKnowledge } = require('./_lib/knowledgeRetriever');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VT-API-Key, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authGuard(req, res)) return;

  try {
    const apiKey = process.env.GEMINI_API_KEY_FREE || process.env.GEMINI_API_KEY || req.headers?.['x-gemini-key'] || req.body?.geminiApiKey;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée. Veuillez renseigner votre clé gratuite Google AI Studio dans Paramètres ⚙️.'
      });
    }

    const {
      profile = {},
      symptoms = {},
      medications = '',
      bloodBiomarkers = {},
      historyData = {},
      preferredLanguage = 'fr'
    } = req.body || {};

    // ── 1. Construire les requêtes RAG ciblées pour extraire le savoir clinique ──
    const searchTerms = [
      profile.goal || 'détoxication régénération cellulaire',
      symptoms.kidneys ? 'reins filtration glomérulaire sédiments urinaires acide urique' : '',
      symptoms.colon ? 'colon péristaltisme biofilm mucus constipation transit' : '',
      symptoms.liver ? 'foie bile surcharge hépatique langue chargée décongestion' : '',
      medications ? `interactions médicamenteuses contre-indications ${medications}` : 'sécurité phytothérapie'
    ].filter(Boolean).join(' ');

    const knowledgeText = retrieveRelevantKnowledge(searchTerms, {
      maxChunks: 8,
      preferredLanguage: preferredLanguage || 'fr'
    });

    const knowledgeContext = typeof knowledgeText === 'string' && knowledgeText.trim().length > 0
      ? knowledgeText
      : 'Sources vitalistes classiques de référence.';

    // ── 2. Construire le prompt clinique approfondi ──
    const systemPrompt = `Tu es le Moteur d'Analyse Clinique Vitaliste Approfondi (Deep Search Engine) de VitalTrack.
Tu incarnes la synthèse rigoureuse et bienveillante des plus grands maîtres de la santé naturelle et de l'hygiénisme :
- Dr. Sebi (Alimentation bio-électrique cellulaire, minéralisation native, alcalinité)
- Prof. Arnold Ehret (Régime sans mucus, diagnostic de toxémie, nettoyage mécanique intestinal)
- Dr. Robert Morse, N.D. (Clearance rénale, drainage lymphatique, chimie acide vs alcaline)
- David Wolfe (Alimentation vivante biophotonique, super-aliments bruts)
- Dr. John Kallas (Nutrition sauvage dense, oméga-3, chlorophylle pure)
- Dr. John R. Christopher (Phytothérapie réparatrice, bouillons de potassium)
- Stephen Buhner, Dr. James Duke, Leslie Taylor (Sécurité phyto-biochimique et interactions médicamenteuses)

DIRECTIVES CLINIQUES CRUCIALES :
1. ANALYSE PROFONDE ET EXHAUSTIVE : Analyse les 5 grands émonctoires (Reins, Côlon, Foie, Poumons, Peau) avec scoring (0-100), statut précis et mécanismes physiologiques.
2. VÉRIFICATION DE SÉCURITÉ MÉDICAMENTEUSE : Si l'utilisateur prend des médicaments, effectue un contrôle rigoureux pour éliminer toute plante à risque (fluidifiants, diurétiques puissants, hypotenseurs, etc.). Si aucun médicament n'est déclaré, valide le feu vert clinique.
3. ADAPTATION DU PALIER DE TRANSITION : Recommande le niveau de transition optimal (Niveau 1: Transition douce avec poissons sauvages / Niveau 2: Sans mucus d'Ehret / Niveau 3: Vivant & Sub-acide / Niveau 4: Électrique Dr. Sebi).
4. PLAN 7 JOURS RÉALISTE : Propose un menu 7 jours cohérent, mentionnant les recettes réelles de la base (Gel de Sea Moss, Salade Balai, Master Lemonade, Bouillon de Potassium, Mayonnaise d'Avocat, Poêlée d'Amaranthe, Papillote de Saumon Sauvage, etc.).
5. FORMAT DE SORTIE : Tu DOIS répondre EXCLUSIVEMENT par un objet JSON valide, sans texte d'introduction ni balises markdown superflues.`;

    const userPrompt = `Effectue le Bilan Vitaliste Clinique Approfondi pour ce profil :

=== DONNÉES DU PATIENT / UTILISATEUR ===
- Profil : Âge: ${profile.age || 'N/C'}, Sexe: ${profile.gender || 'N/C'}, Taille: ${profile.height || 'N/C'} cm, Poids Actuel: ${profile.weight || 'N/C'} kg, Poids Cible: ${profile.targetWeight || 'N/C'} kg, Niveau d'activité: ${profile.activity || 'N/C'}, Objectif: ${profile.goal || 'Santé globale'}
- Symptômes déclarés :
  * Reins / Vessie : ${symptoms.kidneys || 'Aucun symptôme majeur'}
  * Côlon / Intestins : ${symptoms.colon || 'Transit normal'}
  * Foie / Vésicule : ${symptoms.liver || 'Aucune gêne hépatique signalée'}
  * Poumons / Sinus / Catarrhe : ${symptoms.lungs || 'Voies respiratoires libres'}
  * Peau / Sudation : ${symptoms.skin || 'Peau normale'}
  * Énergie / Sommeil / Douleurs : ${symptoms.energy || 'Énergie stable'}, ${symptoms.sleep || 'Sommeil réparateur'}, ${symptoms.pain || 'Pas de douleurs articulaires'}
- Traitements & Médicaments en cours : ${medications || 'Aucun traitement médicamenteux'}
- Biomarqueurs sanguins récents : ${JSON.stringify(bloodBiomarkers || {})}
- Historique VitalTrack : Repas récents: ${JSON.stringify(historyData.recentMeals || [])}, Jeûnes: ${JSON.stringify(historyData.fastingHistory || [])}, PRAL moyen estimé: ${historyData.averagePRAL || 'N/C'}

=== EXTRAITS DE CONNAISSANCE VITALISTE (RAG) ===
${knowledgeContext}

Génère la structure JSON exacte suivante :
{
  "overallVitalityScore": <nombre 0-100>,
  "toxemiaLevel": "<Légère / Modérée / Élevée / Sévère avec qualificatif vitaliste>",
  "pralSummary": "<Résumé de l'équilibre acido-basique et charge rénale>",
  "recommendedTransitionLevel": <1 | 2 | 3 | 4>,
  "recommendedTransitionTitle": "<Titre explicite du niveau de transition>",
  "executiveSummary": "<Synthèse clinique bienveillante et percutante de 3-4 paragraphes>",
  "emonctoires": {
    "reins": {
      "score": <0-100>,
      "status": "<Statut clinique court>",
      "analysis": "<Explication du mécanisme d'élimination et signes d'acidose>",
      "actions": ["<Action 1>", "<Action 2>", "<Action 3>"]
    },
    "colon": {
      "score": <0-100>,
      "status": "<Statut clinique court>",
      "analysis": "<Analyse du transit, mucus et motilité>",
      "actions": ["<Action 1>", "<Action 2>", "<Action 3>"]
    },
    "foie": {
      "score": <0-100>,
      "status": "<Statut clinique court>",
      "analysis": "<Analyse de la fonction biliaire et décongestion>",
      "actions": ["<Action 1>", "<Action 2>", "<Action 3>"]
    },
    "poumons": {
      "score": <0-100>,
      "status": "<Statut clinique court>",
      "analysis": "<Analyse du catarrhe et de l'élimination gazeuse>",
      "actions": ["<Action 1>", "<Action 2>"]
    },
    "peau": {
      "score": <0-100>,
      "status": "<Statut clinique court>",
      "analysis": "<Rôle d'émonctoire secondaire et sudation>",
      "actions": ["<Action 1>", "<Action 2>"]
    }
  },
  "safetyAndInteractions": {
    "hasWarnings": <true/false>,
    "warningsList": ["<Avertissement si médicament présent>"],
    "contraindicatedHerbs": ["<Herbe déconseillée>"],
    "safeAlternatives": ["<Alternative sûre>"],
    "generalSafetyNote": "<Recommandation de sécurité et validation avec médecin traitant>"
  },
  "phytotherapyProtocol": {
    "morning": { "remedy": "<Nom remède>", "preparation": "<Comment préparer>", "therapeuticTarget": "<Cible>" },
    "afternoon": { "remedy": "<Nom remède>", "preparation": "<Comment préparer>", "therapeuticTarget": "<Cible>" },
    "evening": { "remedy": "<Nom remède>", "preparation": "<Comment préparer>", "therapeuticTarget": "<Cible>" },
    "weeklyRoutine": "<Conseils de fréquence et posologie>"
  },
  "weeklyMealPlan": [
    {
      "day": 1,
      "focus": "<Objectif du jour 1>",
      "breakfast": { "title": "<Titre repas>", "description": "<Détail>", "recipeId": "<id optionnel>" },
      "lunch": { "title": "<Titre repas>", "description": "<Détail>", "recipeId": "<id optionnel>" },
      "snack": { "title": "<Titre en-cas>", "description": "<Détail>", "recipeId": "<id optionnel>" },
      "dinner": { "title": "<Titre dîner>", "description": "<Détail>", "recipeId": "<id optionnel>" }
    }
    // ... jours 2 à 7
  ],
  "eliminationCrisisManagement": {
    "expectedSymptoms": ["<Symptôme élimination 1>", "<Symptôme 2>"],
    "naturalSolutions": ["<Solution naturelle 1>", "<Solution 2>"],
    "whenToConsultDoctor": "<Drapeaux rouges médicaux>"
  },
  "verifiedPrimarySources": [
    { "author": "<Nom>", "work": "<Livre>", "relevance": "<En quoi cette source fonde ce bilan>" }
  ]
}`;

    // ── 3. Appel de l'API Gemini FinOps Cascade ──
    const geminiRes = await callGeminiApi({
      apiKey,
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      intent: 'complex',
      requestedModel: 'gemini-3.7-flash',
      forceFreeTierOnly: false,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 5000,
        responseMimeType: 'application/json'
      }
    });

    const rawText = (typeof geminiRes === 'object' && geminiRes.text) ? geminiRes.text : (geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text || String(geminiRes || ''));
    if (!rawText) {
      return res.status(500).json({ error: "L'analyse n'a pas pu être générée. Veuillez réessayer." });
    }

    let parsedResult;
    try {
      // Nettoyage éventuel des balises markdown si présentes
      const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[DeepSearch] JSON Parse Error:', parseErr, rawText);
      return res.status(500).json({
        error: "Erreur lors du décodage du rapport clinique.",
        rawText: rawText.slice(0, 500)
      });
    }

    return res.status(200).json({
      status: 'success',
      report: parsedResult,
      generatedAt: new Date().toISOString(),
      disclaimer: "Ce bilan est un outil d'accompagnement vitaliste et hygiéniste à visée informative et éducative. Il ne se substitue pas à un avis médical, un diagnostic ou un traitement prescrit par un professionnel de santé qualifié."
    });

  } catch (err) {
    console.error('[DeepSearch API Error]', err);
    return res.status(500).json({
      error: err.message || "Erreur interne lors de l'exécution du Bilan Deep Search."
    });
  }
};
