/**
 * simulate_full_day_gemini_flash.mjs
 * 
 * Simulation des 5 mêmes scénarios d'une journée complète avec Gemini 3.7 Flash
 * pour comparer directement avec Gemma 31B sur la vitesse, la structure et la pertinence clinique.
 */

import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.7-flash';

const SYSTEM_PROMPT = `Tu es l'assistant d'intelligence artificielle clinique et vitaliste de VitalTrack, expert en hygiène vitale, physiologie cellulaire, détoxification selon les principes d'Arnold Ehret (Système de Guérison du Régime Sans Mucus), Dr. Robert Morse (The Detox Miracle Sourcebook), Dr. Sebi et la pharmacopée vivante.
Ton rôle est de guider l'utilisateur avec bienveillance, clarté, rigueur scientifique et précision vitaliste.
Réponds en français fluide, chaleureux et professionnel avec du markdown soigné.
Si l'utilisateur te demande un plan repas ou une action pour son calendrier, fournis un bloc JSON valide avec le schéma dietPlanRequest.`;

async function callGemini(userMessage) {
  const t0 = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500
      }
    })
  });

  const duration = Date.now() - t0;
  if (!res.ok) {
    const errText = await res.text();
    return { error: true, status: res.status, errText, duration };
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const rawText = candidate?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata || {};

  return {
    error: false,
    text: rawText,
    duration,
    usage
  };
}

async function run() {
  const scenarios = [
    {
      time: '08h00 - Matin',
      title: 'Accueil, Onboarding & Symptômes du Réveil',
      prompt: "Bonjour ! Je viens d'installer l'application. Je me sens fatigué ce matin avec un léger mal de tête et le foie lourd. Par quoi me conseilles-tu de commencer ma journée pour relancer mon énergie sans bloquer mon corps ?"
    },
    {
      time: '12h30 - Midi',
      title: 'Scan & Analyse Nutritionnelle d\'un Repas',
      prompt: "Analyse mon déjeuner : j'ai mangé une grande salade de roquette avec du concombre, un demi-avocat, des graines de tournesol germées, du jus de citron et de l'huile d'olive, puis 2 figues fraîches. Donne-moi le bilan biochimique (PRAL, mucus/sans mucus, filtration rénale, vital score /100)."
    },
    {
      time: '16h00 - Après-midi',
      title: 'Création d\'un Plan Repas 1 Journée pour le Calendrier',
      prompt: "Crée-moi un plan de repas complet pour demain (Transition Vitaliste Niveau 2) avec Petit-déjeuner, Déjeuner, Collation et Dîner. Inclus un bloc JSON valide avec 'dietPlanRequest' contenant pour chaque repas le titre, les ingrédients et les bienfaits émonctoriels."
    },
    {
      time: '19h30 - Soir',
      title: 'Gestion d\'une Crise de Guérison & Conseil Plantes',
      prompt: "J'ai la langue un peu chargée (blanchâtre) et de légers frissons ce soir. Est-ce une crise d'élimination ? Quelles plantes ou tisanes simples du Dr. Morse ou Dr. Sebi me conseilles-tu pour soutenir mes reins et ma lymphe ce soir ?"
    },
    {
      time: '21h00 - Recherche / Savoir',
      title: 'Deep Search / Question de Doctrine Vitaliste',
      prompt: "Explique-moi la formule d'Arnold Ehret 'V = P - O' (Vitalité = Puissance - Obstruction) et pourquoi selon lui manger moins permet d'avoir plus d'énergie."
    }
  ];

  const results = [];
  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    console.log(`▶️ [Gemini 3.7 Flash] ${sc.time} : ${sc.title}...`);
    const r = await callGemini(sc.prompt);
    console.log(`   ⚡ Réponse en ${r.duration} ms (${r.usage?.candidatesTokenCount || 0} tokens)`);
    results.push({ ...sc, ...r });
    await new Promise(res => setTimeout(res, 500));
  }

  fs.writeFileSync(
    '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/gemini_37_flash_simulation_results.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('✅ Simulation Gemini 3.7 Flash terminée et enregistrée !');
}

run().catch(console.error);
