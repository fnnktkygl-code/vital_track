import https from 'https';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');

const extraPlants = [
  { id: 'carqueja', title: 'Baccharis_trimera' },
  { id: 'sacha-inchi', title: 'Plukenetia_volubilis' },
  { id: 'guaco', title: 'Mikania_glomerata' },
  { id: 'amor-seco', title: 'Desmodium_adscendens' },
  { id: 'mullaca', title: 'Physalis_angulata' },
  { id: 'abuta', title: 'Abuta_grandifolia' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (https://vitaltrack.app; support@vitaltrack.app)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
      if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function getImageUrlForTitle(title) {
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const data = await fetchJson(summaryUrl);
    if (data.originalimage?.source) return data.originalimage.source;
    if (data.thumbnail?.source) return data.thumbnail.source;
  } catch (e) {}

  try {
    const ptSummaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const ptData = await fetchJson(ptSummaryUrl);
    if (ptData.originalimage?.source) return ptData.originalimage.source;
    if (ptData.thumbnail?.source) return ptData.thumbnail.source;
  } catch (e) {}

  try {
    const frSummaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const frData = await fetchJson(frSummaryUrl);
    if (frData.originalimage?.source) return frData.originalimage.source;
    if (frData.thumbnail?.source) return frData.thumbnail.source;
  } catch (e) {}

  return null;
}

async function run() {
  for (const plant of extraPlants) {
    const dest = path.join(outDir, `${plant.id}.jpg`);
    let imgUrl = await getImageUrlForTitle(plant.title);
    if (imgUrl) {
      console.log(`📥 Downloading ${plant.id} from ${imgUrl}`);
      try {
        await downloadBinary(imgUrl, dest);
        console.log(`✅ Saved ${plant.id}.jpg`);
      } catch (err) {
        console.error(`❌ Failed ${plant.id}:`, err.message);
      }
    } else {
      console.warn(`⚠️ No image found for ${plant.id}`);
    }
  }
}

run();
