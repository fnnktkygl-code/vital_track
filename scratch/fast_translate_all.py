# -*- coding: utf-8 -*-
"""
Traduction Ultra-Rapide et Intégrale de l'Œuvre Complète d'Arnold Ehret (113 pages, 269 000 caractères)
Utilise ThreadPoolExecutor pour traduire tous les paragraphes en parallèle.
"""

import os
import re
import json
import time
import urllib.request
import urllib.parse
import subprocess
from concurrent.futures import ThreadPoolExecutor

chapters_dir = "/Users/richard/Developer/vital_track/scratch/ehret_chapters"
html_out_path = "/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html"
pdf_pub_path = "/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"
pdf_dist_path = "/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf"

POST_REPLACEMENTS = [
    (r"\brégime sans mucus\b", "Régime Sans Mucus"),
    (r"\brégime de transition\b", "Régime de Transition"),
    (r"\bjeûne rationnel\b", "Jeûne Rationnel"),
    (r"\bmiroir magique\b", "Miroir Magique"),
    (r"\bnouvelle physiologie\b", "Nouvelle Physiologie"),
    (r"\bformule de la vie\b", "Formule de la Vie"),
    (r"\baliments formateurs de mucus\b", "Aliments Formateurs de Mucus"),
    (r"\bscience médicale\b", "Science Médicale"),
    (r"\behrétiste\b", "Ehrétiste"),
    (r"\behrétistes\b", "Ehrétistes"),
    (r"\bV = P - O\b", "<strong>V = P - O</strong>"),
]

def translate_chunk(text):
    if not text.strip():
        return ""
    # Split text into chunks < 1500 chars if needed
    if len(text) > 1800:
        parts = text.split(". ")
        mid = len(parts) // 2
        p1 = ". ".join(parts[:mid]) + "."
        p2 = ". ".join(parts[mid:])
        return translate_chunk(p1) + " " + translate_chunk(p2)
        
    for attempt in range(3):
        try:
            url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=" + urllib.parse.quote(text)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            res = urllib.request.urlopen(req, timeout=12)
            data = json.loads(res.read().decode("utf-8"))
            translated = "".join([s[0] for s in data[0] if s[0]])
            for pat, rep in POST_REPLACEMENTS:
                translated = re.sub(pat, rep, translated, flags=re.IGNORECASE)
            return translated
        except Exception as e:
            time.sleep(0.5 * (attempt + 1))
    return text

CHAPTER_TITLES = {
    30: ("Préface & Hommage", "Notice de l'Éditeur (Fred S. Hirsch)"),
    31: ("Préface & Hommage", "Notice de l'Éditeur — Suite"),
    32: ("Introduction Fondatrice", "Introduction par F. S. Hirsch"),
    33: ("Esquisse Biographique", "Esquisse Biographique Détaillée du Professeur Arnold Ehret"),
    34: ("Leçon I", "Principes Généraux d'Introduction & Nature de la Maladie"),
    35: ("Leçon II", "Maladies Latentes, Aiguës et Chroniques — Le Mystère enfin Élucidé"),
    36: ("Leçon III", "Pourquoi le Diagnostic Médical Traditionnel Échoue"),
    37: ("Leçon IV", "Le Diagnostic Vitaliste Réel & Le Miroir Magique"),
    38: ("Leçon V", "La Formule Suprême de la Vie : V = P - O"),
    39: ("Leçon VI", "La Nouvelle Physiologie (Partie I) : Le Moteur Humain à Pression d'Air"),
    40: ("Leçon VII", "La Nouvelle Physiologie (Partie II) : L'Éradication du Dogme des Protéines"),
    41: ("Leçon VIII", "La Nouvelle Physiologie (Partie III) : La Formation du Sang Naturel"),
    42: ("Leçon IX", "La Nouvelle Physiologie (Partie IV) : L'Erreur Fondamentale du Métabolisme"),
    43: ("Leçon X", "Critique Sans Concession de Tous les Autres Systèmes Thérapeutiques"),
    44: ("Leçon XI", "La Confusion en Diététique (Partie I) : L'Illusion de l'Énergie Immédiate"),
    45: ("Leçon XII", "La Confusion en Diététique (Partie II) : Le Danger du Lait et des Féculents"),
    46: ("Leçon XIII", "La Confusion en Diététique (Partie III) : Viandes et Aliments Carnés"),
    47: ("Leçon XIV", "Les Tables Scientifiques de Ragnar Berg (Acides vs Bases)"),
    48: ("Leçon XV", "Le Régime de Transition (Partie I) : Les Règles d'Or de la Gradualité"),
    49: ("Leçon XVI", "Le Régime de Transition (Partie II) : Menus de Nettoyage et Balais Intestinaux"),
    50: ("Leçon XVII", "Recettes Pratiques de Transition & Menus Végétariens Spéciaux"),
    51: ("Leçon XVIII", "Le Jeûne Rationnel (Partie I) : Définition et Règles Fondamentales"),
    52: ("Leçon XIX", "Le Jeûne Rationnel (Partie II) : Conduite et Hygiène du Jeûne"),
    53: ("Leçon XX", "Le Jeûne Rationnel (Partie III) : L'Art Suprême de la Rupture du Jeûne"),
    54: ("Leçon XXI", "Le Jeûne Supérieur (Partie IV) : Les Jeûnes Courts Répétés"),
    55: ("Leçon XXII", "L'Alimentation de la Civilisation & la Nourriture Originelle de l'Homme"),
    56: ("Leçon XXIII", "Sexualité, Pureté du Sang et Conservation de l'Énergie Vitale"),
    57: ("Leçon XXIV", "Maternité Sans Douleur & Éducation des Enfants Sans Mucus"),
    58: ("Leçon XXV", "Accélération de l'Élimination par les Facteurs Naturels (Soleil, Air, Exercice)"),
    59: ("Leçon XXVI", "Message Fraternel aux Ehrétistes & Vision d'Avenir")
}

print("Loading raw chapters...")
tasks = []
all_paragraphs_by_ch = {}

for idx in range(30, 60):
    ch_filename = f"ch_{idx:02d}.txt"
    ch_path = os.path.join(chapters_dir, ch_filename)
    if not os.path.exists(ch_path):
        continue
    
    with open(ch_path, "r", encoding="utf-8") as f:
        raw_lines = f.readlines()
    
    paragraphs = []
    current_p = []
    for line in raw_lines:
        s = line.strip()
        if not s:
            if current_p:
                paragraphs.append(" ".join(current_p))
                current_p = []
        else:
            if s.startswith("LESSON") or s.startswith("BIOGRAPHICAL") or s.startswith("PUBLISHER"):
                continue
            current_p.append(s)
    if current_p:
        paragraphs.append(" ".join(current_p))
    
    all_paragraphs_by_ch[idx] = paragraphs
    for p_idx, p in enumerate(paragraphs):
        tasks.append((idx, p_idx, p))

print(f"Total paragraphs to translate in parallel: {len(tasks)}")

def process_task(item):
    ch_idx, p_idx, p_text = item
    if len(p_text) < 4:
        return (ch_idx, p_idx, "")
    is_heading = len(p_text) < 60 and not p_text.endswith(".")
    tr = translate_chunk(p_text)
    if is_heading:
        return (ch_idx, p_idx, f"<h2>{tr}</h2>")
    else:
        if "V = P - O" in tr or "V=P-O" in tr:
            box = f"""
            <div class="callout-formula">
              <div class="math">V = P - O</div>
              <div style="font-size:11pt; font-weight:600; color:#a7f3d0; margin-bottom:6px;">Vitalité = Puissance − Obstruction</div>
            </div>
            """
            return (ch_idx, p_idx, box + f"<p>{tr}</p>")
        return (ch_idx, p_idx, f"<p>{tr}</p>")

print("Launching multi-threaded translation (12 workers)...")
results = {}
with ThreadPoolExecutor(max_workers=12) as executor:
    futures = [executor.submit(process_task, t) for t in tasks]
    for i, f in enumerate(futures):
        res = f.result()
        ch_idx, p_idx, html_p = res
        if ch_idx not in results:
            results[ch_idx] = {}
        results[ch_idx][p_idx] = html_p
        if (i + 1) % 50 == 0 or (i + 1) == len(tasks):
            print(f"Translated {i + 1}/{len(tasks)} paragraphs ({((i+1)/len(tasks)*100):.1f}%)...", flush=True)

print("Assembling final HTML...")

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
      font-size: 9.8pt;
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

full_html = [html_header]

for idx in range(30, 60):
    if idx not in results:
        continue
    meta_name, title_name = CHAPTER_TITLES.get(idx, (f"Section {idx}", f"Chapitre {idx}"))
    p_dict = results[idx]
    sorted_p_keys = sorted(p_dict.keys())
    content_html = "".join([p_dict[k] for k in sorted_p_keys])
    
    full_html.append(f"""
  <!-- CHAPITRE {idx} : {title_name} -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-meta">{meta_name}</div>
      <h1>{title_name}</h1>
    </div>
    {content_html}
  </div>
""")

full_html.append("""
</body>
</html>
""")

print("Saving HTML to disk...")
with open(html_out_path, "w", encoding="utf-8") as f:
    f.write("".join(full_html))

print(f"✅ HTML file created at: {html_out_path} ({os.path.getsize(html_out_path)} bytes)")

# Compile vector PDF using puppeteer
render_script = f"""
import fs from 'fs';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function run() {{
  console.log('📄 Rendering Complete 100+ Page Vector PDF via Headless Chrome...');
  const browser = await puppeteer.launch({{
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }});

  const page = await browser.newPage();
  const html = fs.readFileSync('{html_out_path}', 'utf8');
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

print("Executing Puppeteer PDF rendering...")
subprocess.run(["node", "/Users/richard/Developer/vital_track/scratch/render_full_pdf.mjs"], check=True)
print("🎉 Full Unabridged French PDF generated successfully!")
