import fs from 'fs';
import path from 'path';

const plantsMap = {
  'chanca-piedra': 'chanca.htm',
  'erva-tostao': 'ervatostao.htm',
  'griffe-de-chat': 'catsclaw.htm',
  'sangre-de-grado': 'sangre.htm',
  'pau-darco': 'paudarco.htm',
  'fedegoso': 'fedegoso.htm',
  'espinheira-santa': 'espinheira.htm',
  'carqueja': 'carqueja.htm',
  'boldo-amazonie': 'boldo.htm',
  'camu-camu': 'camu.htm',
  'sacha-inchi': 'sachainchi.htm',
  'jatoba': 'jatoba.htm',
  'guaco': 'guaco.htm',
  'amor-seco': 'amorseco.htm',
  'mullaca': 'mullaca.htm',
  'graviola': 'graviola.htm',
  'abuta': 'abuta.htm',
  'muira-puama': 'muirapuama.htm',
  'catuaba': 'catuaba.htm',
  'piri-piri': 'piripiri.htm'
};

async function checkAll() {
  console.log('🔍 Checking rain-tree.com pages for all 20 plants...');
  const results = {};

  for (const [id, slug] of Object.entries(plantsMap)) {
    try {
      const url = `https://rain-tree.com/${slug}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (resp.status === 200) {
        const html = await resp.text();
        // Look for plant images in images/pics/ or Plant-Images/ or full image links
        const imgMatches = [...html.matchAll(/<img[^>]+src=[\"']([^\"']+)[\"']/gi)].map(m => m[1]);
        const aMatches = [...html.matchAll(/<a[^>]+href=[\"']([^\"']+\.(jpg|jpeg|gif|png))[\"']/gi)].map(m => m[1]);
        
        // Filter relevant plant photos (exclude site logo, backgrounds, etc.)
        const plantImgs = [...imgMatches, ...aMatches].filter(src => {
          const lower = src.toLowerCase();
          return !lower.includes('rplogo') && 
                 !lower.includes('bg') && 
                 !lower.includes('header') && 
                 !lower.includes('banner') &&
                 !lower.includes('book') &&
                 !lower.includes('paypal') &&
                 !lower.includes('blank.gif') &&
                 !lower.includes('bullet');
        });

        results[id] = { status: 200, slug, images: plantImgs };
        console.log(`✅ ${id} (${slug}):`, plantImgs);
      } else {
        results[id] = { status: resp.status, slug, images: [] };
        console.log(`❌ ${id} (${slug}): Status ${resp.status}`);
      }
    } catch (e) {
      results[id] = { status: 'error', error: e.message };
      console.log(`❌ ${id} error:`, e.message);
    }
  }

  return results;
}

checkAll();
