import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { classifyQueryIntent } = require('../api/_lib/queryClassifier.js');
const { getChitChatSystemPrompt, getChatSystemPrompt } = require('../api/_lib/prompts.js');
const { resolveModelName } = require('../api/_lib/geminiFallback.js');

let passed = 0;
let total = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ÉCHEC: ${desc}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('🤖 Démarrage des tests de classification d\'intention et cascades de modèles...\n');

// 1. Tests de classification d'intention
it('Détecte "salut" comme chitchat', () => {
  assert.equal(classifyQueryIntent({ query: 'salut' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'Salut !' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'bonjour' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'coucou' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'hola' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'hello there' }), 'chitchat');
});

it('Détecte les questions de politesse / small talk comme chitchat', () => {
  assert.equal(classifyQueryIntent({ query: 'comment tu vas ?' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'ça va ?' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'qui es-tu ?' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'merci beaucoup !' }), 'chitchat');
  assert.equal(classifyQueryIntent({ query: 'tu fais quoi ?' }), 'chitchat');
});

it('Détecte les questions vitalistes / santé comme standard', () => {
  assert.equal(classifyQueryIntent({ query: 'Quels sont les bienfaits du Chaga ?' }), 'standard');
  assert.equal(classifyQueryIntent({ query: 'Comment faire une transition sans mucus selon Ehret ?' }), 'standard');
  assert.equal(classifyQueryIntent({ query: 'Donne-moi une recette de jus pour drainer les reins' }), 'standard');
  assert.equal(classifyQueryIntent({ query: 'Est-ce que je peux manger du quinoa en transition ?' }), 'standard');
});

it('Détecte les questions avec images comme complex', () => {
  assert.equal(classifyQueryIntent({ 
    query: 'Que penses-tu de ce plat ?', 
    fileParts: [{ inlineData: { mimeType: 'image/jpeg', data: 'abc' } }] 
  }), 'complex');
});

it('Détecte les longues requêtes complexes (> 300 chars) comme complex', () => {
  const longQuery = 'Bonjour coach, voici mon historique médical : j\'ai été diagnostiqué avec une acidose métabolique sévère, des douleurs articulaires récurrentes, des problèmes de filtration rénale sans sédiments dans les urines depuis 3 ans, ainsi qu\'une fatigue surrénalienne chronique. Quels protocoles du Dr. Morse me conseilles-tu ?';
  assert.equal(classifyQueryIntent({ query: longQuery }), 'complex');
});

// 2. Tests des prompts
it('getChitChatSystemPrompt retourne un prompt concis et chaleureux pour chaque langue', () => {
  const promptFr = getChitChatSystemPrompt('fr');
  assert.ok(promptFr.includes('Français'));
  assert.ok(promptFr.includes('TRÈS CONCISE'));
  
  const promptEn = getChitChatSystemPrompt('en');
  assert.ok(promptEn.includes('English'));

  const promptEs = getChitChatSystemPrompt('es');
  assert.ok(promptEs.includes('Español'));
});

// 3. Tests des alias de modèles
it('resolveModelName résout correctement vers des modèles Google Gemini réels', () => {
  assert.equal(resolveModelName('auto'), 'auto');
  assert.equal(resolveModelName('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite');
  assert.equal(resolveModelName('lite'), 'gemini-3.5-flash-lite');
  assert.equal(resolveModelName('flash'), 'gemini-3.6-flash');
  assert.equal(resolveModelName('gemini-3.7-flash'), 'gemini-3.7-flash');
  assert.equal(resolveModelName('gemini-2.5-flash'), 'gemini-2.5-flash');
  assert.equal(resolveModelName('pro'), 'gemini-3.7-flash');
});

console.log(`\n🎉 SUITE CASCADE & INTENTS VALIDÉE : ${passed} / ${total} tests réussis !\n`);
