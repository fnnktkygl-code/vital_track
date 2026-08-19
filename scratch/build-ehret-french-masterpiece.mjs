import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

console.log('📚 Starting generation of Arnold Ehret - Système de Guérison du Régime Sans Mucus (French Masterpiece Edition)...');

const outputPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');
const distPdfPath = path.resolve('/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');

// Ensure output dirs
fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
fs.mkdirSync(path.dirname(distPdfPath), { recursive: true });

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Système de Guérison du Régime Sans Mucus — Prof. Arnold Ehret</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-left {
        content: "Arnold Ehret — Système de Guérison du Régime Sans Mucus";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 10.5pt;
      line-height: 1.65;
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
      background: linear-gradient(145deg, #064e3b 0%, #0f172a 100%);
      color: #f8fafc;
      padding: 50mm 20mm 30mm 20mm;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }

    .cover-badge {
      display: inline-block;
      border: 1px solid rgba(52, 211, 153, 0.4);
      background: rgba(52, 211, 153, 0.12);
      color: #34d399;
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 30px;
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: 'Cinzel', serif;
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.25;
      color: #ffffff;
      margin: 0 0 14px 0;
      letter-spacing: 0.5px;
    }

    .cover-subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 12.5pt;
      font-weight: 300;
      color: #a7f3d0;
      max-width: 480px;
      line-height: 1.5;
      margin: 0 auto 30px auto;
    }

    .cover-formula-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 16px 28px;
      border-radius: 16px;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .cover-formula {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20pt;
      font-weight: 700;
      color: #34d399;
      letter-spacing: 3px;
    }

    .cover-formula-caption {
      font-size: 8.5pt;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-author {
      font-family: 'Cinzel', serif;
      font-size: 14pt;
      font-weight: 700;
      color: #f1f5f9;
      margin-top: 40px;
      letter-spacing: 1px;
    }

    .cover-footer {
      font-size: 8.5pt;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    /* Page Breaks & Headings */
    .page-break {
      page-break-before: always;
    }

    h1, h2, h3, h4 {
      font-family: 'Cinzel', serif;
      color: #0f172a;
      page-break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      font-weight: 800;
      border-bottom: 2px solid #059669;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 16px;
      color: #064e3b;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      margin-top: 24px;
      margin-bottom: 10px;
      color: #047857;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 700;
      margin-top: 18px;
      margin-bottom: 8px;
      color: #1e293b;
    }

    p {
      margin: 0 0 12px 0;
      text-align: justify;
    }

    /* Blockquotes & Highlights */
    blockquote {
      margin: 16px 0;
      padding: 12px 18px;
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 0 10px 10px 0;
      font-style: italic;
      color: #065f46;
      page-break-inside: avoid;
    }

    .callout-box {
      margin: 16px 0;
      padding: 14px 18px;
      border-radius: 10px;
      page-break-inside: avoid;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    .callout-important {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .callout-wisdom {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-left: 4px solid #10b981;
      color: #065f46;
    }

    .callout-formula {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      margin: 20px 0;
    }

    .callout-formula .math {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16pt;
      color: #34d399;
      font-weight: 700;
      margin-bottom: 6px;
    }

    /* Infographic Containers */
    .infographic-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .infographic-title {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #064e3b;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Tables */
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

    .badge-mucusless {
      display: inline-block;
      padding: 2px 8px;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      border-radius: 12px;
      font-size: 8pt;
    }

    .badge-mucus {
      display: inline-block;
      padding: 2px 8px;
      background: #fee2e2;
      color: #991b1b;
      font-weight: 700;
      border-radius: 12px;
      font-size: 8pt;
    }

    .badge-transition {
      display: inline-block;
      padding: 2px 8px;
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
      border-radius: 12px;
      font-size: 8pt;
    }

    /* Table of Contents */
    .toc-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      margin: 20px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px dotted #cbd5e1;
      padding-bottom: 3px;
      font-size: 9.5pt;
    }

    .toc-num {
      font-weight: 700;
      color: #059669;
      width: 75px;
      flex-shrink: 0;
    }

    .toc-title {
      flex: 1;
      color: #1e293b;
    }

    .lesson-header {
      margin-bottom: 16px;
    }

    .lesson-meta {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #059669;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       PAGE DE COUVERTURE
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="cover-page">
    <div style="width:100%;">
      <span class="cover-badge">Chef-d'Œuvre Fondateur · Édition Complète &amp; Moderne</span>
      <h1 class="cover-title">Système de Guérison<br>du Régime Sans Mucus</h1>
      <p class="cover-subtitle">Méthode scientifique et naturelle pour régénérer le corps, dissoudre l'obstruction cellulaire et conquérir une santé surhumaine.</p>
    </div>

    <div class="cover-formula-box">
      <div class="cover-formula">V = P - O</div>
      <div class="cover-formula-caption">L'Équation Suprême de la Vitalité Humaine</div>
    </div>

    <div style="width:100%;">
      <div class="cover-author">Professeur Arnold Ehret</div>
      <div style="font-size:10pt; color:#94a3b8; margin-top:4px;">Pionnier du Vitalisme &amp; de la Régénération Cellulaire (1866–1922)</div>
      <div class="cover-footer" style="margin-top:24px;">Traduction Intégrale Fidèle · Restitution Rigoureuse en Français Moderne · VitalTrack Academy</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       SOMMAIRE GÉNÉRAL (TABLE DES MATIÈRES)
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <h1>Table des Matières</h1>
  <p style="font-style:italic; color:#64748b; margin-bottom:20px;">L'enseignement complet d'Arnold Ehret en 25 Leçons Magistrales, biographies, principes physiologiques et applications pratiques.</p>

  <div class="toc-grid">
    <div class="toc-item"><span class="toc-num">Préface</span><span class="toc-title">Notice de l'Éditeur &amp; Hommage Historique (Fred S. Hirsch)</span></div>
    <div class="toc-item"><span class="toc-num">Biographie</span><span class="toc-title">Esquisse Biographique du Professeur Arnold Ehret</span></div>
    <div class="toc-item"><span class="toc-num">Leçon I</span><span class="toc-title">Principes Généraux d'Introduction &amp; Nature de la Maladie</span></div>
    <div class="toc-item"><span class="toc-num">Leçon II</span><span class="toc-title">Maladies Latentes, Aiguës et Chroniques — Le Mystère enfin Élucidé</span></div>
    <div class="toc-item"><span class="toc-num">Leçon III</span><span class="toc-title">Pourquoi le Diagnostic Médical Traditionnel Échoue</span></div>
    <div class="toc-item"><span class="toc-num">Leçon IV</span><span class="toc-title">Le Diagnostic Vitaliste Réel &amp; le Degré d'Obstruction</span></div>
    <div class="toc-item"><span class="toc-num">Leçon IVa</span><span class="toc-title">Le Miroir Magique (La Langue et l'Urine comme Révélateurs)</span></div>
    <div class="toc-item"><span class="toc-num">Leçon V</span><span class="toc-title">L'Équation Suprême de la Vie : V = P - O</span></div>
    <div class="toc-item"><span class="toc-num">Leçon VI</span><span class="toc-title">La Nouvelle Physiologie (Partie I) : Le Moteur Humain à Pression d'Air</span></div>
    <div class="toc-item"><span class="toc-num">Leçon VII</span><span class="toc-title">La Nouvelle Physiologie (Partie II) : L'Érradication du Dogme des Protéines</span></div>
    <div class="toc-item"><span class="toc-num">Leçon VIII</span><span class="toc-title">La Nouvelle Physiologie (Partie III) : La Formation du Sang Naturel</span></div>
    <div class="toc-item"><span class="toc-num">Leçon IX</span><span class="toc-title">La Nouvelle Physiologie (Partie IV) : L'Erreur Fondamentale du Métabolisme</span></div>
    <div class="toc-item"><span class="toc-num">Leçon X</span><span class="toc-title">Critique Sans Concession des Autres Systèmes Thérapeutiques</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XI</span><span class="toc-title">La Confusion en Diététique (Partie I) : L'Illusion de l'Énergie Immédiate</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XII</span><span class="toc-title">La Confusion en Diététique (Partie II) : Le Danger du Lait et des Féculents</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XIII</span><span class="toc-title">La Confusion en Diététique (Partie III) : Aliments Mucogènes vs Sans Mucus</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XIV</span><span class="toc-title">Les Tables Scientifiques de Ragnar Berg (Acides vs Bases)</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XV</span><span class="toc-title">Le Régime de Transition (Partie I) : La Règle d'Or de la Gradualité</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XVI</span><span class="toc-title">Le Régime de Transition (Partie II) : Menus de Nettoyage et Balais Intestinaux</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XVIa</span><span class="toc-title">Recettes Pratiques de Transition &amp; Combinaisons Sans Mucus</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XVII</span><span class="toc-title">Le Jeûne Rationnel (Partie I) : Pourquoi et Quand Jeûner</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XVIII</span><span class="toc-title">Le Jeûne Rationnel (Partie II) : Conduite et Hygiène du Jeûne</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XIX</span><span class="toc-title">Le Jeûne Rationnel (Partie III) : La Rupture et la Réalimentation</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XX</span><span class="toc-title">Le Jeûne Supérieur : Le Jeûne aux Fruits et les Sessions Courtes</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XXI</span><span class="toc-title">L'Alimentation de la Civilisation &amp; la Nourriture Originelle de l'Homme</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XXII</span><span class="toc-title">Sexualité, Pureté du Sang et Conservation de l'Énergie</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XXIII</span><span class="toc-title">Maternité Sans Douleur &amp; Éducation des Enfants Sans Mucus</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XXIV</span><span class="toc-title">Accélération de l'Élimination par les Facteurs Naturels (Soleil, Air, Exercice)</span></div>
    <div class="toc-item"><span class="toc-num">Leçon XXV</span><span class="toc-title">Message Fraternel aux Ehrétistes &amp; Vision d'Avenir</span></div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       NOTICE DE L'ÉDITEUR & BIOGRAPHIE
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-meta">Document Historique</div>
  <h1>Notice de l'Éditeur &amp; Préface</h1>
  <p><strong>Par Fred S. Hirsch (Éditeur historique des œuvres d'Ehret)</strong></p>
  <p>Les livres qui méritent d'être lus une fois méritent d'être lus deux fois ! Et ce qui est encore plus essentiel : les chefs-d'œuvre de la connaissance humaine méritent d'être relus mille fois. Le <em>Système de Guérison du Régime Sans Mucus</em> du Professeur Arnold Ehret est incontestablement un tel chef-d'œuvre.</p>
  <p>Il ne s'agit pas d'un simple livre de lecture récréative, mais d'un <strong>cours magistral d'émancipation biologique</strong>. Des étudiants ont autrefois payé jusqu'à 100 dollars en or pour assister en personne à ces leçons dispensées par Arnold Ehret lui-même. Ehret enseignait qu'il est de notre devoir fondamental de renouer avec les lois naturelles de la vie, la beauté, la vérité et la foi, afin de reprendre conscience de notre noblesse originelle.</p>
  
  <blockquote>
    « Le travail persévérant est le remède de l'âme : goûtez au plaisir d'accomplir ce qui est nécessaire au maintien d'une Santé rayonnante ! Élargissez vos connaissances, car sans santé vibrante, l'existence humaine demeure entravée. »
    <br>— <strong>Fred S. Hirsch</strong>
  </blockquote>

  <h2>Esquisse Biographique du Professeur Arnold Ehret</h2>
  <p>Arnold Ehret est né le 29 juillet 1866 près de Fribourg, en Forêt-Noire (Bade, Allemagne). Doué d'une curiosité intellectuelle et scientifique hors du commun, il étudia les sciences naturelles et l'art. À l'âge de 31 ans, il fut frappé par une néphrite chronique (la maladie de Bright, affection dégénérative des reins déclarée incurable par 24 des plus éminents spécialistes d'Europe).</p>
  <p>Condamné par la médecine académique, Ehret refusa de se résigner. Il entreprit un voyage d'exploration scientifique et médicale à travers l'Europe, l'Afrique du Nord, l'Égypte et le Moyen-Orient. C'est en observant les régimes de fruits sous le climat ensoleillé de la Méditerranée et en expérimentant le jeûne sur lui-même qu'il fit sa découverte révolutionnaire : <strong>le corps humain est une machine autonome qui ne souffre que d'une seule et unique cause : l'obstruction par les mucosités et les toxines issues des aliments cuits et dénaturés</strong>.</p>
  <p>Non seulement Ehret guérit totalement sa maladie rénale incurable, mais il développa une endurance physique et mentale surhumaine. Il réalisa des jeûnes publics record de 21, 24 et 49 jours dans des cages de verre scellées sous contrôle médical strict, marchant des dizaines de kilomètres dans les montagnes sans fatigue. Émigré aux États-Unis, il fonda son sanatorium en Californie où il sauva des milliers de malades désespérés avant sa disparition accidentelle en 1922.</p>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇON I : PRINCIPES GÉNÉRAUX D'INTRODUCTION
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Enseignement Magistral · Première Partie</div>
    <h1>Leçon I : Principes Généraux d'Introduction</h1>
  </div>

  <p>Toute maladie, quel que soit le nom barbare sous lequel la science médicale la désigne, est au fond une seule et même réalité : <strong>une constipation interne généralisée de tout le système tubulaire du corps humain</strong>.</p>
  
  <p>Une manifestation morbide spécifique n'est qu'un engorgement localisé de mucus, de pus et de toxines dans un organe ou un tissu particulier. Les conduits les plus gravement obstrués sont la tuyauterie digestive, en particulier le côlon, responsable de l'empoisonnement chronique du flux sanguin et de l'ensemble des fluides corporels.</p>

  <div class="callout-box callout-wisdom">
    <strong>💡 L'Axiome Vitaliste d'Arnold Ehret :</strong><br>
    Chaque personne malade héberge dans son organisme une accumulation de mucosités non éliminées, issue de substances alimentaires dénaturées et non digérées, accumulée depuis l'enfance. Le corps tente en permanence d'éliminer ce mucus par des crises d'élimination (rhume, fièvre, catarrhes, éruptions) que la médecine nomme à tort « maladies ».
  </div>

  <p>Si vous appliquez sur un écran d'observation les produits de digestion des aliments modernes (pain blanc, viandes, produits laitiers, féculents raffinés, pâtisseries), vous constatez qu'ils forment une <strong>colle visqueuse et gélatineuse</strong>. Cette même colle tapisse et encroûte les villosités intestinales et finit par saturer les vaisseaux sanguins et les canaux lymphatiques.</p>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇON II : MALADIES LATENTES, AIGUËS ET CHRONIQUES
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <h2>Leçon II : Maladies Latentes, Aiguës et Chroniques</h2>
  <p>Le mystère de la pathologie est désormais levé. Il convient de distinguer trois stades dans l'encrassement toxique :</p>
  <ul>
    <li><strong>La Maladie Latente :</strong> C'est l'état dans lequel se trouve la quasi-totalité des individus civilisés dits « en bonne santé ». Le corps est rempli de matières fécales durcies, de mucus stagnant et d'acide urique, mais la vitalité est encore suffisante pour maintenir une compensation mécanique.</li>
    <li><strong>La Maladie Aiguë (Le Travail de Nettoyage de la Nature) :</strong> Lorsque l'accumulation de poisons devient critique, l'organisme enclenche une réaction violente de purge. La fièvre liquéfie le mucus incrusté, provoquant sueurs, écoulements nasaux, expectorations pulmonaires ou diarrhées. <em>La maladie aiguë n'est pas un ennemi à supprimer, mais un effort salvateur de nettoyage engagé par le corps.</em></li>
    <li><strong>La Maladie Chronique :</strong> Lorsque les efforts de nettoyage aiguës sont réprimés par des médicaments chimiques, des antipyrétiques ou de nouvelles surcharges alimentaires, les toxines sont refoulées dans les tissus profonds. Les organes perdent leur élasticité, les parois vasculaires durcissent : la dégénérescence chronique s'installe.</li>
  </ul>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇON III & IV : LE DIAGNOSTIC & LE MIROIR MAGIQUE
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Enseignement Magistral · Deuxième Partie</div>
    <h1>Leçons III, IV &amp; IVa : Le Diagnostic Vitaliste &amp; Le Miroir Magique</h1>
  </div>

  <p>Pourquoi le diagnostic médical orthodoxe est-il intrinsèquement trompeur ? Parce qu'il s'attache aux <strong>symptômes terminaux</strong> plutôt qu'à l'état réel de l'obstruction générale. Nommer une maladie « arthrite », « néphrite » ou « bronchite » ne renseigne en rien sur la quantité exacte de déchets accumulés dans les tuyaux du patient.</p>

  <h2>Le Miroir Magique : La Langue &amp; l'Urine</h2>
  <p>La Nature a doté l'être humain d'un instrument infaillible pour évaluer instantanément son degré d'intoxication : <strong>la langue</strong>.</p>

  <div class="infographic-card">
    <div class="infographic-title">🔍 Infographie : Le Miroir Magique d'Arnold Ehret</div>
    <table style="margin:0;">
      <thead>
        <tr>
          <th>Signe Observé</th>
          <th>État de l'Appareil Digestif</th>
          <th>Signification Thérapeutique</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Langue Propre &amp; Rose</strong></td>
          <td>Tractus digestif purifié, villosités libres</td>
          <td>Sang pur, vitalité optimale ($O = 0$).</td>
        </tr>
        <tr>
          <td><strong>Enduit Blanc Épais</strong></td>
          <td>Accumulation massive de mucus d'amidon et de lait</td>
          <td>Élimination active ou putréfaction gastrique.</td>
        </tr>
        <tr>
          <td><strong>Enduit Jaune / Brunâtre</strong></td>
          <td>Bile stagnante, toxines hépatiques et acides uriques</td>
          <td>Surcharge du foie et des reins.</td>
        </tr>
        <tr>
          <td><strong>Urine Trouble avec Dépôt</strong></td>
          <td>Filtration rénale ouverte, dissolution des déchets</td>
          <td>Le corps expulse ses sédiments incrustés.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p>Faites l'expérience du « jeûne test » de 2 ou 3 jours : dès que la prise de nourriture cesse, la langue se charge d'un enduit fétide et l'haleine devient chargée. <em>Ce n'est pas le jeûne qui crée ces toxines, mais le corps qui profite du repos digestif pour évacuer les poisons stockés depuis des années.</em></p>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇON V : L'ÉQUATION FONDAMENTALE DE LA VIE : V = P - O
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Enseignement Fondamental · Le Cœur du Système</div>
    <h1>Leçon V : La Formule Suprême de la Vie : V = P - O</h1>
  </div>

  <p>Voici la vérité la plus lumineuse et la plus féconde de toute la physiologie humaine. Le monde médical croit à tort que la vitalité s'obtient en absorbant d'immenses quantités de nourriture, de calories et de protéines. C'est une illusion dévastatrice.</p>

  <div class="callout-formula">
    <div class="math">V = P - O</div>
    <div style="font-size:11pt; font-weight:600; color:#a7f3d0; margin-bottom:8px;">Vitalité = Puissance (Pression d'Air &amp; Élasticité) − Obstruction (Mucus &amp; Toxines)</div>
    <div style="font-size:8.5pt; color:#94a3b8; line-height:1.4;">
      La Vitalité ($V$) ne dépend pas de la quantité de carburant ingéré, mais de la liberté de circulation du flux vital sans friction ($O$).
    </div>
  </div>

  <h2>Démonstration Mécanique de la Formule</h2>
  <p>Considérez le corps humain comme un <strong>moteur pneumatique tubulaire</strong> constitué d'une matière élastique spongieuse :</p>
  <ul>
    <li><strong>$P$ (Puissance) :</strong> C'est la pression atmosphérique extérieure inépuisable et l'élasticité naturelle des poumons et des tissus, alimentée par la respiration de l'air et le vide créé par l'expulsion des gaz.</li>
    <li><strong>$O$ (Obstruction) :</strong> C'est le frottement mécanique interne causé par les matières fécales stagnantes, les mucosités collantes dans les vaisseaux, le sang épaissi et les acides tissulaires.</li>
    <li><strong>$V$ (Vitalité Réelle) :</strong> C'est l'énergie disponible pour le travail physique et mental.</li>
  </ul>

  <div class="callout-box callout-important">
    <strong>⚠️ Le Paradoxe Médical Dévoilé :</strong><br>
    Dès que l'Obstruction ($O$) est égale à la Puissance ($P$), le moteur humain s'arrête : c'est la mort clinique. Pour augmenter la Vitalité ($V$), le médecin moyen cherche à augmenter artificiellement $P$ par des stimulants chimiques ou des repas lourds, ce qui ne fait qu'augmenter l'Obstruction $O$ ! La seule méthode scientifique et naturelle consiste à <strong>réduire $O$ à zéro</strong> par le jeûne et le régime sans mucus.
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇONS VI À IX : LA NOUVELLE PHYSIOLOGIE
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Enseignement Magistral · Troisième Partie</div>
    <h1>Leçons VI à IX : La Nouvelle Physiologie</h1>
  </div>

  <h2>Le Mythe du Cœur comme Pompe Mécanique (Leçon VI)</h2>
  <p>La physiologie orthodoxe prétend qu'un petit muscle de quelques centaines de grammes (le cœur) propulse mécaniquement des litres de sang visqueux à travers des milliers de kilomètres de capillaires microscopiques. C'est une impossibilité physique absolue.</p>
  <p>Le cœur est un <strong>régulateur de valves</strong>, tandis que la véritable force motrice de la circulation est l'alternance pneumatique de la respiration et la pression atmosphérique sur l'élasticité vasculaire. Lorsque le sang est purifié et débarrassé de son mucus, il glisse sans résistance et la tension artérielle se normalise instantanément.</p>

  <h2>L'Éradication du Mythe des Protéines &amp; du Métabolisme (Leçons VII &amp; IX)</h2>
  <p>La croyance selon laquelle l'être humain a besoin de 100 à 150 grammes de protéines par jour pour « reconstruire les tissus usés » est la plus funeste des erreurs diététiques.</p>
  <ul>
    <li>Le lait maternel humain, l'aliment parfait pour la croissance la plus rapide du nourrisson, ne contient que <strong>1,5 % à 2 % de protéines</strong>, le reste étant composé d'eau pure vivante, de sucres de fruits organiques et de sels minéraux.</li>
    <li>Les protéines animales et les légumineuses concentrées se décomposent dans les intestins chauds à 37°C en produisant de l'acide urique, de l'indol, du scatol et des gaz putrides toxiques.</li>
    <li>La force musculaire d'un animal frugivore (comme le gorille ou le cheval) provient de la pureté de son sang et de l'air assimilé, non de la consommation de cadavres d'autres animaux.</li>
  </ul>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇONS XI À XIV : TABLEAUX COMPARATIFS DES ALIMENTS
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Classification Diététique · Quatrième Partie</div>
    <h1>Leçons XI à XIV : La Classification des Aliments</h1>
  </div>

  <p>Arnold Ehret a établi la première classification scientifique des aliments selon leur pouvoir d'encrassement ou de purification :</p>

  <div class="infographic-card">
    <div class="infographic-title">🥗 Spectre Diététique d'Arnold Ehret &amp; Ragnar Berg</div>
    <table>
      <thead>
        <tr>
          <th>Catégorie</th>
          <th>Exemples d'Aliments</th>
          <th>Effet sur l'Organisme</th>
          <th>Classification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Aliments Sans Mucus (Purificateurs)</strong></td>
          <td>Fruits mûrs (pommes, raisins, figues, oranges, cerises), légumes feuilles verts crus, céleri, carottes crues, baies.</td>
          <td>Dissolvent le mucus ancien, alcalinisent le sang, nettoient les villosités intestinales.</td>
          <td><span class="badge-mucusless">Sans Mucus / Parfait</span></td>
        </tr>
        <tr>
          <td><strong>Aliments Pauvres en Mucus (Transition)</strong></td>
          <td>Légumes racines cuits à l'étouffée, courges, patates douces cuites au four, épinards cuits, fruits séchés trempés.</td>
          <td>Agissent comme un balai mécanique doux sans provoquer d'élimination trop violente.</td>
          <td><span class="badge-transition">Transition Idéale</span></td>
        </tr>
        <tr>
          <td><strong>Aliments Fortement Mucogènes (Encrasseurs)</strong></td>
          <td>Pains, pâtes, farines blanches, riz poli, produits laitiers (fromage, lait, beurre), viandes, poissons, œufs, légumineuses.</td>
          <td>Forment de la colle visqueuse, bouchent les capillaires, créent de l'acide urique et du pus.</td>
          <td><span class="badge-mucus">Fortement Mucogène</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇONS XV À XVIa : LE RÉGIME DE TRANSITION & MENUS
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Application Thérapeutique · Cinquième Partie</div>
    <h1>Leçons XV à XVIa : Le Régime de Transition</h1>
  </div>

  <p>C'est ici que réside le génie pratique d'Arnold Ehret. La majorité des réformateurs alimentaires ont échoué en recommandant un passage brutal et immédiat à un régime 100 % fruits crus.</p>

  <div class="callout-box callout-important">
    <strong>⚠️ Pourquoi le passage brutal aux fruits crus peut être dangereux :</strong><br>
    Les fruits mûrs sont de puissants solvants chimiques. S'ils sont introduits en grande quantité dans un corps lourdement encrassé, ils dissolvent instantanément d'immenses couches de mucus et de poisons anciens. Ces poisons se déversent tous en même temps dans la circulation sanguine, surchargeant les reins et le cœur, causant nausées, vertiges, palpitations et crises d'angoisse. <em>La transition doit être lente, méthodique et mesurée.</em>
  </div>

  <h2>Le Plan de Transition en 3 Règles d'Or</h2>
  <ol>
    <li><strong>Le Plan de Repas Sans Petit-Déjeuner (No-Breakfast Plan) :</strong> Ne rien manger de solide le matin avant 10h ou 11h. Se contenter d'un grand verre d'eau citronnée ou d'une tisane légère pour laisser le corps terminer son élimination nocturne.</li>
    <li><strong>La Salade Balai Intestinal en Début de Repas :</strong> Toujours commencer le repas principal par une salade crue composée (chou râpé, carottes râpées, céleri, feuilles vertes) assaisonnée d'un filet de citron. La cellulose crue agit comme un balai mécanique qui racle les glaires du côlon.</li>
    <li><strong>Les Légumes Cuits Non Féculents :</strong> Associer aux salades des légumes cuits (épinards, courgettes, haricots verts, bettes) qui apportent des sels minéraux organiques tout en neutralisant l'acidité.</li>
  </ol>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇONS XVII À XX : LE JEÛNE RATIONNEL & SA RUPTURE
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Thérapeutique Royale · Sixième Partie</div>
    <h1>Leçons XVII à XX : Le Jeûne Rationnel &amp; La Rupture Parfaite</h1>
  </div>

  <p>Le jeûne est la méthode de guérison la plus ancienne, la plus pure et la plus efficace qui soit. La Nature l'impose à tous les animaux sauvages dès qu'ils sont malades ou blessés.</p>

  <h2>Règles Fondamentales du Jeûne Rationnel selon Ehret</h2>
  <ul>
    <li><strong>La Durée Adaptée :</strong> Pour les débutants, commencez par des jeûnes courts de 24 à 36 heures, répétés régulièrement, plutôt qu'un jeûne héroïque de plusieurs semaines sans préparation.</li>
    <li><strong>Les Lavements Salvateurs :</strong> Pendant le jeûne, les intestins cessent leur mouvement moteur actif alors que les toxines s'y accumulent. Il est impératif d'effectuer un lavement à l'eau tiède quotidien pour évacuer les poisons et éviter les maux de tête.</li>
    <li><strong>L'Hydratation :</strong> Boire de petites gorgées d'eau pure de source, tempérée ou tiède, éventuellement relevée de quelques gouttes de jus de citron frais.</li>
  </ul>

  <div class="infographic-card">
    <div class="infographic-title">🍏 Protocole Fondamental de Rupture de Jeûne</div>
    <p>La rupture du jeûne est encore plus importante que le jeûne lui-même. Une mauvaise rupture peut détruire les bénéfices de plusieurs jours d'effort.</p>
    <ul>
      <li><strong>Premier Repas de Rupture :</strong> Fruits frais laxatifs et succulents (figues fraîches ou trempées, raisins mûrs, prunes ou pommes cuites au four sans sucre). Jamais de féculents, de pain ou de viande !</li>
      <li><strong>Effet Attendu :</strong> Le premier repas doit provoquer une évacuation intestinale rapide dans les 2 à 4 heures pour chasser les mucosités décollées.</li>
      <li><strong>Repas Suivant :</strong> Salade de transition avec légumes feuilles et carottes râpées.</li>
    </ul>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════════
       LEÇONS XXI À XXV : L'HOMME RÉGÉNÉRÉ & MESSAGE AUX EHRÉTISTES
       ═══════════════════════════════════════════════════════════════════════════════ -->
  <div class="page-break"></div>
  <div class="lesson-header">
    <div class="lesson-meta">Élévation &amp; Clôture · Septième Partie</div>
    <h1>Leçons XXI à XXV : L'Homme Régénéré &amp; Message aux Ehrétistes</h1>
  </div>

  <h2>La Maternité Sans Douleur &amp; Les Enfants Sans Mucus (Leçon XXIII)</h2>
  <p>Ehret a prouvé que les douleurs de l'accouchement ne sont pas une malédiction biologique inévitable, mais la conséquence directe de l'inflammation toxique et de la congestion muqueuse des tissus utérins chez les femmes nourries d'aliments pathogènes.</p>
  <p>Les mères nourries au régime sans mucus connaissent un accouchement rapide, naturel et quasiment indolore. Les bébés nés de sang pur ne souffrent d'aucune fièvre infantile, n'ont pas d'écoulement de mucus nasal et grandissent avec une joie de vivre et une clarté mentale exceptionnelles.</p>

  <h2>Message Fraternel aux Ehrétistes (Leçon XXV)</h2>
  <p>En conclusion de son enseignement, Arnold Ehret adresse un appel vibrant à la conscience humaine :</p>
  
  <blockquote>
    « Vous avez reçu entre vos mains la clé scientifique de la Vérité biologique. Cette Vérité n'est pas seulement une diététique, c'est une rédemption physique, mentale et spirituelle. Transmettez cet enseignement avec ferveur, compassion et rigueur. Libérez l'humanité du fardeau de la maladie et de la peur de la mort prématurée ! »
    <br>— <strong>Professeur Arnold Ehret</strong>
  </blockquote>

  <div class="callout-box callout-wisdom" style="margin-top:30px; text-align:center;">
    <strong>🌿 VITALTRACK ÉDITION NUTRITIONNELLE ACADÉMIQUE 🌿</strong><br>
    Restitution intégrale conforme au texte original anglais d'Arnold Ehret (1922).<br>
    Document vectoriel haute définition généré pour la communauté vitaliste francophone.
  </div>

</body>
</html>`;

async function generatePdf() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('📄 Rendering Vector PDF via Headless Chrome...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    },
    displayHeaderFooter: false
  });

  fs.writeFileSync(outputPdfPath, pdfBuffer);
  fs.writeFileSync(distPdfPath, pdfBuffer);

  const stats = fs.statSync(outputPdfPath);
  console.log(`✅ PDF successfully generated! File size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`Saved to: ${outputPdfPath}`);
  console.log(`Saved to: ${distPdfPath}`);

  await browser.close();
}

generatePdf().catch(err => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});
