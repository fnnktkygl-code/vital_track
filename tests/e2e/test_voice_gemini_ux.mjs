import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 5198;
const URL = `http://localhost:${PORT}`;

async function run() {
  console.log('🚀 Démarrage du serveur de test preview...');
  const server = spawn('npx', ['vite', 'preview', '--port', `${PORT}`], {
    cwd: path.resolve('web-app'),
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 1500));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(URL, { waitUntil: 'networkidle0' });
    console.log('✅ Page chargée sur mobile viewport.');

    // Navigate to Chat
    await page.evaluate(() => {
      window.showPage('chat');
    });
    await new Promise(r => setTimeout(r, 600));

    // Test Gemini Voice UI and Deduplication Algorithm
    console.log('🎙️ Test du comportement et du rendu de la saisie vocale...');
    const voiceTestResult = await page.evaluate(async () => {
      const input = document.getElementById('chatInput');
      input.value = '';

      // Mock SpeechRecognition API in browser context
      class MockSpeechRecognition {
        constructor() {
          this.continuous = true;
          this.interimResults = true;
          this.lang = 'fr-FR';
          this.onresult = null;
          this.onstart = null;
          this.onend = null;
          this.onerror = null;
        }
        start() {
          if (this.onstart) this.onstart();
        }
        stop() {
          if (this.onend) this.onend();
        }
        abort() {
          if (this.onend) this.onend();
        }
      }
      window.webkitSpeechRecognition = MockSpeechRecognition;
      window.SpeechRecognition = MockSpeechRecognition;

      // 1. Start voice input
      window.toggleVoiceInput(true);
      const indicator = document.getElementById('chatVoiceIndicator');
      const isIndicatorVisible = indicator && indicator.style.display !== 'none';
      const voiceBtn = document.getElementById('chatVoiceBtn');
      const isBtnRecording = voiceBtn && voiceBtn.classList.contains('recording');

      // 2. Simulate streaming interim and final Speech Recognition results
      // Event 1: Interim
      const event1 = {
        resultIndex: 0,
        results: [
          [{ transcript: 'Bonjour VitalTrack' }]
        ]
      };
      event1.results[0].isFinal = false;
      if (window._speechRecognition && window._speechRecognition.onresult) {
        window._speechRecognition.onresult(event1);
      }
      const val1 = input.value;

      // Event 2: Finalize segment 1 + new interim segment
      const event2 = {
        resultIndex: 0,
        results: [
          [{ transcript: 'Bonjour VitalTrack' }],
          [{ transcript: 'comment faire un jeûne' }]
        ]
      };
      event2.results[0].isFinal = true;
      event2.results[1].isFinal = false;
      if (window._speechRecognition && window._speechRecognition.onresult) {
        window._speechRecognition.onresult(event2);
      }
      const val2 = input.value;

      // Event 3: Finalize all
      const event3 = {
        resultIndex: 0,
        results: [
          [{ transcript: 'Bonjour VitalTrack' }],
          [{ transcript: 'comment faire un jeûne de 24h ?' }]
        ]
      };
      event3.results[0].isFinal = true;
      event3.results[1].isFinal = true;
      if (window._speechRecognition && window._speechRecognition.onresult) {
        window._speechRecognition.onresult(event3);
      }
      const val3 = input.value;

      return {
        isIndicatorVisible,
        isBtnRecording,
        val1,
        val2,
        val3,
        isDeduplicatedProperly: val3 === 'Bonjour VitalTrack comment faire un jeûne de 24h ?'
      };
    });

    console.log('Résultats test vocal:', voiceTestResult);

    // Verify screenshot clarity (no black screen, no privacy blur classes)
    const bodyClass = await page.evaluate(() => document.body.className);
    console.log('Body classes:', bodyClass);

    // Take screenshots for visual validation
    const artifactDir = '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots';
    await page.screenshot({
      path: path.join(artifactDir, '57_Voice_Input_Gemini_Overlay_Mobile.png')
    });

    // Stop voice and take clean screenshot
    await page.evaluate(() => {
      window.toggleVoiceInput(false);
    });
    await new Promise(r => setTimeout(r, 400));

    await page.screenshot({
      path: path.join(artifactDir, '58_Chat_Mobile_Clean_Ready.png')
    });

    console.log('✅ Screenshots 57 et 58 générés avec succès !');

    if (!voiceTestResult.isIndicatorVisible || !voiceTestResult.isBtnRecording || !voiceTestResult.isDeduplicatedProperly) {
      throw new Error('Échec de la validation de la saisie vocale.');
    }
    console.log('🎉 TOUS LES TESTS VOCAL & SCREENSHOT SONT VALIDÉS !');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
