import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { morseDetoxMiracleFr } from '/Users/richard/Developer/vital_track/web-app/src/data/books/morseDetoxMiracleFr.js';

const PDF_DIR = '/Users/richard/Developer/vital_track/web-app/public/pdfs';
const DIST_PDF_DIR = '/Users/richard/Developer/vital_track/web-app/dist/pdfs';

[PDF_DIR, DIST_PDF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function buildMorsePdf() {
  console.log('📕 Démarrage de la génération du PDF de Luxe du Dr. Robert Morse...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper pour formater le markdown en HTML propre
  function formatMd(text) {
    if (!text) return '';
    let html = '';
    let remaining = text;

    if (remaining.startsWith('### ')) {
      const lines = remaining.split('\n');
      const titleLine = lines[0].replace(/^###\s+/, '');
      html += `<h3 class="section-h3">${formatInline(titleLine)}</h3>`;
      remaining = lines.slice(1).join('\n').trim();
    }

    if (!remaining) return html;

    // Tableau markdown
    if (remaining.includes('|') && remaining.includes('---')) {
      const lines = remaining.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
      if (lines.length >= 2) {
        html += '<div class="table-container"><table class="clinical-table">';
        lines.forEach((line, idx) => {
          if (line.includes('---')) return;
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          if (idx === 0) {
            html += '<thead><tr>' + cells.map(c => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead><tbody>';
          } else {
            html += '<tr>' + cells.map(c => {
              const isPos = c.startsWith('+');
              const isNeg = c.startsWith('-');
              const valClass = isPos ? 'val-pos' : (isNeg ? 'val-neg' : '');
              return `<td class="${valClass}">${formatInline(c)}</td>`;
            }).join('') + '</tr>';
          }
        });
        html += '</tbody></table></div>';
        return html;
      }
    }

    // Paragraphe normal
    return html + `<p class="book-paragraph">${formatInline(remaining)}</p>`;
  }

  function formatInline(str) {
    if (!str) return '';
    return str
      .replace(/\{\{(.+?)\}\}/g, '<span class="glossary-term">$1</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  const glossaryEntries = Object.entries(morseDetoxMiracleFr.glossary || {});

  let bookBodyHtml = '';
  morseDetoxMiracleFr.chapters.forEach((chap, idx) => {
    bookBodyHtml += `
      <section class="book-chapter-section" id="chap-${chap.id}">
        <div class="chapter-header">
          <span class="chapter-tag">${chap.tag}</span>
          <h2 class="chapter-title">${chap.title}</h2>
        </div>
        <div class="chapter-content">
          ${chap.id.includes('glossaire') ? `
            <div class="glossary-grid">
              ${glossaryEntries.map(([term, item]) => `
                <div class="glossary-pdf-card">
                  <div class="glossary-term-header">
                    <h4>💡 ${term.toUpperCase()}</h4>
                    <span class="badge-${item.type || 'science'}">${item.type === 'warning' ? 'MISE EN GARDE MÉDICALE' : 'ÉCLAIRAGE FACTUEL'}</span>
                  </div>
                  <p class="glossary-def"><strong>Définition du Dr. Morse :</strong> ${item.def}</p>
                  ${item.note ? `<p class="glossary-note">⚖️ <strong>Note Scientifique :</strong> ${item.note}</p>` : ''}
                  ${item.sources && item.sources.length > 0 ? `
                    <div class="glossary-sources">
                      <strong>Sources & Références Primaires :</strong>
                      <ul>
                        ${item.sources.map(s => `<li>${s}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : (
            chap.paragraphs.map(p => formatMd(p)).join('')
          )}
        </div>
      </section>
    `;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${morseDetoxMiracleFr.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap');

        @page {
          size: A4;
          margin: 18mm 16mm 20mm 16mm;
          @bottom-center {
            content: "Page " counter(page);
            font-family: 'Outfit', sans-serif;
            font-size: 9pt;
            color: #94a3b8;
          }
        }

        body {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 11.5pt;
          line-height: 1.65;
          color: #1e293b;
          background: #ffffff;
          margin: 0;
          padding: 0;
        }

        .cover-page {
          height: 100vh;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: linear-gradient(135deg, #042f2e, #0f766e, #134e4a);
          color: #ffffff;
          border-radius: 12px;
          padding: 60px 40px;
          box-sizing: border-box;
        }

        .cover-badge {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 8px 20px;
          border-radius: 30px;
          font-family: 'Outfit', sans-serif;
          font-size: 11pt;
          font-weight: 700;
          color: #5eead4;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 30px;
        }

        .cover-title {
          font-family: 'Outfit', sans-serif;
          font-size: 26pt;
          font-weight: 800;
          line-height: 1.25;
          margin: 0 0 20px 0;
        }

        .cover-subtitle {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 14pt;
          font-style: italic;
          color: #ccfbf1;
          max-width: 520px;
          margin: 0 0 40px 0;
        }

        .cover-author {
          font-family: 'Outfit', sans-serif;
          font-size: 15pt;
          font-weight: 700;
          color: #ffffff;
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 24px;
          width: 80%;
        }

        .book-chapter-section {
          page-break-before: always;
          margin-bottom: 30px;
        }

        .chapter-header {
          border-bottom: 2px solid #0f766e;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        .chapter-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9pt;
          font-weight: 700;
          color: #0f766e;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: block;
          margin-bottom: 4px;
        }

        .chapter-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18pt;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
        }

        .section-h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 13pt;
          font-weight: 700;
          color: #0f766e;
          margin-top: 24px;
          margin-bottom: 8px;
        }

        .book-paragraph {
          margin-bottom: 14px;
          text-align: justify;
        }

        .glossary-term {
          font-weight: 700;
          color: #0f766e;
          background: #f0fdfa;
          padding: 1px 4px;
          border-radius: 4px;
        }

        .table-container {
          margin: 20px 0;
          overflow-x: auto;
        }

        .clinical-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
          font-family: 'Outfit', sans-serif;
          background: #ffffff;
          border: 1px solid #cbd5e1;
        }

        .clinical-table th {
          background: #0f766e;
          color: #ffffff;
          padding: 8px 10px;
          font-weight: 700;
          text-align: left;
          border: 1px solid #0d9488;
        }

        .clinical-table td {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
        }

        .clinical-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .glossary-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glossary-pdf-card {
          border: 1px solid #e2e8f0;
          background: #fafafa;
          border-radius: 8px;
          padding: 14px;
          page-break-inside: avoid;
        }

        .glossary-term-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .glossary-term-header h4 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          color: #0f766e;
          font-size: 12pt;
        }

        .badge-science {
          background: #dcfce7;
          color: #166534;
          font-size: 8pt;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .badge-warning {
          background: #fee2e2;
          color: #991b1b;
          font-size: 8pt;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .glossary-def {
          margin: 4px 0 8px 0;
          font-size: 10.5pt;
        }

        .glossary-note {
          background: #f0fdf4;
          border-left: 3px solid #10b981;
          padding: 6px 10px;
          margin: 6px 0;
          font-size: 10pt;
          color: #065f46;
        }

        .glossary-sources {
          font-size: 8.5pt;
          color: #64748b;
          margin-top: 8px;
        }

        .glossary-sources ul {
          margin: 4px 0 0 16px;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div class="cover-page">
        <div class="cover-badge">VitalTrack · Bibliothèque Clinique</div>
        <h1 class="cover-title">${morseDetoxMiracleFr.title}</h1>
        <div class="cover-subtitle">${morseDetoxMiracleFr.tagline}</div>
        <div class="cover-author">${morseDetoxMiracleFr.author} · Édition Française Complète</div>
      </div>

      <div class="book-body">
        ${bookBodyHtml}
      </div>
    </body>
    </html>
  `;

  await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

  const targetPublic = path.join(PDF_DIR, 'dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf');
  const targetDist = path.join(DIST_PDF_DIR, 'dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf');

  await page.pdf({
    path: targetPublic,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    }
  });

  fs.copyFileSync(targetPublic, targetDist);

  const stats = fs.statSync(targetPublic);
  console.log(`✅ PDF du Dr. Robert Morse généré avec succès (${(stats.size / 1024).toFixed(1)} Ko) !`);

  await browser.close();
}

buildMorsePdf().catch(err => {
  console.error(err);
  process.exit(1);
});
