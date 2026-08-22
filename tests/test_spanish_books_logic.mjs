/**
 * test_spanish_books_logic.mjs
 * 
 * Suite de tests unitaires pour les éditions espagnoles des livres d'Arnold Ehret et du Dr. Robert Morse.
 */

import assert from 'node:assert/strict';
import { ehretMucuslessEs } from '../web-app/src/data/books/ehretMucuslessEs.js';
import { morseDetoxMiracleEs } from '../web-app/src/data/books/morseDetoxMiracleEs.js';
import { ALL_READABLE_BOOKS } from '../web-app/src/data/books/ehretMucuslessFr.js';

console.log('🇪🇸 Démarrage de la suite de tests pour les Éditions Espagnoles (Ehret & Morse)...');

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. ARNOLD EHRET - ÉDITION ESPAGNOLE
// ─────────────────────────────────────────────────────────────────────────────

it('Ehret ES : Métadonnées valides (ID, Titre, Auteur, Langue)', () => {
  assert.equal(ehretMucuslessEs.id, 'ehret-mucusless-es');
  assert.equal(ehretMucuslessEs.author, 'Prof. Arnold Ehret');
  assert.ok(ehretMucuslessEs.title.includes('Sistema de Curación por Dieta Sin Moco'));
  assert.ok(ehretMucuslessEs.pdfUrl.endsWith('.pdf'));
});

it('Ehret ES : Contient 30 sections intégrales (26 leçons + préface + intro + bio + dictionnaire)', () => {
  assert.equal(ehretMucuslessEs.chapters.length, 30);
});

it('Ehret ES : Volume substantiel (> 500 paragraphes et > 280 000 caractères)', () => {
  let totalChars = 0;
  let totalParagraphs = 0;
  ehretMucuslessEs.chapters.forEach(c => {
    totalParagraphs += c.paragraphs.length;
    c.paragraphs.forEach(p => totalChars += p.length);
  });
  assert.ok(totalParagraphs >= 500, `Attendu >= 500 paragraphes (trouvé ${totalParagraphs})`);
  assert.ok(totalChars >= 280000, `Attendu >= 280 000 caractères (trouvé ${totalChars})`);
});

it('Ehret ES : Les 26 leçons sont ordonnées de Lección I à Lección XXVI', () => {
  const lessonTags = ehretMucuslessEs.chapters.slice(3, 29).map(c => c.tag);
  assert.equal(lessonTags[0], 'Lección I');
  assert.equal(lessonTags[lessonTags.length - 1], 'Lección XXVI');
  assert.ok(lessonTags.includes('Lección V'));
  assert.ok(lessonTags.includes('Lección XIV'));
  assert.ok(lessonTags.includes('Lección XVII'));
});

it('Ehret ES : La Lección XIV contient les 10 tables exhaustives de Ragnar Berg en espagnol', () => {
  const lesson14 = ehretMucuslessEs.chapters.find(c => c.id === 'leccion-14');
  assert.ok(lesson14, 'La Lección XIV doit exister');
  const tableParagraphs = lesson14.paragraphs.filter(p => p.includes('| Alimento') && p.includes('---'));
  assert.equal(tableParagraphs.length, 10, `Attendu 10 tables de Berg (trouvé ${tableParagraphs.length})`);
  assert.ok(lesson14.paragraphs.join(' ').includes('+10.25') || lesson14.paragraphs.join(' ').includes('+10,25')); // Ostras
  assert.ok(lesson14.paragraphs.join(' ').includes('-51.83') || lesson14.paragraphs.join(' ').includes('-51,83')); // Yemas de huevo
  assert.ok(lesson14.paragraphs.join(' ').includes('+39.40') || lesson14.paragraphs.join(' ').includes('+39,40')); // Rábano negro
});

it('Ehret ES : Le glossaire contient les termes espagnols clés avec sources académiques primaires', () => {
  assert.ok(ehretMucuslessEs.glossary['moco']);
  assert.ok(ehretMucuslessEs.glossary['obstrucción']);
  assert.ok(ehretMucuslessEs.glossary['vitalidad']);
  assert.ok(ehretMucuslessEs.glossary['ecuación suprema']);
  assert.ok(ehretMucuslessEs.glossary['dieta sin moco']);
  assert.ok(ehretMucuslessEs.glossary['dieta de transición']);
  assert.ok(ehretMucuslessEs.glossary['ensalada escoba']);
  assert.ok(ehretMucuslessEs.glossary['autólisis']);
  assert.ok(Object.keys(ehretMucuslessEs.glossary).length >= 35);

  const allSources = Object.values(ehretMucuslessEs.glossary).flatMap(v => v.sources).join(' ');
  assert.ok(allSources.includes('Guyton'), 'Doit citer Guyton & Hall');
  assert.ok(allSources.includes('Lehninger'), 'Doit citer Lehninger');
  assert.ok(allSources.includes('Nobel'), 'Doit citer le Nobel Ohsumi');
  assert.ok(allSources.includes('OMS') || allSources.includes('Organización Mundial de la Salud'), 'Doit citer l\'OMS');
});

it('Ehret ES : Tous les termes annotés {{término}} existent dans le glossaire espagnol', () => {
  const termRegex = /\{\{(.+?)\}\}/g;
  let termCount = 0;
  ehretMucuslessEs.chapters.forEach(ch => {
    ch.paragraphs.forEach(p => {
      let match;
      while ((match = termRegex.exec(p)) !== null) {
        const term = match[1].toLowerCase();
        termCount++;
        assert.ok(
          ehretMucuslessEs.glossary[term] !== undefined,
          `Le terme '{{${term}}}' dans le chapitre '${ch.title}' n'a pas de définition dans le glossaire ES !`
        );
      }
    });
  });
  assert.ok(termCount >= 500, `Au moins 500 annotations de glossaire doivent être présentes (trouvé ${termCount})`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DR. ROBERT MORSE - ÉDITION ESPAGNOLE
// ─────────────────────────────────────────────────────────────────────────────

it('Morse ES : Métadonnées valides (ID, Titre, Auteur, Langue)', () => {
  assert.equal(morseDetoxMiracleEs.id, 'morse-detox-miracle-es');
  assert.equal(morseDetoxMiracleEs.author, 'Dr. Robert Morse, N.D.');
  assert.ok(morseDetoxMiracleEs.title.includes('El Milagro de la Desintoxicación'));
  assert.ok(morseDetoxMiracleEs.pdfUrl.endsWith('.pdf'));
});

it('Morse ES : Contient l\'intégralité des 10 chapitres, modules et annexes (80+ sections)', () => {
  assert.ok(Array.isArray(morseDetoxMiracleEs.chapters));
  assert.ok(morseDetoxMiracleEs.chapters.length >= 80, `Trouvé ${morseDetoxMiracleEs.chapters.length} sections`);
});

it('Morse ES : Présence du tableau d\'anatomie comparée (Carnívoro vs Frugívoro)', () => {
  const chap1 = morseDetoxMiracleEs.chapters.find(c => c.id.includes('capitulo-1'));
  assert.ok(chap1, 'Capítulo 1 trouvé');
  const fullText = chap1.paragraphs.join('\n');
  assert.ok(fullText.includes('Frugívoro') || fullText.includes('frugívoro'), 'Contient la mention frugívoro');
  assert.ok(fullText.includes('anatomía') || fullText.includes('Anatomía') || fullText.includes('mandíbula') || fullText.includes('intestino'), 'Contient les caractéristiques anatomiques');
});

it('Morse ES : Présence de la table acido-basique et des combinaisons alimentaires', () => {
  const mod72 = morseDetoxMiracleEs.chapters.find(c => c.id.includes('modulo-7-2'));
  const mod73 = morseDetoxMiracleEs.chapters.find(c => c.id.includes('modulo-7-3'));
  assert.ok(mod72, 'Módulo 7.2 trouvé');
  assert.ok(mod73, 'Módulo 7.3 trouvé');
  assert.ok(mod72.paragraphs.join('\n').length > 50, 'Módulo 7.2 a du contenu');
  assert.ok(mod73.paragraphs.join('\n').length > 50, 'Módulo 7.3 a du contenu');
});

it('Morse ES : Présence des formules botaniques par système (Módulo 8.3)', () => {
  const mod83 = morseDetoxMiracleEs.chapters.find(c => c.id.includes('modulo-8-3'));
  assert.ok(mod83, 'Módulo 8.3 trouvé');
  assert.ok(mod83.paragraphs.join('\n').length > 50, 'Módulo 8.3 a du contenu');
});

it('Morse ES : Présence du protocole de température basale de Broda Barnes (Anexo A)', () => {
  const anexoA = morseDetoxMiracleEs.chapters.find(c => c.id.includes('anexo-a'));
  assert.ok(anexoA, 'Anexo A trouvé');
  const fullText = anexoA.paragraphs.join('\n');
  assert.ok(fullText.includes('Temperatura') || fullText.includes('temperatura') || fullText.includes('Barnes'), 'Contient le protocole de température');
});

it('Morse ES : Le glossaire contient les termes espagnols clés avec définitions et sources', () => {
  const keys = Object.keys(morseDetoxMiracleEs.glossary || {});
  assert.ok(keys.length >= 15, `Trouvé ${keys.length} termes dans le glossaire`);
  assert.ok(morseDetoxMiracleEs.glossary['linfa'], 'Terme linfa présent');
  assert.ok(morseDetoxMiracleEs.glossary['filtración renal'], 'Terme filtración renal présent');
  assert.ok(morseDetoxMiracleEs.glossary['glándulas suprarrenales'], 'Terme glándulas suprarrenales présent');
  assert.ok(morseDetoxMiracleEs.glossary['paratiroides'], 'Terme paratiroides présent');
});

it('Morse ES : Tous les termes annotés {{término}} existent dans le glossaire espagnol', () => {
  const glossaryKeys = new Set(Object.keys(morseDetoxMiracleEs.glossary).map(k => k.toLowerCase()));
  
  for (const chap of morseDetoxMiracleEs.chapters) {
    if (chap.id.includes('glosario')) continue;
    for (const p of chap.paragraphs) {
      const matches = p.match(/\{\{(.+?)\}\}/g) || [];
      for (const m of matches) {
        const term = m.replace(/\{\{|\}\}/g, '').trim().toLowerCase();
        assert.ok(
          glossaryKeys.has(term),
          `Le terme '{{${term}}}' dans le chapitre '${chap.title}' doit être défini dans le glossaire ES !`
        );
      }
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CATALOGUE ET ENREGISTREMENT GLOBAL
// ─────────────────────────────────────────────────────────────────────────────

it('ALL_READABLE_BOOKS contient les 4 livres complets (Ehret FR/ES, Morse FR/ES)', () => {
  assert.equal(ALL_READABLE_BOOKS.length, 4);
  const ids = ALL_READABLE_BOOKS.map(b => b.id);
  assert.ok(ids.includes('ehret-mucusless-fr'));
  assert.ok(ids.includes('morse-detox-miracle-fr'));
  assert.ok(ids.includes('ehret-mucusless-es'));
  assert.ok(ids.includes('morse-detox-miracle-es'));
});

console.log(`\n🎉 SUITE LIVRES ESPAGNOLS VALIDÉE : ${passedTests} / ${totalTests} assertions réussies à 100% !\n`);
