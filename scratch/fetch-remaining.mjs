import fs from 'fs';
import path from 'path';
import https from 'https';

const remaining = [
  { id: 'boldo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Boldo_%28Peumus_boldus%29.JPG/800px-Boldo_%28Peumus_boldus%29.JPG' },
  { id: 'guarana', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Paullinia_cupana_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-235.jpg/800px-Paullinia_cupana_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-235.jpg' },
  { id: 'muira-puama', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ptychopetalum_olacoides_Benth._%287311394140%29.jpg/800px-Ptychopetalum_olacoides_Benth._%287311394140%29.jpg' },
  { id: 'espinheira-santa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Maytenus_ilicifolia_-_Jardim_Bot%C3%A2nico_de_Porto_Alegre_01.jpg/800px-Maytenus_ilicifolia_-_Jardim_Bot%C3%A2nico_de_Porto_Alegre_01.jpg' }
];

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants');

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
  for (const item of remaining) {
    const dest = path.join(outDir, `${item.id}.jpg`);
    console.log(`Downloading ${item.id}...`);
    try {
      await downloadFile(item.url, dest);
      console.log(`✅ Saved ${item.id}.jpg`);
    } catch(e) {
      console.error(`❌ Error on ${item.id}:`, e.message);
    }
  }
}

run();
