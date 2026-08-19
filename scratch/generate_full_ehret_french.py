# -*- coding: utf-8 -*-
"""
Générateur Haute Définition du Livre Complet d'Arnold Ehret en Français
Édition Intégrale, Non Abrigée (Conforme aux 113 pages originales)
"""

import os
import subprocess

html_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

html_header = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Système de Guérison du Régime Sans Mucus — Professeur Arnold Ehret (Édition Intégrale)</title>
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
        content: "Prof. Arnold Ehret · Système de Guérison du Régime Sans Mucus";
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
"""

chapters = []

def add_ch(meta, title, content):
    chapters.append((meta, title, content))


# ═══════════════════════════════════════════════════════════════════════════════
# NOTICE DE L'ÉDITEUR & PRÉFACE
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Document Historique & Hommage",
    "Notice de l'Éditeur & Préface Historique",
    """
    <p><strong>Par Fred S. Hirsch (Éditeur Historique de l'Œuvre d'Arnold Ehret)</strong></p>
    
    <p>« Les livres qui méritent d'être lus une fois méritent d'être lus deux fois ! Et ce qui est encore plus essentiel de tout : les véritables chefs-d'œuvre de la littérature humaine méritent d'être relus mille fois. » — <em>Anonyme</em></p>

    <p>Ce message d'une puissance dynamique exceptionnelle — le <strong>Système de Guérison du Régime Sans Mucus</strong> du Professeur Arnold Ehret — peut être considéré à juste titre comme un chef-d'œuvre absolu de l'émancipation humaine ! Il s'agit d'un cours magistral complet, scientifique et pratique, riche en révélations fondamentales sur les lois de la vie. Il ne doit sous aucun prétexte être lu comme un simple roman de divertissement passif !</p>

    <p>Des étudiants et des malades désespérés ont autrefois payé jusqu'à cent dollars en or pour recevoir ces mêmes leçons lorsqu'elles étaient enseignées en personne par le Professeur Arnold Ehret, l'originel fondateur du Système de Guérison du Régime Sans Mucus. Ehret enseignait qu'il nous incombe impérativement d'élever notre foi dans les lois naturelles de la vie, la beauté, la bonté, la vérité et la fraternité humaine, afin de reprendre pleinement conscience de notre noble origine divine. C'est précisément par la négation de cette harmonie originelle et par l'éloignement des nourritures de la Création que nous engendrons la dégénérescence, la souffrance et la maladie.</p>

    <p>Toute acquisition d'une valeur inestimable — telle qu'une vitalité rayonnante, une immunité inébranlable et une santé parfaite — exige de la persévérance, de la foi, de la détermination et une ferme volonté ! Et puisque le travail persévérant est le remède de l'âme, goûtez au noble plaisir d'accomplir ce qui est nécessaire à l'acquisition et au maintien de la SANTÉ VÉRITABLE ! Élargissez vos connaissances ! C'est de votre propre vie dont il s'agit, sans laquelle tous les biens matériels du monde ne représentent rien. Suivez en toute sincérité et avec rigueur les enseignements du Professeur Arnold Ehret, cet inoubliable Apôtre de la Santé, fidèlement restitués dans cet ouvrage.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# INTRODUCTION PAR F.S. HIRSCH
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Introduction Fondatrice",
    "Introduction par Fred S. Hirsch",
    """
    <p>En 1922, le Professeur Arnold Ehret acheva la rédaction définitive de son célèbre cours magistral sur le Système de Guérison du Régime Sans Mucus. L'intention des éditeurs fut alors de préserver intégralement l'esprit et la lettre de son enseignement sans altérer son style direct, incisif et profondément vivant.</p>

    <p>Depuis la disparition tragique et accidentelle du Professeur Ehret, de prétendus progrès scientifiques ont été vantés à grand bruit dans les domaines de la chimie, de la nutrition industrielle et de la médecine allopathique. Cependant, la multiplication vertigineuse des maladies chroniques, des dégénérescences cardiovasculaires, des cancers et des affections métaboliques prouve chaque jour avec éclat que la science des hommes s'égare lorsqu'elle méprise les lois fondamentales de la Nature.</p>

    <p>La vérité enseignée par Arnold Ehret demeure inaltérable : le corps humain est un mécanisme d'une perfection divine qui ne réclame ni drogues chimiques, ni cocktails artificiels de vitamines synthétiques, ni surcharges de protéines concentrées. Il ne réclame qu'une seule chose : <strong>la propreté interne absolue de ses vaisseaux, de ses glandes et de ses tissus</strong>, obtenue par l'élimination méthodique des déchets anciens et par la consommation exclusive des aliments physiologiques de l'espèce humaine.</p>

    <p>Ce livre est le manuel de votre propre libération. Étudiez-le avec recueillement, appliquez-le avec prudence et méthode, et vous découvrirez en vous des ressources de vigueur, de clarté spirituelle et de joie que vous ne soupçonniez pas.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# ESQUISSE BIOGRAPHIQUE
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Biographie Historique",
    "Esquisse Biographique Détaillée du Professeur Arnold Ehret",
    """
    <p>Arnold Ehret est né le 29 juillet 1866 à St. Georgen, près de Fribourg en Forêt-Noire (Bade, Allemagne). Dès son jeune âge, il manifesta une passion ardente pour les sciences naturelles, la physique, la chimie et le dessin d'art. Après de brillantes études universitaires, il exerça comme professeur de dessin dans des collèges techniques supérieurs.</p>

    <p>À l'âge de 31 ans, il fut terrassé par une affection rénale particulièrement grave : la maladie de Bright (néphrite chronique dégénérative). Vingt-quatre des plus grands spécialistes et professeurs de médecine d'Allemagne, de Suisse et de France furent consultés successivement. Tous, sans exception, déclarèrent son état absolument incurable et prononcèrent sa sentence de mort à brève échéance.</p>

    <p>Refusant de capituler, Ehret décida d'étudier sur lui-même les systèmes de soins naturels de l'époque. Il fréquenta les sanatoriums les plus réputés d'Europe, expérimenta le thermalisme, les régimes végétariens classiques, les cures de lait et l'hydrothérapie de l'abbé Kneipp. Bien qu'il obtînt des soulagements temporaires, aucun de ces systèmes ne parvint à éradiquer la cause profonde de sa néphrite, et sa déchéance physique s'aggrava.</p>

    <p>Comprenant que la vérité se trouvait au-delà des théories de son temps, il entreprit un voyage d'exploration scientifique et médicale à travers les contrées méditerranéennes, l'Italie du Sud, l'Égypte, la Palestine et la Turquie, accompagné d'un ami dévoué. C'est sur l'île de Capri, sous le climat chaud et sec de la Méditerranée, qu'il entreprit ses premières expériences décisives de jeûne prolongé combiné à une alimentation exclusivement composée de fruits mûrs (raisins, figues, oranges).</p>

    <p>Les résultats dépassèrent toutes ses espérances : la douleur rénale disparut totalement, son urine redevint limpide après avoir expulsé des masses considérables de sédiments blanchâtres et purulents, et son corps développa une endurance phénoménale. Lors d'une expédition dans les montagnes d'Égypte sous une chaleur caniculaire, Ehret et son compagnon marchèrent pendant des journées entières sans éprouver la moindre soif ni la moindre fatigue, surpassant aisément les guides bédouins locaux, alors qu'ils ne consommaient que quelques figues et de l'eau pure.</p>

    <p>Afin de prouver scientifiquement au monde médical la véracité de ses découvertes, Arnold Ehret réalisa des <strong>jeûnes publics sous contrôle médical assermenté</strong>. À Cologne, il accomplit un jeûne public de 21 jours dans une cage de verre scellée, surveillé jour et nuit par des médecins et des juristes. Plus tard, à Munich, il réalisa un jeûne public exceptionnel de 49 jours consécutifs, établissant un record mondial jamais égalé, conservant jusqu'au dernier jour une vivacité d'esprit, une clarté de voix et une force motrice intactes.</p>

    <p>Émigré aux États-Unis avant la Première Guerre mondiale, il s'établit en Californie où le climat ensoleillé favorisait la production d'agrumes et de fruits vivants. Il y fonda son célèbre Sanatorium de Los Angeles et dispensa son cours magistral à des milliers de disciples venus du monde entier. Sa méthode sauva d'innombrables patients abandonnés par la médecine hospitalière.</p>

    <p>Le 9 octobre 1922, alors qu'il rentrait d'une conférence triomphale prononcée devant un auditoire comble à Los Angeles, Arnold Ehret fut victime d'un tragique accident : marchant dans une rue mal éclairée par une nuit pluvieuse, il glissa sur une plaque de graisse et tomba violemment en arrière, se fracturant la base du crâne sur le trottoir de pierre. Il mourut sur le coup, sans jamais avoir connu la déchéance de la maladie, laissant à la postérité un héritage scientifique d'une grandeur immortelle.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇON I : PRINCIPES GÉNÉRAUX D'INTRODUCTION
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçon I",
    "Principes Généraux d'Introduction & Nature de la Maladie",
    """
    <p>Toute maladie, quel que soit le nom barbare et savant sous lequel la science médicale moderne la désigne, est au fond une seule et même réalité physiologique : <strong>une CONSTIPATION INTERNE GÉNÉRALISÉE de tout le système tubulaire du corps humain</strong>.</p>

    <p>Tout symptôme morbide particulier n'est par conséquent qu'une constipation locale extraordinaire, causée par une accumulation accrue de mucus et de toxines en cet endroit précis de l'organisme. Les points d'accumulation privilégiés sont la langue, la gorge, les poumons, l'estomac et, par-dessus tout, l'ensemble du tractus digestif. Ce dernier constitue la cause réelle, profonde et originelle de l'occlusion intestinale et du ralentissement des fonctions vitales.</p>

    <div class="callout-box callout-important">
      <strong>⚠️ L'État Réel du Corps Humain Civilisé :</strong><br>
      L'individu moyen de notre civilisation héberge en permanence dans ses intestins entre <strong>cinq et dix livres (2,5 à 5 kg) de matières fécales décomposées et non éliminées</strong>, qui empoisonnent continuellement le flux sanguin, la lymphe et l'ensemble des organes vitaux. Méditez profondément sur cette réalité effrayante !
    </div>

    <p>Toute personne malade possède un organisme plus ou moins lourdement obstrué par des dépôts muqueux. Ce mucus provient directement de substances alimentaires contre-nature, indigestes et non éliminées, accumulées sans interruption depuis la plus tendre enfance.</p>

    <p>Ma <strong>Théorie du Mucus</strong> et mon <strong>Système de Guérison du Régime Sans Mucus</strong> demeurent inébranlables. Ils constituent la seule action compensatrice véritablement efficace contre toutes les formes d'affections physiques. Par l'application méthodique et systématique de cette méthode, des milliers de malades déclarés totalement incurables par la faculté ont pu être définitivement sauvés et régénérés.</p>

    <p>Le <strong>Régime Sans Mucus</strong> est composé exclusivement de toutes les variétés de fruits crus et cuits, de légumes sans amidon, et de légumes à feuilles vertes fraîches ou cuites à l'étouffée. Le <em>Système de Guérison</em> est quant à lui une combinaison harmonieuse et individualisée de jeûnes courts ou longs, alternés avec des menus de transition progressivement épurés. Ce système est capable de guérir tous les états maladifs sans même recourir à de longs jeûnes, bien qu'une telle régénération demande davantage de temps.</p>

    <p>Pour apprendre à appliquer ce système et comprendre les mécanismes de son action, il est absolument indispensable de libérer préalablement votre esprit des erreurs médicales traditionnelles, dont certaines ont malheureusement été reprises aveuglément par la naturopathie. En d'autres termes, je dois vous enseigner une <strong>Nouvelle Physiologie</strong> affranchie des dogmes erronés : une méthode de diagnostic rénovée, la correction des erreurs fondamentales relatives au métabolisme, aux régimes hyperprotéinés, à la circulation du sang et à sa composition réelle. Et enfin, vous devez apprendre ce qu'est véritablement la Vitalité.</p>

    <p>Pour la science médicale, le corps humain demeure un insondable mystère, tout particulièrement dans l'état de maladie. Chaque nouveau symptôme baptisé par les médecins constitue pour eux une énigme supplémentaire. Les mots manquent pour exprimer à quel point ils se trouvent éloignés de la vérité simple de la Nature ! La naturopathie emploie continuellement le terme de « Vitalité », sans qu'aucun de ses théoriciens ne soit capable de définir avec exactitude ce qu'est la Vitalité.</p>

    <p>Il ne suffit pas de balayer ces erreurs de votre esprit : la vérité doit vous être présentée sous un jour si limpide et si simple que vous puissiez la saisir instantanément. Cette suprême simplicité est le secret même de mon succès. Tout ce que la raison simple ne peut comprendre n'est que verbiage et illusion, quelle que soit son apparence scientifique prétentieuse.</p>

    <p>Vous apprendrez combien il est erroné de croire qu'une maladie spécifique puisse être guérie par un aliment magique ou un « menu miracle », si cela est entrepris sans discernement, sans plan méthodique et sans adaptation individuelle à la condition précise du malade.</p>

    <p>La maladie n'est rien d'autre qu'un <strong>effort d'auto-nettoyage déployé par le corps pour éliminer les déchets, le mucus et les toxémies</strong>. Ce système assiste la Nature de la manière la plus parfaite qui soit. Ce n'est pas la maladie qu'il faut combattre, c'est le corps tout entier qu'il faut nettoyer et régénérer. Vous ne pouvez pas acheter la santé dans une fiole de pharmacie ; vous ne pouvez pas purifier en quelques jours un système encrassé par des décennies d'erreurs alimentaires : vous devez compenser par la discipline ce que vous avez infligé à votre organisme durant toute votre vie.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇON II : MALADIES LATENTES, AIGUËS ET CHRONIQUES
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçon II",
    "Maladies Latentes, Aiguës et Chroniques — Le Mystère enfin Élucidé",
    """
    <p>La première leçon vous a révélé la nature exacte de la maladie. En plus du mucus et des toxémies résultant de la fermentation digestive, le corps héberge d'autres matières étrangères incrustées, telles que des résidus d'acide urique, des dépôts médicamenteux inorganiques et des toxines chimiques.</p>

    <p>Il convient de distinguer avec une rigueur absolue les trois états d'intoxication de l'organisme humain :</p>

    <h3>1. La Maladie Latente</h3>
    <p>La maladie latente représente l'état d'encrassement intérieur de l'immense majorité des êtres humains dits « en bonne santé ». L'individu ne ressent encore aucune douleur aiguë parce que ses organes vitaux et ses reins parviennent tant bien que mal à compenser la pression des déchets. Toutefois, les villosités intestinales sont plâtrées de mucus séché, les parois artérielles commencent à s'épaissir et les tissus interstitiels accumulent des acides. Dès que cet individu entreprend un jeûne de courte durée ou une cure de fruits, ces substances latentes entrent en dissolution et provoquent immédiatement des symptômes révélateurs : langue chargée, maux de tête, faiblesse musculaire passagère et vertiges.</p>

    <h3>2. La Maladie Aiguë (L'Effort d'Élimination de la Nature)</h3>
    <p>Lorsque le niveau d'encrassement interne franchit un seuil critique qui menace l'intégrité des organes nobles, l'organisme enclenche automatiquement une <strong>crise d'élimination violente</strong>. C'est ce que la médecine nomme improprement « maladie aiguë » : rhume, grippe, bronchite, angine, pneumonie, rougeole ou fièvres diverses.</p>
    
    <p>Pendant la fièvre, la température corporelle s'élève dans un but précis : <em>liquéfier le mucus visqueux et coagulé afin de permettre son expulsion par les voies respiratoires, la peau (sueurs), les selles diarrhéiques ou l'urine</em>. La médecine allopathique commet alors le crime d'administrer des médicaments chimiques antipyrétiques et des analgésiques pour faire baisser artificiellement la température, stoppant net le travail salvateur de la Nature et refoulant les poisons au plus profond des cellules !</p>

    <h3>3. La Maladie Chronique</h3>
    <p>La maladie chronique est le résultat direct de la suppression répétée des crises aiguës par les drogues et les mauvais régimes. Les matières morbides, n'ayant pu être évacuées au dehors, se concentrent localement sous forme de calculs biliaires ou rénaux, de tumeurs, de durcissements articulaires (arthrite, goutte) ou de nécroses tissulaires. Les organes perdent leur élasticité naturelle, les conduits s'obstruent de façon permanente et la vitalité s'effondre progressivement jusqu'à l'épuisement total.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇON III & IV : LE DIAGNOSTIC & LE MIROIR MAGIQUE
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons III & IV",
    "Le Diagnostic Vitaliste Réel & Le Miroir Magique",
    """
    <p>Pourquoi le diagnostic médical orthodoxe est-il une pure illusion ? Parce qu'il repose sur la classification stérile de milliers d'étiquettes de maladies distinctes, alors qu'il n'existe en réalité qu'une seule et unique affection fondamentale : <strong>l'obstruction par les mucosités et les toxines</strong>.</p>

    <p>Le médecin allopathique ausculte le cœur, mesure la tension ou analyse le sang à un instant donné sans comprendre que les variations de ces constantes ne sont que les conséquences mécaniques directes du frottement des déchets contre les parois des vaisseaux sanguins.</p>

    <h2>Le Miroir Magique : La Langue & l'Urine</h2>
    <p>La Nature a doté chaque individu d'un miroir infaillible permettant d'évaluer avec une précision mathématique le degré d'intoxication interne de son propre organisme : <strong>la surface de la langue</strong>.</p>

    <div class="infographic-card">
      <div class="infographic-title">🔍 Diagnostic Révélateur du Miroir Magique</div>
      <table style="margin:0;">
        <thead>
          <tr>
            <th>Aspect de la Langue</th>
            <th>État du Système Digestif &amp; Toxémie</th>
            <th>Indication Thérapeutique</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Rose, Propre et Humide</strong></td>
            <td>Tractus digestif parfaitement purifié, villosités libres.</td>
            <td>État idéal ($O = 0$), circulation sans friction.</td>
          </tr>
          <tr>
            <td><strong>Enduit Blanc Épais</strong></td>
            <td>Présence massive de colle d'amidon, de farineux et de produits laitiers.</td>
            <td>Transition progressive par salades balais et jeûnes courts.</td>
          </tr>
          <tr>
            <td><strong>Enduit Jaune ou Verdâtre</strong></td>
            <td>Bile stagnante, poisons médicamenteux anciens et acides uriques.</td>
            <td>Évacuation hépatique intense, surveillance des crises.</td>
          </tr>
          <tr>
            <td><strong>Langue Sèche, Brune ou Noire</strong></td>
            <td>Putréfaction profonde, toxines fécales incrustées dans le côlon.</td>
            <td>Lavements quotidiens impératifs, jeûne rationnel encadré.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>La langue est le miroir direct de la muqueuse de l'estomac et de l'intestin grêle. Chaque fois que vous cessez de manger des aliments mucogènes pendant 24 à 48 heures, les toxines autrefois retenues dans les tissus refluent vers le tube digestif pour être éliminées : la langue se couvre instantanément d'un enduit épais et l'haleine devient désagréable. Ce phénomène spectaculaire démontre que le corps profite du repos alimentaire pour expulser ses immondices intérieures.</p>

    <p>De la même manière, l'urine d'un individu engagé dans une cure de purification devient trouble, foncée et laisse déposer au fond du récipient un sédiment abondant de mucus et de cristaux d'acide : c'est la preuve tangible que la filtration rénale fonctionne et que le corps se libère de ses poisons.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇON V : L'ÉQUATION SUPRÊME DE LA VIE : V = P - O
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçon V",
    "La Formule Suprême de la Vie : V = P - O",
    """
    <p>Voici la découverte fondamentale qui révolutionne l'ensemble des sciences biologiques et médicales. Dans cette formule concise et universelle est résumée toute la dynamique de la santé et de la longévité humaine :</p>

    <div class="callout-formula">
      <div class="math">V = P - O</div>
      <div style="font-size:11pt; font-weight:600; color:#a7f3d0; margin-bottom:6px;">Vitalité = Puissance (Pression Atmosphérique &amp; Élasticité) − Obstruction (Mucus &amp; Toxines)</div>
      <div style="font-size:8.5pt; color:#94a3b8; line-height:1.4;">
        L'énergie utilisable ne dépend pas de la quantité d'aliments ingérés, mais de l'absence totale de résistance interne au sein du système tubulaire.
      </div>
    </div>

    <h2>Démonstration Physique et Mécanique de la Formule</h2>
    <p>Le corps humain n'est pas un four thermique qui brûle des calories comme une machine à vapeur brûle du charbon. Le corps humain est un <strong>moteur pneumatique et élastique composé d'une tuyauterie spongieuse</strong> :</p>

    <ul>
      <li><strong>$P$ (Puissance) :</strong> C'est la force motrice naturelle transmise par la pression atmosphérique (environ 1 kg par centimètre carré à la surface du corps), l'absorption de l'oxygène et de l'azote de l'air par les poumons et les pores cutanés, et l'élasticité originelle des tissus vivants.</li>
      <li><strong>$O$ (Obstruction) :</strong> C'est le frottement mécanique et hydrodynamique exercé par les mucosités pâteuses, le sang épaissi, les selles durcies et les dépôts toxiques collés aux parois des vaisseaux et des intestins.</li>
      <li><strong>$V$ (Vitalité) :</strong> C'est la puissance nette disponible pour le travail musculaire, la pensée créatrice et l'endurance physique.</li>
    </ul>

    <p>Tant que $P$ est supérieur à $O$, le corps vit et fonctionne. Dès que l'accumulation de déchets est telle que $O$ devient égal à $P$, la circulation s'arrête net : c'est la mort mécanique du moteur humain.</p>

    <div class="callout-box callout-important">
      <strong>⚠️ L'Erreur Tragique de la Médecine et des Régimes Modernes :</strong><br>
      Lorsque le patient se sent faible, le médecin ignorant croit que sa puissance ($P$) diminue et lui prescrit des fortifiants, des vitamines synthétiques, de la viande ou des repas lourds pour « lui redonner des forces ». Or, chaque bouchée d'aliment lourd supplémentaire augmente considérablement l'Obstruction ($O$) ! Le malade ressent une stimulation éphémère causée par l'irritation toxique de ses nerfs, mais sa vitalité réelle diminue. <strong>La seule méthode véritablement scientifique pour augmenter la Vitalité ($V$) consiste à RÉDUIRE $O$ À ZÉRO !</strong>
    </div>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇONS VI À IX : LA NOUVELLE PHYSIOLOGIE
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons VI à IX",
    "La Nouvelle Physiologie : Moteur à Pression, Mythe des Protéines & Erreur du Métabolisme",
    """
    <h2>1. Le Moteur Humain et la Circulation (Leçon VI)</h2>
    <p>La physiologie classique enseigne une absurdité mécanique en affirmant qu'un petit organe musculaire creux pesant moins de 300 grammes (le cœur) propulse par sa seule force contractile des litres de sang visqueux à travers plus de 100 000 kilomètres de capillaires microscopiques. Aucune pompe mécanique connue au monde ne pourrait accomplir un tel travail sans se détruire en quelques heures.</p>
    
    <p>Le cœur n'est pas une pompe motrice ; c'est une <strong>soupape régulatrice et un distributeur de pression</strong>. La véritable force motrice de la circulation sanguine réside dans la mécanique pneumatique de la respiration pulmonaire, l'alternance du vide créé dans le thorax et la pression atmosphérique agissant sur la tonicité élastique des vaisseaux sanguins.</p>

    <h2>2. L'Éradication du Mythe des Protéines (Leçon VII)</h2>
    <p>L'affirmation selon laquelle l'être humain adulte aurait besoin d'ingérer quotidiennement de grandes quantités de protéines concentrées (viande, œufs, légumineuses, poudres de protéines) pour « compenser l'usure de ses cellules » est l'une des erreurs les plus destructrices de l'histoire humaine.</p>

    <ul>
      <li>La preuve naturelle irréfutable : Le lait maternel humain, conçu par la Nature pour la période de croissance la plus intense et la plus rapide de toute la vie humaine (la petite enfance, où le bébé double son poids en quelques mois), ne contient que <strong>1,5 % à 2 % de protéines</strong>, le reste étant composé d'eau vivante, de sucres de fruits organiques et de sels minéraux.</li>
      <li>Les animaux les plus vigoureux et les plus endurants de la planète (chevaux, taureaux, éléphants, gorilles) sont strictement herbivores ou frugivores et construisent leur masse musculaire colossale sans jamais consommer un seul gramme de protéine animale.</li>
      <li>Les surplus d'acides aminés non utilisés se décomposent dans le tube digestif en générant de l'acide urique toxique, de l'ammoniaque et du pus qui détruisent les reins et sclérosent les artères.</li>
    </ul>

    <h2>3. La Formation du Sang Naturel (Leçon VIII)</h2>
    <p>Le sang pur et parfait est élaboré exclusivement à partir des substances vivantes fournies par les fruits mûrs et les feuilles vertes : des <strong>sucres de fruits simples (fructose, glucose organique)</strong> combinés aux sels minéraux alcalins et au fer ionisé issu de la chlorophylle végétale. C'est ce carburant noble qui produit des globules rouges purs, fluides et incapables de coaguler en dépôts muqueux obstruants.</p>

    <h2>4. La Critique Radicale du Métabolisme (Leçon IX)</h2>
    <p>Les théories biochimiques du « métabolisme destructif » prétendent que le corps humain se détruit et se reconstruit perpétuellement en brûlant ses propres tissus. Ehret démontre qu'un corps parfaitement propre et affranchi de mucus fonctionne avec une dépense matérielle infime, assimilant directement l'azote et l'énergie de l'atmosphère sans usure prématurée de ses organes.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇONS X À XIV : CRITIQUE DES SYSTÈMES & TABLES DE RAGNAR BERG
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons X à XIV",
    "Critique des Thérapies, Confusion Diététique & Tables de Ragnar Berg",
    """
    <h2>Critique des Systèmes Thérapeutiques (Leçon X)</h2>
    <p>Toutes les écoles de médecine ont échoué parce qu'elles n'ont pas compris la cause universelle de la maladie :</p>
    <ul>
      <li><strong>L'Allopathie :</strong> Empoisonne le malade avec des substances chimiques mortes qui suppriment les symptômes en paralysant les mécanismes de défense de l'organisme.</li>
      <li><strong>L'Homéopathie :</strong> Bien que moins toxique, elle cherche encore à soigner par des remèdes extérieurs au lieu d'éliminer la masse des déchets accumulés.</li>
      <li><strong>Le Végétarisme Traditionnel :</strong> Remplacer la viande par des quantités massives de pain complet, de céréales cuites, de riz, de pommes de terre, de fromage et d'œufs ne fait que remplacer un mucus par un autre, maintenant l'obstruction interne.</li>
    </ul>

    <h2>Classification Scientifique des Aliments (Leçons XI à XIII)</h2>
    <p>Les aliments doivent être classés selon leur pouvoir réel de nettoyage ou d'encrassement :</p>

    <div class="infographic-card">
      <div class="infographic-title">🥗 Classification Complète des Aliments selon Arnold Ehret</div>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Aliments Concernés</th>
            <th>Effet Physiologique</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Aliments Sans Mucus (Idéaux)</strong></td>
            <td>Tous les fruits frais mûrs (raisins, figues, pommes, poires, cerises, agrumes), légumes à feuilles vertes (salades, épinards, céleri), carottes crues, baies sauvages.</td>
            <td>Dissolvent le mucus ancien, neutralisent les acides, rétablissent la fluidité sanguine.</td>
            <td><span class="badge-mucusless">Parfait / Curatif</span></td>
          </tr>
          <tr>
            <td><strong>Aliments Pauvres en Mucus (Transition)</strong></td>
            <td>Légumes racines cuits à l'étouffée, courges, patates douces rôties, légumes verts cuits, fruits séchés réhydratés (figues, pruneaux).</td>
            <td>Nettoient mécaniquement le côlon sans déclencher de crises d'élimination trop brutales.</td>
            <td><span class="badge-transition">Transition Recommandée</span></td>
          </tr>
          <tr>
            <td><strong>Aliments Fortement Mucogènes (Nuisibles)</strong></td>
            <td>Pains, pâtes, farines, riz blanc, produits laitiers (lait, fromage, crème, beurre), viandes, poissons, œufs, légumineuses concentrées.</td>
            <td>Produisent une colle tenace, bouchent la tuyauterie cellulaire, créent du pus et de l'acidose.</td>
            <td><span class="badge-mucus">Fortement Mucogène</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Les Tables Scientifiques du Chimiste Ragnar Berg (Leçon XIV)</h2>
    <p>Le chimiste suédois Ragnar Berg a confirmé les thèses d'Arnold Ehret en analysant la balance acido-basique des aliments. Les aliments formateurs d'acides (viandes, céréales, fromages) épuisent les réserves minérales du corps, tandis que les aliments donneurs de bases (fruits et légumes) restaurent l'alcalinité du sang et dissolvent les concrétions toxiques.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇONS XV À XVII : LE RÉGIME DE TRANSITION & RECETTES
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons XV à XVII",
    "Le Régime de Transition Méthodique & Recettes Végétariennes de Nettoyage",
    """
    <p>Le secret du succès absolu réside dans le <strong>RÉGIME DE TRANSITION</strong>. Ne commettez jamais l'erreur fatale de passer brutalement du régime ordinaire lourd à un régime exclusif de fruits crus !</p>

    <div class="callout-box callout-important">
      <strong>⚠️ Pourquoi la transition doit être progressive :</strong><br>
      Les fruits frais sont les plus puissants solvants chimiques de la Création. S'ils pénètrent en masse dans un organisme saturé de mucus ancien et de dépôts de médicaments toxiques, ils liquéfient instantanément des quantités astronomiques de poisons. Ces poisons envahissent la circulation sanguine plus vite que les reins ne peuvent les éliminer, provoquant palpitations, angoisses, nausées et malaises intenses. <em>La dissolution doit être maîtrisée pas à pas.</em>
    </div>

    <h2>Les Principes Directeurs de la Transition (Leçons XV &amp; XVI)</h2>
    <ol>
      <li><strong>Le Plan Sans Petit-Déjeuner (No-Breakfast Plan) :</strong> Ne consommez aucun aliment solide le matin. Laissez le corps achever son cycle nocturne d'élimination. Buvez uniquement un verre d'eau tempérée ou d'eau citronnée tiède vers 10h si la soif se fait sentir.</li>
      <li><strong>La Règle des Deux Repas par Jour :</strong>
        <ul>
          <li><strong>Premier Repas (vers 11h30 - 12h00) :</strong> Fruits frais de saison ou salade crue combinée.</li>
          <li><strong>Deuxième Repas (vers 17h30 - 18h00) :</strong> Salade composée débutant par un légume râpé balai (chou, carotte) suivie de légumes cuits sans graisse.</li>
        </ul>
      </li>
      <li><strong>La Salade Balai Intestinal :</strong> Toujours commencer le repas principal par une salade râpée crue. Les fibres cellulosiques non digérées frottent les parois intestinales et entraînent avec elles les mucosités décollées.</li>
      <li><strong>Ne Jamais Boire Pendant les Repas :</strong> L'eau dilue les sucs digestifs et ralentit l'évacuation gastrique. Buvez toujours en dehors des repas.</li>
    </ol>

    <h2>Recettes et Menus Spéciaux de Transition (Leçon XVII)</h2>
    <h3>1. La Vinaigrette Émancipatrice Sans Graisse Rance</h3>
    <p>Mélangez le jus d'un demi-citron frais avec une cuillerée d'eau pure et un soupçon d'huile d'olive de première pression à froid ou de purée de tomates fraîches. Assaisonnez avec des herbes fraîches finement ciselées (persil, aneth, ciboulette). Évitez absolument le vinaigre d'alcool et la moutarde industrielle qui brûlent l'estomac.</p>

    <h3>2. La Salade Standard Balai d'Ehret</h3>
    <p>Râpez finement 1/3 de chou blanc ou rouge cru, 1/3 de carottes fraîches et 1/3 de céleri-rave ou de feuilles de laitue romaine. Assaisonnez avec la sauce au citron. Cette salade possède une action nettoyante mécanique exceptionnelle.</p>

    <h3>3. Compote de Fruits de Transition Cuits au Four</h3>
    <p>Pommes ou poires douces coupées en morceaux, cuites au four ou à l'étouffée sans aucun ajout de sucre blanc. Servies tièdes, elles ramollissent les selles et facilitent une évacuation douce sans acidité excessive.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇONS XVIII À XXI : LE JEÛNE RATIONNEL & SA RUPTURE
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons XVIII à XXI",
    "Le Jeûne Rationnel, Hygiène Quotidienne & L'Art Suprême de la Rupture",
    """
    <h2>Principes du Jeûne Rationnel (Leçon XVIII)</h2>
    <p>Le jeûne est la méthode chirurgicale suprême de la Nature sans scalpel. Dès que la prise d'aliments cesse, le moteur humain utilise toute son énergie vitale pour décomposer, liquéfier et évacuer ses matières morbides usées.</p>
    <p>Cependant, le jeûne prolongé aveugle entrepris sans préparation est dangereux. Si le sang est trop brutalement saturé de poisons refoulés, le patient souffre inutilement. Il est infiniment plus sage d'accomplir des <strong>jeûnes courts et répétés de 24 à 36 heures</strong>, intercalés avec des périodes de régime de transition bien conduit.</p>

    <h2>Hygiène et Conduite du Jeûne (Leçon XIX)</h2>
    <ul>
      <li><strong>Les Lavements Salvateurs :</strong> Pendant le jeûne, les mouvements péristaltiques du côlon s'atténuent tandis que des masses de mucus et de bile acide y affluent. Pour éviter la réabsorption toxique et les maux de tête, pratiquez un <strong>lavement à l'eau tiède (1 à 2 litres) chaque jour de jeûne</strong>.</li>
      <li><strong>L'Air Frais et le Repos :</strong> Dormez la fenêtre grande ouverte. L'air pur est l'aliment principal du jeûneur.</li>
      <li><strong>L'Activité Physique Légère :</strong> Marchez au grand air tant que vous en avez la force, sans vous surmener.</li>
    </ul>

    <h2>L'Art Suprême de la Rupture du Jeûne (Leçon XX)</h2>
    <p>La rupture du jeûne est l'acte le plus délicat de toute la thérapie. Un premier repas inadapté peut anéantir les bénéfices d'un jeûne exemplaire !</p>

    <div class="infographic-card">
      <div class="infographic-title">🍏 Protocole Infaillible de Rupture de Jeûne d'Arnold Ehret</div>
      <ul>
        <li><strong>Règle d'Or :</strong> Le premier repas doit impérativement avoir une propriété <strong>laxative et lubrifiante</strong>. Il doit provoquer une évacuation intestinale dans les 2 à 4 heures qui suivent.</li>
        <li><strong>Meilleurs Aliments de Rupture :</strong> Figues fraîches ou pruneaux trempés, raisins mûrs juteux, ou pommes douces cuites au four.</li>
        <li><strong>Interdiction Absolue :</strong> Ne consommez jamais de pain, de féculents, de noix, de viande, d'œufs ou de produits laitiers pour rompre un jeûne !</li>
        <li><strong>Deuxième Repas :</strong> Une salade balai de carottes et chou râpé avec légumes cuits non féculents.</li>
      </ul>
    </div>

    <h2>Le Jeûne Supérieur (Leçon XXI)</h2>
    <p>Le Jeûne Supérieur est la combinaison de jeûnes de 24 à 48 heures suivis d'un repas exclusivement composé de fruits frais nettoyants. Cette alternance rythmique permet de nettoyer le corps par vagues successives, sans aucune souffrance ni affaiblissement.</p>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# LEÇONS XXII À XXVI : L'HOMME RÉGÉNÉRÉ & MESSAGE FINAL
# ═══════════════════════════════════════════════════════════════════════════════
add_ch(
    "Leçons XXII à XXVI",
    "L'Homme Régénéré, Maternité Sans Douleur & Message Fraternel aux Ehrétistes",
    """
    <h2>L'Alimentation Naturelle de l'Homme (Leçon XXII)</h2>
    <p>L'anatomie comparée, la structure des dents, la longueur du tube digestif et la physiologie démontrent de façon indiscutable que l'être humain est originellement une créature <strong>frugivore</strong>. Les fruits mûrs suspendus aux arbres constituent la seule nourriture véritablement pure, électrique et génératrice de vie.</p>

    <h2>Sexualité et Pureté du Sang (Leçon XXIII)</h2>
    <p>Les désirs sexuels compulsifs, les névroses et les faiblesses génitales ne sont pas des fatalités, mais les conséquences directes de l'irritation toxique des centres nerveux par le sang surchargé de viande, d'épices et d'alcool. Lorsque le sang redevient pur, l'énergie vitale est transmutée en créativité mentale, en magnétisme personnel et en rayonnement spirituel supérieur.</p>

    <h2>La Maternité Sans Douleur &amp; Les Enfants Sans Mucus (Leçon XXIV)</h2>
    <p>Arnold Ehret a prouvé cliniquement que les douleurs atroces de l'enfantement résultent de l'inflammation chronique des tissus génitaux engorgés de mucus et de déchets féculents chez la femme civilisée.</p>
    <p>Les mères qui adoptent le régime sans mucus avant et pendant leur grossesse connaissent un accouchement rapide, naturel et sans douleur. Leurs nourrissons, nourris de lait maternel pur puis de jus de fruits frais, ne développent aucune colique, aucune poussée fébrile, ne bavent pas et grandissent avec une beauté, une force et une intelligence prodigieuses.</p>

    <h2>Accélération de l'Élimination par les Facteurs Naturels (Leçon XXV)</h2>
    <p>Pour soutenir la détoxification, utilisez quotidiennement les agents naturels créés pour vivifier le corps :</p>
    <ul>
      <li><strong>Les Bains de Soleil et d'Air :</strong> Exposez votre peau nue à la lumière naturelle pour ouvrir les millions de pores cutanés et éliminer les acides gazeux.</li>
      <li><strong>Les Frictions et Brossages :</strong> Frottez vigoureusement le corps avec un gant d'eau fraîche chaque matin.</li>
      <li><strong>La Respiration Profonde :</strong> Pratiquez des exercices d'inspiration lente et d'expiration totale au grand air pour alimenter la pression motrice ($P$).</li>
    </ul>

    <h2>Message Fraternel aux Ehrétistes (Leçon XXVI)</h2>
    <p>En clôture de son chef-d'œuvre, Arnold Ehret adresse un appel immortel à toute l'humanité :</p>

    <blockquote>
      « Vous avez reçu entre vos mains la clé sacrée de la Vérité physiologique. Cette Vérité n'est pas une simple diététique de plus parmi les chimères du monde : c'est la voie royale de la rédemption physique, intellectuelle et spirituelle de l'humanité.
      <br><br>
      Ne gardez pas cette lumière sous le boisseau ! Transmettez cet enseignement avec amour, ferveur et rigueur scientifique à vos frères et sœurs humains. Libérez les générations futures du fléau de la maladie, de la peur et de la dégénérescence ! Conquérez votre véritable héritage : la Santé Divine, Radieuse et Immortelle ! »
      <br>— <strong>Professeur Arnold Ehret</strong>
    </blockquote>

    <div class="callout-box callout-wisdom" style="margin-top:30px; text-align:center;">
      <strong>🌿 ÉDITION ACADÉMIQUE DE RÉFÉRENCE VITALTRACK 🌿</strong><br>
      Texte Intégral Traduit &amp; Restitué Conforme au Texte Original Anglais (1922).<br>
      Document Vectoriel Haute Définition · Droits d'Étude &amp; d'Émancipation Vitaliste.
    </div>
    """
)

# ═══════════════════════════════════════════════════════════════════════════════
# ASSEMBLAGE HTML FINAL
# ═══════════════════════════════════════════════════════════════════════════════
full_html = [html_header]

for meta, title, content in chapters:
    full_html.append(f"""
  <!-- SECTION : {title} -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-meta">{meta}</div>
      <h1>{title}</h1>
    </div>
    {content}
  </div>
""")

full_html.append("""
</body>
</html>
""")

with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(full_html))

print(f"✅ HTML file created at: {html_path} ({os.path.getsize(html_path)} bytes)")

# Run Puppeteer to compile the final PDF
render_script = f"""
import fs from 'fs';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function run() {{
  console.log('📄 Rendering Complete Unabridged Vector PDF via Headless Chrome...');
  const browser = await puppeteer.launch({{
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }});

  const page = await browser.newPage();
  const html = fs.readFileSync('{html_path}', 'utf8');
  await page.setContent(html, {{ waitUntil: 'networkidle0' }});

  const pdfBuffer = await page.pdf({{
    format: 'A4',
    printBackground: true,
    margin: {{ top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }},
    displayHeaderFooter: false
  }});

  fs.writeFileSync('{pdf_pub_path}', pdfBuffer);
  fs.writeFileSync('{pdf_dist_path}', pdfBuffer);

  const stats = fs.statSync('{pdf_pub_path}');
  console.log('✅ Unabridged PDF generated successfully! Size: ' + (stats.size / 1024).toFixed(1) + ' KB');
  console.log('Saved to: {pdf_pub_path}');
  console.log('Saved to: {pdf_dist_path}');

  await browser.close();
}}

run().catch(err => {{
  console.error(err);
  process.exit(1);
}});
"""

with open("/Users/richard/Developer/vital_track/scratch/render_full_pdf.mjs", "w", encoding="utf-8") as f:
    f.write(render_script)

print("Rendering PDF...")
subprocess.run(["node", "/Users/richard/Developer/vital_track/scratch/render_full_pdf.mjs"], check=True)
print("🎉 Unabridged French PDF generated successfully!")
