import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

console.log('🚀 Assembling Unabridged French Edition of Arnold Ehret...');

const outputPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');
const distPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');

fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
fs.mkdirSync(path.dirname(distPdfPath), { recursive: true });

// Let's write the HTML builder
let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Système de Guérison du Régime Sans Mucus — Prof. Arnold Ehret (Édition Intégrale)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        font-weight: 600;
        color: #64748b;
      }
      @bottom-left {
        content: "Arnold Ehret · Système de Guérison du Régime Sans Mucus";
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 10pt;
      line-height: 1.68;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      page-break-before: avoid;
      page-break-after: always;
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: radial-gradient(circle at 50% 30%, #064e3b 0%, #022c22 60%, #09121a 100%);
      color: #f8fafc;
      padding: 40mm 20mm 25mm 20mm;
      border-radius: 8px;
    }

    .cover-badge {
      display: inline-block;
      border: 1px solid rgba(52, 211, 153, 0.5);
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      padding: 6px 18px;
      border-radius: 30px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-family: 'Cinzel', serif;
      font-size: 27pt;
      font-weight: 800;
      line-height: 1.25;
      color: #ffffff;
      margin: 0 0 16px 0;
      letter-spacing: 0.5px;
    }

    .cover-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 12pt;
      font-weight: 300;
      color: #a7f3d0;
      max-width: 520px;
      line-height: 1.55;
      margin: 0 auto 30px auto;
    }

    .cover-formula-box {
      background: rgba(15, 23, 42, 0.7);
      border: 1.5px solid rgba(52, 211, 153, 0.4);
      padding: 18px 32px;
      border-radius: 16px;
      margin: 20px 0;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
    }

    .cover-formula {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22pt;
      font-weight: 700;
      color: #34d399;
      letter-spacing: 4px;
    }

    .cover-formula-caption {
      font-size: 8.5pt;
      color: #cbd5e1;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .cover-author {
      font-family: 'Cinzel', serif;
      font-size: 16pt;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1px;
    }

    .cover-author-desc {
      font-size: 9.5pt;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* Chapter Formatting */
    .chapter {
      page-break-before: always;
      padding-top: 8mm;
    }

    .chapter-header {
      margin-bottom: 22px;
      border-bottom: 2px solid #059669;
      padding-bottom: 12px;
    }

    .chapter-meta {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #059669;
      margin-bottom: 6px;
    }

    h1 {
      font-family: 'Cinzel', serif;
      font-size: 18pt;
      font-weight: 800;
      color: #064e3b;
      margin: 0;
      line-height: 1.3;
    }

    h2 {
      font-family: 'Cinzel', serif;
      font-size: 13pt;
      font-weight: 700;
      color: #047857;
      margin-top: 24px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h3 {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 14px 0;
      text-align: justify;
      text-justify: inter-word;
    }

    blockquote {
      margin: 18px 0;
      padding: 14px 20px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 0 10px 10px 0;
      font-style: italic;
      color: #065f46;
      page-break-inside: avoid;
    }

    .callout-box {
      margin: 18px 0;
      padding: 14px 18px;
      border-radius: 10px;
      page-break-inside: avoid;
      font-size: 9.5pt;
      line-height: 1.55;
    }

    .callout-wisdom {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #10b981;
      color: #065f46;
    }

    .callout-important {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .callout-formula {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      margin: 22px 0;
      page-break-inside: avoid;
    }

    .callout-formula .math {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18pt;
      color: #34d399;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .infographic-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin: 22px 0;
      page-break-inside: avoid;
    }

    .infographic-title {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #064e3b;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background: #064e3b;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    ul, ol {
      margin: 0 0 14px 0;
      padding-left: 24px;
    }

    li {
      margin-bottom: 6px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px dotted #cbd5e1;
      padding: 4px 0;
      font-size: 9.5pt;
    }

    .toc-num {
      font-weight: 700;
      color: #059669;
      width: 85px;
      flex-shrink: 0;
    }

    .toc-title {
      flex: 1;
      color: #1e293b;
    }

    .badge-mucusless {
      display: inline-block;
      padding: 2px 8px;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      border-radius: 12px;
      font-size: 7.5pt;
    }

    .badge-mucus {
      display: inline-block;
      padding: 2px 8px;
      background: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      border-radius: 12px;
      font-size: 7.5pt;
    }

    .badge-transition {
      display: inline-block;
      padding: 2px 8px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
      border-radius: 12px;
      font-size: 7.5pt;
    }
  </style>
</head>
<body>

  <!-- COUVERTURE -->
  <div class="cover-page">
    <div style="width:100%;">
      <span class="cover-badge">Chef-d'Œuvre Fondateur · Édition Complète &amp; Intégrale</span>
      <h1 class="cover-title">Système de Guérison<br>du Régime Sans Mucus</h1>
      <p class="cover-subtitle">Méthode scientifique et naturelle pour régénérer le corps, dissoudre l'obstruction interne et conquérir une vitalité surhumaine.</p>
    </div>

    <div class="cover-formula-box">
      <div class="cover-formula">V = P - O</div>
      <div class="cover-formula-caption">L'Équation Suprême de la Vitalité Humaine</div>
    </div>

    <div style="width:100%;">
      <div class="cover-author">Professeur Arnold Ehret</div>
      <div class="cover-author-desc">Pionnier mondial du Vitalisme et de la Régénération Cellulaire (1866–1922)</div>
      <div style="font-size:8.5pt; color:#64748b; margin-top:20px;">Traduction Intégrale &amp; Conforme au Texte Original Anglais (1922) · 26 Leçons &amp; Traités Magistraux · VitalTrack Academy</div>
    </div>
  </div>

  <!-- TABLE DES MATIÈRES -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-meta">Sommaire Général</div>
      <h1>Table des Matières</h1>
    </div>
    <p style="font-style:italic; color:#64748b; margin-bottom:20px;">L'enseignement complet d'Arnold Ehret comprenant l'ensemble des 26 leçons magistrales, les traités biographiques et les tables nutritionnelles.</p>

    <div style="display:grid; grid-template-columns:1fr; gap:4px;">
      <div class="toc-item"><span class="toc-num">Préface</span><span class="toc-title">Notice de l'Éditeur &amp; Hommage Historique (Fred S. Hirsch)</span></div>
      <div class="toc-item"><span class="toc-num">Introduction</span><span class="toc-title">Introduction par F. S. Hirsch</span></div>
      <div class="toc-item"><span class="toc-num">Biographie</span><span class="toc-title">Esquisse Biographique Détaillée du Professeur Arnold Ehret</span></div>
      <div class="toc-item"><span class="toc-num">Leçon I</span><span class="toc-title">Principes Généraux d'Introduction &amp; Nature de la Maladie</span></div>
      <div class="toc-item"><span class="toc-num">Leçon II</span><span class="toc-title">Maladies Latentes, Aiguës et Chroniques — Le Mystère enfin Élucidé</span></div>
      <div class="toc-item"><span class="toc-num">Leçon III</span><span class="toc-title">Pourquoi le Diagnostic Médical Traditionnel Échoue</span></div>
      <div class="toc-item"><span class="toc-num">Leçon IV</span><span class="toc-title">Le Diagnostic Vitaliste Réel &amp; Le Miroir Magique</span></div>
      <div class="toc-item"><span class="toc-num">Leçon V</span><span class="toc-title">La Formule Fondamentale de la Vie : V = P - O</span></div>
      <div class="toc-item"><span class="toc-num">Leçon VI</span><span class="toc-title">La Nouvelle Physiologie (Partie I) : Le Moteur Humain à Pression d'Air</span></div>
      <div class="toc-item"><span class="toc-num">Leçon VII</span><span class="toc-title">La Nouvelle Physiologie (Partie II) : L'Éradication du Dogme des Protéines</span></div>
      <div class="toc-item"><span class="toc-num">Leçon VIII</span><span class="toc-title">La Nouvelle Physiologie (Partie III) : La Formation du Sang Naturel</span></div>
      <div class="toc-item"><span class="toc-num">Leçon IX</span><span class="toc-title">La Nouvelle Physiologie (Partie IV) : L'Erreur Fondamentale du Métabolisme</span></div>
      <div class="toc-item"><span class="toc-num">Leçon X</span><span class="toc-title">Critique Sans Concession de Tous les Autres Systèmes Thérapeutiques</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XI</span><span class="toc-title">La Confusion en Diététique (Partie I) : L'Illusion de l'Énergie Immédiate</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XII</span><span class="toc-title">La Confusion en Diététique (Partie II) : Le Danger du Lait et des Féculents</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XIII</span><span class="toc-title">La Confusion en Diététique (Partie III) : Viandes et Aliments Carnés</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XIV</span><span class="toc-title">Les Tables Scientifiques de Ragnar Berg (Acides vs Bases)</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XV</span><span class="toc-title">Le Régime de Transition (Partie I) : Les Règles d'Or de la Gradualité</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XVI</span><span class="toc-title">Le Régime de Transition (Partie II) : Menus de Nettoyage et Balais Intestinaux</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XVII</span><span class="toc-title">Recettes Pratiques de Transition &amp; Menus Végétariens Spéciaux</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XVIII</span><span class="toc-title">Le Jeûne Rationnel (Partie I) : Définition et Règles Fondamentales</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XIX</span><span class="toc-title">Le Jeûne Rationnel (Partie II) : Conduite et Hygiène du Jeûne</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XX</span><span class="toc-title">Le Jeûne Rationnel (Partie III) : L'Art Suprême de la Rupture du Jeûne</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXI</span><span class="toc-title">Le Jeûne Supérieur (Partie IV) : Les Jeûnes Courts Répétés</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXII</span><span class="toc-title">L'Alimentation de la Civilisation &amp; la Nourriture Originelle de l'Homme</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXIII</span><span class="toc-title">Sexualité, Pureté du Sang et Conservation de l'Énergie Vitale</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXIV</span><span class="toc-title">Maternité Sans Douleur &amp; Éducation des Enfants Sans Mucus</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXV</span><span class="toc-title">Accélération de l'Élimination par les Facteurs Naturels (Soleil, Air, Exercice)</span></div>
      <div class="toc-item"><span class="toc-num">Leçon XXVI</span><span class="toc-title">Message Fraternel aux Ehrétistes &amp; Vision d'Avenir</span></div>
    </div>
  </div>
`;

// Now let's append all unabridged chapters
console.log('Appending unabridged text for all 26 chapters...');
