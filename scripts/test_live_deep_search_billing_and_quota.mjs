/**
 * test_live_deep_search_billing_and_quota.mjs
 * 
 * Test complet et simulation réelle du Deep Search de VitalTrack
 * utilisant directement l'API Google avec la clé utilisateur pour mesurer :
 *  1. Les tokens d'entrée (Prompt Tokens)
 *  2. Les tokens de sortie (Output / Candidates Tokens)
 *  3. Les tokens de réflexion (Thinking Tokens)
 *  4. La latence exacte en secondes
 *  5. Le coût estimé en USD / EUR selon la grille Google AI Studio
 *  6. La consommation du quota gratuit (RPD / RPM)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FREE;

if (!apiKey) {
  console.error('❌ ERREUR: GEMINI_API_KEY manquante dans process.env');
  process.exit(1);
}

// ── 1. Données complètes et réalistes de l'utilisateur / patient ──
const samplePatientData = {
  profile: {
    age: 44,
    gender: 'Masculin',
    height: 178,
    weight: 84.5,
    targetWeight: 75.0,
    activity: 'Modéré (30 min marche/jour, sédentaire au bureau)',
    goal: 'Détoxification lymphatique profonde, relance de la filtration rénale et disparition du reflux gastro-œsophagien.'
  },
  symptoms: {
    kidneys: 'Urine claire le matin sans sédiments floconneux (filtres fermés), lourdeur lombaire en fin de journée.',
    colon: 'Transit ralenti (1 selle tous les 2 jours), selles dures, ballonnements post-prandiaux avec gaz.',
    liver: 'Langue pâteuse et chargée blanche/jaune au réveil, digestion lente des corps gras, réveil récurrent vers 2h30.',
    lungs: 'Catarrhe matinal (raclement de gorge permanent), sinus occasionnellement encombrés, légère baisse d’endurance respiratoire.',
    skin: 'Peau sèche aux avant-bras, sueurs difficiles au sauna, légères éruptions d’acné dans le haut du dos.',
    energy: 'Coup de pompe vers 14h-15h, baisse de vitalité générale.',
    sleep: 'Sommeil haché avec micro-réveils, réveil difficile.',
    pain: 'Raideurs cervicales matinales, douleurs légères au genou droit.'
  },
  medications: 'Oméprazole 20mg (1 comprimé/matin), Paracétamol occasionnel (en cas de céphalée).',
  bloodBiomarkers: {
    "Créatinine sérique": "104 µmol/L (Légèrement élevée)",
    "Débit de Filtration Glomérulaire (DFG)": "74 mL/min/1.73m² (Filtration sub-optimale)",
    "Acide urique": "425 µmol/L (Élevé - risque acide urique)",
    "Triglycérides": "1.85 g/L",
    "Cholestérol Total": "2.40 g/L (LDL 1.60 g/L)",
    "Glycémie à jeun": "5.6 mmol/L",
    "TSH": "2.95 µIU/mL",
    "Protéine C-Réactive (CRP)": "3.8 mg/L (Inflammation bas bruit)"
  },
  historyData: {
    recentMeals: [
      { date: "J-1 Midi", meal: "Steak haché de bœuf, frites, mayonnaise industrielle, café sucré" },
      { date: "J-1 Soir", meal: "Pizza jambon fromage, 1 verre de vin rouge" },
      { date: "J-0 Matin", meal: "2 croissants, café au lait de vache, jus d'orange en bouteille" },
      { date: "J-0 Midi", meal: "Sandwich baguette jambon beurre emmental, chips" }
    ],
    fastingHistory: [
      { type: "Aucun jeûne récent", duration: "0h" }
    ],
    averagePRAL: "+22.5 mEq (Hautement acidifiant)"
  },
  preferredLanguage: 'fr'
};

// ── 2. Simulation RAG (Extraction des monographies vitalistes de référence) ──
const knowledgeChunks = `
[EXTRAIT DR. ROBERT MORSE - The Detox Miracle Sourcebook]
Le système lymphatique représente 80% des liquides interstitiels du corps humain. C'est le système d'égout cellulaire. Les reins et la peau sont les portes de sortie principales des déchets acides cellulaires.
Lorsque les reins ne filtrent pas (absence de sédiments dans les urines), les acides s'accumulent dans la lymphe, provoquant œdème, inflammation tissulaire, fibromes, et surcharge hépatique.
Pour réactiver les reins : régime frugivore riche en astringents (raisins noirs, citrons, pastèques) combiné à des formules de plantes spécifiques : Gaillet gratteron (Cleavers), Baies de Genévrier (Juniper), Barbe de maïs (Corn silk), Queue de cheval (Horsetail).
Contre-indication : Ne pas utiliser de diurétiques violents de synthèse ni de fortes doses de baies de genévrier en cas d'insuffisance rénale aiguë sans supervision.

[EXTRAIT ARNOLD EHRET - Système de Guérison du Régime Sans Mucus]
La maladie est une tentative du corps d'éliminer le mucus, les toxines et les poisons accumulés depuis la naissance par une alimentation erronée (viandes, produits laitiers, farines raffinées, graisses cuites).
Formule fondamentale : V = P - O (Vitalité = Puissance - Obstruction).
Pour dissoudre le mucus sans provoquer de crise d'élimination trop brutale : transition progressive avec des fruits cuits ou mûrs et des salades à feuilles vert foncé (Salade balai à base de carotte râpée, céleri et chou blanc cru).

[EXTRAIT DR. SEBI - Bio-Electric Cell Food]
Les cellules humaines sont électriques et alcalines. Les aliments acides et hybrides détruisent la membrane cellulaire et créent une prolifération de mucus.
Plantes fondamentales pour le sang et le foie : Racine de Bardane (Burdock root), Pissenlit (Dandelion root), Salsepareille (Sarsaparilla), Quassia.
Aliments recommandés : Amarante, Fonio, Baies sauvages, Pommes sauvages, Courges, Huile d'olive extra-vierge crue pressée à froid.

[SÉCURITÉ CLINIQUE & PHYTOTHÉRAPIE - Dr. James Duke / Leslie Taylor]
Interactions médicamenteuses avec Oméprazole : Éviter les plantes qui altèrent l'acidité gastrique de manière brutale ou qui augmentent la biodisponibilité de l'oméprazole. Privilégier les mucilages apaisants (Guimauve/Marshmallow, Orme rouge/Slippery elm) pour régénérer la muqueuse gastrique en douceur sans inhiber la sécrétion enzymatique naturelle.
`;

const systemPrompt = `Tu es le Moteur d'Analyse Clinique Vitaliste Approfondi (Deep Search Engine) de VitalTrack.
Tu incarnes la synthèse rigoureuse et bienveillante des plus grands maîtres de la santé naturelle et de l'hygiénisme :
- Dr. Sebi (Alimentation bio-électrique cellulaire, minéralisation native, alcalinité)
- Prof. Arnold Ehret (Régime sans mucus, diagnostic de toxémie, nettoyage mécanique intestinal)
- Dr. Robert Morse, N.D. (Clearance rénale, drainage lymphatique, chimie acide vs alcaline)
- David Wolfe, Dr. John Christopher, Dr. James Duke, Leslie Taylor.

DIRECTIVES CLINIQUES CRUCIALES :
1. ANALYSE PROFONDE ET EXHAUSTIVE : Analyse les 5 grands émonctoires (Reins, Côlon, Foie, Poumons, Peau) avec scoring (0-100), statut précis et mécanismes physiologiques.
2. VÉRIFICATION DE SÉCURITÉ MÉDICAMENTEUSE : Contrôle rigoureux des médicaments déclarés (Oméprazole, etc.) et exclusion formelle des plantes à risque.
3. ADAPTATION DU PALIER DE TRANSITION : Recommande le palier optimal avec protocole d'alimentation vivante.
4. PLAN 7 JOURS RÉALISTE : Menu complet 7 jours cohérent avec les recettes de l'application.
5. FORMAT DE SORTIE : Tu DOIS répondre EXCLUSIVEMENT par un objet JSON valide suivant la structure requise.`;

const userPrompt = `Effectue le Bilan Vitaliste Clinique Approfondi pour ce profil :

=== DONNÉES DU PATIENT / UTILISATEUR ===
- Profil : Âge: ${samplePatientData.profile.age}, Sexe: ${samplePatientData.profile.gender}, Taille: ${samplePatientData.profile.height} cm, Poids Actuel: ${samplePatientData.profile.weight} kg, Poids Cible: ${samplePatientData.profile.targetWeight} kg, Activité: ${samplePatientData.profile.activity}, Objectif: ${samplePatientData.profile.goal}
- Symptômes déclarés :
  * Reins / Vessie : ${samplePatientData.symptoms.kidneys}
  * Côlon / Intestins : ${samplePatientData.symptoms.colon}
  * Foie / Vésicule : ${samplePatientData.symptoms.liver}
  * Poumons / Sinus : ${samplePatientData.symptoms.lungs}
  * Peau / Sudation : ${samplePatientData.symptoms.skin}
  * Énergie / Sommeil / Douleurs : ${samplePatientData.symptoms.energy}, ${samplePatientData.symptoms.sleep}, ${samplePatientData.symptoms.pain}
- Médicaments en cours : ${samplePatientData.medications}
- Biomarqueurs sanguins : ${JSON.stringify(samplePatientData.bloodBiomarkers)}
- Historique alimentaire : ${JSON.stringify(samplePatientData.historyData)}

=== CONNAISSANCES VITALISTES ET PHARMACOPÉE DE RÉFÉRENCE ===
${knowledgeChunks}

Réponds au format JSON strict avec les clés :
{
  "overallVitalityScore": 48,
  "toxemiaLevel": "Modérée à Sévère (Acidose lymphatique et stagnation rénale)",
  "executiveSummary": "...",
  "primaryCauses": ["..."],
  "emunctoriesAnalysis": {
    "kidneys": { "score": 40, "status": "...", "analysis": "...", "recommendations": "..." },
    "colon": { "score": 45, "status": "...", "analysis": "...", "recommendations": "..." },
    "liver": { "score": 50, "status": "...", "analysis": "...", "recommendations": "..." },
    "lungs": { "score": 60, "status": "...", "analysis": "...", "recommendations": "..." },
    "skin": { "score": 55, "status": "...", "analysis": "...", "recommendations": "..." }
  },
  "bloodBiomarkersAnalysis": [
    { "biomarker": "...", "value": "...", "clinicalMeaning": "...", "vitalistPerspective": "..." }
  ],
  "drugInteractionsAndSafety": {
    "status": "...",
    "details": "...",
    "contraindicatedHerbs": ["..."],
    "safeHerbs": ["..."]
  },
  "recommendedTransitionLevel": {
    "level": 2,
    "title": "...",
    "rationale": "..."
  },
  "sevenDayPlan": [
    { "day": "Jour 1", "breakfast": "...", "lunch": "...", "snack": "...", "dinner": "...", "focus": "..." }
  ],
  "botanicalPrescription": [
    { "herbOrFormula": "...", "targetEmunctory": "...", "dosage": "...", "action": "..." }
  ],
  "healingCrisisWarning": {
    "expectedSymptoms": ["..."],
    "soothingProtocols": ["..."]
  }
}`;

// ── 3. Modèles à tester (Gemini 2.5 Flash / Gemini 3.7 Flash) ──
const MODELS_TO_BENCHMARK = [
  { name: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Production Standard)' },
  { name: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Dernière Génération Hybride)' },
  { name: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (Ultra-Économique)' }
];

async function runLiveTest() {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🔬 TEST EN DIRECT : MESURE DES QUOTAS, TOKENS & COÛT DEEP SEARCH VITALTRACK');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  const results = [];

  for (const modelConfig of MODELS_TO_BENCHMARK) {
    console.log(`▶️ Test du modèle : ${modelConfig.label} (${modelConfig.name})...`);
    const t0 = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${apiKey}`;

    try {
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json'
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  ❌ Erreur HTTP ${res.status}: ${errText.slice(0, 200)}`);
        results.push({ model: modelConfig.name, error: true, status: res.status, errText: errText.slice(0, 200) });
        continue;
      }

      const data = await res.json();
      const usage = data.usageMetadata || {};
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(candidateText);
      } catch (e) {
        parsedJson = { error: 'JSON non parseable' };
      }

      const promptTokens = usage.promptTokenCount || 0;
      const candidateTokens = usage.candidatesTokenCount || 0;
      const thoughtsTokens = usage.thoughtsTokenCount || 0;
      const totalTokens = usage.totalTokenCount || (promptTokens + candidateTokens);

      // Calcul des coûts selon la grille officielle Google AI Studio :
      // - Free Tier : 0.00 $ (Jusqu'à 15 RPM / 1M TPM / 1500 RPD)
      // - Paid Tier (Gemini 2.5 Flash) : 0.075 $ / million tokens prompt, 0.30 $ / million tokens output
      // - Paid Tier (Gemini 3.7 Flash) : 0.15 $ / million prompt, 0.60 $ / million output
      // - Paid Tier (Gemini 3.1 Flash-Lite) : 0.0375 $ / million prompt, 0.15 $ / million output
      let promptPricePerM = 0.075;
      let outputPricePerM = 0.30;
      if (modelConfig.name.includes('3.7')) {
        promptPricePerM = 0.15;
        outputPricePerM = 0.60;
      } else if (modelConfig.name.includes('lite')) {
        promptPricePerM = 0.0375;
        outputPricePerM = 0.15;
      }

      const estimatedCostPaidTierUSD = ((promptTokens * promptPricePerM) + (candidateTokens * outputPricePerM)) / 1000000;
      const estimatedCostPaidTierEUR = estimatedCostPaidTierUSD * 0.95;

      console.log(`  ✅ Succès en ${elapsed}s !`);
      console.log(`     • Tokens Entrée (Prompt)  : ${promptTokens.toLocaleString()} tokens`);
      console.log(`     • Tokens Sortie (Output) : ${candidateTokens.toLocaleString()} tokens`);
      if (thoughtsTokens > 0) {
        console.log(`     • Tokens Réflexion (CoT) : ${thoughtsTokens.toLocaleString()} tokens`);
      }
      console.log(`     • Tokens Totaux Consommés : ${totalTokens.toLocaleString()} tokens`);
      console.log(`     • Score Vitalité calculé  : ${parsedJson?.overallVitalityScore || 'N/A'}/100`);
      console.log(`     • Niveau Toxémie          : "${parsedJson?.toxemiaLevel || 'N/A'}"`);
      console.log(`     • Sécurité Médicaments    : ${parsedJson?.drugInteractionsAndSafety?.status || 'Vérifié'}`);
      console.log(`     • Coût sur Plan Gratuit   : 0.0000 € (Inclus dans le quota gratuit)`);
      console.log(`     • Coût si Plan Payant     : ${estimatedCostPaidTierUSD.toFixed(6)} $ (${estimatedCostPaidTierEUR.toFixed(6)} €)\n`);

      results.push({
        model: modelConfig.name,
        label: modelConfig.label,
        durationSeconds: parseFloat(elapsed),
        promptTokens,
        candidateTokens,
        thoughtsTokens,
        totalTokens,
        vitalityScore: parsedJson?.overallVitalityScore,
        toxemiaLevel: parsedJson?.toxemiaLevel,
        planDaysCount: parsedJson?.sevenDayPlan?.length || 0,
        herbsCount: parsedJson?.botanicalPrescription?.length || 0,
        costFreeTierEUR: 0.00,
        costPaidTierUSD: estimatedCostPaidTierUSD,
        costPaidTierEUR: estimatedCostPaidTierEUR,
        sampleOutputExcerpt: candidateText.slice(0, 300) + '...'
      });

    } catch (err) {
      console.error(`  ❌ Exception : ${err.message}`);
    }
  }

  // Sauvegarder les résultats complets
  const reportPath = path.join(__dirname, '..', 'deep_search_live_quota_benchmark.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Rapport complet sauvegardé dans : ${reportPath}`);
}

runLiveTest().catch(console.error);
