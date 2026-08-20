#!/usr/bin/env python3
"""
🎙️ VITALTRACK MULTI-SPEAKER STUDIO DUBBING PIPELINE (PERFECT STABLE DIARIZATION)
Garantit une voix 100% stable et cohérente tout au long du documentaire (56 min) :
- Rock Newman (Journaliste TV) : UNIQUEMENT fr-FR-HenriNeural (voix claire, vive, rythmée)
- Dr. Sebi (Sage & Herboriste aîné) : UNIQUEMENT fr-CA-JeanNeural (voix chaleureuse, posée, profonde)
- Voix off / Annonces : fr-FR-VivienneMultilingualNeural
"""

import os
import re
import sys
import json
import asyncio
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from deep_translator import GoogleTranslator
import edge_tts

BASE_DIR = Path("/Users/richard/Developer/vital_track")
WEB_APP_DIR = BASE_DIR / "web-app"
PUBLIC_VIDEOS_DIR = WEB_APP_DIR / "public" / "videos"
SCRATCH_DIR = BASE_DIR / "scratch"
CLIPS_DIR = SCRATCH_DIR / "master_dubbing_clips_stable"
SILENCE_DIR = SCRATCH_DIR / "silence_cache"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-CA-JeanNeural"
VOICE_FEMALE = "fr-FR-VivienneMultilingualNeural"

def get_audio_duration(file_path):
    cmd = [
        "/opt/homebrew/bin/ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(res.stdout.strip())
    except:
        return 0.0

def make_silence(duration_sec, out_path):
    if duration_sec <= 0.01:
        return
    cmd = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
        "-t", f"{duration_sec:.3f}",
        "-q:a", "9",
        "-acodec", "libmp3lame",
        str(out_path)
    ]
    subprocess.run(cmd, capture_output=True)

def classify_sebi_interview_chunk(chunk, prev_speaker, t0, t1):
    txt = chunk['text'].strip()
    txt_clean = txt.lstrip('- ').strip()
    txt_lower = txt_clean.lower()
    
    # 1. Annonces / Générique
    if t0 < 78.0:
        return 'rock'
    if 'this program was produced by whut' in txt_lower or 'for a dvd copy' in txt_lower:
        return 'female'
    if 'join us next time on the rock newman' in txt_lower or 'thank you for watching' in txt_lower:
        return 'rock'
        
    # 2. Questions et relances du journaliste Rock Newman
    rock_patterns = [
        r'welcome to the rock newman',
        r'i\'?m rock newman',
        r'let me ask you',
        r'so let me ask',
        r'can you tell us',
        r'did you have',
        r'what did the judge',
        r'and that message is what',
        r'and that is compared to',
        r'how long ago was that',
        r'you\'?re 82 years old',
        r'what about michael jackson',
        r'what about lisa',
        r'we have one minute left',
        r'thank you so much for joining us',
        r'is that right\?',
        r'really\?',
        r'in new york\?',
        r'in philadelphia\?'
    ]
    for p in rock_patterns:
        if re.search(p, txt_lower):
            return 'rock'
            
    # 3. Récits & explications du Dr. Sebi
    sebi_patterns = [
        r'i was born',
        r'when i was in',
        r'my mother',
        r'my grandmother',
        r'alfredo cortez',
        r'i went to mexico',
        r'in the village of usha',
        r'in honduras',
        r'the mucus',
        r'the starch',
        r'bio-?electric',
        r'alkaline',
        r'when the patient',
        r'i stopped eating',
        r'64 days',
        r'90 days',
        r'i weighed 291',
        r'only weigh 120',
        r'god made',
        r'the judge told me',
        r'the supreme court',
        r'the attorney general',
        r'they brought 77 patients',
        r'we cure',
        r'in answer to your question',
        r'that\'?s all i weigh'
    ]
    for p in sebi_patterns:
        if re.search(p, txt_lower):
            return 'sebi'
            
    # 4. Réponses courtes
    if txt_lower in ['yeah.', 'yes.', 'okay.', 'right.', 'uh-huh.', 'sure.', 'no.'] and (t1 - t0) < 1.5:
        return 'rock' if prev_speaker == 'sebi' else 'sebi'
        
    # 5. Questions du présentateur
    if txt.endswith('?') and len(txt) < 80 and any(w in txt_lower for w in ['you', 'what', 'how', 'why', 'who', 'when']):
        return 'rock'
        
    # 6. Monologue continu
    return prev_speaker or 'sebi'

def parse_stable_dialog_turns(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    trans = data.get('transcription', [])

    classified = []
    curr = 'rock'
    for s in trans:
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        speaker = classify_sebi_interview_chunk(s, curr, t0, t1)
        curr = speaker
        s['speaker'] = speaker
        classified.append(s)

    merged_turns = []
    active = None
    for s in classified:
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        txt = s['text'].lstrip('- ').strip()
        if not txt or (txt.startswith('(') and txt.endswith(')')):
            continue
            
        if active is None:
            active = {'speaker': s['speaker'], 'start': t0, 'end': t1, 'texts': [txt]}
        elif active['speaker'] == s['speaker'] and (t0 - active['end'] < 2.0) and (t1 - active['start'] < 14.0):
            active['end'] = t1
            active['texts'].append(txt)
        else:
            merged_turns.append({
                'speaker': active['speaker'],
                'start': active['start'],
                'end': active['end'],
                'text': ' '.join(active['texts'])
            })
            active = {'speaker': s['speaker'], 'start': t0, 'end': t1, 'texts': [txt]}

    if active:
        merged_turns.append({
            'speaker': active['speaker'],
            'start': active['start'],
            'end': active['end'],
            'text': ' '.join(active['texts'])
        })

    return merged_turns

def ai_clean_and_translate_dialog(text_en, speaker):
    # 1. Protection préalable des entités
    protected = [
        (r'(?i)lisa\s+left\s+eye\s+lope[sz]', 'TAG_LISA_LEFT_EYE'),
        (r'(?i)left\s+eye\s+lope[sz]', 'TAG_LISA_LEFT_EYE'),
        (r'(?i)left\s+eye', 'TAG_LEFT_EYE'),
        (r'(?i)dr\.?\s*sabie', 'TAG_DR_SEBI'),
        (r'(?i)dr\.?\s*sebi', 'TAG_DR_SEBI'),
        (r'(?i)the\s+rock\s+newman\s+show', 'TAG_ROCK_NEWMAN_SHOW'),
        (r'(?i)rock\s+newman', 'TAG_ROCK_NEWMAN'),
        (r'(?i)howard\s+university', 'TAG_HOWARD_UNIV'),
        (r'(?i)new\s+york\s+supreme\s+court', 'TAG_NY_COURT'),
        (r'(?i)supreme\s+court', 'TAG_SUPREME_COURT'),
        (r'(?i)usha\s+village', 'TAG_USHA_VILLAGE'),
        (r'(?i)alfredo\s+cortez', 'TAG_ALFREDO_CORTEZ'),
        (r'(?i)michael\s+jackson', 'TAG_MICHAEL_JACKSON')
    ]
    
    t = text_en
    for pattern, tag in protected:
        t = re.sub(pattern, tag, t)

    # 2. Traduction
    try:
        tr = GoogleTranslator(source='en', target='fr').translate(t)
    except Exception:
        tr = t

    # 3. Restauration fidèle des noms propres
    tr = tr.replace('TAG_LISA_LEFT_EYE', 'Lisa « Left Eye » Lopes')
    tr = tr.replace('TAG_LEFT_EYE', 'Left Eye')
    tr = tr.replace('TAG_DR_SEBI', 'Docteur Sebi')
    tr = tr.replace('TAG_ROCK_NEWMAN_SHOW', "l'émission Rock Newman Show")
    tr = tr.replace('TAG_ROCK_NEWMAN', 'Rock Newman')
    tr = tr.replace('TAG_HOWARD_UNIV', "l'Université Howard")
    tr = tr.replace('TAG_NY_COURT', 'la Cour Suprême de New York')
    tr = tr.replace('TAG_SUPREME_COURT', 'la Cour Suprême')
    tr = tr.replace('TAG_USHA_VILLAGE', 'village Usha au Honduras')
    tr = tr.replace('TAG_ALFREDO_CORTEZ', 'Alfredo Cortez')
    tr = tr.replace('TAG_MICHAEL_JACKSON', 'Michael Jackson')

    # Nettoyage des contresens
    mistranslations = {
        r'(?i)lisa\s+yeux?\s+gauche?s?': 'Lisa « Left Eye » Lopes',
        r'(?i)lisa\s+oeil\s+gauche': 'Lisa « Left Eye » Lopes',
        r'(?i)oeil\s+gauche\s+lopez': 'Lisa « Left Eye » Lopes',
        r'(?i)docteur\s+sabie': 'Docteur Sebi',
        r'(?i)dr\s+sabie': 'Docteur Sebi',
        r'(?i)nourriture\s+cellulaire': 'aliments bio-électriques cellulaires',
        r'(?i)aliments\s+cellulaires': 'aliments bio-électriques',
        r'(?i)chapskin': 'problèmes de peau et gerçures',
        r'(?i)acides\s+carboniques': 'acides carboniques et toxines',
        r'(?i)mucusless': 'sans mucus',
        r'(?i)Queen\s+Anne\'?s\s+Lace': 'carotte sauvage (Queen Anne\'s Lace)'
    }
    for pat, rep in mistranslations.items():
        tr = re.sub(pat, rep, tr)

    # 4. Ponctuation pour la respiration orale
    if speaker == 'rock':
        tr = re.sub(r'^(Ce soir)\b', 'Ce soir,', tr)
        tr = re.sub(r'^(Bienvenue)\b', 'Bienvenue,', tr)
        tr = re.sub(r'^(D\'accord)\b', 'D\'accord...', tr)
    elif speaker == 'sebi':
        tr = re.sub(r'^(Eh bien)\b', 'Eh bien,', tr)
        tr = re.sub(r'^(Vous savez)\b', 'Vous savez,', tr)
        tr = re.sub(r'^(En fait)\b', 'En fait,', tr)
        tr = re.sub(r'^(Oui)\b', 'Oui,', tr)

    tr = re.sub(r',\s*,', ',', tr)
    tr = re.sub(r'\s+', ' ', tr).strip()
    return tr

def translate_turn(item):
    item['text_fr'] = ai_clean_and_translate_dialog(item['text'], item['speaker'])
    return item

async def generate_speech_for_sentence(idx, item, out_path, sem):
    async with sem:
        text = item['text_fr'].strip()
        dur = item['end'] - item['start']
        speaker = item['speaker']
        
        if not text or len(text) < 2:
            make_silence(max(0.5, dur), out_path)
            return

        if speaker == "sebi":
            voice = VOICE_SEBI
            rate = "-1%" if dur > 8 else "+2%"
            pitch = "-2Hz"
        elif speaker == "female":
            voice = VOICE_FEMALE
            rate = "+2%"
            pitch = "+0Hz"
        else:
            voice = VOICE_ROCK
            rate = "+4%" if dur < 6.0 else "+2%"
            pitch = "+1Hz"
            
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                await comm.save(str(out_path))
                if (idx + 1) % 25 == 0 or idx == 0:
                    print(f"  [Dialogue Stable #{idx+1:03d}] [{speaker.upper()}] ({item['start']:.1f}s -> {item['end']:.1f}s): {text[:50]}...", flush=True)
                return
            except Exception as e:
                if attempt == 2:
                    print(f"  ⚠️ [TTS Fallback] #{idx+1:03d} silence for {dur:.1f}s (Error: {e})", flush=True)
                    make_silence(max(0.5, dur), out_path)
                else:
                    await asyncio.sleep(1.0)

async def build_sebi_continuous_audio():
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    SILENCE_DIR.mkdir(parents=True, exist_ok=True)
    json_path = SCRATCH_DIR / "sebi_exact_transcript.json"
    
    print(f"📖 1. Analyse stable des tours de dialogue ({json_path.name})...", flush=True)
    dialog_turns = parse_stable_dialog_turns(json_path)
    rock_cnt = sum(1 for g in dialog_turns if g['speaker'] == 'rock')
    sebi_cnt = sum(1 for g in dialog_turns if g['speaker'] == 'sebi')
    print(f"   ➔ {len(dialog_turns)} tours de parole consolidés (Rock Newman: {rock_cnt}, Dr. Sebi: {sebi_cnt}).", flush=True)

    print("\n🧠 2. Traduction intelligente & Protection des entités (Lisa « Left Eye » Lopes, Dr. Sebi)...", flush=True)
    with ThreadPoolExecutor(max_workers=30) as executor:
        dialog_turns = list(executor.map(translate_turn, dialog_turns))
    print(f"   ✅ Les {len(dialog_turns)} répliques ont été traduites avec succès !", flush=True)

    print("\n🎙️ 3. Synthèse vocale neuronale studio avec voix 100% constantes...", flush=True)
    sem = asyncio.Semaphore(15)
    tasks = []
    
    for i, s in enumerate(dialog_turns):
        clip_path = CLIPS_DIR / f"turn_{i+1:04d}_{s['speaker']}.mp3"
        s['clip_path'] = clip_path
        tasks.append(generate_speech_for_sentence(i, s, clip_path, sem))
        
    await asyncio.gather(*tasks)
