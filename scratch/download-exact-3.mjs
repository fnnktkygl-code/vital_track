import https from 'https';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');

const targets = [
  { id: 'pedra-ume-caa', file: 'File:Myrcia_splendens_1zz.jpg' },
  { id: 'piri-piri', file: 'File:Starr_070215-4606_Cyperus_articulatus.jpg' },
  { id: 'vassourinha', file: 'File:Starr_080117-1473_Scoparia_dulcis.jpg' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (contact@vitaltrack.local)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (contact@vitaltrack.local)' } }, (res) => {
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

async function run() {
  for (const t of targets) {
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(t.file)}&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetchJson(infoUrl);
    const pages = res.query?.pages;
    if (pages) {
      for (const k of Object.keys(pages)) {
        const url = pages[k].imageinfo?.[0]?.url;
        if (url) {
          console.log(`Downloading ${t.id} from ${url}`);
          await downloadBinary(url, path.join(outDir, `${t.id}.jpg`));
          console.log(`✅ Saved ${t.id}.jpg`);
        }
      }
    }
  }
}

run();
