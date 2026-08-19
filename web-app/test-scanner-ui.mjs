import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  console.log('🚀 Testing Scanner IA UI & Diagnostic Dossier Rendering...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1100 });

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Page loaded');

    // 1. Navigate to Scanner IA
    await page.evaluate(() => window.showPage('scan'));
    await new Promise(r => setTimeout(r, 400));

    // Check scanner header & dropzone
    const scanTitle = await page.$eval('.scan-header h2', el => el.innerText);
    console.log('Scanner Header:', scanTitle);

    // 2. Feed the exact sample tapas response from user screenshot
    const sampleAiAnalysis = `
🍃 Scan Vitaliste de ton assiette :
Il s'agit d'un assortiment de **tapas méditerranéennes** (canapés sur pain blanc, charcuteries [chorizo, jambon cru], fromage affiné, conserves de sardines et moules à l'huile, olives, tapenade et sauce tomate au basilic).
---
1. 🔍 Statut Vitaliste (Dr. Sebi / Arnold Ehret)

* Hautement Mucogène & Acidifiant 🔴 :
* **Pain blanc (farine de blé raffinée)** : Forte teneur en gluten et amidon transformé, formant une colle digestive et du mucus intestinal dense.
* **Charcuteries (porc/bœuf transformé) & Fromages affinés** : Générateurs d'acides sulfurique et phosphorique ($H_2SO_4$, $H_3PO_4$), surchargeant les reins et la lymphe.
* **Sardines & Moules en conserve** : Riches en purines et acide urique.

* Éléments Végétaux / Neutres 🟡 :
* **Olives, poivrons, basilic, sauce tomate** : Apportent des polyphénols et minéraux, mais restent minoritaires face à la charge mucogène globale.
---
2. ⚖️ Indice PRAL Estimé

* PRAL Global : Fortement Positif / Acidifiant (+15 à +25 mEq/100g)
Fromage affiné : ~+34 mEq/100g
Charcuteries & Poissons : ~+13 à +15 mEq/100g
Pain blanc : ~+3.5 mEq/100g
---
3. 🌊 Impact Émonctoriel & Lymphatique

* **Lymphe** : Congestion des liquides interstitiels par excès de graisses saturées et protéines animales.
* **Reins** : Sollicitation intense pour éliminer l'excès de sodium, d'urée et d'urates.
---
💡 Pour "Électriser" ce type d'apéritif :

Remplace le pain blanc par des **tranches de concombre cru** ou des **crackers de graines de lin déshydratées**, et substitue la charcuterie par du **guacamole frais**, des **bâtonnets de légumes croquants** et des **micro-pousses vivantes**.

\`\`\`json
{
  "actionMeal": {
    "name": "Apéritif Vitaliste Électrisé (Cru & Vivant)",
    "category": "snack",
    "emoji": "🥒",
    "items": ["Tranches de concombre cru", "Crackers de graines de lin déshydratées", "Guacamole frais", "Bâtonnets de poivrons crus", "Olives Kalamata"],
    "note": "Alternative 100% électrique sans colle mucosique, riche en potassium et enzymes vivantes."
  },
  "suggestFoods": ["Olives Kalamata", "Poivrons rouges crus", "Graines de lin germées", "Concombre", "Persil frais"]
}
\`\`\`
`;

    // Render result into the Scanner page
    await page.evaluate((text) => {
      window.renderScanResult(text);
    }, sampleAiAnalysis);

    await new Promise(r => setTimeout(r, 400));

    // Verify elements
    const heroTitle = await page.$eval('.scan-dish-title', el => el.innerText);
    const vitalBadge = await page.$eval('.scan-vital-badge', el => el.innerText);
    const cardsCount = await page.$$eval('.scan-card', cards => cards.length);
    const pralVal = await page.$eval('.scan-pral-val', el => el.innerText);
    const foodChipsCount = await page.$$eval('.food-chip', chips => chips.length);

    console.log('Hero Title:', heroTitle);
    console.log('Vital Badge:', vitalBadge);
    console.log('Cards Count:', cardsCount);
    console.log('PRAL Value:', pralVal);
    console.log('Food Chips Count:', foodChipsCount);

    if (!heroTitle.toLowerCase().includes('tapas') || !vitalBadge.toLowerCase().includes('mucogène') || cardsCount < 4) {
      throw new Error('Scanner result structure validation failed');
    }

    // Take screenshot of the scanner page
    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/scanner_redesigned_dossier.png', fullPage: true });
    console.log('📸 Screenshot saved: scanner_redesigned_dossier.png');

    console.log('🎉 ALL SCANNER UI TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
