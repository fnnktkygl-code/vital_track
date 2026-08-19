import fs from 'fs';
import path from 'path';

const outDir = path.resolve('/Users/richard/Developer/vital_track/web-app/public/plants-raintree');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const targetPlants = [
  { id: 'chanca-piedra', slug: 'chanca.htm' },
  { id: 'erva-tostao', slug: 'ervatostao.htm' },
  { id: 'griffe-de-chat', slug: 'catclaw.htm' },
  { id: 'sangre-de-grado', slug: 'sangre.htm' },
  { id: 'pau-darco', slug: 'paudarco.htm' },
  { id: 'fedegoso', slug: 'fedegosa.htm' },
  { id: 'espinheira-santa', slug: 'espinheira.htm' },
  { id: 'carqueja', slug: 'carqueja.htm' },
  { id: 'boldo-amazonie', slug: 'boldo.htm' },
  { id: 'camu-camu', slug: 'camu.htm' },
  { id: 'jatoba', slug: 'jatoba.htm' },
  { id: 'guaco', slug: 'guaco.htm' },
  { id: 'amor-seco', slug: 'amorseco.htm' },
  { id: 'mullaca', slug: 'mullaca.htm' },
  { id: 'graviola', slug: 'graviola.htm' },
  { id: 'abuta', slug: 'abuta.htm' },
  { id: 'muira-puama', slug: 'muirapuama.htm' },
  { id: 'catuaba', slug: 'catuaba.htm' },
  { id: 'piri-piri', slug: 'piri-piri.htm' },
  { id: 'sacha-inchi', slug: 'plukenetia.htm' }
];

async function downloadDirectRaintree() {
  console.log('🌿 Starting Raintree official asset extraction from https://rain-tree.com ...');
  const summary = {};

  for (const plant of targetPlants) {
    try {
      const pageUrl = `https://rain-tree.com/${plant.slug}`;
      const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (resp.status !== 200) {
        console.log(`⚠️ ${plant.id}: Page ${pageUrl} returned status ${resp.status}`);
        summary[plant.id] = { status: resp.status, found: false };
        continue;
      }

      const html = await resp.text();
      // Extract all potential image URLs
      const imgSources = [];
      const imgRegex = /<img[^>]+src=[\"']([^\"']+)[\"']/gi;
      let m;
      while ((m = imgRegex.exec(html)) !== null) {
        const src = m[1];
        const lower = src.toLowerCase();
        if (!lower.includes('rplogo') && 
            !lower.includes('bg') && 
            !lower.includes('header') && 
            !lower.includes('fighting-cancer') && 
            !lower.includes('banner') &&
            !lower.includes('book') &&
            !lower.includes('blank.gif') &&
            !lower.includes('bullet')) {
          imgSources.push(src);
        }
      }

      // Check linked plant-image pages if any
      const linkRegex = /<a[^>]+href=[\"'](Plant-Images\/[^\"']+\.(jpg|jpeg|gif|png|htm))[\"']/gi;
      while ((m = linkRegex.exec(html)) !== null) {
        imgSources.push(m[1]);
      }

      console.log(`🔍 ${plant.id} sources found:`, imgSources);

      // Download the first valid plant image
      let downloaded = false;
      for (let imgSrc of imgSources) {
        if (imgSrc.endsWith('.htm')) {
          // fetch that subpage to find the .jpg/.gif
          const subResp = await fetch(`https://rain-tree.com/${imgSrc}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (subResp.status === 200) {
            const subHtml = await subResp.text();
            const subImgs = [...subHtml.matchAll(/<img[^>]+src=[\"']([^\"']+\.(jpg|jpeg|gif|png))[\"']/gi)].map(x => x[1])
              .filter(s => !s.includes('rplogo') && !s.includes('bg') && !s.includes('banner'));
            if (subImgs.length) {
              imgSrc = subImgs[0].startsWith('http') ? subImgs[0] : (subImgs[0].startsWith('/') ? `https://rain-tree.com${subImgs[0]}` : `https://rain-tree.com/Plant-Images/${subImgs[0]}`);
            }
          }
        }

        const fullImgUrl = imgSrc.startsWith('http') ? imgSrc : `https://rain-tree.com/${imgSrc.replace(/^\//, '')}`;
        try {
          const imgResp = await fetch(fullImgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (imgResp.status === 200) {
            const contentType = imgResp.headers.get('content-type') || '';
            if (contentType.includes('image')) {
              const arrayBuf = await imgResp.arrayBuffer();
              const buffer = Buffer.from(arrayBuf);
              const ext = contentType.includes('gif') ? '.gif' : (contentType.includes('png') ? '.png' : '.jpg');
              const savePath = path.join(outDir, `${plant.id}${ext}`);
              fs.writeFileSync(savePath, buffer);
              console.log(`✅ Saved ${plant.id} (${buffer.length} bytes) from ${fullImgUrl}`);
              summary[plant.id] = { status: 200, found: true, url: fullImgUrl, bytes: buffer.length, ext };
              downloaded = true;
              break;
            }
          }
        } catch (err) {
          console.log(`  Failed to fetch ${fullImgUrl}: ${err.message}`);
        }
      }

      if (!downloaded) {
        summary[plant.id] = { status: 200, found: false, note: 'No image tag resolved on page' };
      }

    } catch (e) {
      console.log(`❌ Error for ${plant.id}: ${e.message}`);
      summary[plant.id] = { status: 'error', error: e.message };
    }
  }

  console.log('\n📊 Summary of Raintree direct image extraction:');
  console.log(JSON.stringify(summary, null, 2));
}

downloadDirectRaintree();
