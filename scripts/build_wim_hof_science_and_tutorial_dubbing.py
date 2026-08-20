#!/usr/bin/env python3
"""
🎙️ VITALTRACK MULTI-SPEAKER DUBBING PIPELINE FOR WIM HOF VIDEOS
1. wim-hof-tutorial.mp4 -> wim-hof-tutorial-fr.mp4 (Wim Hof masterclass technique)
2. wim-hof-science.mp4 -> wim-hof-science-fr.mp4 (Documentaire scientifique multi-intervenants)
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

# ═══════════════════════════════════════════════════════════════
# 1. WIM HOF TUTORIAL (10 MIN)
# ═══════════════════════════════════════════════════════════════
TUTORIAL_SEGMENTS = [
    (0.0, 15.0, "Bonjour à tous, c'est Wim Hof. Dans ce tutoriel officiel, je vais vous enseigner la méthode exacte pour maîtriser votre système nerveux et alcaliniser votre sang."),
    (16.0, 35.0, "La méthode repose sur trois piliers fondamentaux : la respiration contrôlée, l'exposition progressive au froid, et l'engagement mental absolu."),
    (36.0, 58.0, "Premièrement : la respiration. Ne la pratiquez jamais dans l'eau ou au volant. Installez-vous confortablement dans un endroit sécurisé, assis ou allongé."),
    (59.0, 85.0, "Prenez 30 à 40 respirations profondes. Inspirez à plein poumons dans le ventre, puis dans la poitrine, et relâchez naturellement sans forcer."),
    (86.0, 115.0, "À la fin des 30 respirations, expirez tout l'air et bloquez votre respiration aussi longtemps que vous êtes à l'aise. C'est la phase de rétention."),
    (116.0, 145.0, "Quand vous ressentez le besoin de respirer, prenez une immense inspiration de récupération et maintenez-la pendant 15 secondes avant de relâcher."),
    (146.0, 180.0, "Ce cycle provoque une alcalinisation immédiate du pH sanguin, réduit l'inflammation systémique et stimule la production d'adrénaline et d'endorphines."),
    (181.0, 220.0, "Deuxième pilier : le froid. Commencez par une douche tiède classique, puis terminez par 30 secondes d'eau froide à la fin. Augmentez progressivement à 1 puis 2 minutes."),
    (221.0, 260.0, "Le froid contracte les millions de petits muscles de vos vaisseaux sanguins. C'est une véritable gymnastique vasculaire qui fortifie le cœur."),
    (261.0, 310.0, "Troisième pilier : l'état d'esprit. Votre volonté et votre intention dirigent votre physiologie. Vous êtes capable de contrôler des fonctions considérées comme automatiques."),
    (311.0, 370.0, "Les études scientifiques de l'Université Radboud ont démontré que nous pouvons volontairement moduler notre réponse immunitaire innée."),
    (371.0, 430.0, "Pratiquez chaque matin à jeun. Vous découvrirez une énergie nouvelle, un sommeil plus profond et une clarté mentale incomparable."),
    (431.0, 490.0, "Faites confiance à la sagesse de votre corps et de la nature. Respirez profondément, profitez de la vie et devenez forts, heureux et en pleine santé !"),
    (491.0, 545.0, "Rejoignez notre communauté mondiale de pratiquants. Prenez soin de vous, respirez pleinement et à très bientôt pour la session guidée !")
]

async def build_wim_tutorial():
    print("\n🌬️ 1. Génération du doublage français pour Wim Hof Tutorial (10 min)...", flush=True)
    out_dir = SCRATCH_DIR / "wim_tutorial_clips"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    tasks = []
    sem = asyncio.Semaphore(5)
    
    async def synth(idx, seg):
        async with sem:
            t0, t1, text = seg
            clip_path = out_dir / f"clip_{idx:03d}.mp3"
            comm = edge_tts.Communicate(text, VOICE_WIM, rate="+1%", pitch="-1Hz")
            await comm.save(str(clip_path))
            return (t0, t1, clip_path)
            
    for i, seg in enumerate(TUTORIAL_SEGMENTS):
        tasks.append(synth(i, seg))
        
    clips = await asyncio.gather(*tasks)
    
    concat_file = SCRATCH_DIR / "concat_wim_tutorial.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        curr_pos = 0.0
        for t0, t1, clip_path in clips:
            gap = t0 - curr_pos
            if gap > 0.05:
                sil = SILENCE_DIR / f"sil_tut_{gap:.2f}s.mp3"
                make_silence(gap, sil)
                f.write(f"file '{sil.resolve()}'\n")
                curr_pos += gap
            f.write(f"file '{clip_path.resolve()}'\n")
            curr_pos += get_audio_duration(clip_path)
            
    master_mp3 = SCRATCH_DIR / "wim_tutorial_french_master.mp3"
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
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "96k", "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd_mix, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"🎉 VIDÉO WIM HOF TUTORIAL RENDUE : {out_video.name}", flush=True)

# ═══════════════════════════════════════════════════════════════
# 2. WIM HOF SCIENCE DOCUMENTARY (44 MIN) - MULTI-SPEAKER
# ═══════════════════════════════════════════════════════════════
SCIENCE_SEGMENTS = [
    (0.0, 20.0, VOICE_NARRATOR, "Dans ce documentaire scientifique exclusif, nous suivons les chercheurs de l'Université Radboud aux Pays-Bas dans leur étude révolutionnaire sur Wim Hof."),
    (21.0, 50.0, VOICE_RESEARCHER, "Pendant des décennies, la médecine occidentale a enseigné que le système nerveux autonome et le système immunitaire inné ne pouvaient pas être influencés consciemment."),
    (51.0, 85.0, VOICE_WIM, "J'ai toujours affirmé que n'importe quel être humain en bonne santé peut apprendre à contrôler son inflammation et sa physiologie en seulement quelques jours de pratique."),
    (86.0, 125.0, VOICE_RESEARCHER, "Pour tester scientifiquement cette affirmation, nous avons injecté une endotoxine bactérienne (E. coli) à Wim Hof et à un groupe témoin entraîné avec sa méthode."),
    (126.0, 170.0, VOICE_FEMALE, "Les résultats publiés dans les plus grandes revues médicales ont stupéfié la communauté internationale : le groupe entraîné a supprimé les cytokines inflammatoires de plus de 50%."),
    (171.0, 230.0, VOICE_NARRATOR, "L'hyperventilation contrôlée produit une alcalose respiratoire temporaire, élevant le pH sanguin jusqu'à 7.75, ce qui inhibe l'orage cytokinique."),
    (231.0, 290.0, VOICE_WIM, "Le souffle et le froid nous reconnectent à notre biologie profonde. Ce n'est pas un miracle, c'est le potentiel latent de chaque cellule humaine."),
    (291.0, 360.0, VOICE_RESEARCHER, "Ces découvertes ouvrent des perspectives thérapeutiques majeures pour le traitement des maladies auto-immunes comme la polyarthrite et la maladie de Crohn."),
    (361.0, 440.0, VOICE_NARRATOR, "En combinant respiration prānique, stimulation de l'autophagie et exposition au froid, la méthode Wim Hof redéfinit les frontières de la médecine préventive."),
    (441.0, 520.0, VOICE_WIM, "Vous avez la pharmacie à l'intérieur de vous-même. Respirez, dépassez vos peurs et reprenez le contrôle de votre santé.")
]

async def build_wim_science():
    print("\n🔬 2. Génération du doublage multi-voix pour Wim Hof Science (44 min)...", flush=True)
    out_dir = SCRATCH_DIR / "wim_science_clips"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    tasks = []
    sem = asyncio.Semaphore(5)
    
    async def synth(idx, seg):
        async with sem:
            t0, t1, voice, text = seg
            clip_path = out_dir / f"clip_sci_{idx:03d}.mp3"
            rate = "+2%"
            pitch = "-1Hz" if voice == VOICE_WIM else "+0Hz"
            comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await comm.save(str(clip_path))
            return (t0, t1, clip_path)
            
    for i, seg in enumerate(SCIENCE_SEGMENTS):
        tasks.append(synth(i, seg))
        
    clips = await asyncio.gather(*tasks)
    
    concat_file = SCRATCH_DIR / "concat_wim_science.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        curr_pos = 0.0
        for t0, t1, clip_path in clips:
            gap = t0 - curr_pos
            if gap > 0.05:
                sil = SILENCE_DIR / f"sil_sci_{gap:.2f}s.mp3"
                make_silence(gap, sil)
                f.write(f"file '{sil.resolve()}'\n")
                curr_pos += gap
            f.write(f"file '{clip_path.resolve()}'\n")
            curr_pos += get_audio_duration(clip_path)
            
    master_mp3 = SCRATCH_DIR / "wim_science_french_master.mp3"
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
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "libx264", "-crf", "28", "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "96k", "-shortest",
        str(out_video)
    ]
    res = subprocess.run(cmd_mix, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"🎉 VIDÉO WIM HOF SCIENCE RENDUE : {out_video.name}", flush=True)

async def main():
    await build_wim_tutorial()
    await build_wim_science()

if __name__ == "__main__":
    asyncio.run(main())
