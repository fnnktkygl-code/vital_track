#!/usr/bin/env python3
"""
🎙️ VITALTRACK STUDIO DUBBING GENERATOR
Génère des pistes audio françaises studio haute fidélité (voix neurales humaines)
et mixe les vidéos avec Audio Ducking automatique via ffmpeg.
"""

import os
import sys
import json
import asyncio
import subprocess
from pathlib import Path

# Importer edge_tts
import edge_tts

BASE_DIR = Path("/Users/richard/Developer/vital_track")
WEB_APP_DIR = BASE_DIR / "web-app"
PUBLIC_VIDEOS_DIR = WEB_APP_DIR / "public" / "videos"
DUBBING_DIR = PUBLIC_VIDEOS_DIR / "dubbing"
CLIPS_DIR = DUBBING_DIR / "clips"

# Attribution des voix neurales ultra-humaines par rôle
VOICE_MAP = {
    # Rock Newman (Journaliste TV, voix articulée, posée, dynamique)
    "rock_newman": "fr-FR-HenriNeural",
    # Dr. Sebi (Chercheur & Guérisseur, voix profonde, chaleureuse, posée)
    "dr_sebi": "fr-FR-RemyMultilingualNeural",
    # Wim Hof (Énergie vive, enthousiaste, motivationnel)
    "wim_hof": "fr-CA-JeanNeural",
    # Matt Shea (Journaliste Vice, jeune, curieux)
    "matt_shea": "fr-BE-GerardNeural",
    # Dr. Pickkers (Médecin chercheur universitaire)
    "dr_pickkers": "fr-CA-AntoineNeural",
    # Professeur Arnold Ehret (Professeur, voix pédagogique)
    "arnold_ehret": "fr-FR-HenriNeural",
    # Narrateur documentaire
    "narrator_fr": "fr-FR-HenriNeural",
    # Dr. Robert Morse (Herboriste naturopathe, bienveillant)
    "dr_morse": "fr-CA-JeanNeural",
}

# Extraction des données de doublage depuis le JS
def get_dubbing_database():
    js_path = WEB_APP_DIR / "src" / "data" / "videoDubbingData.js"
    content = js_path.read_text(encoding="utf-8")
    
    # Parser les objets via node
    node_cmd = [
        "node", "-e",
        f"""
        import('{js_path.as_posix()}').then(m => {{
            console.log(JSON.stringify(m.VIDEO_DUBBING_DATABASE));
        }});
        """
    ]
    res = subprocess.run(node_cmd, capture_output=True, text=True, check=True)
    return json.loads(res.stdout)

async def generate_single_clip(text, voice, out_path):
    communicate = edge_tts.Communicate(text, voice, rate="+2%", pitch="+0Hz")
    await communicate.save(str(out_path))

async def main():
    print("🎙️ Démarrage de la génération du doublage studio humain...")
    DUBBING_DIR.mkdir(parents=True, exist_ok=True)
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)

    db = get_dubbing_database()
    
    generated_clips_manifest = {}

    for video_id, data in db.items():
        title = data.get("title", video_id)
        dialogues = data.get("dialogues", [])
        speakers = data.get("speakers", {})
        print(f"\n========================================================")
        print(f"🎬 Vidéo: {title} ({len(dialogues)} répliques)")
        print(f"========================================================")

        clip_entries = []

        for d in dialogues:
            d_id = d["id"]
            spk_id = d["speaker"]
            text_fr = d["textFr"]
            start_sec = d["start"]
            end_sec = d["end"]
            voice = VOICE_MAP.get(spk_id, "fr-FR-HenriNeural")
            clip_path = CLIPS_DIR / f"{d_id}.mp3"

            print(f"  [TTS] {spk_id} ({voice}) -> {d_id}.mp3 ({start_sec}s - {end_sec}s)")
            await generate_single_clip(text_fr, voice, clip_path)

            # Obtenir la durée réelle du clip généré via ffprobe
            probe_cmd = [
                "/opt/homebrew/bin/ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(clip_path)
            ]
            dur_res = subprocess.run(probe_cmd, capture_output=True, text=True)
            actual_dur = float(dur_res.stdout.strip() or (end_sec - start_sec))

            clip_entries.append({
                "id": d_id,
                "speaker": spk_id,
                "start": start_sec,
                "end": end_sec,
                "actual_duration": actual_dur,
                "file": f"/videos/dubbing/clips/{d_id}.mp3",
                "textFr": text_fr,
                "textEn": d.get("textEn", "")
            })

        generated_clips_manifest[video_id] = {
            "title": title,
            "clips": clip_entries
        }

    # Sauvegarder le manifest JSON
    manifest_path = DUBBING_DIR / "dubbing_manifest.json"
    manifest_path.write_text(json.dumps(generated_clips_manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n✅ Manifest de doublage sauvegardé : {manifest_path}")

    # Générer la version vidéo avec doublage mixé pour Dr Sebi et Wim Hof si les fichiers existent
    local_videos = [
        ("dr-sebi-documentary.mp4", "dr_sebi_interview", "dr-sebi-documentary-fr.mp4"),
        ("wim-hof-3-rounds.mp4", "wim_hof_breathing", "wim-hof-3-rounds-fr.mp4"),
    ]

    for orig_name, v_key, out_name in local_videos:
        orig_video = PUBLIC_VIDEOS_DIR / orig_name
        if orig_video.exists() and v_key in generated_clips_manifest:
            print(f"\n🎛️ Mixage Audio Ducking pour {orig_name}...")
            clips = generated_clips_manifest[v_key]["clips"]
            out_video = PUBLIC_VIDEOS_DIR / out_name
            
            # Construire les filtres de mixage ffmpeg
            # On superpose chaque réplique à son start timestamp avec adelay
            inputs = ["-i", str(orig_video)]
            filter_parts = []
            
            for i, c in enumerate(clips):
                c_file = CLIPS_DIR / f"{c['id']}.mp3"
                inputs.extend(["-i", str(c_file)])
                delay_ms = int(c["start"] * 1000)
                # Filter to delay the speech clip
                filter_parts.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},volume=1.8[speech{i}];")

            speech_labels = "".join([f"[speech{i}]" for i in range(len(clips))])
            if len(clips) > 1:
                filter_parts.append(f"{speech_labels}amix=inputs={len(clips)}:dropout_transition=0:normalize=0[all_speech];")
            else:
                filter_parts.append(f"[speech0]acopy[all_speech];")

            # Duck the original video audio to 25% and mix with French speech
            filter_parts.append(f"[0:a]volume=0.35[orig_ducked];[orig_ducked][all_speech]amix=inputs=2:dropout_transition=0:normalize=0[aout]")

            full_filter = "".join(filter_parts)

            ffmpeg_cmd = [
                "/opt/homebrew/bin/ffmpeg", "-y",
                *inputs,
                "-filter_complex", full_filter,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(out_video)
            ]

            print(f"  Execution ffmpeg -> {out_name}...")
            res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"  ✅ Vidéo doublée FR créée avec succès : {out_name} ({out_video.stat().st_size / (1024*1024):.1f} MB)")
            else:
                print(f"  ⚠️ Erreur mixage vidéo (stderr): {res.stderr[-400:]}")

    print("\n🎉 Toutes les voix studio humaines et vidéos doublées ont été générées avec succès !")

if __name__ == "__main__":
    asyncio.run(main())
