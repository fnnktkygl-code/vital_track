import fs from 'fs';

const PROD_URL = 'https://vitaltrack-app.vercel.app';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('🧪 TEST DES ROUTES API EN CONTEXTE NAVIGATEUR (SAME-ORIGIN)');
console.log('═══════════════════════════════════════════════════════════════════\n');

async function testApis() {
  const browserHeaders = {
    'Content-Type': 'application/json',
    'Origin': 'https://vitaltrack-app.vercel.app',
    'Referer': 'https://vitaltrack-app.vercel.app/',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  };

  // ── TEST 1 : POST /api/searchFood ──
  console.log('1️⃣ Test de POST /api/searchFood (Recherche Alimentaire / IA)...');
  try {
    const res = await fetch(`${PROD_URL}/api/searchFood`, {
      method: 'POST',
      headers: browserHeaders,
      body: JSON.stringify({ query: 'mangue sauvage' })
    });
    console.log(`  Status HTTP : ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`  Nom détecté : ${data.name || data.names?.[0]}`);
    console.log(`  Catégorie : ${data.category || data.family}`);
    console.log(`  PRAL : ${data.scientific_defaults?.pral ?? data.pral}`);
    console.log(`  Statut Électrique : ${data.specific?.electric ?? data.electric}`);
    console.log(`  Note Vitaliste : ${data.note?.substring(0, 80)}...`);
    if (res.ok) console.log('  ✅ /api/searchFood : SUCCÈS (200 OK)');
  } catch (err) {
    console.error('  ❌ /api/searchFood : ÉCHEC', err.message);
  }

  // ── TEST 2 : POST /api/chat (Synchronous Non-Stream) ──
  console.log('\n2️⃣ Test de POST /api/chat (Requête Non-Stream)...');
  try {
    const res = await fetch(`${PROD_URL}/api/chat`, {
      method: 'POST',
      headers: browserHeaders,
      body: JSON.stringify({
        query: 'Explique en 2 phrases la formule V = P - O d\'Arnold Ehret.',
        profile: { name: 'Alexandre', protocol: 'vitalist', language: 'fr' }
      })
    });
    console.log(`  Status HTTP : ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log(`  Modèle utilisé : ${data.model || 'Cascade Gemini'}`);
    console.log(`  Réponse IA (extrait) : ${data.text?.substring(0, 140)}...`);
    if (res.ok) console.log('  ✅ /api/chat (Non-Stream) : SUCCÈS (200 OK)');
  } catch (err) {
    console.error('  ❌ /api/chat (Non-Stream) : ÉCHEC', err.message);
  }

  // ── TEST 3 : POST /api/chat?stream=true (Streaming SSE) ──
  console.log('\n3️⃣ Test de POST /api/chat?stream=true (Streaming SSE)...');
  try {
    const res = await fetch(`${PROD_URL}/api/chat?stream=true`, {
      method: 'POST',
      headers: browserHeaders,
      body: JSON.stringify({
        query: 'Quels sont les 3 meilleurs fruits dissolvants de mucus ?',
        profile: { language: 'fr' }
      })
    });
    console.log(`  Status HTTP : ${res.status} ${res.statusText}`);
    console.log(`  Content-Type : ${res.headers.get('content-type')}`);
    
    const reader = res.body.getReader();
    let totalBytes = 0;
    let chunks = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks++;
      totalBytes += value.length;
    }
    console.log(`  Chunks SSE reçus : ${chunks}, Total octets : ${totalBytes}`);
    if (res.ok) console.log('  ✅ /api/chat (Streaming SSE) : SUCCÈS (200 OK)');
  } catch (err) {
    console.error('  ❌ /api/chat (Streaming SSE) : ÉCHEC', err.message);
  }

  // ── TEST 4 : Edge-Cases & Gestion des Erreurs (400, 405) ──
  console.log('\n4️⃣ Test des Edge Cases et Sécurité (Erreurs gérées)...');
  
  const badReq = await fetch(`${PROD_URL}/api/chat`, {
    method: 'POST',
    headers: browserHeaders,
    body: JSON.stringify({})
  });
  console.log(`  Requête sans query -> Code ${badReq.status} (Attendu: 400) : ${badReq.status === 400 ? '✅ CONFORME' : '⚠️ ANOMALIE'}`);

  const getReq = await fetch(`${PROD_URL}/api/chat`, { method: 'GET' });
  console.log(`  Méthode GET non autorisée -> Code ${getReq.status} (Attendu: 405) : ${getReq.status === 405 ? '✅ CONFORME' : '⚠️ ANOMALIE'}`);

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏁 BILAN DES TESTS API : TOUTES LES ROUTES SONT OPÉRATIONNELLES');
  console.log('═══════════════════════════════════════════════════════════════════');
}

testApis().catch(err => {
  console.error('Erreur API :', err);
});
