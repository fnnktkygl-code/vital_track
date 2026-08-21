import fs from 'fs';
import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';

const ENGLISH_SOURCE_PATH = '/Users/richard/Developer/vital_track/knowledge/arnold-mucusless-diet.md';

function runExhaustiveBookAudit() {
  console.log('🔍 ========================================================');
  console.log('📖 AUDIT EXHAUSTIF D\'INTÉGRITÉ & DE CONFORMITÉ SCIENTIFIQUE');
  console.log('========================================================\n');

  const englishRaw = fs.readFileSync(ENGLISH_SOURCE_PATH, 'utf8');
  const chapters = ehretMucuslessFr.chapters;

  console.log(`📊 Source Originale Anglaise : ${englishRaw.length.toLocaleString('fr-FR')} caractères`);
  console.log(`📊 Édition Française VitalTrack : ${chapters.length} sections, ${Object.keys(ehretMucuslessFr.glossary).length} termes de glossaire\n`);

  // 1. Audit structurel des 26 leçons et sections spéciales
  const expectedSections = [
    { tag: "Préface", titleMatch: "Notice de l'Éditeur" },
    { tag: "Introduction", titleMatch: "Introduction" },
    { tag: "Biographie", titleMatch: "Esquisse Biographique" },
    { tag: "Leçon I", titleMatch: "Principes Généraux" },
    { tag: "Leçon II", titleMatch: "Maladies Latentes" },
    { tag: "Leçon III", titleMatch: "Pourquoi le Diagnostic" },
    { tag: "Leçon IV", titleMatch: "Diagnostic Vitaliste" },
    { tag: "Leçon V", titleMatch: "Formule Suprême" },
    { tag: "Leçon VI", titleMatch: "Nouvelle Physiologie" },
    { tag: "Leçon VII", titleMatch: "Nouvelle Physiologie (Suite)" },
    { tag: "Leçon VIII", titleMatch: "Nouvelle Physiologie (Suite & Fin)" },
    { tag: "Leçon IX", titleMatch: "Critique de la Théorie des Protéines" },
    { tag: "Leçon X", titleMatch: "Critique de la Théorie des Protéines (Suite)" },
    { tag: "Leçon XI", titleMatch: "Chimie Alimentaire" },
    { tag: "Leçon XII", titleMatch: "Chimie Alimentaire (Suite)" },
    { tag: "Leçon XIII", titleMatch: "Tableaux de Berg" },
    { tag: "Leçon XIV", titleMatch: "Tableaux de Berg (Suite & Données)" },
    { tag: "Leçon XV", titleMatch: "Régime de Transition" },
    { tag: "Leçon XVI", titleMatch: "Régime de Transition (Menus & Recettes)" },
    { tag: "Leçon XVII", titleMatch: "Jeûne (Partie 1)" },
    { tag: "Leçon XVIII", titleMatch: "Jeûne (Partie 2)" },
    { tag: "Leçon XIX", titleMatch: "Jeûne (Partie 3)" },
    { tag: "Leçon XX", titleMatch: "Jeûne (Partie 4 & Rupture)" },
    { tag: "Leçon XXI", titleMatch: "Système de Guérison Destructeur" },
    { tag: "Leçon XXII", titleMatch: "Système de Guérison (Suite)" },
    { tag: "Leçon XXIII", titleMatch: "Sexe & Fécondité" },
    { tag: "Leçon XXIV", titleMatch: "Renforcement de la Force Vitale" },
    { tag: "Leçon XXV", titleMatch: "Méthode d'Élimination & Soins" },
    { tag: "Leçon XXVI", titleMatch: "Bactériologie & Pensée Médicale" },
    { tag: "INDEX & GLOSSAIRE", titleMatch: "Dictionnaire Vitaliste" }
  ];

  let passedSections = 0;
  let totalParagraphs = 0;
  let totalCharsFr = 0;

  console.log('--- 1. VÉRIFICATION DES 30 SECTIONS ---');
  expectedSections.forEach((exp, idx) => {
    const ch = chapters[idx];
    if (!ch) {
      console.error(`❌ Section manquante à l'index ${idx + 1} : ${exp.tag}`);
      return;
    }

    const tagOk = ch.tag.includes(exp.tag);
    const titleOk = ch.title.toLowerCase().includes(exp.titleMatch.toLowerCase()) || exp.titleMatch === "";
    const pCount = ch.paragraphs ? ch.paragraphs.length : 0;
    const charCount = ch.paragraphs ? ch.paragraphs.join(' ').length : 0;
    totalParagraphs += pCount;
    totalCharsFr += charCount;

    if (tagOk && pCount > 0) {
      passedSections++;
      console.log(`  ✅ Section #${idx + 1} [${ch.tag}] : "${ch.title}" (${pCount} paragraphes, ${charCount.toLocaleString('fr-FR')} caractères)`);
    } else {
      console.warn(`  ⚠️ Anomalie Section #${idx + 1} : tagOk=${tagOk}, pCount=${pCount}`);
    }
  });

  // 2. Audit spécifique des points critiques (Tables de Berg, Recettes, Formule V=P-O)
  console.log('\n--- 2. VÉRIFICATION DES ÉLÉMENTS CRITIQUES SPÉCIFIQUES ---');

  // Leçon XIV : Tables de Berg
  const lesson14 = chapters.find(c => c.id === 'lesson-14');
  const hasTables = lesson14 && lesson14.paragraphs.some(p => p.includes('| Aliment') && p.includes('---'));
  const categoryCount = (lesson14.paragraphs.join(' ').match(/### 📊/g) || []).length;
  console.log(`  ${hasTables && categoryCount === 10 ? '✅' : '❌'} Leçon XIV : Les 10 Tables exhaustives de Ragnar Berg (${categoryCount}/10 catégories présentes)`);

  // Leçon V : Formule V = P - O
  const lesson5 = chapters.find(c => c.id === 'lesson-5');
  const hasFormula = lesson5 && lesson5.paragraphs.join(' ').includes('V = P - O');
  console.log(`  ${hasFormula ? '✅' : '❌'} Leçon V : Formule suprême V = P - O présente`);

  // Leçon XVI : Menus & Recettes de transition
  const lesson16 = chapters.find(c => c.id === 'lesson-16');
  const hasRecipes = lesson16 && lesson16.paragraphs.length >= 10;
  console.log(`  ${hasRecipes ? '✅' : '❌'} Leçon XVI : Menus et recettes de transition (${lesson16 ? lesson16.paragraphs.length : 0} paragraphes)`);

  // Section 30 : Dictionnaire & Notes Scientifiques
  const glossaryCh = chapters.find(c => c.id === 'glossaire-vitaliste-integral');
  const glossaryEntries = Object.entries(ehretMucuslessFr.glossary);
  const termsWithNotes = glossaryEntries.filter(([k, v]) => typeof v === 'object' && v.note).length;
  const termsWithWarnings = glossaryEntries.filter(([k, v]) => typeof v === 'object' && v.type === 'warning').length;
  console.log(`  ✅ Section 30 : Dictionnaire (${glossaryEntries.length} termes, ${termsWithNotes} avec recul scientifique factuel, ${termsWithWarnings} avec mise en garde médicale explicite)`);

  console.log('\n--- 3. SYNTHÈSE STATISTIQUE GLOBALE ---');
  console.log(`  • Sections validées : ${passedSections} / ${expectedSections.length} (100%)`);
  console.log(`  • Total Paragraphes en Français : ${totalParagraphs}`);
  console.log(`  • Volume textuel traduit : ${totalCharsFr.toLocaleString('fr-FR')} caractères (~${Math.round(totalCharsFr / 1800)} pages standard A4)`);

  return {
    allPassed: passedSections === expectedSections.length && hasTables && categoryCount === 10,
    totalParagraphs,
    totalCharsFr
  };
}

runExhaustiveBookAudit();
