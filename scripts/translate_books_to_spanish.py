#!/usr/bin/env python3
"""
translate_books_to_spanish.py

Script de traduction haute fidélité pour traduire l'intégralité des livres
d'Arnold Ehret et du Dr. Robert Morse en Espagnol avec préservation stricte :
- Des balises {{terme}} -> {{término_español}}
- Des tableaux Markdown (Ragnar Berg, anatomie comparée, tables acido-basiques)
- Des titres de chapitres, sous-titres, menus et listes
- Avec système de cache incrémental sur disque pour garantir la fiabilité.
"""

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(BASE_DIR, 'scripts', '.spanish_books_translation_cache.json')

EHRET_FR_PATH = os.path.join(BASE_DIR, 'web-app', 'src', 'data', 'books', 'ehretMucuslessFr.js')
MORSE_FR_PATH = os.path.join(BASE_DIR, 'web-app', 'src', 'data', 'books', 'morseDetoxMiracleFr.js')

EHRET_ES_OUT_PATH = os.path.join(BASE_DIR, 'web-app', 'src', 'data', 'books', 'ehretMucuslessEs.js')
MORSE_ES_OUT_PATH = os.path.join(BASE_DIR, 'web-app', 'src', 'data', 'books', 'morseDetoxMiracleEs.js')

# Load cache
cache = {}
if os.path.exists(CACHE_PATH):
    try:
        with open(CACHE_PATH, 'r', encoding='utf-8') as f:
            cache = json.load(f)
        print(f"📦 Cache chargé : {len(cache)} traductions mémorisées.")
    except Exception as e:
        print(f"⚠️ Erreur chargement cache : {e}")

def save_cache():
    try:
        with open(CACHE_PATH, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde cache : {e}")

EHRET_TAG_MAP = {
    'acide urique': 'ácido úrico',
    'air-gaz': 'aire-gas',
    'aliments sans mucus': 'alimentos sin moco',
    'bains de soleil': 'baños de sol',
    'constipation intestinale': 'estreñimiento intestinal',
    'côlon': 'colon',
    'colon': 'colon',
    'encombrement': 'obstrucción',
    'foie': 'hígado',
    'friction': 'fricción',
    'féculents': 'almidones y féculas',
    'jeûne rationnel': 'ayuno racional',
    'lavement': 'enema',
    'miroir magique': 'espejo mágico',
    'mucus': 'moco',
    'obstruction': 'obstrucción',
    'protéines': 'proteínas',
    'ragnar berg': 'ragnar berg',
    'reins': 'riñones',
    'rupture du jeûne': 'ruptura del ayuno',
    'régime de transition': 'dieta de transición',
    'régime sans mucus': 'dieta sin moco',
    'toxémie': 'toxemia',
    'vitalité': 'vitalidad',
    'élimination': 'eliminación',
    'autolyse': 'autólisis',
    'air frais': 'aire fresco',
    'sang propre': 'sangre limpia',
    'aliments producteurs de mucus': 'alimentos formadores de moco',
    'équation suprême': 'ecuación suprema',
    'salade balai': 'ensalada escoba',
    'puissance': 'potencia'
}

MORSE_TAG_MAP = {
    'acidose': 'acidosis',
    'ptyaline': 'ptialina',
    'lymphe': 'linfa',
    'filtration rénale': 'filtración renal',
    'surrénales': 'glándulas suprarrenales',
    'glandes surrénales': 'glándulas suprarrenales',
    'parathyroïdes': 'paratiroides',
    'frugivorisme': 'frugivorismo',
    'combinaisons alimentaires': 'combinaciones alimentarias',
    'formules de plantes': 'fórmulas de plantas',
    'température basale de barnes': 'temperatura basal de barnes',
    'crise de guérison': 'crisis de curación',
    'crise d\'élimination': 'crisis de curación',
    'aliments vivants': 'alimentos vivos',
    'iridologie': 'iridología',
    'subluxations vertébrales': 'subluxaciones vertebrales',
    'alcalinisation': 'alcalinización',
    'astringence': 'astringencia',
    'détoxification': 'desintoxicación',
    'vitalité': 'vitalidad',
    'autophagie': 'autofagia',
    'mucus': 'moco'
}

def translate_api(text, src='fr', dest='es'):
    text = text.strip()
    if not text:
        return text
    
    cache_key = f"{src}->{dest}:{text}"
    if cache_key in cache:
        return cache[cache_key]
    
    # URL encode
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={src}&tl={dest}&dt=t&q=" + urllib.parse.quote(text)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
    
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                translated = ''.join([part[0] for part in data[0] if part[0]])
                cache[cache_key] = translated
                return translated
        except Exception as e:
            time.sleep(1.0 * (attempt + 1))
            if attempt == 3:
                print(f"⚠️ Erreur traduction après 4 essais : {e}")
                return text

def translate_paragraph(p, tag_map):
    if not p or not p.strip():
        return p
    
    # 1. Mask tags like {{terme}}
    tags_found = []
    def mask_tag(match):
        term = match.group(1).lower().strip()
        mapped = tag_map.get(term, term)
        idx = len(tags_found)
        tags_found.append(mapped)
        return f"__VTTG_{idx}__"
    
    masked = re.sub(r'\{\{(.+?)\}\}', mask_tag, p)
    
    # If paragraph is a markdown table or title, handle line by line
    if '|' in masked and ('---' in masked or ':---' in masked):
        lines = masked.split('\n')
        translated_lines = []
        for line in lines:
            if line.strip().startswith('|') and ('---' in line or ':---' in line):
                # Header separator line
                translated_lines.append(line)
            elif line.strip().startswith('|'):
                cells = line.split('|')
                trans_cells = []
                for cell in cells:
                    c_clean = cell.strip()
                    if not c_clean:
                        trans_cells.append(cell)
                    else:
                        # Translate cell content
                        trans_c = translate_api(c_clean)
                        # Keep formatting
                        trans_cells.append(f" {trans_c} ")
                translated_lines.append('|'.join(trans_cells))
            elif line.strip().startswith('#'):
                # Heading line
                h_match = re.match(r'^(#+)\s*(.*)$', line.strip())
                if h_match:
                    hashes, rest = h_match.groups()
                    translated_lines.append(f"{hashes} {translate_api(rest)}")
                else:
                    translated_lines.append(translate_api(line))
            elif line.strip():
                translated_lines.append(translate_api(line))
            else:
                translated_lines.append(line)
        translated_text = '\n'.join(translated_lines)
    else:
        # Normal text paragraph
        translated_text = translate_api(masked)
    
    # 2. Unmask tags
    for idx, term in enumerate(tags_found):
        placeholder = f"__VTTG_{idx}__"
        # In case the API added spaces
        translated_text = re.sub(rf'__\s*VTTG_{idx}\s*__', f"{{{{{term}}}}}", translated_text)
        translated_text = translated_text.replace(placeholder, f"{{{{{term}}}}}")
    
    return translated_text

def extract_js_data(filepath, var_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find export const var_name = { ... };
    pattern = rf'export\s+const\s+{var_name}\s*=\s*(\{{[\s\S]*\}});?'
    match = re.search(pattern, content)
    if not match:
        raise ValueError(f"Impossible de trouver '{var_name}' dans {filepath}")
    
    raw_json = match.group(1).rstrip(';')
    return json.loads(raw_json)

def translate_ehret_book():
    print("\n📘 =================================================================")
    print("📖 TRADUCTION INTÉGRALE D'ARNOLD EHRET EN ESPAGNOL")
    print("=================================================================")
    
    data = extract_js_data(EHRET_FR_PATH, 'ehretMucuslessFr')
    
    es_data = {
        "id": "ehret-mucusless-es",
        "title": "Sistema de Curación por Dieta Sin Moco",
        "subtitle": "Un curso completo para quienes desean aprender a reconquistar su salud, vitalidad y juventud mediante el ayuno racional y los alimentos sin moco",
        "author": "Prof. Arnold Ehret",
        "year": "1922",
        "translator": "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
        "editionNotice": "Edición digital interactiva enriquecida por VitalTrack Academy a partir de la obra original de 1922. Contiene aclaraciones científicas y advertencias fisiológicas respaldadas por fuentes primarias verificables.",
        "pageCount": data.get("pageCount", 118),
        "pdfUrl": "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
        "glossary": {},
        "chapters": []
    }
    
    # 1. Load glossary
    print(f"📚 Chargement du Glossaire...")
    glossaries_path = os.path.join(BASE_DIR, 'scripts', 'spanish_glossaries.json')
    with open(glossaries_path, 'r', encoding='utf-8') as f:
        all_gloss = json.load(f)
    es_data["glossary"] = all_gloss["ehret"]
    
    # 2. Translate chapters
    chapters = data.get("chapters", [])
    total_chaps = len(chapters)
    
    for idx, ch in enumerate(chapters):
        ch_id = ch["id"].replace('lesson-', 'leccion-')
        
        # Translate tag
        tag = ch["tag"]
        if tag.startswith('Leçon'):
            tag = tag.replace('Leçon', 'Lección')
        elif tag == 'Introduction':
            tag = 'Introducción'
        elif tag == 'Préface':
            tag = 'Prefacio'
        elif tag == 'Biographie':
            tag = 'Biografía'
        elif tag == 'Dictionnaire':
            tag = 'Glosario'
        else:
            tag = translate_api(tag)
        
        # Translate title
        title = translate_api(ch["title"])
        print(f"  [{idx+1}/{total_chaps}] {tag} : {title} ({len(ch['paragraphs'])} paragraphes)...")
        
        # Translate paragraphs
        es_paragraphs = []
        for p_idx, p in enumerate(ch["paragraphs"]):
            trans_p = translate_paragraph(p, EHRET_TAG_MAP)
            es_paragraphs.append(trans_p)
            if (p_idx + 1) % 15 == 0 or (p_idx + 1) == len(ch["paragraphs"]):
                save_cache()
                print(f"    • {p_idx + 1}/{len(ch['paragraphs'])} paragraphes traduits...")
        
        es_data["chapters"].append({
            "id": ch_id,
            "tag": tag,
            "title": title,
            "paragraphs": es_paragraphs
        })
        save_cache()
    
    # Save output JS
    js_content = f"// Édition Intégrale en Espagnol - Prof. Arnold Ehret\nexport const ehretMucuslessEs = {json.dumps(es_data, ensure_ascii=False, indent=2)};\n"
    with open(EHRET_ES_OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✨ Fichier écrit avec succès : {EHRET_ES_OUT_PATH}")

def translate_morse_book():
    print("\n🌿 =================================================================")
    print("📖 TRADUCTION INTÉGRALE DU DR. ROBERT MORSE EN ESPAGNOL")
    print("=================================================================")
    
    data = extract_js_data(MORSE_FR_PATH, 'morseDetoxMiracleFr')
    
    es_data = {
        "id": "morse-detox-miracle-es",
        "title": "El Milagro de la Desintoxicación",
        "subtitle": "Guía clínica y práctica para la regeneración celular completa, la activación linfática, la filtración renal y la vitalidad holística",
        "author": "Dr. Robert Morse, N.D.",
        "year": "2004",
        "translator": "VitalTrack Academy (Traducción y Arquitectura Interactiva)",
        "editionNotice": "Edición clínica interactiva traducida y enriquecida por VitalTrack Academy a partir de 'The Detox Miracle Sourcebook' (2004). Incluye tablas de anatomía comparada, fórmulas de plantas, protocolo Barnes y referencias académicas primarias.",
        "pageCount": data.get("pageCount", 380),
        "pdfUrl": "/pdfs/robert-morse-the-detox-miracle-sourcebook-ebook.pdf",
        "glossary": {},
        "chapters": []
    }
    
    # 1. Load glossary
    print(f"📚 Chargement du Glossaire...")
    glossaries_path = os.path.join(BASE_DIR, 'scripts', 'spanish_glossaries.json')
    with open(glossaries_path, 'r', encoding='utf-8') as f:
        all_gloss = json.load(f)
    es_data["glossary"] = all_gloss["morse"]
    
    # 2. Translate chapters
    chapters = data.get("chapters", [])
    total_chaps = len(chapters)
    
    for idx, ch in enumerate(chapters):
        ch_id = ch["id"].replace('chapitre-', 'capitulo-').replace('module-', 'modulo-').replace('annexe-', 'anexo-')
        
        # Translate tag
        tag = ch["tag"]
        if tag.startswith('Chapitre'):
            tag = tag.replace('Chapitre', 'Capítulo')
        elif tag.startswith('Module'):
            tag = tag.replace('Module', 'Módulo')
        elif tag.startswith('Annexe'):
            tag = tag.replace('Annexe', 'Anexo')
        elif tag == 'Introduction':
            tag = 'Introducción'
        elif tag == 'Glossaire':
            tag = 'Glosario'
        else:
            tag = translate_api(tag)
        
        # Translate title
        title = translate_api(ch["title"])
        print(f"  [{idx+1}/{total_chaps}] {tag} : {title} ({len(ch['paragraphs'])} paragraphes)...")
        
        # Translate paragraphs
        es_paragraphs = []
        for p_idx, p in enumerate(ch["paragraphs"]):
            trans_p = translate_paragraph(p, MORSE_TAG_MAP)
            es_paragraphs.append(trans_p)
            if (p_idx + 1) % 15 == 0 or (p_idx + 1) == len(ch["paragraphs"]):
                save_cache()
                print(f"    • {p_idx + 1}/{len(ch['paragraphs'])} paragraphes traduits...")
        
        es_data["chapters"].append({
            "id": ch_id,
            "tag": tag,
            "title": title,
            "paragraphs": es_paragraphs
        })
        save_cache()
    
    # Save output JS
    js_content = f"// Édition Intégrale en Espagnol - Dr. Robert Morse\nexport const morseDetoxMiracleEs = {json.dumps(es_data, ensure_ascii=False, indent=2)};\n"
    with open(MORSE_ES_OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✨ Fichier écrit avec succès : {MORSE_ES_OUT_PATH}")

if __name__ == '__main__':
    translate_ehret_book()
    translate_morse_book()
    save_cache()
    print("\n🎉 TRADUCTION ESPAGNOLE INTÉGRALE DES DEUX OUVRAGES TERMINÉE AVEC SUCCÈS !")
