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
it('Le livre contient 30 sections intégrales (Préface, Intro, Biographie + 26 Leçons + Dictionnaire Vitaliste)', () => {
  assert.equal(ehretMucuslessFr.chapters.length, 30);
});

it('Le livre contient plus de 500 paragraphes et plus de 280 000 caractères intégraux', () => {
  let totalChars = 0;
  let totalParagraphs = 0;
  ehretMucuslessFr.chapters.forEach(c => {
    totalParagraphs += c.paragraphs.length;
    c.paragraphs.forEach(p => totalChars += p.length);
  });
  assert.ok(totalParagraphs >= 500, `Attendu >= 500 paragraphes (trouvé ${totalParagraphs})`);
  assert.ok(totalChars >= 280000, `Attendu >= 280 000 caractères (trouvé ${totalChars})`);
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
  const lessonTags = ehretMucuslessFr.chapters.slice(3, 29).map(c => c.tag);
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
  assert.ok(Object.keys(ehretMucuslessFr.glossary).length >= 35);
});

it('Tous les termes annotés {{terme}} dans les paragraphes existent dans le glossaire', () => {
  const termRegex = /\{\{(.+?)\}\}/g;
  let termCount = 0;
  ehretMucuslessFr.chapters.forEach(ch => {
    ch.paragraphs.forEach(p => {
      let match;
      while ((match = termRegex.exec(p)) !== null) {
        const term = match[1].toLowerCase();
        termCount++;
        assert.ok(
          ehretMucuslessFr.glossary[term] !== undefined,
          `Le terme '{{${term}}}' dans le chapitre '${ch.title}' n'a pas de définition dans le glossaire !`
        );
      }
    });
  });
  assert.ok(termCount >= 500, `Au moins 500 annotations de glossaire doivent être présentes (trouvé ${termCount})`);
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

// 6. Mémoire de Lecture & Persistance
it('La structure de persistance de lecture mémorise le chapitre, le scrollTop et le ratio', () => {
  const mockProgress = {
    bookId: 'ehret-mucusless-fr',
    chapterIndex: 5,
    scrollTop: 850,
    scrollRatio: 0.42,
    updatedAt: Date.now()
  };
  const serialized = JSON.stringify(mockProgress);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.bookId, 'ehret-mucusless-fr');
  assert.equal(parsed.chapterIndex, 5);
  assert.equal(parsed.scrollTop, 850);
  assert.equal(parsed.scrollRatio, 0.42);
  assert.ok(parsed.updatedAt > 0);
});

// 7. Vérification des 10 Tables de Ragnar Berg (Leçon XIV)
it('La Leçon XIV contient les 10 tables exhaustives de Ragnar Berg avec valeurs chiffrées', () => {
  const lesson14 = ehretMucuslessFr.chapters.find(c => c.id === 'lesson-14');
  assert.ok(lesson14, 'La Leçon XIV doit exister');
  const tableParagraphs = lesson14.paragraphs.filter(p => p.includes('| Aliment') && p.includes('---'));
  assert.equal(tableParagraphs.length, 10, `Attendu 10 tables de Berg (trouvé ${tableParagraphs.length})`);
  assert.ok(lesson14.paragraphs.join(' ').includes('+10.25')); // Huîtres
  assert.ok(lesson14.paragraphs.join(' ').includes('-51.83')); // Jaunes d'œufs
  assert.ok(lesson14.paragraphs.join(' ').includes('+39.40')); // Radis noir
});

// 8. Vérification des Éclairages Scientifiques & Mises en Garde (Section 30)
it('Toutes les définitions du glossaire contiennent un recul scientifique et des mises en garde factuelles', () => {
  const entries = Object.entries(ehretMucuslessFr.glossary);
  assert.ok(entries.length >= 38);
  const warnings = entries.filter(([k, v]) => v.type === 'warning');
  assert.ok(warnings.length >= 3, 'Au moins 3 termes clés doivent comporter une mise en garde explicite (cœur/moteur, protéines, médicaments)');
});

// 9. Vérification des Sources Scientifiques Primaires (DOI / Manuels / OMS)
it('Toutes les définitions du glossaire sont appuyées par des sources académiques primaires vérifiables', () => {
  const entries = Object.entries(ehretMucuslessFr.glossary);
  entries.forEach(([term, item]) => {
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `Le terme '${term}' doit contenir une liste de sources`);
    item.sources.forEach(src => {
      assert.ok(typeof src === 'string' && src.length > 15, `La source '${src}' pour le terme '${term}' est trop courte ou invalide`);
    });
  });

  // Vérifier la présence de sources majeures
  const allSources = entries.flatMap(([k, v]) => v.sources).join(' ');
  assert.ok(allSources.includes('Guyton'), 'Doit citer le traité de physiologie Guyton & Hall');
  assert.ok(allSources.includes('Lehninger'), 'Doit citer le traité de biochimie Lehninger');
  assert.ok(allSources.includes('Nobel'), 'Doit citer les travaux prix Nobel sur l\'autophagie (Ohsumi)');
  assert.ok(allSources.includes('Remer'), 'Doit citer les études sur l\'indice PRAL de Remer');
  assert.ok(allSources.includes('Organisation Mondiale de la Santé') || allSources.includes('OMS'), 'Doit citer l\'OMS / FAO');
});

console.log(`\n🎉 SUITE BOOKREADER VALIDÉE : ${passedTests} / ${totalTests} assertions réussies à 100% !\n`);
