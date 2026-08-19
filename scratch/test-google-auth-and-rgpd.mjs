import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('/Users/richard/Developer/vital_track/web-app/dist');

// Static HTTP server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(distDir, 'index.html'), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexData);
        }
      });
      return;
    }
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(4183, async () => {
  console.log('🚀 Starting Google Auth & RGPD E2E tests on port 4183...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser error:', msg.text());
  });

  await page.goto('http://localhost:4183', { waitUntil: 'networkidle0' });

  // TEST 1: Check initial guest state & Google Auth button in navbar
  const hasGoogleBtn = await page.evaluate(() => {
    return !!document.querySelector('.google-auth-btn');
  });
  console.log(`✅ TEST 1: Google Auth button visible in navbar: ${hasGoogleBtn}`);
  if (!hasGoogleBtn) throw new Error('Google Auth button missing in navbar');

  // TEST 2: Simulate Google Sign-In for User Alice
  console.log('--- TEST 2: Signing in as User Alice ---');
  await page.evaluate(() => {
    const userAlice = {
      uid: 'google_uid_alice_123',
      name: 'Alice Vitaliste',
      email: 'alice@gmail.com',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
      provider: 'google'
    };
    window.vitalTrackAuth._saveSession(userAlice);
    window.store.set('profile', { name: 'Alice', goal: 'detox', protocol: 'morse' });
    window.store.set('meals', [{ id: 'm1', name: 'Mangue Électrique', pral: -5.2 }]);
  });

  const aliceBadgeName = await page.evaluate(() => {
    return document.querySelector('.user-name-label')?.textContent;
  });
  console.log(`User badge displayed: ${aliceBadgeName}`);
  if (aliceBadgeName !== 'Alice Vitaliste') throw new Error('User Alice badge not displayed properly');

  // Verify Alice storage keys
  const aliceStorageKeys = await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys.filter(k => k.includes('google_uid_alice_123'));
  });
  console.log(`Alice partitioned storage keys: ${aliceStorageKeys.join(', ')}`);
  if (aliceStorageKeys.length < 2) throw new Error('Alice data not partitioned under uid');

  // TEST 3: User Isolation (Sign out Alice, sign in Bob)
  console.log('--- TEST 3: Testing Strict Data Isolation with User Bob ---');
  await page.evaluate(() => {
    const userBob = {
      uid: 'google_uid_bob_456',
      name: 'Bob Herb',
      email: 'bob@gmail.com',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob',
      provider: 'google'
    };
    window.vitalTrackAuth._saveSession(userBob);
  });

  const bobMeals = await page.evaluate(() => window.store.get('meals', []));
  console.log(`Bob meals count (Must be 0 to prove isolation): ${bobMeals.length}`);
  if (bobMeals.length !== 0) throw new Error('DATA LEAK: Bob can see Alice meals!');
  console.log('🔒 HERMETIC DATA ISOLATION VERIFIED: User B cannot access User A data!');

  // TEST 4: RGPD Right to be Forgotten (Droit à l\'oubli) for Alice
  console.log('--- TEST 4: Testing RGPD Right to be Forgotten (Full Account Erasure) ---');
  await page.evaluate(() => {
    // Re-sign as Alice and trigger permanent deletion
    const userAlice = { uid: 'google_uid_alice_123', email: 'alice@gmail.com', name: 'Alice Vitaliste' };
    window.vitalTrackAuth.currentUser = userAlice;
    window.vitalTrackAuth.deleteAccountAndAllData();
  });

  const remainingAliceKeys = await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys.filter(k => k.includes('google_uid_alice_123'));
  });

  console.log(`Remaining Alice keys after RGPD deletion: ${remainingAliceKeys.length}`);
  if (remainingAliceKeys.length !== 0) throw new Error('RGPD VIOLATION: Alice data still persisted after deletion!');
  console.log('🗑️ RGPD RIGHT TO BE FORGOTTEN VERIFIED: 100% of user data purged!');

  console.log('\n🎉 ALL GOOGLE AUTH & RGPD COMPLIANCE TESTS PASSED 100% PERFECTLY!');

  await browser.close();
  server.close();
  process.exit(0);
});
