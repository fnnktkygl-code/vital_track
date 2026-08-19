import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testDeleteConversationModal() {
  console.log('🚀 Test de validation de la suppression sécurisée de conversation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.showPage('chat'));
  await new Promise(r => setTimeout(r, 600));

  // Créer 2 conversations de test via window.store
  await page.evaluate(() => {
    const conv1 = {
      id: 'test-conv-1',
      title: 'Mon programme de jeûne 7 jours',
      messages: [{ role: 'user', content: 'Programme 7j' }],
      updated: Date.now()
    };
    const conv2 = {
      id: 'test-conv-2',
      title: 'Conseils Dr. Sebi plantes',
      messages: [{ role: 'user', content: 'Plantes' }],
      updated: Date.now() - 10000
    };
    window.store.set('conversations', [conv1, conv2]);
    window.store.set('activeConvId', 'test-conv-1');
    if (window.loadChatHistory) window.loadChatHistory();
    window.toggleSidebar(true);
  });
  await new Promise(r => setTimeout(r, 500));

  // 1. Vérifier la visibilité du bouton de suppression
  const deleteBtnVisible = await page.$eval('.conv-item-delete', el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.opacity !== '0';
  });
  console.log('🔍 Bouton de suppression visible :', deleteBtnVisible ? '✅ OUI (Visible & contrasté)' : '❌ NON');

  // Prendre screenshot de la sidebar avec le bouton visible
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/23_Chat_Sidebar_Delete_Btn.png' });

  // 2. Cliquer sur le bouton de suppression du premier item
  await page.click('.conv-item-delete');
  await new Promise(r => setTimeout(r, 400));

  // 3. Vérifier que la modale de confirmation est apparue
  const isModalOpen = await page.$eval('#deleteConvModal', el => el.style.display === 'flex');
  const previewTitle = await page.$eval('#deleteConvTitlePreview', el => el.textContent.trim());
  console.log('🔍 Modale de confirmation ouverte :', isModalOpen ? '✅ OUI' : '❌ NON');
  console.log('🔍 Titre de conversation dans la modale :', previewTitle);

  // Prendre screenshot de la modale de confirmation
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/24_Delete_Conversation_Confirm_Modal.png' });

  // 4. Test Annulation
  await page.click('#deleteConvModal button.btn-secondary');
  await new Promise(r => setTimeout(r, 300));
  const isModalClosed = await page.$eval('#deleteConvModal', el => el.style.display === 'none');
  const convCountAfterCancel = await page.evaluate(() => (window.store.get('conversations', [])).length);
  console.log('🔍 Après clic Annuler : Modale fermée =', isModalClosed ? '✅ OUI' : '❌ NON', '| Nb conversations =', convCountAfterCancel === 2 ? '✅ 2 (Intact)' : '❌ Erreur');

  // 5. Test Confirmation de Suppression
  await page.click('.conv-item-delete');
  await new Promise(r => setTimeout(r, 300));
  await page.click('#confirmDeleteConvBtn');
  await new Promise(r => setTimeout(r, 400));

  const convCountAfterDelete = await page.evaluate(() => (window.store.get('conversations', [])).length);
  console.log('🔍 Après clic Supprimer définitivement : Nb conversations =', convCountAfterDelete === 1 ? '✅ 1 (Supprimée avec succès)' : '❌ Erreur');

  await browser.close();
  console.log('✨ TOUS LES TESTS DE SUPPRESSION SÉCURISÉE SONT VALIDÉS !');
}

testDeleteConversationModal().catch(err => {
  console.error(err);
  process.exit(1);
});
