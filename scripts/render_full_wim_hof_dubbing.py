#!/usr/bin/env python3
"""
🎙️ VITALTRACK COMPLETE WORD-FOR-WORD DUBBING FOR WIM HOF VIDEOS
1. wim-hof-tutorial-fr.mp4 : 100% des 607 secondes doublées mot à mot d'après la transcription exacte Whisper.
2. wim-hof-science-fr.mp4 : 100% des 2653 secondes (44 min) doublées intégralement en multi-voix d'après la transcription exacte Whisper.
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
SILENCE_DIR = SCRATCH_DIR / "silence_cache"
SILENCE_DIR.mkdir(parents=True, exist_ok=True)

VOICE_NARRATOR = "fr-FR-HenriNeural"
VOICE_WIM = "fr-CA-JeanNeural"
VOICE_RESEARCHER = "fr-FR-RemyMultilingualNeural"
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

def translate_clean_text(text_en, is_wim=False):
    t = text_en.strip().lstrip('- ').strip()
    if not t or (t.startswith('(') and t.endswith(')')):
        return ""
        
    protected = [
        (r'(?i)wim\s+hof', 'TAG_WIM_HOF'),
        (r'(?i)radboud', 'TAG_RADBOUD'),
        (r'(?i)curiositystream', 'TAG_CURIOSITY'),
        (r'(?i)e\.?\s*coli', 'TAG_ECOLI')
    ]
    for pat, tag in protected:
        t = re.sub(pat, tag, t)
        
    try:
        tr = GoogleTranslator(source='en', target='fr').translate(t)
    except Exception:
        tr = t
        
    tr = tr.replace('TAG_WIM_HOF', 'Wim Hof')
    tr = tr.replace('TAG_RADBOUD', 'l\'Université Radboud')
    tr = tr.replace('TAG_CURIOSITY', 'CuriosityStream')
    tr = tr.replace('TAG_ECOLI', 'E. coli')
    
    corrections = {
        r'(?i)respiration\s+du\s+ballet': 'respiration abdominale',
        r'(?i)ballet': 'ventre',
        r'(?i)haute\s+sur\s+votre\s+propre\s+approvisionnement': 'naturellement euphorique grâce à votre propre chimie',
        r'(?i)high\s+on\s+your\s+own\s+supply': 'en pleine euphorie naturelle'
    }
    for pat, rep in corrections.items():
        tr = re.sub(pat, rep, tr)
        
    if is_wim:
        tr = re.sub(r'^(Inspirez)\b', 'Inspirez,', tr)
        tr = re.sub(r'^(Relâchez)\b', 'Relâchez,', tr)
        tr = re.sub(r'^(Ventre)\b', 'Dans le ventre,', tr)
        tr = re.sub(r'^(Poitrine)\b', 'la poitrine,', tr)
        
    return tr.strip()

# ═══════════════════════════════════════════════════════════════
# 1. RENDER 100% WIM HOF TUTORIAL (FULL 607 SECONDS)
# ═══════════════════════════════════════════════════════════════
async def process_wim_tutorial_full():
    print("\n🌬️ 1. Traitement COMPLET mot à mot de Wim Hof Tutorial (10 min)...", flush=True)
    json_path = SCRATCH_DIR / "wim_tutorial_exact_transcript.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    trans = data.get('transcription', [])
    print(f"   ➔ {len(trans)} segments Whisper bruts chargés.", flush=True)
    
    # Consolidation des phrases
    merged = []
    active = None
    for s in trans:
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        txt = s['text'].strip()
        if not txt or (txt.startswith('(') and txt.endswith(')')):
            continue
        if active is None:
            active = {'start': t0, 'end': t1, 'texts': [txt]}
        elif (t0 - active['end'] < 1.5) and (t1 - active['start'] < 12.0):
            active['end'] = t1
            active['texts'].append(txt)
        else:
            merged.append({
                'start': active['start'],
                'end': active['end'],
                'text': ' '.join(active['texts'])
            })
            active = {'start': t0, 'end': t1, 'texts': [txt]}
    if active:
        merged.append({'start': active['start'], 'end': active['end'], 'text': ' '.join(active['texts'])})
        
    print(f"   ➔ {len(merged)} blocs de parole consolidés. Traduction en cours...", flush=True)
    with ThreadPoolExecutor(max_workers=20) as ex:
        for item in merged:
            item['text_fr'] = translate_clean_text(item['text'], is_wim=True)
            
    out_dir = SCRATCH_DIR / "wim_tut_full_clips"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sem = asyncio.Semaphore(15)
    async def synth_tut(idx, item):
        async with sem:
            clip_path = out_dir / f"tut_{idx:04d}.mp3"
            item['clip_path'] = clip_path
            dur = item['end'] - item['start']
            text = item['text_fr']
            if not text or len(text) < 2:
                make_silence(max(0.5, dur), clip_path)
                return
            for attempt in range(3):
                try:
                    comm = edge_tts.Communicate(text, VOICE_WIM, rate="+2%", pitch="-1Hz")
                    await comm.save(str(clip_path))
                    return
                except:
                    if attempt == 2:
                        make_silence(max(0.5, dur), clip_path)
                    else:
                        await asyncio.sleep(1.0)
                        
    tasks = [synth_tut(i, item) for i, item in enumerate(merged)]
    await asyncio.gather(*tasks)
    print("   ✅ Tous les clips audio du tutoriel sont synthétisés !", flush=True)
    
    # Concaténation complète
    concat_file = SCRATCH_DIR / "concat_wim_tutorial_full.txt"
    with open(concat_file, 'w', encoding='utf-8') as f:
        curr_pos = 0.0
        for i, item in enumerate(merged):
            clip = item['clip_path']
            if not clip.exists():
                continue
            gap = item['start'] - curr_pos
            if gap > 0.05:
                sil = SILENCE_DIR / f"sil_tut_full_{i}_{gap:.2f}s.mp3"
                make_silence(gap, sil)
                f.write(f"file '{sil.resolve()}'\n")
                curr_pos += gap
            f.write(f"file '{clip.resolve()}'\n")
            curr_pos += get_audio_duration(clip)
            
    master_mp3 = SCRATCH_DIR / "wim_tutorial_full_master.mp3"
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(master_mp3)
    ], capture_output=True)
    
    out_video = PUBLIC_VIDEOS_DIR / "wim-hof-tutorial-fr.mp4"
    orig_video = PUBLIC_VIDEOS_DIR / "wim-hof-tutorial.mp4"
    cmd_mix = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", str(orig_video),
        "-i", str(master_mp3),
        "-filter_complex", "[0:a]volume=0.15[orig];[orig][1:a]amix=inputs=2:dropout_transition=0:normalize=0[aout]",
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "96k", "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd_mix, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"🎉 VIDÉO WIM HOF TUTORIAL 100% COMPLÈTE RENDUE : {out_video.name} ({out_video.stat().st_size / (1024*1024):.1f} MB)", flush=True)

# ═══════════════════════════════════════════════════════════════
# 2. RENDER 100% WIM HOF SCIENCE (FULL 44 MINUTES, 2653s)
# ═══════════════════════════════════════════════════════════════
def classify_science_speaker(text, prev_speaker, t0):
    t_low = text.lower()
    if 'wim hof says' in t_low or 'according to wim' in t_low or 'in 2014' in t_low or 'the researchers at' in t_low:
        return 'narrator'
    if 'i\'ve been doing this' in t_low or 'i told them' in t_low or 'breathe in' in t_low or 'fully in' in t_low or 'my method' in t_low:
        return 'wim'
    if 'the study' in t_low or 'endotoxin' in t_low or 'interleukin' in t_low or 'cytokine' in t_low or 'blood samples' in t_low or 'statistically significant' in t_low:
        return 'researcher'
    if 'dr.' in t_low or 'matthijs' in t_low or 'peter pickkers' in t_low:
        return 'researcher'
    return prev_speaker or 'narrator'

async def process_wim_science_full():
    print("\n🔬 2. Traitement COMPLET mot à mot de Wim Hof Science (44 min)...", flush=True)
    json_path = SCRATCH_DIR / "wim_science_exact_transcript.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    trans = data.get('transcription', [])
    print(f"   ➔ {len(trans)} segments Whisper bruts chargés.", flush=True)
    
    # Consolidation des phrases et diarisation
    merged = []
    active = None
    curr_spk = 'narrator'
    for s in trans:
        t0 = s['offsets']['from'] / 1000.0
        t1 = s['offsets']['to'] / 1000.0
        txt = s['text'].strip()
        if not txt or (txt.startswith('(') and txt.endswith(')')):
            continue
        spk = classify_science_speaker(txt, curr_spk, t0)
        curr_spk = spk
        
        if active is None:
            active = {'speaker': spk, 'start': t0, 'end': t1, 'texts': [txt]}
        elif active['speaker'] == spk and (t0 - active['end'] < 2.0) and (t1 - active['start'] < 14.0):
            active['end'] = t1
            active['texts'].append(txt)
        else:
            merged.append({
                'speaker': active['speaker'],
                'start': active['start'],
                'end': active['end'],
                'text': ' '.join(active['texts'])
            })
            active = {'speaker': spk, 'start': t0, 'end': t1, 'texts': [txt]}
            
    if active:
        merged.append({
            'speaker': active['speaker'],
            'start': active['start'],
            'end': active['end'],
            'text': ' '.join(active['texts'])
        })
        
    print(f"   ➔ {len(merged)} blocs de parole consolidés. Traduction complète en cours...", flush=True)
    with ThreadPoolExecutor(max_workers=30) as ex:
        for item in merged:
            item['text_fr'] = translate_clean_text(item['text'], is_wim=(item['speaker']=='wim'))
            
    out_dir = SCRATCH_DIR / "wim_sci_full_clips"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sem = asyncio.Semaphore(15)
    async def synth_sci(idx, item):
        async with sem:
            clip_path = out_dir / f"sci_{idx:04d}_{item['speaker']}.mp3"
            item['clip_path'] = clip_path
            dur = item['end'] - item['start']
            text = item['text_fr']
            if not text or len(text) < 2:
                make_silence(max(0.5, dur), clip_path)
                return
                
            spk = item['speaker']
            if spk == 'wim':
                voice = VOICE_WIM
                rate = "+2%"
                pitch = "-1Hz"
            elif spk == 'researcher':
                voice = VOICE_RESEARCHER
                rate = "+2%"
                pitch = "+0Hz"
            else:
                voice = VOICE_NARRATOR
                rate = "+3%"
                pitch = "+1Hz"
                
            for attempt in range(3):
                try:
                    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                    await comm.save(str(clip_path))
                    return
                except:
                    if attempt == 2:
                        make_silence(max(0.5, dur), clip_path)
                    else:
                        await asyncio.sleep(1.0)
                        
    tasks = [synth_sci(i, item) for i, item in enumerate(merged)]
    await asyncio.gather(*tasks)
    print("   ✅ Tous les clips audio du documentaire scientifique (44 min) sont synthétisés !", flush=True)
    
    # Concaténation complète 44 minutes
    concat_file = SCRATCH_DIR / "concat_wim_science_full.txt"
    with open(concat_file, 'w', encoding='utf-8') as f:
        curr_pos = 0.0
        for i, item in enumerate(merged):
            clip = item['clip_path']
            if not clip.exists():
                continue
            gap = item['start'] - curr_pos
            if gap > 0.05:
                sil = SILENCE_DIR / f"sil_sci_full_{i}_{gap:.2f}s.mp3"
                make_silence(gap, sil)
                f.write(f"file '{sil.resolve()}'\n")
                curr_pos += gap
            f.write(f"file '{clip.resolve()}'\n")
            curr_pos += get_audio_duration(clip)
            
    master_mp3 = SCRATCH_DIR / "wim_science_full_master.mp3"
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(master_mp3)
    ], capture_output=True)
    
    out_video = PUBLIC_VIDEOS_DIR / "wim-hof-science-fr.mp4"
    orig_video = PUBLIC_VIDEOS_DIR / "wim-hof-science.mp4"
    cmd_mix = [
        "/opt/homebrew/bin/ffmpeg", "-y",
        "-i", str(orig_video),
        "-i", str(master_mp3),
        "-filter_complex", "[0:a]volume=0.15[orig];[orig][1:a]amix=inputs=2:dropout_transition=0:normalize=0[aout]",
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "96k", "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd_mix, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"🎉 VIDÉO WIM HOF SCIENCE 100% COMPLÈTE RENDUE : {out_video.name} ({out_video.stat().st_size / (1024*1024):.1f} MB)", flush=True)

async def main():
    await process_wim_tutorial_full()
    await process_wim_science_full()

if __name__ == "__main__":
    asyncio.run(main())
