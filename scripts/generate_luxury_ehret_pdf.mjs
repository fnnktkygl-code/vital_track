import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';

const PUBLIC_PDF_PATH = '/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf';
const DIST_PDF_PATH = '/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\{\{(.+?)\}\}/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function generateLuxuryHtml() {
  const chapters = ehretMucuslessFr.chapters;
  const glossary = ehretMucuslessFr.glossary;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${esc(ehretMucuslessFr.title)} — Prof. Arnold Ehret</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=IBM+Plex+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      background: #ffffff !important;
      color: #1e293b;
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 10.5pt;
      line-height: 1.65;
      text-rendering: optimizeLegibility;
    }

    /* ══════════════════════════════════════════════════════════════════
       1. COUVERTURE ÉPURÉE, MODERNE & PLEINE LARGEUR (FOND BLANC PUR)
       ══════════════════════════════════════════════════════════════════ */
    .pdf-cover-page {
      page-break-before: avoid;
      page-break-after: always;
      width: 100%;
      min-height: 250mm;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 30mm 0 10mm;
      border-bottom: 2px solid #0f766e;
    }

    .cover-badge-top {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #0f766e;
      border: 1px solid #0f766e;
      padding: 6px 16px;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .cover-main-content {
      margin: auto 0;
      width: 100%;
      max-width: 90%;
    }

    .cover-author-eyebrow {
      font-family: 'Outfit', sans-serif;
      font-size: 13pt;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 12px;
    }

    .cover-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 30pt;
      font-weight: 800;
      line-height: 1.18;
      color: #0f172a;
      margin: 0 0 18px;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-family: 'Source Serif 4', serif;
      font-size: 12pt;
      font-style: italic;
      color: #475569;
      line-height: 1.5;
      margin: 0 auto 30px;
      max-width: 85%;
    }

    .cover-formula-box {
      display: inline-block;
      background: #f8fafc;
      border: 1.5px solid #0f766e;
      border-radius: 8px;
      padding: 12px 30px;
      margin: 10px 0 20px;
    }

    .cover-formula-math {
      font-family: 'Fraunces', serif;
      font-size: 22pt;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: 2px;
    }

    .cover-formula-label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 4px;
    }

    .cover-footer {
      width: 100%;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 20px;
    }

    .cover-footer-author {
      font-family: 'Outfit', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .cover-footer-meta {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8pt;
      color: #64748b;
      letter-spacing: 1px;
    }

    /* ══════════════════════════════════════════════════════════════════
       2. NOTICE HISTORIQUE & COLOPHON
       ══════════════════════════════════════════════════════════════════ */
    .pdf-colophon-page {
      page-break-before: always;
      page-break-after: always;
      padding: 15mm 0;
      width: 100%;
    }

    .colophon-header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .colophon-title {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .colophon-author {
      font-family: 'Outfit', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0f766e;
    }

    .colophon-quote-box {
      background: #f8fafc;
      border-left: 4px solid #0f766e;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 0 6px 6px 0;
      font-style: italic;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #334155;
    }

    .colophon-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
      font-family: 'Outfit', sans-serif;
      font-size: 9pt;
    }

    .colophon-table td {
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .colophon-table .col-label {
      font-weight: 700;
      color: #475569;
      width: 32%;
    }

    .colophon-table .col-val {
      color: #0f172a;
    }

    /* ══════════════════════════════════════════════════════════════════
       3. SOMMAIRE GÉNÉRAL (TABLE DES MATIÈRES ROBUSTE)
       ══════════════════════════════════════════════════════════════════ */
    .pdf-toc-page {
      page-break-before: always;
      page-break-after: always;
      padding: 10mm 0;
      width: 100%;
    }

    .toc-header-title {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 20px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 10px;
    }

    .toc-table {
      width: 100%;
      border-collapse: collapse;
    }

    .toc-table tr {
      page-break-inside: avoid;
    }

    .toc-table td {
      padding: 7px 0;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: baseline;
    }

    .toc-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f766e;
      width: 105px;
      flex-shrink: 0;
    }

    .toc-name {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      font-weight: 600;
      color: #1e293b;
      padding-right: 12px;
    }

    .toc-num {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5pt;
      color: #94a3b8;
      text-align: right;
      width: 36px;
    }

    /* ══════════════════════════════════════════════════════════════════
       4. CHAPITRES & LEÇONS DU LIVRE
       ══════════════════════════════════════════════════════════════════ */
    .pdf-chapter {
      page-break-before: always;
      width: 100%;
      margin: 0;
      padding-top: 6mm;
    }

    .chapter-top-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #0f766e;
      margin-bottom: 6px;
    }

    .chapter-main-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 18pt;
      font-weight: 800;
      line-height: 1.25;
      color: #0f172a;
      margin: 0 0 16px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 12px;
    }

    .pdf-paragraph {
      margin: 0 0 14px;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1e293b;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      orphans: 3;
      widows: 3;
    }

    /* Lettrine Haute Lisibilité (Drop Cap) */
    .pdf-paragraph.has-dropcap::first-letter {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 3.4rem;
      line-height: 0.82;
      float: left;
      margin-right: 10px;
      margin-bottom: -4px;
      margin-top: 2px;
      font-weight: 800;
      color: #0f766e;
    }

    /* Encadré Formule $V = P - O$ pour la leçon V */
    .pdf-formula-card {
      page-break-inside: avoid;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
      text-align: center;
    }

    .formula-math-text {
      font-family: 'Fraunces', serif;
      font-size: 18pt;
      font-weight: 800;
      color: #0f766e;
      margin-bottom: 4px;
    }

    .formula-desc-text {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      color: #334155;
    }

    /* ══════════════════════════════════════════════════════════════════
       5. GLOSSAIRE VITALISTE
       ══════════════════════════════════════════════════════════════════ */
    .pdf-glossary-section {
      page-break-before: always;
      width: 100%;
      padding-top: 6mm;
    }

    .glossary-header-title {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 20px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 10px;
    }

    .glossary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .glossary-box {
      page-break-inside: avoid;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0f766e;
      border-radius: 4px;
      padding: 12px 14px;
    }

    .glossary-term-heading {
      font-family: 'Outfit', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: #0f766e;
      margin-bottom: 4px;
      text-transform: capitalize;
    }

    .glossary-term-body {
      font-size: 9pt;
      line-height: 1.45;
      color: #334155;
      margin: 0;
    }
  </style>
</head>
<body>

  <!-- 1. COUVERTURE ÉPURÉE MODERNE -->
  <div class="pdf-cover-page">
    <div class="cover-badge-top">
      CHEF-D'ŒUVRE FONDATEUR · ÉDITION INTÉGRALE FRANÇAISE (1922)
    </div>

    <div class="cover-main-content">
      <div class="cover-author-eyebrow">Professeur Arnold Ehret</div>
      <h1 class="cover-title">Système de Guérison du Régime Sans Mucus</h1>
      <p class="cover-subtitle">
        Méthode scientifique et naturelle pour régénérer le corps, dissoudre l'obstruction interne et conquérir une vitalité surhumaine.
      </p>

      <div class="cover-formula-box">
        <div class="cover-formula-math">V = P - O</div>
        <div class="cover-formula-label">L'Équation Suprême de la Vitalité Humaine</div>
      </div>
    </div>

    <div class="cover-footer">
      <div class="cover-footer-author">Professeur Arnold Ehret (1866–1922)</div>
      <div class="cover-footer-meta">Édition Complète & Intégrale · VitalTrack Academy</div>
    </div>
  </div>

  <!-- 2. NOTICE HISTORIQUE & COLOPHON -->
  <div class="pdf-colophon-page">
    <div class="colophon-header">
      <h1 class="colophon-title">${esc(ehretMucuslessFr.title)}</h1>
      <div class="colophon-author">Par le Professeur Arnold Ehret</div>
    </div>

    <div class="colophon-quote-box">
      « La maladie est un effort de la Nature pour éliminer les déchets, les glaires et les toxines... Ce cours complet enseigne pour la première fois dans l'histoire humaine comment nettoyer méthodiquement le temple cellulaire sans violenter l'organisme. »
      <br><br>
      <strong style="font-family:'Outfit',sans-serif; font-size:9pt; text-transform:uppercase; color:#0f766e;">— Prof. Arnold Ehret (1922)</strong>
    </div>

    <table class="colophon-table">
      <tr>
        <td class="col-label">Auteur Original :</td>
        <td class="col-val">Professeur Arnold Ehret (1866–1922)</td>
      </tr>
      <tr>
        <td class="col-label">Publication Originale :</td>
        <td class="col-val">Los Angeles, Californie, 1922</td>
      </tr>
      <tr>
        <td class="col-label">Traduction & Édition :</td>
        <td class="col-val">VitalTrack Academy (Traduction Intégrale Conforme au Texte Original)</td>
      </tr>
      <tr>
        <td class="col-label">Structure de l'Ouvrage :</td>
        <td class="col-val">Préface de Fred S. Hirsch, Biographie & 26 Leçons Magistrales</td>
      </tr>
      <tr>
        <td class="col-label">Intégrité Textuelle :</td>
        <td class="col-val">29 Sections Complètes · 100% Non Abrégé</td>
      </tr>
    </table>
  </div>

  <!-- 3. SOMMAIRE GÉNÉRAL -->
  <div class="pdf-toc-page">
    <h2 class="toc-header-title">Sommaire Général</h2>
    <table class="toc-table">
      ${chapters.map((c, i) => `
        <tr>
          <td class="toc-tag">${esc(c.tag)}</td>
          <td class="toc-name">${esc(c.title)}</td>
          <td class="toc-num">#${i + 1}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  <!-- 4. LES 29 CHAPITRES ET 26 LEÇONS COMPLÈTES -->
  ${chapters.map((c, idx) => `
    <div class="pdf-chapter">
      <div class="chapter-top-tag">${esc(c.tag)} · Section #${idx + 1}</div>
      <h2 class="chapter-main-title">${esc(c.title)}</h2>

      ${c.tag === 'Leçon V' ? `
        <div class="pdf-formula-card">
          <div class="formula-math-text">V = P - O</div>
          <div class="formula-desc-text"><strong>Vitalité = Puissance - Obstruction</strong><br>La force vitale n'augmente pas en ingérant plus de nourriture, mais en éliminant les frottements et l'encombrement interne.</div>
        </div>
      ` : ''}

      ${c.paragraphs.map((p, pIdx) => `
        <p class="pdf-paragraph ${pIdx === 0 ? 'has-dropcap' : ''}">
          ${cleanMarkdown(p)}
        </p>
      `).join('')}
    </div>
  `).join('')}

  <!-- 5. GLOSSAIRE VITALISTE -->
  <div class="pdf-glossary-section">
    <h2 class="glossary-header-title">Glossaire Vitaliste & Définitions Clés</h2>
    <div class="glossary-grid">
      ${Object.entries(glossary).map(([term, def]) => `
        <div class="glossary-box">
          <div class="glossary-term-heading">${esc(term)}</div>
          <p class="glossary-term-body">${esc(def)}</p>
        </div>
      `).join('')}
    </div>
  </div>

</body>
</html>`;
}

export async function generateLuxuryPdf() {
  console.log('🎨 Génération du PDF Moderne Pure White pour Arnold Ehret...');
  const htmlContent = generateLuxuryHtml();

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    console.log('📄 Rendu du PDF via Puppeteer...');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        bottom: '18mm',
        left: '16mm',
        right: '16mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:#94a3b8; width:100%; display:flex; justify-content:space-between; padding:0 16mm; text-transform:uppercase; letter-spacing:0.5px;">
          <span>Prof. Arnold Ehret — Système de Guérison du Régime Sans Mucus</span>
          <span>VitalTrack Academy</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:#94a3b8; width:100%; display:flex; justify-content:space-between; padding:0 16mm;">
          <span>Édition Intégrale Française (1922)</span>
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `
    });

    fs.writeFileSync(PUBLIC_PDF_PATH, pdfBuffer);
    console.log(`✅ PDF sauvegardé dans : ${PUBLIC_PDF_PATH} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    if (fs.existsSync(path.dirname(DIST_PDF_PATH))) {
      fs.writeFileSync(DIST_PDF_PATH, pdfBuffer);
      console.log(`✅ PDF copié dans dist : ${DIST_PDF_PATH}`);
    }

  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateLuxuryPdf().catch(err => {
    console.error('❌ Erreur lors de la génération du PDF :', err);
    process.exit(1);
  });
}
