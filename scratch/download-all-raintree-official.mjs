import fs from 'fs';
import path from 'path';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Mapping of our 20 plants to their exact Raintree pages / Plant-Images gallery pages
const plantPages = [
  { id: 'chanca-piedra', picPage: 'chanca-piedra-pic.htm', mainPage: 'chanca.htm' },
  { id: 'erva-tostao', picPage: 'ervatostao-pic.htm', mainPage: 'ervatostao.htm' },
  { id: 'griffe-de-chat', picPage: 'cats-claw-pic.htm', mainPage: 'catclaw.htm' },
  { id: 'sangre-de-grado', picPage: 'sangre-pic.htm', mainPage: 'sangre.htm' },
  { id: 'pau-darco', picPage: 'paudarco-pic.htm', mainPage: 'paudarco.htm' },
  { id: 'fedegoso', picPage: 'fedegoso-pic.htm', mainPage: 'fedegosa.htm' },
  { id: 'espinheira-santa', picPage: 'espinheira-pic.htm', mainPage: 'espinheira.htm' },
  { id: 'carqueja', picPage: 'carqueja-pic.htm', mainPage: 'carqueja.htm' },
  { id: 'boldo-amazonie', picPage: 'boldo-pic.htm', mainPage: 'boldo.htm' },
  { id: 'camu-camu', picPage: 'camu-pic.htm', mainPage: 'camu.htm' },
  { id: 'jatoba', picPage: 'jatoba-pic.htm', mainPage: 'jatoba.htm' },
  { id: 'guaco', picPage: 'guaco-pic.htm', mainPage: 'guaco.htm' },
  { id: 'amor-seco', picPage: 'amorseco-pic.htm', mainPage: 'amorseco.htm' },
  { id: 'mullaca', picPage: 'mullaca-pic.htm', mainPage: 'mullaca.htm' },
  { id: 'graviola', picPage: 'graviola-pic.htm', mainPage: 'graviola.htm' },
  { id: 'abuta', picPage: 'abuta-pic.htm', mainPage: 'abuta.htm' },
  { id: 'muira-puama', picPage: 'muira-puama-pic.htm', mainPage: 'muirapuama.htm' },
  { id: 'catuaba', picPage: 'catuaba-pic.htm', mainPage: 'catuaba.htm' },
  { id: 'piri-piri', picPage: 'tirirca-pics.htm', mainPage: 'piri-piri.htm' },
  { id: 'sacha-inchi', picPage: 'plukenetia-pic.htm', mainPage: 'sachainchi.htm' }
];

async function downloadAll() {
  console.log('🚀 Downloading official Raintree plant photos & illustrations...');
  const downloadedReport = [];

  for (const plant of plantPages) {
    let imagesFound = [];

    // 1. Try picPage
    if (plant.picPage) {
      try {
        const url = `https://rain-tree.com/Plant-Images/${plant.picPage}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resp.status === 200) {
          const html = await resp.text();
          const matches = [...html.matchAll(/<img[^>]+src=[\"']([^\"']+\.(jpg|jpeg|png|gif))[\"']/gi)].map(m => m[1]);
          for (const m of matches) {
            if (!m.includes('logo') && !m.includes('banner') && !m.includes('bg') && !m.includes('bullet') && !m.includes('blank')) {
              const fullUrl = m.startsWith('http') ? m : (m.startsWith('../') ? `https://rain-tree.com/${m.replace('../', '')}` : `https://rain-tree.com/Plant-Images/${m}`);
              imagesFound.push(fullUrl);
            }
          }
        }
      } catch (e) {}
    }

    // 2. Try main page if needed
    if (imagesFound.length === 0 && plant.mainPage) {
      try {
        const url = `https://rain-tree.com/${plant.mainPage}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resp.status === 200) {
          const html = await resp.text();
          const matches = [...html.matchAll(/<img[^>]+src=[\"']([^\"']+\.(jpg|jpeg|png|gif))[\"']/gi)].map(m => m[1]);
          for (const m of matches) {
            if (!m.includes('logo') && !m.includes('banner') && !m.includes('bg') && !m.includes('cancer') && !m.includes('book')) {
              const fullUrl = m.startsWith('http') ? m : `https://rain-tree.com/${m.replace(/^\//, '')}`;
              imagesFound.push(fullUrl);
            }
          }
        }
      } catch (e) {}
    }

    console.log(`\n🌿 ${plant.id}: Found ${imagesFound.length} Raintree image URLs:`, imagesFound.slice(0, 3));

    // Prefer photographic JPGs first, then GIF illustrations
    imagesFound.sort((a, b) => {
      const aIsJpg = a.toLowerCase().endsWith('.jpg') || a.toLowerCase().endsWith('.jpeg');
      const bIsJpg = b.toLowerCase().endsWith('.jpg') || b.toLowerCase().endsWith('.jpeg');
      if (aIsJpg && !bIsJpg) return -1;
      if (!aIsJpg && bIsJpg) return 1;
      return 0;
    });

    let saved = false;
    for (const imgUrl of imagesFound) {
      try {
        const resp = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resp.status === 200) {
          const buf = Buffer.from(await resp.arrayBuffer());
          if (buf.length > 1000) { // Valid image
            const destPath = path.join(outDir, `${plant.id}.jpg`);
            fs.writeFileSync(destPath, buf);
            console.log(`✅ [RAINTREE SUCCESS] ${plant.id}.jpg saved (${buf.length} bytes) from ${imgUrl}`);
            downloadedReport.push({ id: plant.id, source: imgUrl, bytes: buf.length, status: 'OK' });
            saved = true;
            break;
          }
        }
      } catch (err) {
        console.log(`  Failed downloading ${imgUrl}: ${err.message}`);
      }
    }

    if (!saved) {
      console.log(`⚠️ Could not download specific Raintree asset for ${plant.id}, fallback to verified botanical image.`);
      downloadedReport.push({ id: plant.id, status: 'FALLBACK_PRESERVED' });
    }
  }

  console.log('\n=========================================');
  console.log('🎉 RAINTREE OFFICIAL ASSET EXTRACTION REPORT:');
  console.log(JSON.stringify(downloadedReport, null, 2));
}

downloadAll();
