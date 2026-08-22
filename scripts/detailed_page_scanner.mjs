/**
 * detailed_page_scanner.mjs
 * 
 * Analyse en profondeur chaque chapitre et module pour identifier tous les schémas,
 * organigrammes, tableaux, listes comparatives et classifications.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_morse_pages.json'), 'utf8'));

function scanRange(startPage, endPage, label) {
  console.log(`\n======================================================`);
  console.log(`📚 SCAN : ${label} (Pages ${startPage} à ${endPage})`);
  console.log(`======================================================`);

  for (let i = startPage; i <= endPage; i++) {
    const page = pages.find(p => p.page === i);
    if (!page) continue;
    
    const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Détection de structures tabulaires ou de diagrammes
    const isSpecial = lines.some(l => 
      /^(Tableau|Table|Classification|Comparaison|Organigramme|Schéma|Diagramme|Hormone|Glande|Anticorps|Immunoglobuline|Cellule|Système|Fluide|Vitamine|Minéral|Aliment|Acidose|Alcalin|PRAL|Formule|Posologie|Recommandation|Définition|Préfixe|Suffixe|Énergie|Angströms)/i.test(l) ||
      /(\%|mg|µg|Å|pH|IgG|IgA|IgM|IgD|IgE|TSH|ACTH|FSH|LH|GH|PTH|ADH)/.test(l)
    );

    if (isSpecial) {
      console.log(`\n📄 [Page ${i}]`);
      lines.forEach((l, idx) => {
        if (/^[A-ZÉÈÊËÀÂÎÏÔÙÛÇ\s–—\-]{4,}$/.test(l) || l.includes('%') || l.includes('—') || l.includes(':') || idx < 5) {
          console.log(`   - ${l.slice(0, 100)}`);
        }
      });
    }
  }
}

scanRange(21, 28, "Chapitre 1 - Comprendre notre espèce");
scanRange(29, 75, "Chapitre 2 - Le fonctionnement de notre organisme");
scanRange(76, 123, "Chapitre 3 - Les aliments que nous mangeons");
scanRange(124, 147, "Chapitre 4 - Les habitudes toxiques");
scanRange(148, 183, "Chapitre 5 - La nature de la maladie");
scanRange(184, 217, "Chapitre 6 - Éradiquer la maladie");
scanRange(218, 239, "Chapitre 7 - La vitalité en mangeant");
scanRange(240, 286, "Chapitre 8 - Le pouvoir des plantes");
scanRange(287, 299, "Chapitres 9 & 10 - Outils & Spiritualité");
scanRange(300, 387, "Annexes A à H & Glossaire");
