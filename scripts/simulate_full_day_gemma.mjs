/**
 * simulate_full_day_gemma.mjs
 * 
 * Simulation complète d'une journée type d'un utilisateur sur VitalTrack
 * en utilisant le modèle open-weights haut de gamme Gemma 31B (gemma-4-31b-it)
 * via Google AI Studio.
 */

import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = 'gemma-4-31b-it';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY manquante');
  process.exit(1);
}

const SYSTEM_PROMPT = `Tu es l'assistant d'intelligence artificielle clinique et vitaliste de VitalTrack, expert en hygiène vitale, physiologie cellulaire, détoxification selon les principes d'Arnold Ehret (Système de Guérison du Régime Sans Mucus), Dr. Robert Morse (The Detox Miracle Sourcebook), Dr. Sebi et la pharmacopée vivante.
Ton rôle est de guider l'utilisateur avec bienveillance, clarté, rigueur scientifique et précision vitaliste.
Réponds en français fluide, chaleureux et professionnel.
Si l'utilisateur te demande un plan repas ou une action pour son calendrier, fournis TOUJOURS un bloc JSON valide avec le schéma dietPlanRequest.`;

async function callGemma(userMessage, systemPrompt = SYSTEM_PROMPT) {
  const t0 = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const fullPrompt = `${systemPrompt}\n\nUtilisateur : ${userMessage}\n\nAssistant VitalTrack :`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.4,
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

async function runFullDaySimulation() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`🚀 SIMULATION 1 JOURNÉE UTILISATEUR VITALTRACK AVEC GEMMA 31B (${MODEL})`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

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
    console.log(`▶️ [Étape ${i + 1}/5] ${sc.time} : ${sc.title}`);
    console.log(`💬 Message Utilisateur : "${sc.prompt}"`);

    const result = await callGemma(sc.prompt);

    if (result.error) {
      console.log(`❌ Erreur API (${result.status}) en ${result.duration}ms :`, result.errText);
    } else {
      console.log(`⚡ Temps de réponse : ${result.duration} ms`);
      console.log(`📊 Tokens consommés : Prompt ${result.usage.promptTokenCount || 0} | Réponse ${result.usage.candidatesTokenCount || 0} | Total ${result.usage.totalTokenCount || 0}`);
      console.log('───────────────────────────────────────────────────────────────────────');
      console.log('📝 Réponse générée par Gemma 31B :\n');
      console.log(result.text.trim());
      console.log('───────────────────────────────────────────────────────────────────────\n');
    }

    results.push({ ...sc, ...result });
    // Pause de courtoisie
    await new Promise(r => setTimeout(r, 1000));
  }

  // Bilan global
  const totalTokens = results.reduce((acc, r) => acc + (r.usage?.totalTokenCount || 0), 0);
  const avgDuration = Math.round(results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length);

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🏆 SYNTHÈSE DE LA SIMULATION COMPLÈTE (GEMMA 31B)');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`• Nombre total d'interactions simulées : ${scenarios.length}`);
  console.log(`• Temps de réponse moyen              : ${avgDuration} ms`);
  console.log(`• Consommation totale de tokens        : ${totalTokens} tokens`);
  console.log(`• Coût estimé (Tarif standard)         : ~${(totalTokens * 0.0000003).toFixed(5)} €`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  fs.writeFileSync(
    '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/gemma_31b_simulation_results.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('💾 Résultats détaillés enregistrés dans gemma_31b_simulation_results.json');
}

runFullDaySimulation().catch(console.error);
