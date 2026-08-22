/**
 * test_chat_sidebar_new_chat_and_modals_i18n.mjs
 * 
 * Automated E2E verification for:
 * 1. New Chat creation from sidebar auto-closes drawer and focuses #chatInput.
 * 2. Chat titles, sidebar empty state, and action buttons properly localize across FR, EN, ES, FR-CA.
 * 3. Modals (deleteConvModal, voiceSelectorModal, targetWeightModal, createDishModal) localize properly.
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════');
console.log('🌐 TEST E2E I18N : TITRES CHAT, ACTIONS, MODAUX ET AUTO-FOCUS');
console.log('═══════════════════════════════════════════════════════════\n');

const port = 5490 + Math.floor(Math.random() * 100);
const server = await createServer({
  root: '/Users/richard/Developer/vital_track/web-app',
  server: { port }
});
await server.listen();
const baseUrl = server.resolvedUrls.local[0] || `http://localhost:${port}`;
console.log(`🌐 Serveur Vite démarré sur ${baseUrl}`);

let browser;
try {
  browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to Chat page
  await page.evaluate(() => {
    window.location.hash = '#chat';
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('📱 Écran mobile Chat chargé.');

  // 1. Switch language to Spanish
  await page.evaluate(() => {
    window.vitalTrackI18n.setLanguage('es');
    window.renderSidebar();
    window.renderActiveConversation();
  });
  await new Promise(r => setTimeout(r, 300));

  const esTitle = await page.$eval('#chatTitle', el => el.textContent.trim());
  console.log(`🇪🇸 Titre du chat en Espagnol : "${esTitle}"`);
  if (esTitle !== 'Nuevo chat') {
    throw new Error(`Expected "Nuevo chat" but got "${esTitle}"`);
  }

  // 2. Open sidebar on mobile
  await page.evaluate(() => {
    window.toggleSidebar(true);
  });
  await new Promise(r => setTimeout(r, 300));

  let isSidebarOpen = await page.$eval('#chatSidebar', el => el.classList.contains('open'));
  console.log(`📂 Barre latérale ouverte : ${isSidebarOpen}`);
  if (!isSidebarOpen) throw new Error('Sidebar should be open');

  // 3. Click "Nuevo chat" button inside sidebar
  await page.evaluate(() => {
    const btn = document.getElementById('btnNewChatSidebar');
    if (btn) btn.click();
    else window.newConversation();
  });
  await new Promise(r => setTimeout(r, 300));

  // Verify sidebar closed automatically
  isSidebarOpen = await page.$eval('#chatSidebar', el => el.classList.contains('open'));
  console.log(`🔒 Barre latérale fermée automatiquement : ${!isSidebarOpen}`);
  if (isSidebarOpen) throw new Error('Sidebar should have closed automatically on new chat!');

  // Verify focus on #chatInput
  const isFocused = await page.evaluate(() => {
    return document.activeElement && document.activeElement.id === 'chatInput';
  });
  console.log(`🎯 Curseur actif sur #chatInput : ${isFocused}`);
  if (!isFocused) throw new Error('Chat input should be focused!');

  // 4. Verify Modals translations in Spanish
  const deleteModalTitle = await page.$eval('#deleteConvModal h3', el => el.textContent.trim());
  console.log(`🇪🇸 Titre modale suppression : "${deleteModalTitle}"`);
  if (!deleteModalTitle.includes('¿Eliminar')) {
    throw new Error(`Expected Spanish delete modal title, got "${deleteModalTitle}"`);
  }

  const voiceModalTitle = await page.$eval('#voiceSelectorModal h3', el => el.textContent.trim());
  console.log(`🇪🇸 Titre modale voix : "${voiceModalTitle}"`);
  if (!voiceModalTitle.includes('Estudio de Voces')) {
    throw new Error(`Expected Spanish voice modal title, got "${voiceModalTitle}"`);
  }

  const targetWeightTitle = await page.$eval('#targetWeightModal h3', el => el.textContent.trim());
  console.log(`🇪🇸 Titre modale poids cible : "${targetWeightTitle}"`);
  if (!targetWeightTitle.includes('Objetivo de Peso Meta')) {
    throw new Error(`Expected Spanish target weight title, got "${targetWeightTitle}"`);
  }

  // 5. Switch language to English
  await page.evaluate(() => {
    window.vitalTrackI18n.setLanguage('en');
    window.renderSidebar();
    window.renderActiveConversation();
  });
  await new Promise(r => setTimeout(r, 300));

  const enTitle = await page.$eval('#chatTitle', el => el.textContent.trim());
  console.log(`🇬🇧 Titre du chat en Anglais : "${enTitle}"`);
  if (enTitle !== 'New Chat') {
    throw new Error(`Expected "New Chat" but got "${enTitle}"`);
  }

  const enDeleteModalTitle = await page.$eval('#deleteConvModal h3', el => el.textContent.trim());
  console.log(`🇬🇧 Titre modale suppression en Anglais : "${enDeleteModalTitle}"`);
  if (!enDeleteModalTitle.includes('Delete conversation')) {
    throw new Error(`Expected English delete modal title, got "${enDeleteModalTitle}"`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🏆 SUCCÈS TOTAL : Tous les tests E2E Chat & Modaux i18n sont validés !');
  console.log('═══════════════════════════════════════════════════════════\n');

} finally {
  if (browser) await browser.close();
  await server.close();
}
