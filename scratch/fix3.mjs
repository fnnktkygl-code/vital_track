import https from 'https';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');

const targets = [
  { id: 'pedra-ume-caa', query: 'Myrcia' },
  { id: 'piri-piri', query: 'Cyperus articulatus' },
  { id: 'vassourinha', query: 'Scoparia dulcis' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VitalTrackBot/1.0 (https://vitaltrack.app; support@vitaltrack.app)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
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

async function fix3() {
  for (const t of targets) {
    console.log(`Searching Commons for ${t.query}...`);
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(t.query)}&gsrlimit=5&prop=imageinfo&iiprop=url&format=json`;
    const res = await fetchJson(searchUrl);
    const pages = res.query?.pages;
    if (pages) {
      for (const k of Object.keys(pages)) {
        const url = pages[k].imageinfo?.[0]?.url;
        if (url && (url.endsWith('.jpg') || url.endsWith('.JPG') || url.endsWith('.png'))) {
          console.log(`Found URL for ${t.id}: ${url}`);
          try {
            await downloadBinary(url, path.join(outDir, `${t.id}.jpg`));
            console.log(`✅ Saved ${t.id}.jpg`);
            break;
          } catch(e) {
            console.log(`Retrying next file for ${t.id}...`);
          }
        }
      }
    }
  }
}

fix3();
