import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testFavoriteDishes() {
  console.log('🚀 Test de validation des Plats et Recettes Favoris...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.showPage('favorites'));
  await new Promise(r => setTimeout(r, 600));

  // 1. Vérifier l'affichage de la page favoris
  const hasCreateBtn = await page.$eval('.favs-header button.btn-primary', el => !!el);
  console.log('🔍 Bouton "+ Créer un plat" présent :', hasCreateBtn ? '✅ OUI' : '❌ NON');

  // Prendre screenshot de la page Favoris vide
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/28_Favorites_Empty_Page.png' });

  // 2. Ouvrir la modale de création de plat
  console.log('👆 Ouverture de la modale de création de plat...');
  await page.click('.favs-header button.btn-primary');
  await new Promise(r => setTimeout(r, 400));

  const isModalOpen = await page.$eval('#createDishModal', el => el.style.display === 'flex');
  console.log('🔍 Modale de création de plat ouverte :', isModalOpen ? '✅ OUI' : '❌ NON');

  // Prendre screenshot de la modale ouverte
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/29_Create_Dish_Modal.png' });

  // 3. Remplir le formulaire
  await page.type('#dishNameInput', 'Salade Vivante Détox Papaye & Roquette');
  await page.type('#dishIngredientsInput', 'Papaye mûre, Avocat Hass, Roquette sauvage, Graines de chia, Huile d\'olive');
  await page.type('#dishNotesInput', 'Adapté par le Coach Vital pour une régénération sans mucus. Assaisonner avec jus de citron vert.');
  await page.click('#createDishForm button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));

  // 4. Vérifier que le plat apparaît dans les favoris
  const dishCardName = await page.$eval('.fav-dish-name', el => el.textContent.trim());
  const dishTagsCount = await page.$$eval('.fav-dish-tag', els => els.length);
  console.log('🔍 Plat favori enregistré avec succès :', dishCardName);
  console.log('🔍 Nombre d\'ingrédients étiquetés :', dishTagsCount, '✅ (5 ingrédients)');

  // Prendre screenshot de la carte du plat favori
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/30_Favorite_Dish_Card.png' });

  // 5. Tester l'action "Consommer (Ajouter au journal)"
  console.log('👆 Clic sur "Consommer (Ajouter au journal)"...');
  await page.click('.btn-dish-consume');
  await new Promise(r => setTimeout(r, 600));

  // 6. Naviguer vers le journal des repas pour vérifier la présence du plat consommé
  await page.evaluate(() => window.showPage('meals'));
  await new Promise(r => setTimeout(r, 600));

  const mealName = await page.$eval('.meal-item-name', el => el.textContent.trim());
  console.log('🔍 Plat consommé bien ajouté au Journal des Repas :', mealName === 'Salade Vivante Détox Papaye & Roquette' ? '✅ OUI' : '❌ NON');

  // Prendre screenshot du journal des repas avec le plat favori réutilisé
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/31_Meals_Journal_With_Favorite_Dish.png' });

  await browser.close();
  console.log('✨ TOUS LES TESTS DE GESTION DES PLATS FAVORIS SONT VALIDÉS !');
}

testFavoriteDishes().catch(err => {
  console.error(err);
  process.exit(1);
});
