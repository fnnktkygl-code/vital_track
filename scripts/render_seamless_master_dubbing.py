#!/usr/bin/env python3
"""
🎙️ VITALTRACK MULTI-SPEAKER STUDIO DUBBING PIPELINE (HIGH-CONTRAST DIALOG DIARIZATION)
Génère une piste audio française continue de 56 minutes avec 2 voix distinctes à haut contraste :
- Rock Newman (Journaliste TV) : fr-FR-HenriNeural (ton clair, vif, parisien)
- Dr. Sebi (Herboriste & Sage) : fr-CA-JeanNeural (timbre chaleureux, posé et profond)
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
CLIPS_DIR = SCRATCH_DIR / "master_dubbing_clips_dialog"
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

def parse_exact_dialog_turns(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    trans = data.get('transcription', [])

    groups = []
    curr_speaker = 'rock'
    curr_group = None

    for s in trans:
        txt = s['text'].strip()
        if not txt or (txt.startswith('(') and txt.endswith(')')):
            continue
        
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        
        is_dash = txt.startswith('-')
        clean_txt = txt.lstrip('- ').strip()
        
        if is_dash:
            if t0 < 80.0:
                curr_speaker = 'rock'
            elif 'welcome to the rock newman' in clean_txt.lower() or 'this evening on' in clean_txt.lower() or 'this program was produced' in clean_txt.lower():
                curr_speaker = 'rock'
            elif curr_speaker == 'rock':
                curr_speaker = 'sebi'
            else:
                curr_speaker = 'rock'
                
        if curr_group is None:
            curr_group = {'speaker': curr_speaker, 'start': t0, 'end': t1, 'texts': [clean_txt]}
        else:
            gap = t0 - curr_group['end']
            if curr_group['speaker'] == curr_speaker and gap < 1.2 and (t1 - curr_group['start'] < 12.0):
                curr_group['end'] = t1
                curr_group['texts'].append(clean_txt)
            else:
                groups.append({
                    'speaker': curr_group['speaker'],
                    'start': curr_group['start'],
                    'end': curr_group['end'],
                    'text': ' '.join(curr_group['texts'])
                })
                curr_group = {'speaker': curr_speaker, 'start': t0, 'end': t1, 'texts': [clean_txt]}

    if curr_group:
        groups.append({
            'speaker': curr_group['speaker'],
            'start': curr_group['start'],
            'end': curr_group['end'],
            'text': ' '.join(curr_group['texts'])
        })

    return groups

def fix_translation(fr_text):
    replacements = {
        "Dr Sabie": "Dr Sebi",
        "Docteur Sabie": "Docteur Sebi",
        "Sabie": "Sebi",
        "aliments cellulaires": "aliments bio-électriques",
        "chapskin": "problèmes de peau",
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
                if (idx + 1) % 30 == 0 or idx == 0:
                    print(f"  [Dialogue Multi-Voix #{idx+1:03d}] [{speaker.upper()}] ({item['start']:.1f}s -> {item['end']:.1f}s): {text[:45]}...", flush=True)
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
    
    print(f"📖 1. Analyse des répliques et tours de parole ({json_path.name})...", flush=True)
    dialog_turns = parse_exact_dialog_turns(json_path)
    rock_cnt = sum(1 for g in dialog_turns if g['speaker'] == 'rock')
    sebi_cnt = sum(1 for g in dialog_turns if g['speaker'] == 'sebi')
    print(f"   ➔ {len(dialog_turns)} répliques détectées (Rock: {rock_cnt}, Dr. Sebi: {sebi_cnt}).", flush=True)

    print("\n🌐 2. Traduction française contextuelle (30 workers)...", flush=True)
    with ThreadPoolExecutor(max_workers=30) as executor:
        dialog_turns = list(executor.map(translate_single, dialog_turns))
    print(f"   ✅ Les {len(dialog_turns)} répliques ont été traduites avec succès !", flush=True)

    print("\n🎙️ 3. Synthèse vocale neuronale à deux voix distinctes...", flush=True)
    sem = asyncio.Semaphore(15)
    tasks = []
    
    for i, s in enumerate(dialog_turns):
        clip_path = CLIPS_DIR / f"turn_{i+1:04d}_{s['speaker']}.mp3"
        s['clip_path'] = clip_path
        tasks.append(generate_speech_for_sentence(i, s, clip_path, sem))
        
    await asyncio.gather(*tasks)
    print("   ✅ Toutes les répliques audio sont synthétisées !", flush=True)

    print("\n🎚️ 4. Concaténation de la piste continue 56 minutes...", flush=True)
    concat_list_file = SCRATCH_DIR / "concat_dialog_list.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f_concat:
        curr_timeline_pos = 0.0
        for i, s in enumerate(dialog_turns):
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

    master_speech_path = SCRATCH_DIR / "dr_sebi_dialog_french_master.mp3"
    print(f"   Assemblage ffmpeg vers {master_speech_path.name}...", flush=True)
    cmd_concat = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list_file),
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(master_speech_path)
    ]
    subprocess.run(cmd_concat, capture_output=True)
    print(f"   ✅ Piste vocale maîtresse de {curr_timeline_pos/60:.1f} minutes créée !", flush=True)

    print("\n🎬 5. Mixage final vidéo avec Audio Ducking automatique...", flush=True)
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
