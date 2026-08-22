/**
 * audit_all_tables_and_diagrams_in_pdf.mjs
 * 
 * Scanne l'ensemble des 387 pages du PDF pour inventorier tous les tableaux,
 * organigrammes, diagrammes de flux et schémas du livre du Dr. Robert Morse.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_morse_pages.json'), 'utf8'));

console.log(`🔍 Audit exhaustif des tableaux et diagrammes sur ${pages.length} pages...`);

const findings = [];

pages.forEach(p => {
  const text = p.text;
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Recherche de mots-clés de tableaux, flux, schémas, hormones, pourcentages, colonnes
  const hasTableKeyword = /(Tableau|Table|Classification|Comparaison|Organigramme|Schéma|Diagramme|Hormone|Glande|Immunoglobuline|Anticorps|Vitamine|Minéral|Aliment|Acidose|Alcalin|PRAL|Formule|Posologie|Recommandation|Définition|Préfixe|Suffixe)/i.test(text);
  const hasPercentagesOrUnits = /(\d+\s*\%|\d+\s*mg|\d+\s*µg|\d+\s*Å|\bpH\b|\bIgG\b|\bIgA\b|\bIgM\b|\bTSH\b|\bACTH\b|\bPTH\b)/.test(text);
  const hasDenseColumns = lines.some(l => /^[A-ZÉÈÊËÀÂÎÏÔÙÛÇ\s]{3,25}\s+[A-ZÉÈÊËÀÂÎÏÔÙÛÇa-z0-9\-\.\,]{3,}/.test(l));

  if (hasTableKeyword && (hasPercentagesOrUnits || hasDenseColumns || text.includes('---') || text.includes('|') || text.includes('—'))) {
    findings.push({
      page: p.page,
      snippet: lines.slice(0, 8).join(' | ')
    });
  }
});

console.log(`Total pages contenant des données tabulaires/diagrammes : ${findings.length}`);
findings.slice(0, 40).forEach(f => console.log(`Page ${f.page}: ${f.snippet.slice(0, 120)}...`));
