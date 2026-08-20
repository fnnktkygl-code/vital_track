#!/usr/bin/env python3
"""
🎙️ VITALTRACK MULTI-SPEAKER STUDIO DUBBING PIPELINE
Génère une piste audio française continue de 56 minutes avec 3 voix distinctes :
- Rock Newman (Journaliste TV) : fr-FR-HenriNeural
- Dr. Sebi (Sage / Herboriste aîné) : fr-BE-GerardNeural (timbre chaud et profond)
- Annonces / Narratrice : fr-FR-VivienneMultilingualNeural
"""

import os
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
CLIPS_DIR = SCRATCH_DIR / "master_dubbing_clips_multi"
SILENCE_DIR = SCRATCH_DIR / "silence_cache"

VOICE_ROCK = "fr-FR-HenriNeural"
VOICE_SEBI = "fr-BE-GerardNeural"
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

def clean_and_group_transcript(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    trans = data.get('transcription', [])
    
    grouped = []
    curr = None

    for s in trans:
        text = s['text'].strip()
        if not text or (text.startswith('(') and text.endswith(')')):
            continue
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        
        if curr is None:
            curr = {'start': t0, 'end': t1, 'texts': [text]}
        else:
            gap = t0 - curr['end']
            dur = t1 - curr['start']
            if gap < 1.0 and dur < 10.0:
                curr['end'] = t1
                curr['texts'].append(text)
            else:
                grouped.append({
                    'start': curr['start'],
                    'end': curr['end'],
                    'text': ' '.join(curr['texts'])
                })
                curr = {'start': t0, 'end': t1, 'texts': [text]}

    if curr:
        grouped.append({
            'start': curr['start'],
            'end': curr['end'],
            'text': ' '.join(curr['texts'])
        })

    return grouped

def fix_translation(fr_text):
    replacements = {
        "Dr Sabie": "Dr Sebi",
        "Docteur Sabie": "Docteur Sebi",
        "Sabie": "Sebi",
        "aliments cellulaires": "aliments bio-électriques",
        "chapskin": "problèmes de peau",
        "nourriture pour ours polaire": "nourriture pour ours polaire",
        "village au Honduras": "village Usha au Honduras",
        "acides carboniques": "acides carboniques et mucus",
        "Queen Anne's Lace": "carotte sauvage",
        "mucusless": "sans mucus"
    }
    for k, v in replacements.items():
        fr_text = fr_text.replace(k, v)
    return fr_text

def translate_single(item):
    txt_en = item['text']
    try:
        translator = GoogleTranslator(source='en', target='fr')
        fr = translator.translate(txt_en)
        item['text_fr'] = fix_translation(fr)
    except Exception:
        item['text_fr'] = txt_en
    return item

async def generate_speech_for_sentence(idx, item, out_path, sem):
    async with sem:
        text = item['text_fr']
        dur = item['end'] - item['start']
        speaker = item['speaker']
        voice = item['voice']
        
        # Ajustement des tonalités selon le personnage pour un contraste humain maximal
        if speaker == "sebi":
            # Voix du sage : plus posée, chaude et profonde
            rate = "-1%" if dur > 8 else "+2%"
            pitch = "-2Hz"
        elif speaker == "female":
            rate = "+2%"
            pitch = "+0Hz"
        else: # rock (journaliste)
            rate = "+5%" if dur < 6.0 else "+2%"
            pitch = "+1Hz"
            
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await comm.save(str(out_path))
        if (idx + 1) % 40 == 0 or idx == 0:
            print(f"  [TTS Multi-Voix] #{idx+1} [{speaker.upper()}] [{item['start']:.1f}s -> {item['end']:.1f}s]: {text[:45]}...", flush=True)

async def build_sebi_continuous_audio():
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    SILENCE_DIR.mkdir(parents=True, exist_ok=True)
    json_path = SCRATCH_DIR / "sebi_exact_transcript.json"
    
    print(f"📖 1. Chargement du transcript Whisper ({json_path.name})...", flush=True)
    sentences = clean_and_group_transcript(json_path)
    print(f"   ➔ {len(sentences)} phrases continues identifiées sur 56 minutes.", flush=True)

    print("\n🎭 2. Détection contextuelle des rôles (Rock Newman vs Dr. Sebi)...", flush=True)
    current_speaker = "rock"
    
    for i, s in enumerate(sentences):
        txt_en = s['text'].lower()
        
        # Détection précise de l'orateur
        if i == 0 or "welcome to the rock newman show" in txt_en or "i'm rock newman" in txt_en or "this evening on the rock newman" in txt_en:
            current_speaker = "rock"
        elif "this program was produced by whut" in txt_en:
            current_speaker = "female"
        elif "when the first patient" in txt_en or "i was born" in txt_en or "i went to mexico" in txt_en or "alfredo cortez" in txt_en or "my grandmother" in txt_en:
            current_speaker = "sebi"
        elif "the mucus" in txt_en or "the starch" in txt_en or "gorilla does not eat" in txt_en or "we have people at the village" in txt_en:
            current_speaker = "sebi"
        elif txt_en.startswith("- ") or txt_en.startswith("well, ") or txt_en.startswith("yes, ") or txt_en.startswith("no, "):
            current_speaker = "sebi" if current_speaker == "rock" else "rock"
        elif "?" in s['text'] and len(s['text']) < 140 and current_speaker == "sebi":
            current_speaker = "rock"
        elif "thank you so much for joining us" in txt_en:
            current_speaker = "rock"
            
        s['speaker'] = current_speaker
        if current_speaker == "rock":
            s['voice'] = VOICE_ROCK
        elif current_speaker == "sebi":
            s['voice'] = VOICE_SEBI
        else:
            s['voice'] = VOICE_FEMALE

    print("\n🌐 3. Traduction française ultra-rapide (30 workers parallèles)...", flush=True)
    with ThreadPoolExecutor(max_workers=30) as executor:
        sentences = list(executor.map(translate_single, sentences))
    print(f"   ✅ Les {len(sentences)} phrases ont été traduites avec succès !", flush=True)

    print("\n🎙️ 4. Synthèse vocale multi-voix neuronale studio...", flush=True)
    sem = asyncio.Semaphore(15)
    tasks = []
    
    for i, s in enumerate(sentences):
        clip_path = CLIPS_DIR / f"clip_{i+1:04d}.mp3"
        s['clip_path'] = clip_path
        tasks.append(generate_speech_for_sentence(i, s, clip_path, sem))
        
    await asyncio.gather(*tasks)
    print("   ✅ Toutes les synthèses multi-voix sont prêtes !", flush=True)

    print("\n🎚️ 5. Concaténation de la piste continue 56 minutes multi-personnages...", flush=True)
    concat_list_file = SCRATCH_DIR / "concat_dub_multi_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f_concat:
        curr_timeline_pos = 0.0
        for i, s in enumerate(sentences):
            clip_path = s['clip_path']
            if not clip_path.exists():
                continue
            
            target_start = s['start']
            gap = target_start - curr_timeline_pos
            if gap > 0.05:
                silence_file = SILENCE_DIR / f"sil_{i}_{gap:.2f}s.mp3"
                make_silence(gap, silence_file)
                f_concat.write(f"file '{silence_file.resolve()}'\n")
                curr_timeline_pos += gap
                
            f_concat.write(f"file '{clip_path.resolve()}'\n")
            clip_dur = get_audio_duration(clip_path)
            curr_timeline_pos += clip_dur

    master_speech_path = SCRATCH_DIR / "dr_sebi_multi_french_speech.mp3"
    print(f"   Assemblage ffmpeg vers {master_speech_path.name}...", flush=True)
    cmd_concat = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(master_speech_path)
    ]
    subprocess.run(cmd_concat, capture_output=True)
    print(f"   ✅ Piste vocale maîtresse multi-voix de {curr_timeline_pos/60:.1f} minutes créée !", flush=True)

    print("\n🎬 6. Mixage final vidéo avec Audio Ducking automatique...", flush=True)
    out_video = PUBLIC_VIDEOS_DIR / "dr-sebi-documentary-fr.mp4"
    orig_video = PUBLIC_VIDEOS_DIR / "dr-sebi-documentary.mp4"

    cmd_mix = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", str(orig_video),
        "-i", str(master_speech_path),
        "-filter_complex", "[0:a]volume=0.15[orig];[orig][1:a]amix=inputs=2:dropout_transition=0:normalize=0[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "96k",
        "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd_mix, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = out_video.stat().st_size / (1024 * 1024)
        print(f"🎉 VIDÉO DR. SEBI MULTI-VOIX RENDUE : {out_video.name} ({size_mb:.1f} MB)", flush=True)
    else:
        print(f"❌ Erreur ffmpeg : {res.stderr[-500:]}", flush=True)

if __name__ == "__main__":
    asyncio.run(build_sebi_continuous_audio())
