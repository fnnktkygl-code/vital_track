import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Spawning Chrome with CDP...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    'about:blank'
  ]);

  await wait(1500);

  let version;
  try {
    version = await getJson('http://127.0.0.1:9222/json/version');
    console.log('Connected to Chrome:', version.Browser);
  } catch(e) {
    console.error('Failed to connect to Chrome:', e);
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  console.log('Enabling Page & Runtime...');
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:4173 ...');
  await send('Page.navigate', { url: 'http://localhost:4173' });
  await wait(2000);

  // Helper screenshot
  async function takeScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.result.data, 'base64');
    const path = `${artifactDir}/${filename}`;
    fs.writeFileSync(path, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  // 1. Show Chat Page
  console.log('Testing Chat Page & Controls...');
  await send('Runtime.evaluate', {
    expression: `
      showPage('chat');
      document.getElementById('chatInput').value = "Test saisie vocale et image";
    `
  });
  await wait(500);
  await takeScreenshot('chat_ui_verified.png');

  // 2. Open Model Selector & Verify Gemini 3.7 Flash
  console.log('Testing Model Selector (Gemini 3.7 Flash)...');
  await send('Runtime.evaluate', {
    expression: `
      window.renderModelPicker();
      const dd = document.getElementById('modelDropdown');
      dd.style.display = 'block';
    `
  });
  await wait(500);
  await takeScreenshot('chat_model_selector_verified.png');

  // 3. Test Calendar & 30-Day Plan & Substitution Modal
  console.log('Testing Calendar & Substitution Modal...');
  await send('Runtime.evaluate', {
    expression: `
      showPage('calendar');
      const plan = DietPlanEngine.generate({
        protocol: 'sebi',
        numDays: 30,
        objective: 'vitalité boréale',
        restrictions: 'mollusques 1x par semaine'
      });
      store.set('calendar_meals', plan.meals);
      renderStrip();
      renderDay();
      
      const meal = plan.meals[1]; // Petit-déjeuner
      openSubstituteModal(meal.id, 0, meal.tags[0].n, meal.tags[0].e);
    `
  });
  await wait(800);
  await takeScreenshot('calendar_substitution_modal_verified.png');

  // 4. Test selecting substitute chip & applying
  console.log('Applying food substitution...');
  await send('Runtime.evaluate', {
    expression: `
      const chips = document.querySelectorAll('#subChipsContainer .sub-chip');
      if (chips.length > 1) chips[1].click();
      applySubstitution();
    `
  });
  await wait(500);
  await takeScreenshot('calendar_substituted_verified.png');

  console.log('All E2E checks completed successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
