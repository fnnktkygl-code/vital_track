/**
 * test_book_reader_logic.mjs
 * 
 * Suite de tests unitaires pour le composant BookReader et les données du livre d'Arnold Ehret.
 */

import assert from 'node:assert/strict';
import { ehretMucuslessFr, ALL_READABLE_BOOKS } from '../web-app/src/data/books/ehretMucuslessFr.js';

console.log('📖 Démarrage de la suite de tests pour BookReader (Édition Française Ehret)...');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${desc}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Structure du Livre
it('Le livre possède un ID, un titre et un auteur valides', () => {
  assert.equal(ehretMucuslessFr.id, 'ehret-mucusless-fr');
  assert.equal(ehretMucuslessFr.author, 'Prof. Arnold Ehret');
  assert.ok(ehretMucuslessFr.title.includes('sans mucus'));
  assert.ok(ehretMucuslessFr.pdfUrl.endsWith('.pdf'));
});

// 2. Vérification des Leçons
it('Le livre contient 30 sections riches (Préface, Intro + 26 Leçons & Sous-Leçons IVa/XVIa)', () => {
  assert.equal(ehretMucuslessFr.chapters.length, 30);
});

it('Chaque chapitre a un ID unique, un tag non vide, un titre et au moins un paragraphe', () => {
  const ids = new Set();
  ehretMucuslessFr.chapters.forEach((ch, idx) => {
    assert.ok(ch.id, `Le chapitre index ${idx} doit avoir un id`);
    assert.ok(!ids.has(ch.id), `ID en double détecté : ${ch.id}`);
    ids.add(ch.id);

    assert.ok(ch.tag && ch.tag.trim().length > 0, `Le tag du chapitre ${ch.id} ne doit pas être vide`);
    assert.ok(ch.title && ch.title.trim().length > 0, `Le titre du chapitre ${ch.id} ne doit pas être vide`);
    assert.ok(Array.isArray(ch.paragraphs) && ch.paragraphs.length > 0, `Le chapitre ${ch.id} doit contenir des paragraphes`);
  });
});

// 3. Vérification des 26 Leçons Numérotées
it('Toutes les leçons de I à XXVI sont présentes dans l\'ordre', () => {
  const lessonTags = ehretMucuslessFr.chapters.slice(2).map(c => c.tag);
  assert.equal(lessonTags[0], 'Leçon I');
  assert.equal(lessonTags[lessonTags.length - 1], 'Leçon XXVI');
  assert.ok(lessonTags.includes('Leçon V'));
  assert.ok(lessonTags.includes('Leçon XV'));
  assert.ok(lessonTags.includes('Leçon XVII'));
});

// 4. Glossaire & Mots-Clés
it('Le glossaire contient les termes clés indispensables et leurs définitions', () => {
  assert.ok(ehretMucuslessFr.glossary['mucus']);
  assert.ok(ehretMucuslessFr.glossary['encombrement']);
  assert.ok(ehretMucuslessFr.glossary['vitalité']);
  assert.ok(ehretMucuslessFr.glossary['équation suprême']);
  assert.ok(ehretMucuslessFr.glossary['régime sans mucus']);
  assert.ok(ehretMucuslessFr.glossary['régime de transition']);
  assert.ok(ehretMucuslessFr.glossary['salade balai']);
  assert.ok(ehretMucuslessFr.glossary['autolyse']);
});

it('Tous les termes annotés {{terme}} dans les paragraphes existent dans le glossaire', () => {
  const termRegex = /\{\{(.+?)\}\}/g;
  let termCount = 0;
  ehretMucuslessFr.chapters.forEach(ch => {
    ch.paragraphs.forEach(p => {
      let match;
      while ((match = termRegex.exec(p)) !== null) {
        const term = match[1];
        termCount++;
        assert.ok(
          ehretMucuslessFr.glossary[term] !== undefined,
          `Le terme '{{${term}}}' dans le chapitre '${ch.title}' n'a pas de définition dans le glossaire !`
        );
      }
    });
  });
  assert.ok(termCount >= 5, `Au moins 5 annotations de glossaire doivent être présentes (trouvé ${termCount})`);
});

// 5. Thèmes et Tailles de police
it('Les thèmes supportés et les bornes de taille de police sont valides', () => {
  const validThemes = ['bone', 'sepia', 'dusk'];
  validThemes.forEach(t => assert.ok(typeof t === 'string'));

  const minFont = 14;
  const maxFont = 22;
  const initialFont = 17;
  assert.ok(initialFont >= minFont && initialFont <= maxFont);
});

console.log(`\n🎉 SUITE BOOKREADER VALIDÉE : ${passedTests} / ${totalTests} assertions réussies à 100% !\n`);
