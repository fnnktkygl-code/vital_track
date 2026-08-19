import fs from 'fs';
import path from 'path';
import https from 'https';

const plants = [
  { id: 'chanca-piedra', query: 'Phyllanthus niruri' },
  { id: 'erva-tostao', query: 'Boerhavia diffusa' },
  { id: 'griffe-de-chat', query: 'Uncaria tomentosa' },
  { id: 'sangre-de-grado', query: 'Croton lechleri' },
  { id: 'pau-darco', query: 'Handroanthus impetiginosus' },
  { id: 'graviola', query: 'Annona muricata' },
  { id: 'jatoba', query: 'Hymenaea courbaril' },
  { id: 'boldo', query: 'Peumus boldus' },
  { id: 'camu-camu', query: 'Myrciaria dubia' },
  { id: 'maca', query: 'Lepidium meyenii' },
  { id: 'muira-puama', query: 'Ptychopetalum olacoides' },
  { id: 'guarana', query: 'Paullinia cupana' },
  { id: 'catuaba', query: 'Trichilia catigua' },
  { id: 'samambaia', query: 'Phlebodium aureum' },
  { id: 'gervao', query: 'Stachytarpheta cayennensis' },
  { id: 'fedegoso', query: 'Senna occidentalis' },
  { id: 'piri-piri', query: 'Cyperus articulatus' },
  { id: 'espinheira-santa', query: 'Monteverdia ilicifolia' },
  { id: 'vassourinha', query: 'Scoparia dulcis' },
  { id: 'pedra-ume-caa', query: 'Myrcia' }
];

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (vitaltrack@vitaltrack.local)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (vitaltrack@vitaltrack.local)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('🌿 Starting botanical image fetch for all 20 Raintree plants...');
  const results = {};

  for (const plant of plants) {
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(plant.query)}&prop=pageimages&format=json&pithumbsize=800`;
      const data = await fetchJson(apiUrl);
      const pages = data.query?.pages;
      let imageUrl = null;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].thumbnail?.source) {
          imageUrl = pages[pageId].thumbnail.source;
        }
      }

      // If not found, try french wikipedia or commons search
      if (!imageUrl) {
        const frApiUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(plant.query)}&prop=pageimages&format=json&pithumbsize=800`;
        const frData = await fetchJson(frApiUrl);
        const frPages = frData.query?.pages;
        if (frPages) {
          const frPageId = Object.keys(frPages)[0];
          if (frPageId !== '-1' && frPages[frPageId].thumbnail?.source) {
            imageUrl = frPages[frPageId].thumbnail.source;
          }
        }
      }

      if (imageUrl) {
        const dest = path.join(outDir, `${plant.id}.jpg`);
        console.log(`📥 Downloading ${plant.id} from ${imageUrl}`);
        await downloadFile(imageUrl, dest);
        results[plant.id] = `/plants/${plant.id}.jpg`;
        console.log(`✅ Saved ${plant.id}.jpg`);
      } else {
        console.warn(`⚠️ No direct image found for ${plant.query}`);
      }
    } catch (e) {
      console.error(`❌ Error fetching ${plant.id}:`, e.message);
    }
  }

  console.log('\n📊 Summary of downloaded images:', results);
}

run();
