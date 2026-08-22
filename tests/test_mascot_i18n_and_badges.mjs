import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting Mascot Speech Bubble, Mood Badges & Protocol i18n Tests...\n');

import { TRANSLATIONS } from '../web-app/src/locales/index.js';

const languages = ['fr', 'en', 'es', 'fr-CA'];

// 1. Verify mood badges in all 4 languages
const moodKeys = [
  'moodEnergy', 'moodBravo', 'moodDetox', 'moodRegen', 'moodTip',
  'moodVitality', 'moodVictory', 'moodAudio', 'moodWisdom', 'moodWalk'
];

languages.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  assert.ok(dict.mascot, `Mascot section exists for ${lang}`);
  
  moodKeys.forEach(k => {
    const val = dict.mascot[k];
    assert.ok(val, `Key mascot.${k} must exist in ${lang}`);
    assert.ok(typeof val === 'string' && val.length > 0, `mascot.${k} must be non-empty string in ${lang}`);
    assert.ok(val.length < 30, `mascot.${k} should be a short badge label, but got: "${val}" (${val.length} chars)`);
  });
});
console.log('✅ 1. All mood badge labels exist, are translated, and are concise badge pills (< 30 chars).');

// 2. Verify mascot action dialogue quotes in all 4 languages
const actionQuotes = ['idle', 'walk', 'laugh', 'coo', 'think', 'celebrate', 'sleep'];

languages.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  actionQuotes.forEach(k => {
    const val = dict.mascot[k];
    assert.ok(val, `Quote mascot.${k} must exist in ${lang}`);
    assert.ok(typeof val === 'string' && val.length > 10, `mascot.${k} quote must be substantial in ${lang}`);
    // Quotes must not be equal to the short mood label
    assert.notEqual(val, dict.mascot.moodVitality, `mascot.${k} must not collide with moodVitality badge in ${lang}`);
  });
});
console.log('✅ 2. Mascot action quotes exist, are fully localized, and do not collide with badge labels.');

// 3. Verify protocol modes in dashboard section
const protocolModes = ['vitalistMode', 'sebiMode', 'ehretMode', 'morseMode'];

languages.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  assert.ok(dict.dashboard, `Dashboard section exists in ${lang}`);
  protocolModes.forEach(m => {
    const val = dict.dashboard[m];
    assert.ok(val, `Key dashboard.${m} exists in ${lang}`);
    assert.ok(typeof val === 'string' && val.length > 0, `dashboard.${m} must be non-empty in ${lang}`);
  });
});

assert.equal(TRANSLATIONS.es.dashboard.vitalistMode, 'Modo Vitalista', 'Spanish vitalist mode translation correct');
assert.equal(TRANSLATIONS.en.dashboard.vitalistMode, 'Vitalist Mode', 'English vitalist mode translation correct');
assert.equal(TRANSLATIONS.fr.dashboard.vitalistMode, 'Mode Vitaliste', 'French vitalist mode translation correct');
console.log('✅ 3. Dashboard protocol modes localized across all 4 languages.');

// 4. Verify main.js implementation doesn't use full quotes inside badge labels
const mainCode = readFileSync(join(__dirname, '../web-app/src/main.js'), 'utf-8');

assert.ok(mainCode.includes("laugh: { label: tFunc('mascot.moodVitality')"), 'laugh mood uses moodVitality badge label');
assert.ok(mainCode.includes("walk: { label: tFunc('mascot.moodWalk')"), 'walk mood uses moodWalk badge label');
assert.ok(mainCode.includes("celebrate: { label: tFunc('mascot.moodVictory')"), 'celebrate mood uses moodVictory badge label');
assert.ok(mainCode.includes("think: { label: tFunc('mascot.moodWisdom')"), 'think mood uses moodWisdom badge label');
assert.ok(mainCode.includes("coo: { label: tFunc('mascot.moodAudio')"), 'coo mood uses moodAudio badge label');

// Verify triggerMascotInPlaceReaction fetches quote dynamically with tFunc
assert.ok(mainCode.includes('const quote = tFunc(`mascot.${act}`)'), 'triggerMascotInPlaceReaction fetches quote via tFunc');
assert.ok(mainCode.includes('updateProtocolUI()'), 'updateProtocolUI called in onLanguageChange');

console.log('✅ 4. main.js code uses separated badge labels, dynamic i18n quote resolution, and updates protocol on language change.');

console.log('\n🎉 ALL MASCOT I18N & BADGE INTEGRITY TESTS PASSED!');
