import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting Chat Sidebar & Voice Recording System Tests...\n');

import { TRANSLATIONS } from '../web-app/src/locales/index.js';

// 1. Verify i18n keys for sidebar and voice
const languages = ['fr', 'en', 'es', 'fr-CA'];
const requiredChatKeys = [
  'newChat', 'searchPlaceholder', 'recordingStatus', 'transcribingStatus',
  'voiceCancel', 'voiceDone', 'voiceTooltip', 'logMealAction', 'customizeAction',
  'quickAdjustments', 'withFridge', 'rawVersion', 'transitionFood', 'copy', 'edit', 'regenerate', 'listen'
];

languages.forEach(lang => {
  const dict = TRANSLATIONS[lang];
  assert.ok(dict.chat, `Chat section exists in ${lang}`);
  requiredChatKeys.forEach(k => {
    const val = dict.chat[k];
    assert.ok(val, `Key chat.${k} must exist in ${lang}`);
    assert.ok(typeof val === 'string' && val.length > 0, `chat.${k} must be a non-empty string in ${lang}`);
  });
  assert.ok(dict.voiceModal, `voiceModal exists in ${lang}`);
  assert.ok(dict.deleteConvModal, `deleteConvModal exists in ${lang}`);
  assert.ok(dict.targetWeightModal, `targetWeightModal exists in ${lang}`);
  assert.ok(dict.createDishModal, `createDishModal exists in ${lang}`);
});
console.log('✅ 1. All chat sidebar, action cards, and voice i18n keys exist across all 4 locales (FR, EN, ES, FR-CA).');

// 2. Verify index.html DOM elements
const html = readFileSync(join(__dirname, '../web-app/index.html'), 'utf-8');

assert.ok(html.includes('id="chatSidebar"'), 'Chat sidebar exists in index.html');
assert.ok(html.includes('id="sidebarNewChatBtn"'), 'Sidebar new chat button exists with dedicated ID');
assert.ok(html.includes('onclick="newConversation()"'), 'New conversation handler bound in sidebar');
assert.ok(html.includes('data-i18n="chat.newChat"'), 'Sidebar new chat button has data-i18n attribute');
assert.ok(html.includes('id="chatVoiceBtn"'), 'Chat voice button exists');
assert.ok(html.includes('id="chatVoiceIndicator"'), 'Chat voice listening indicator exists');
assert.ok(html.includes('id="chatVoiceStatus"'), 'Voice status label exists');
assert.ok(html.includes('id="deleteConvModal"'), 'Delete conversation modal exists');
assert.ok(html.includes('id="voiceSelectorModal"'), 'Voice selector modal exists');
assert.ok(html.includes('id="targetWeightModal"'), 'Target weight modal exists');
assert.ok(html.includes('id="createDishModal"'), 'Create custom dish modal exists');

console.log('✅ 2. index.html contains all required sidebar, voice, and localized modal UI elements.');

// 3. Verify main.js voice recording and audio feedback implementation
const mainCode = readFileSync(join(__dirname, '../web-app/src/main.js'), 'utf-8');

assert.ok(mainCode.includes('const VoiceAudio = {'), 'VoiceAudio feedback module declared');
assert.ok(mainCode.includes('playStartChime'), 'playStartChime declared in VoiceAudio');
assert.ok(mainCode.includes('playStopChime'), 'playStopChime declared in VoiceAudio');
assert.ok(mainCode.includes('playCancelChime'), 'playCancelChime declared in VoiceAudio');
assert.ok(mainCode.includes('startVoiceRecording'), 'startVoiceRecording function declared');
assert.ok(mainCode.includes('stopVoiceRecording'), 'stopVoiceRecording function declared');
assert.ok(mainCode.includes('cancelVoiceInput'), 'cancelVoiceInput function declared');
assert.ok(mainCode.includes('initVoiceButtonEvents'), 'initVoiceButtonEvents hold-to-talk handler declared');
assert.ok(mainCode.includes('/api/transcribe'), 'Transcription endpoint called');
assert.ok(mainCode.includes("input.focus()"), 'newConversation focuses #chatInput');
assert.ok(mainCode.includes("window.toggleSidebar(false)"), 'newConversation auto-closes sidebar');

console.log('✅ 3. main.js voice audio synthesis, continuous recording, and auto-focus verified.');

// 4. Verify api/transcribe.js endpoint
const transcribeCode = readFileSync(join(__dirname, '../api/transcribe.js'), 'utf-8');
assert.ok(transcribeCode.includes('callGeminiApi'), 'api/transcribe uses callGeminiApi');
assert.ok(transcribeCode.includes('gemini-3.5-flash-lite'), 'api/transcribe uses gemini-3.5-flash-lite multimodal');

console.log('✅ 4. api/transcribe.js is configured with Google Gemini multimodal audio.');

console.log('\n🎉 ALL CHAT SIDEBAR & VOICE TESTS PASSED SUCCESSFULLY!');
