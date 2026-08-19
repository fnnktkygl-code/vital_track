import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('/Users/richard/Developer/vital_track/web-app/src/raintree-full-database.json');
const herbs = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let md = `# MATERIA MEDICA PHYTOCHIMIQUE AMAZONIENNE & TROPICALE INTÉGRALE (BASE RAINTREE)
*Auteure de référence : Dr. Leslie Taylor, N.D. — Raintree Tropical Plant Database (rain-tree.com)*
*Base de données complète : ${herbs.length} plantes médicinales tropicales d'Amazonie et d'Amérique du Sud*
*Portails de recherche officiels :*
- Indications cliniques : https://www.rain-tree.com/indicate.htm
- Usages ethnomédicaux & tribaux : https://www.rain-tree.com/ethnic.htm
- Propriétés & actions phytochimiques : https://www.rain-tree.com/property-action.htm
- Méthodes de préparation : https://www.rain-tree.com/prepmethod.htm
- Articles & recherches cliniques : https://www.rain-tree.com/articles.htm
- Index alphabétique complet : https://www.rain-tree.com/plist.htm
- Index botanique complet : https://www.rain-tree.com/plistbot.htm

---

## 1. Introduction et Principes d'Herboristerie Néotropicale

La forêt tropicale amazonienne abrite la plus haute biodiversité phytochimique de la planète. Les végétaux du bassin amazonien ont développé un arsenal de métabolites secondaires de haute puissance :
- **Lignanes et Polyphénols Spécifiques** : Antiviraux hépatotropes, néphroprotecteurs et antioxydants.
- **Alcaloïdes Oxindoliques et Isoquinoléiques** : Modulateurs immunitaires, antispasmodiques musculaires et relaxants vasculaires.
- **Naphtoquinones et Diterpènes** : Fongicides systémiques, bactéricides et régulateurs du biofilm intestinal.
- **Tanins Condensés et Proanthocyanidines** : Astringents des muqueuses, protecteurs du glycocalyx et cicatrisants.

Dans l'approche vitaliste de VitalTrack, ces plantes sauvages sont employées comme des **catalyseurs émonctoriels** stimulant la filtration rénale, le drainage lymphatique, la vidange biliaire et le désencombrement des muqueuses.

---

## 2. Monographies Botaniques Exhaustives (${herbs.length} Plantes)

`;

for (let i = 0; i < herbs.length; i++) {
  const h = herbs[i];
  md += `---

### ${i + 1}. ${h.name} (*${h.latinName}*)
- **Famille Botanique** : ${h.family}
- **Noms Usuels / Synonymes** : ${(h.synonyms || []).join(', ')}
- **Parties Utilisées** : ${h.partsUsed}
- **Catégorie Thérapeutique & Tropisme** : ${h.category} (${h.tropismBadge?.label || ''})
- **Source Primaire Rain-Tree** : [${h.name} Monograph on Rain-Tree.com](${h.sourceUrl})
- **Principes Phytochimiques Actifs** :
${(h.activeCompounds || []).map(c => `  - ${c}`).join('\n')}
- **Indications & Cibles Thérapeutiques** :
${(h.indications || []).map(ind => `  - ${ind}`).join('\n')}
- **Mécanismes & Pharmacodynamie (Leslie Taylor)** :
${h.mechanisms}
- **Posologie & Modes d'Administration** :
  - **Dosage Standard** : ${h.posology?.standardDosage || '1 tasse d\'infusion 2 à 3 fois par jour ou 2-4 ml de teinture.'}
  - **Infusion / Décoction** : ${h.posology?.infusion || '1 cuillère à café à soupe par tasse, 10-15 min.'}
  - **Teinture** : ${h.posology?.tincture || '2 à 4 ml 2 fois par jour.'}
- **Contre-indications & Précautions** :
  - ${h.contraindications}
- **Note Vitaliste** : ${h.vitalistNote}

`;
}

const outputPath = path.resolve('/Users/richard/Developer/vital_track/knowledge/amazon-and-tropical-raintree-materia-medica.md');
fs.writeFileSync(outputPath, md, 'utf8');
console.log(`✅ Generated comprehensive Materia Medica with ${herbs.length} plants at ${outputPath}`);
