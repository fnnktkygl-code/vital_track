import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');

const plantPages = [
  { id: 'boldo', title: 'Peumus_boldus' },
  { id: 'camu-camu', title: 'Myrciaria_dubia' },
  { id: 'catuaba', title: 'Trichilia_catigua' },
  { id: 'chanca-piedra', title: 'Phyllanthus_niruri' },
  { id: 'erva-tostao', title: 'Boerhavia_diffusa' },
  { id: 'espinheira-santa', title: 'Monteverdia_ilicifolia' },
  { id: 'fedegoso', title: 'Senna_occidentalis' },
  { id: 'gervao', title: 'Stachytarpheta_cayennensis' },
  { id: 'graviola', title: 'Annona_muricata' },
  { id: 'griffe-de-chat', title: 'Uncaria_tomentosa' },
  { id: 'guarana', title: 'Paullinia_cupana' },
  { id: 'jatoba', title: 'Hymenaea_courbaril' },
  { id: 'maca', title: 'Lepidium_meyenii' },
  { id: 'muira-puama', title: 'Ptychopetalum_olacoides' },
  { id: 'pau-darco', title: 'Handroanthus_impetiginosus' },
  { id: 'pedra-ume-caa', title: 'Myrcia_sphaerocarpa' },
  { id: 'piri-piri', title: 'Cyperus_articulatus' },
  { id: 'samambaia', title: 'Phlebodium_aureum' },
  { id: 'sangre-de-grado', title: 'Croton_lechleri' },
  { id: 'vassourinha', title: 'Scoparia_dulcis' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (https://vitaltrack.app; support@vitaltrack.app)' } }, (res) => {
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

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (https://vitaltrack.app; support@vitaltrack.app)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function getImageUrlForTitle(title) {
  // 1. Try en.wikipedia.org summary API
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const data = await fetchJson(summaryUrl);
    if (data.originalimage?.source) return data.originalimage.source;
    if (data.thumbnail?.source) return data.thumbnail.source;
  } catch (e) {}

  // 2. Try pt.wikipedia.org (Portuguese for Amazonian plants)
  try {
    const ptSummaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const ptData = await fetchJson(ptSummaryUrl);
    if (ptData.originalimage?.source) return ptData.originalimage.source;
    if (ptData.thumbnail?.source) return ptData.thumbnail.source;
  } catch (e) {}

  // 3. Try fr.wikipedia.org
  try {
    const frSummaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const frData = await fetchJson(frSummaryUrl);
    if (frData.originalimage?.source) return frData.originalimage.source;
    if (frData.thumbnail?.source) return frData.thumbnail.source;
  } catch (e) {}

  // 4. Try Wikipedia image search
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=1000`;
    const searchData = await fetchJson(searchUrl);
    const pages = searchData.query?.pages;
    if (pages) {
      for (const k in pages) {
        if (pages[k].thumbnail?.source) return pages[k].thumbnail.source;
      }
    }
  } catch (e) {}

  return null;
}

// Fallback search keywords if Latin name page doesn't have image
const fallbacks = {
  'espinheira-santa': 'Maytenus_ilicifolia',
  'muira-puama': 'Ptychopetalum',
  'pedra-ume-caa': 'Myrcia',
  'piri-piri': 'Cyperus_articulatus',
  'vassourinha': 'Scoparia_dulcis',
  'boldo': 'Boldo',
  'guarana': 'Guarana'
};

async function run() {
  for (const plant of plantPages) {
    const dest = path.join(outDir, `${plant.id}.jpg`);
    let imgUrl = await getImageUrlForTitle(plant.title);
    if (!imgUrl && fallbacks[plant.id]) {
      imgUrl = await getImageUrlForTitle(fallbacks[plant.id]);
    }
    
    if (imgUrl) {
      console.log(`📥 Downloading ${plant.id} from ${imgUrl}`);
      try {
        await downloadBinary(imgUrl, dest);
        console.log(`✅ ${plant.id}.jpg saved successfully`);
      } catch (err) {
        console.error(`❌ Failed downloading binary for ${plant.id}:`, err.message);
      }
    } else {
      console.warn(`⚠️ Could not find image for ${plant.id} (${plant.title})`);
    }
  }
}

run();
