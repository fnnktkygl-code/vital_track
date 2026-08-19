#!/usr/bin/env node

/**
 * ⚡ Universal API Resilience & Security Test Harness
 * 
 * Usage:
 *   node harnesses/test_api_resilience.mjs --url http://localhost:5173 --key my-secret-key
 */

const args = process.argv.slice(2);
let baseUrl = 'http://localhost:5173';
let apiKey = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) baseUrl = args[i + 1];
  if (args[i] === '--key' && args[i + 1]) apiKey = args[i + 1];
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`⚡ TEST DE RÉSILIENCE & SÉCURITÉ DES ROUTES API : ${baseUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function testApiResilience() {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': baseUrl,
    'Referer': `${baseUrl}/`,
    'Sec-Fetch-Site': 'same-origin',
    ...(apiKey ? { 'X-App-Key': apiKey } : {})
  };

  // 1. Health check or Root Ping
  console.log('1️⃣ Test de disponibilité du serveur...');
  try {
    const res = await fetch(`${baseUrl}/api/health`, { headers }).catch(() => null);
    if (res) {
      console.log(`  Ping /api/health -> Statut ${res.status}`);
    } else {
      console.log('  Route /api/health non définie (ignoré).');
    }
  } catch (err) {
    console.log(`  Info : ${err.message}`);
  }

  // 2. Test Invalid HTTP Method -> Expect 405
  console.log('\n2️⃣ Test de sécurité : Méthode HTTP non autorisée (GET sur endpoint POST)...');
  try {
    const res = await fetch(`${baseUrl}/api/chat`, { method: 'GET' });
    const is405 = res.status === 405;
    console.log(`  GET /api/chat -> Statut ${res.status} (Attendu: 405) : ${is405 ? '✅ CONFORME' : '⚠️ VÉRIFIER'}`);
  } catch (err) {
    console.error(`  Erreur requête 405 : ${err.message}`);
  }

  // 3. Test Empty Payload -> Expect 400
  console.log('\n3️⃣ Test de validation des entrées : Payload vide...');
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const is400 = res.status === 400;
    console.log(`  POST /api/chat (payload vide) -> Statut ${res.status} (Attendu: 400) : ${is400 ? '✅ CONFORME' : '⚠️ VÉRIFIER'}`);
  } catch (err) {
    console.error(`  Erreur requête 400 : ${err.message}`);
  }

  // 4. Test Valid Streaming Endpoint
  console.log('\n4️⃣ Test de streaming Server-Sent Events (SSE)...');
  try {
    const res = await fetch(`${baseUrl}/api/chat?stream=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'Hello system test', profile: { name: 'Auditor' } })
    });
    console.log(`  POST /api/chat?stream=true -> Statut ${res.status} ${res.statusText}`);
    console.log(`  Content-Type : ${res.headers.get('content-type')}`);

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      let chunks = 0;
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks++;
        totalBytes += value.length;
      }
      console.log(`  ✅ Flux SSE lu avec succès : ${chunks} chunks reçus (${totalBytes} octets)`);
    } else {
      console.log(`  ⚠️ Endpoint non streaming ou indisponible (Statut: ${res.status})`);
    }
  } catch (err) {
    console.log(`  Info stream : ${err.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏁 BILAN DE RÉSILIENCE API TERMINÉ');
  console.log('═══════════════════════════════════════════════════════════════════');
}

testApiResilience().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
