import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { morseDetoxMiracleFr } from '../web-app/src/data/books/morseDetoxMiracleFr.js';
import { ALL_READABLE_BOOKS } from '../web-app/src/data/books/ehretMucuslessFr.js';

console.log('🌿 Démarrage de la suite de tests pour BookReader (Édition Française Dr. Robert Morse)...');

let passedTests = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ÉCHEC: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Métadonnées du Livre
it('Le livre du Dr. Morse possède un ID, un titre et un auteur valides', () => {
  assert.strictEqual(morseDetoxMiracleFr.id, 'morse-detox-miracle-fr');
  assert.ok(morseDetoxMiracleFr.title.includes('Miracle de la Détox'));
  assert.strictEqual(morseDetoxMiracleFr.author, 'Dr. Robert Morse, N.D.');
  assert.ok(morseDetoxMiracleFr.pdfUrl.endsWith('.pdf'));
});

// 2. Sections et Chapitres
it('Le livre contient les sections fondamentales prévues', () => {
  assert.ok(Array.isArray(morseDetoxMiracleFr.chapters));
  assert.ok(morseDetoxMiracleFr.chapters.length >= 12, `Trouvé ${morseDetoxMiracleFr.chapters.length} chapitres`);
});

// 3. Présence de l\'Anatomie Comparée (Tableau)
it('Le Chapitre 1 contient la table exhaustive d\'anatomie comparée (Carnivore vs Frugivore)', () => {
  const chap1 = morseDetoxMiracleFr.chapters.find(c => c.id === 'chapitre-1-humain-frugivore');
  assert.ok(chap1, 'Chapitre 1 trouvé');
  const fullText = chap1.paragraphs.join('\n');
  assert.ok(fullText.includes('Humain Frugivore'), 'Contient la colonne Humain Frugivore');
  assert.ok(fullText.includes('12 fois la longueur du tronc'), 'Contient la longueur intestinale de 12x');
  assert.ok(fullText.includes('ptyaline'), 'Mentionne la ptyaline salivaire');
});

// 4. Présence de la Table Acido-Basique & Combinaisons
it('Le Chapitre 7 contient la grande table acido-basique et les combinaisons alimentaires', () => {
  const chap7 = morseDetoxMiracleFr.chapters.find(c => c.id === 'chapitre-7-menus-et-combinaisons');
  assert.ok(chap7, 'Chapitre 7 trouvé');
  const fullText = chap7.paragraphs.join('\n');
  assert.ok(fullText.includes('Aliments Fortement Alcalinisants'), 'Contient les aliments alcalinisants');
  assert.ok(fullText.includes('Melons et Pastèques se mangent TOUJOURS SEULS'), 'Contient la règle d\'or des melons');
});

// 5. Présence des Formules Botaniques par Système
it('Le Chapitre 8 contient le tableau des formules de plantes par émonctoire', () => {
  const chap8 = morseDetoxMiracleFr.chapters.find(c => c.id === 'chapitre-8-pharmacopee-botanique');
  assert.ok(chap8, 'Chapitre 8 trouvé');
  const fullText = chap8.paragraphs.join('\n');
  assert.ok(fullText.includes('Reins & Vessie'), 'Contient la formule Reins');
  assert.ok(fullText.includes('Grand Système Lymphatique'), 'Contient la formule Lymphe');
  assert.ok(fullText.includes('Glandes Surrénales'), 'Contient la formule Surrénales');
});

// 6. Présence du Protocole de Température Basale de Barnes
it('L\'Annexe A contient le protocole clinique de température basale de Barnes', () => {
  const annexeA = morseDetoxMiracleFr.chapters.find(c => c.id === 'annexes-medicales-barnes');
  assert.ok(annexeA, 'Annexe A trouvée');
  const fullText = annexeA.paragraphs.join('\n');
  assert.ok(fullText.includes('Température Basale Axillaire'), 'Contient le tableau des températures');
  assert.ok(fullText.includes('36,4 °C'), 'Contient le seuil d\'hypothyroïdie');
});

// 7. Présence et Qualité du Glossaire
it('Le glossaire contient les concepts clés du Dr. Morse avec définitions exhaustives', () => {
  const keys = Object.keys(morseDetoxMiracleFr.glossary || {});
  assert.ok(keys.length >= 25, `Trouvé ${keys.length} termes dans le glossaire`);
  assert.ok(morseDetoxMiracleFr.glossary['lymphe'], 'Terme lymphe présent');
  assert.ok(morseDetoxMiracleFr.glossary['filtration rénale'], 'Terme filtration rénale présent');
  assert.ok(morseDetoxMiracleFr.glossary['surrénales'], 'Terme surrénales présent');
  assert.ok(morseDetoxMiracleFr.glossary['parathyroïdes'], 'Terme parathyroïdes présent');
});

// 8. Vérification des Notes Scientifiques et Mises en Garde
it('Toutes les définitions du glossaire contiennent un éclairage scientifique factuel', () => {
  for (const [term, entry] of Object.entries(morseDetoxMiracleFr.glossary)) {
    assert.ok(entry.def && entry.def.length > 10, `Définition pour ${term} doit être substantielle`);
    assert.ok(entry.note && entry.note.length > 10, `Note pour ${term} doit être substantielle`);
    assert.ok(['science', 'warning'].includes(entry.type), `Type pour ${term} doit être science ou warning`);
  }
});

// 9. Vérification des Sources Primaires Académiques
it('Toutes les définitions du glossaire sont appuyées par des sources académiques primaires', () => {
  for (const [term, entry] of Object.entries(morseDetoxMiracleFr.glossary)) {
    assert.ok(Array.isArray(entry.sources) && entry.sources.length >= 1, `Le terme '${term}' doit avoir au moins 1 source primaire`);
    for (const src of entry.sources) {
      assert.ok(src.length >= 15, `La source '${src}' pour '${term}' doit être détaillée`);
    }
  }
});

// 10. Cohérence des Balises {{terme}}
it('Tous les termes annotés {{terme}} dans le texte existent dans le glossaire', () => {
  const glossaryKeys = new Set(Object.keys(morseDetoxMiracleFr.glossary).map(k => k.toLowerCase()));
  
  for (const chap of morseDetoxMiracleFr.chapters) {
    if (chap.id.startsWith('glossaire')) continue;
    for (const p of chap.paragraphs) {
      const matches = p.match(/\{\{(.+?)\}\}/g) || [];
      for (const m of matches) {
        const term = m.replace(/\{\{|\}\}/g, '').trim().toLowerCase();
        assert.ok(
          glossaryKeys.has(term),
          `Le terme '{{${term}}}' dans le chapitre '${chap.title}' doit être défini dans le glossaire !`
        );
      }
    }
  }
});

// 11. Intégration dans ALL_READABLE_BOOKS
it('ALL_READABLE_BOOKS contient à la fois Arnold Ehret et le Dr. Robert Morse', () => {
  assert.strictEqual(ALL_READABLE_BOOKS.length, 2);
  assert.ok(ALL_READABLE_BOOKS.some(b => b.id === 'ehret-mucusless-fr'));
  assert.ok(ALL_READABLE_BOOKS.some(b => b.id === 'morse-detox-miracle-fr'));
});

// 12. Vérification de l\'existence physique du PDF
it('Le fichier PDF de luxe du Dr. Morse existe sur le disque et a une taille supérieure à 300 Ko', () => {
  const pdfPath = path.join(process.cwd(), 'web-app/public', morseDetoxMiracleFr.pdfUrl);
  assert.ok(fs.existsSync(pdfPath), `Le fichier ${pdfPath} doit exister`);
  const stats = fs.statSync(pdfPath);
  assert.ok(stats.size > 300000, `La taille du PDF (${stats.size} octets) doit dépasser 300 Ko`);
});

console.log(`\n🎉 SUITE BOOKREADER DR. MORSE VALIDÉE : ${passedTests} / 12 assertions réussies à 100% !\n`);
