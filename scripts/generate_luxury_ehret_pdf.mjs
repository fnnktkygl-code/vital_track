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
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=IBM+Plex+Mono:wght@400;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 10.5pt;
      line-height: 1.58;
      color: #261f18;
      background: #faf7f0;
      text-rendering: optimizeLegibility;
    }

    /* ══════════════════════════════════════════════════════════════════
       1. PAGE DE COUVERTURE LUXE (Plein écran A4)
       ══════════════════════════════════════════════════════════════════ */
    .pdf-cover-page {
      page-break-before: avoid;
      page-break-after: always;
      height: 100vh;
      min-height: 270mm;
      background: #0b0f17;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 24mm 16mm;
      position: relative;
      border: 10px solid #16202e;
      box-shadow: inset 0 0 0 2px #c27803;
    }

    .cover-ornament-top {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #e59b22;
      border-bottom: 1px solid rgba(229, 155, 34, 0.4);
      padding-bottom: 8px;
      width: 80%;
    }

    .cover-title-group {
      margin: auto 0;
      max-width: 90%;
    }

    .cover-eyebrow {
      font-family: 'Outfit', sans-serif;
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    .cover-main-title {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin: 0 0 16px;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-family: 'Source Serif 4', Georgia, serif;
      font-size: 13pt;
      font-style: italic;
      color: #cbd5e1;
      line-height: 1.4;
      margin: 0 0 24px;
    }

    .cover-formula-badge {
      display: inline-block;
      background: rgba(229, 155, 34, 0.12);
      border: 1.5px solid #e59b22;
      padding: 10px 24px;
      border-radius: 8px;
      margin-top: 10px;
    }

    .cover-formula-math {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #fbbf24;
      letter-spacing: 2px;
    }

    .cover-formula-text {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #cbd5e1;
      margin-top: 4px;
    }

    .cover-author-group {
      width: 100%;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 16px;
    }

    .cover-author-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 17pt;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px;
    }

    .cover-author-title {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    .cover-publisher-seal {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 7.5pt;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #e59b22;
      margin-top: 12px;
    }

    /* ══════════════════════════════════════════════════════════════════
       2. PAGE DE TITRE & COLOPHON
       ══════════════════════════════════════════════════════════════════ */
    .pdf-colophon-page {
      page-break-before: always;
      page-break-after: always;
      padding: 20mm 0;
      min-height: 240mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .colophon-header {
      text-align: center;
      border-bottom: 2px solid #e5dccb;
      padding-bottom: 24px;
    }

    .colophon-book-title {
      font-family: 'Fraunces', serif;
      font-size: 22pt;
      font-weight: 800;
      color: #1f160e;
      margin: 0 0 8px;
    }

    .colophon-author {
      font-family: 'Outfit', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #b45309;
    }

    .colophon-quote-box {
      background: #f4ecd8;
      border-left: 4px solid #b45309;
      padding: 16px 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      font-size: 11pt;
      line-height: 1.6;
    }

    .colophon-meta-table {
      width: 100%;
      font-family: 'Outfit', sans-serif;
      font-size: 9pt;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .colophon-meta-table td {
      padding: 6px 0;
      border-bottom: 1px dotted #e5dccb;
    }

    .colophon-meta-label {
      font-weight: 700;
      color: #7c684d;
      width: 35%;
    }

    /* ══════════════════════════════════════════════════════════════════
       3. SOMMAIRE GÉNÉRAL (TABLE DES MATIÈRES)
       ══════════════════════════════════════════════════════════════════ */
    .pdf-toc-page {
      page-break-before: always;
      page-break-after: always;
      padding: 10mm 0;
    }

    .toc-title {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #1f160e;
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 2px solid #b45309;
      padding-bottom: 10px;
    }

    .toc-grid {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9.5pt;
      border-bottom: 1px dotted rgba(180, 83, 9, 0.25);
      padding-bottom: 3px;
    }

    .toc-item-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
      font-size: 8.5pt;
      color: #b45309;
      width: 90px;
      flex-shrink: 0;
    }

    .toc-item-title {
      flex: 1;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      color: #2a241e;
      padding-right: 12px;
    }

    .toc-item-idx {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5pt;
      color: #7c684d;
      flex-shrink: 0;
    }

    /* ══════════════════════════════════════════════════════════════════
       4. CHAPITRES ET LEÇONS
       ══════════════════════════════════════════════════════════════════ */
    .pdf-chapter {
      page-break-before: always;
      margin-top: 10mm;
      padding-top: 10mm;
    }

    .chapter-header {
      margin-bottom: 22px;
      border-bottom: 1.5px solid #e5dccb;
      padding-bottom: 14px;
    }

    .chapter-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #b45309;
      margin-bottom: 6px;
    }

    .chapter-title {
      font-family: 'Fraunces', serif;
      font-size: 19pt;
      font-weight: 800;
      line-height: 1.25;
      color: #1a140e;
      margin: 0;
    }

    .pdf-paragraph {
      margin: 0 0 14px;
      text-align: justify;
      text-justify: inter-word;
      hyphens: auto;
      orphans: 3;
      widows: 3;
    }

    /* Lettrine Haute Couture (Drop Cap) */
    .pdf-paragraph.has-dropcap::first-letter {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 3.6rem;
      line-height: 0.82;
      float: left;
      margin-right: 10px;
      margin-bottom: -4px;
      margin-top: 2px;
      font-weight: 800;
      color: #b45309;
    }

    /* Boîte de formule $V = P - O$ pour la leçon V */
    .pdf-formula-callout {
      page-break-inside: avoid;
      background: #fbf5e6;
      border: 2px solid #b45309;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 22px 0;
      text-align: center;
    }

    .formula-title {
      font-family: 'Fraunces', serif;
      font-size: 18pt;
      font-weight: 800;
      color: #b45309;
      margin-bottom: 4px;
    }

    .formula-explanation {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      color: #4a3e31;
    }

    /* ══════════════════════════════════════════════════════════════════
       5. GLOSSAIRE VITALISTE EN FIN D'OUVRAGE
       ══════════════════════════════════════════════════════════════════ */
    .pdf-glossary-page {
      page-break-before: always;
      padding: 10mm 0;
    }

    .glossary-title {
      font-family: 'Fraunces', serif;
      font-size: 20pt;
      font-weight: 800;
      color: #1f160e;
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 2px solid #10b981;
      padding-bottom: 10px;
    }

    .glossary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .glossary-card {
      page-break-inside: avoid;
      background: #f4ecd8;
      border: 1px solid #e3d7bd;
      border-left: 3px solid #10b981;
      border-radius: 6px;
      padding: 12px 14px;
    }

    .glossary-term-name {
      font-family: 'Outfit', sans-serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #047857;
      margin-bottom: 4px;
      text-transform: capitalize;
    }

    .glossary-term-def {
      font-size: 9pt;
      line-height: 1.45;
      color: #382c1e;
      margin: 0;
    }
  </style>
</head>
<body>

  <!-- 1. COUVERTURE LUXE -->
  <div class="pdf-cover-page">
    <div class="cover-ornament-top">
      CHEF-D'ŒUVRE FONDATEUR · ÉDITION INTÉGRALE FRANÇAISE (1922)
    </div>

    <div class="cover-title-group">
      <div class="cover-eyebrow">Professeur Arnold Ehret</div>
      <h1 class="cover-main-title">Système de Guérison du Régime Sans Mucus</h1>
      <p class="cover-subtitle">
        Méthode scientifique et naturelle pour régénérer le corps, dissoudre l'obstruction interne et conquérir une vitalité surhumaine.
      </p>

      <div class="cover-formula-badge">
        <div class="cover-formula-math">V = P - O</div>
        <div class="cover-formula-text">L'Équation Suprême de la Vitalité Humaine</div>
      </div>
    </div>

    <div class="cover-author-group">
      <div class="cover-author-name">Professeur Arnold Ehret</div>
      <div class="cover-author-title">Pionnier Mondial du Vitalisme & de la Régénération Cellulaire (1866–1922)</div>
      <div class="cover-publisher-seal">Édition Intégrale Conforme au Texte Original · VitalTrack Academy</div>
    </div>
  </div>

  <!-- 2. PAGE DE TITRE & NOTICE HISTORIQUE -->
  <div class="pdf-colophon-page">
    <div class="colophon-header">
      <h1 class="colophon-book-title">${esc(ehretMucuslessFr.title)}</h1>
      <div class="colophon-author">Par le Professeur Arnold Ehret</div>
    </div>

    <div class="colophon-quote-box">
      « La maladie est un effort de la Nature pour éliminer les déchets, les glaires et les toxines... Ce cours complet enseigne pour la première fois dans l'histoire humaine comment nettoyer méthodiquement le temple cellulaire sans violenter l'organisme. »
      <br><br>
      <strong style="font-family:'Outfit',sans-serif; font-size:9pt; text-transform:uppercase; color:#b45309;">— Prof. Arnold Ehret (1922)</strong>
    </div>

    <div>
      <table class="colophon-meta-table">
        <tr>
          <td class="colophon-meta-label">Auteur :</td>
          <td>Professeur Arnold Ehret (1866–1922)</td>
        </tr>
        <tr>
          <td class="colophon-meta-label">Édition Originale :</td>
          <td>Los Angeles, Californie, 1922</td>
        </tr>
        <tr>
          <td class="colophon-meta-label">Traduction & Édition :</td>
          <td>VitalTrack Academy (Traduction Intégrale Conforme au Texte Original)</td>
        </tr>
        <tr>
          <td class="colophon-meta-label">Contenu :</td>
          <td>26 Leçons Magistrales, Préface de Fred S. Hirsch & Biographie Complète</td>
        </tr>
        <tr>
          <td class="colophon-meta-label">Total :</td>
          <td>29 Sections Intégrales · 100% Non Abrégé</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- 3. SOMMAIRE GÉNÉRAL -->
  <div class="pdf-toc-page">
    <h2 class="toc-title">Sommaire Général</h2>
    <div class="toc-grid">
      ${chapters.map((c, i) => `
        <div class="toc-item">
          <span class="toc-item-tag">${esc(c.tag)}</span>
          <span class="toc-item-title">${esc(c.title)}</span>
          <span class="toc-item-idx">#${i + 1}</span>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 4. LES 29 CHAPITRES ET 26 LEÇONS COMPLÈTES -->
  ${chapters.map((c, idx) => `
    <div class="pdf-chapter">
      <div class="chapter-header">
        <div class="chapter-tag">${esc(c.tag)} · Section #${idx + 1}</div>
        <h2 class="chapter-title">${esc(c.title)}</h2>
      </div>

      ${c.tag === 'Leçon V' ? `
        <div class="pdf-formula-callout">
          <div class="formula-title">V = P - O</div>
          <div class="formula-explanation"><strong>Vitalité = Puissance - Obstruction</strong><br>La force vitale n'augmente pas en ingérant plus de nourriture, mais en éliminant les frottements et l'encombrement interne.</div>
        </div>
      ` : ''}

      ${c.paragraphs.map((p, pIdx) => `
        <p class="pdf-paragraph ${pIdx === 0 ? 'has-dropcap' : ''}">
          ${cleanMarkdown(p)}
        </p>
      `).join('')}
    </div>
  `).join('')}

  <!-- 5. GLOSSAIRE VITALISTE EN FIN D'OUVRAGE -->
  <div class="pdf-glossary-page">
    <h2 class="glossary-title">Glossaire Vitaliste & Définitions Clés</h2>
    <div class="glossary-grid">
      ${Object.entries(glossary).map(([term, def]) => `
        <div class="glossary-card">
          <div class="glossary-term-name">${esc(term)}</div>
          <p class="glossary-term-def">${esc(def)}</p>
        </div>
      `).join('')}
    </div>
  </div>

</body>
</html>`;
}

export async function generateLuxuryPdf() {
  console.log('🎨 Génération du PDF Haute Couture pour Arnold Ehret (Édition Intégrale)...');
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
        top: '22mm',
        bottom: '22mm',
        left: '18mm',
        right: '18mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:#8C7E6C; width:100%; display:flex; justify-content:space-between; padding:0 18mm; text-transform:uppercase; letter-spacing:0.5px;">
          <span>Prof. Arnold Ehret — Système de Guérison du Régime Sans Mucus</span>
          <span>VitalTrack Édition</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-family:'IBM Plex Mono', monospace; font-size:7.5pt; color:#8C7E6C; width:100%; display:flex; justify-content:space-between; padding:0 18mm;">
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
