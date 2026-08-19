import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

console.log('📖 Generating Complete Unabridged French Edition of Arnold Ehret\'s Masterpiece (100+ pages)...');

const outputPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');
const distPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');

// Ensure output dirs
fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
fs.mkdirSync(path.dirname(distPdfPath), { recursive: true });

// Read extracted chapter files to ensure complete verbatim text
const chaptersDir = path.resolve('/Users/richard/Developer/vital_track/scratch/ehret_chapters');

// We will build the complete text in HTML with print-ready book CSS
const htmlHeader = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Système de Guérison du Régime Sans Mucus — Professeur Arnold Ehret</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {
      size: A4;
      margin: 24mm 20mm 24mm 20mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        font-weight: 600;
        color: #64748b;
      }
      @bottom-left {
        content: "Prof. Arnold Ehret · Système de Guérison du Régime Sans Mucus";
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        color: #94a3b8;
      }
      @top-right {
        content: "Édition Intégrale Française";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #cbd5e1;
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

    .cover-tag {
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
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin: 0 0 16px 0;
      letter-spacing: 1px;
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

    .cover-formula-card {
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

    .cover-formula-desc {
      font-size: 8.5pt;
      color: #cbd5e1;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .cover-author-box {
      margin-top: 30px;
    }

    .cover-author {
      font-family: 'Cinzel', serif;
      font-size: 16pt;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1px;
    }

    .cover-author-sub {
      font-size: 9.5pt;
      color: #94a3b8;
      margin-top: 4px;
    }

    /* Chapter & Section Styles */
    .chapter {
      page-break-before: always;
      padding-top: 10mm;
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

    .callout {
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

    .infographic-box {
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

    .badge-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .badge-mucusless { background: #dcfce7; color: #166534; }
    .badge-mucus { background: #fee2e2; color: #991b1b; }
    .badge-transition { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
`;

// Assemble the full document structure
console.log('Building full French book text...');
